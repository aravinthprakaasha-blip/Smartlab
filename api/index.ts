/**
 * Vercel Serverless API Handler
 * All /api/* routes are handled here as a single Express app.
 * In-memory state is module-level (persists per serverless instance warm lifetime).
 * The robot simulation tick runs lazily on each telemetry/request poll instead of setInterval.
 */

import express, { Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";

// ==========================================
// TYPES (inlined to avoid path issues in Vercel)
// ==========================================
enum ItemType {
  REAGENT = "REAGENT",
  SPECIMEN = "SPECIMEN",
  BLOOD_BAG = "BLOOD_BAG",
  SUPPLY = "SUPPLY"
}

enum BloodType {
  A_POS = "A+",
  A_NEG = "A-",
  B_POS = "B+",
  B_NEG = "B-",
  AB_POS = "AB+",
  AB_NEG = "AB-",
  O_POS = "O+",
  O_NEG = "O-"
}

enum BloodComponent {
  WHOLE_BLOOD = "WHOLE_BLOOD",
  PACKED_RED_CELLS = "PACKED_RED_CELLS",
  FRESH_FROZEN_PLASMA = "FRESH_FROZEN_PLASMA",
  PLATELETS = "PLATELETS"
}

interface BloodDetails {
  bloodType: BloodType;
  component: BloodComponent;
  donorId: string;
  crossMatchStatus: "COMPATIBLE" | "UNTESTED";
}

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  type: ItemType;
  barcode: string;
  quantity: number;
  targetMin: number;
  unit: string;
  locationGrid: string;
  expiryDate: string;
  temperatureGroup: "FROZEN_DEEP" | "REFRIGERATED" | "ROOM_TEMP";
  tempCelsiusCurrent: number;
  batchNumber: string;
  status: "NORMAL" | "LOW_STOCK" | "EXPIRED" | "CRITICAL";
  bloodDetails?: BloodDetails;
}

type RobotState = "IDLE" | "MOVING" | "PICKING" | "DELIVERING" | "PLACING" | "RETURNING" | "MAINTENANCE" | "ERROR";

interface RobotStatus {
  id: string;
  designation: string;
  status: RobotState;
  coords: { x: number; y: number; z: number };
  targetCoords?: { x: number; y: number; z: number };
  carryingItemSku?: string;
  speedMmPs: number;
  temperatureCelsius: number;
  alignmentOffsetMm: number;
  errorCode?: string;
  lastMaintenanceDate: string;
}

interface RetrievalRequest {
  id: string;
  itemSku: string;
  itemName: string;
  itemType: ItemType;
  quantity: number;
  requestedBy: string;
  requestedRole: string;
  priority: "ROUTINE" | "URGENT" | "STAT_EMERGENCY";
  recipientDept: string;
  status: "PENDING" | "QUEUED" | "RETRIEVING" | "DELIVERING" | "COMPLETED" | "CANCELED" | "ERROR";
  timestamp: string;
  trackingCode: string;
  robotId?: string;
  errorReason?: string;
}

interface AuditLog {
  id: string;
  actorName: string;
  actorRole: string;
  action: string;
  targetEntity: string;
  status: "SUCCESS" | "WARNING" | "FAILED" | "SECURITY_ALERT";
  timestamp: string;
  details: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "WARNING" | "CRITICAL" | "INFO" | "SUCCESS";
  isRead: boolean;
  timestamp: string;
}

// ==========================================
// GEMINI CLIENT
// ==========================================
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } }
      });
    }
  }
  return aiClient;
}

// ==========================================
// STATE MANAGEMENT (Module-level in-memory store)
// ==========================================
let inventory: InventoryItem[] = [
  {
    id: "inv-1", sku: "RE-COB-WSH", name: "Cobas Wash Buffer Concentrate",
    type: ItemType.REAGENT, barcode: "931289122340", quantity: 12, targetMin: 15,
    unit: "Bottles (500ml)", locationGrid: "RACK-A-Z1-01", expiryDate: "2026-12-15",
    temperatureGroup: "ROOM_TEMP", tempCelsiusCurrent: 21.4, batchNumber: "B-Roche-8893", status: "LOW_STOCK"
  },
  {
    id: "inv-2", sku: "RE-DIA-LYS", name: "Diatron Lyse Diff Reagent",
    type: ItemType.REAGENT, barcode: "931289122345", quantity: 4, targetMin: 10,
    unit: "Canisters (1L)", locationGrid: "RACK-A-Z1-02", expiryDate: "2026-04-01",
    temperatureGroup: "REFRIGERATED", tempCelsiusCurrent: 4.2, batchNumber: "B-Dia-77A", status: "EXPIRED"
  },
  {
    id: "inv-3", sku: "SPEC-HEM-902", name: "Stat Pediatric CBC EDTA Tube",
    type: ItemType.SPECIMEN, barcode: "880912301", quantity: 1, targetMin: 0,
    unit: "Vial", locationGrid: "RACK-B-Z2-01", expiryDate: "2026-06-10",
    temperatureGroup: "REFRIGERATED", tempCelsiusCurrent: 4.4, batchNumber: "S-CRIT-092", status: "NORMAL"
  },
  {
    id: "inv-4", sku: "SPEC-CMP-443", name: "Comprehensive Metabolic Panel Sample",
    type: ItemType.SPECIMEN, barcode: "880912305", quantity: 1, targetMin: 0,
    unit: "Vial", locationGrid: "RACK-B-Z2-02", expiryDate: "2026-06-08",
    temperatureGroup: "REFRIGERATED", tempCelsiusCurrent: 4.1, batchNumber: "S-ROUT-114", status: "NORMAL"
  },
  {
    id: "inv-5", sku: "BB-O-POS-WB", name: "O+ Whole Human Blood Pack",
    type: ItemType.BLOOD_BAG, barcode: "BLOOD-70912", quantity: 18, targetMin: 10,
    unit: "Unit Bags (450ml)", locationGrid: "RACK-A-Z2-03", expiryDate: "2026-07-20",
    temperatureGroup: "REFRIGERATED", tempCelsiusCurrent: 3.8, batchNumber: "D-998-33421", status: "NORMAL",
    bloodDetails: { bloodType: BloodType.O_POS, component: BloodComponent.WHOLE_BLOOD, donorId: "DN-4829", crossMatchStatus: "COMPATIBLE" }
  },
  {
    id: "inv-6", sku: "BB-O-NEG-EMR", name: "O- Emergency Transfusion Red Cells",
    type: ItemType.BLOOD_BAG, barcode: "BLOOD-0001", quantity: 3, targetMin: 8,
    unit: "Unit Bags (450ml)", locationGrid: "RACK-A-Z2-04", expiryDate: "2026-07-02",
    temperatureGroup: "REFRIGERATED", tempCelsiusCurrent: 3.9, batchNumber: "D-001-99812", status: "CRITICAL",
    bloodDetails: { bloodType: BloodType.O_NEG, component: BloodComponent.PACKED_RED_CELLS, donorId: "DN-0001", crossMatchStatus: "COMPATIBLE" }
  },
  {
    id: "inv-7", sku: "BB-AB-POS-PLT", name: "AB+ Human Platelet Apheresis",
    type: ItemType.BLOOD_BAG, barcode: "BLOOD-22019", quantity: 8, targetMin: 6,
    unit: "Bags (250ml)", locationGrid: "RACK-A-Z3-01", expiryDate: "2026-06-09",
    temperatureGroup: "ROOM_TEMP", tempCelsiusCurrent: 22.1, batchNumber: "D-PLT-8890C", status: "NORMAL",
    bloodDetails: { bloodType: BloodType.AB_POS, component: BloodComponent.PLATELETS, donorId: "DN-3312", crossMatchStatus: "COMPATIBLE" }
  },
  {
    id: "inv-8", sku: "BB-A-POS-FFP", name: "A+ Fresh Frozen Plasma Pack",
    type: ItemType.BLOOD_BAG, barcode: "BLOOD-11045", quantity: 14, targetMin: 12,
    unit: "Bags (300ml)", locationGrid: "RACK-C-Z1-01", expiryDate: "2027-01-30",
    temperatureGroup: "FROZEN_DEEP", tempCelsiusCurrent: -24.6, batchNumber: "D-FFP-4109", status: "NORMAL",
    bloodDetails: { bloodType: BloodType.A_POS, component: BloodComponent.FRESH_FROZEN_PLASMA, donorId: "DN-9011", crossMatchStatus: "COMPATIBLE" }
  },
  {
    id: "inv-9", sku: "SUP-VAC-NEED", name: "BD Vacutainer Blood Collection G21",
    type: ItemType.SUPPLY, barcode: "38291024", quantity: 450, targetMin: 200,
    unit: "PCS Box", locationGrid: "RACK-A-Z3-05", expiryDate: "2029-10-10",
    temperatureGroup: "ROOM_TEMP", tempCelsiusCurrent: 21.8, batchNumber: "M-BD-908127", status: "NORMAL"
  }
];

let robot: RobotStatus = {
  id: "robot-alpha-1", designation: "MED-RETRIEVER-01", status: "IDLE",
  coords: { x: 0, y: 0, z: 0 }, speedMmPs: 1200, temperatureCelsius: 18.5,
  alignmentOffsetMm: 0.04, lastMaintenanceDate: "2026-05-10"
};

let requests: RetrievalRequest[] = [
  {
    id: "req-1", itemSku: "SPEC-HEM-902", itemName: "Stat Pediatric CBC EDTA Tube",
    itemType: ItemType.SPECIMEN, quantity: 1, requestedBy: "Dr. Marcus Vance",
    requestedRole: "LABORATORY_STAFF", priority: "STAT_EMERGENCY",
    recipientDept: "Pediatric Emergency Ward B", status: "COMPLETED",
    timestamp: "2026-06-05T07:12:00Z", trackingCode: "RET-SPEC-28190-STA", robotId: "robot-alpha-1"
  }
];

let auditLogs: AuditLog[] = [
  {
    id: "log-1", actorName: "Dr. Marcus Vance", actorRole: "LABORATORY_STAFF",
    action: "ITEM_RETIEVAL_DELIVERED", targetEntity: "SPEC-HEM-902", status: "SUCCESS",
    timestamp: "2026-06-05T07:15:00Z",
    details: "Pediatric CBC Sample was securely dispatched by MED-RETRIEVER-01 to dispatch portal."
  },
  {
    id: "log-2", actorName: "System Safety Monitor", actorRole: "SYSTEM",
    action: "TEMPERATURE_ALERT", targetEntity: "RACK-A-Z1-02", status: "WARNING",
    timestamp: "2026-06-05T08:00:00Z",
    details: "Refrigerated rack zone experienced minor fluctuations. Zone returned to 4.2C."
  }
];

let notifications: Notification[] = [
  {
    id: "notif-1", title: "O- Negative emergency blood bag levels low!",
    message: "Critical shortage of O- emergency units (3 remaining, minimum requirements are 8). Restack requested immediately.",
    type: "CRITICAL", isRead: false, timestamp: "2026-06-05T08:10:00Z"
  },
  {
    id: "notif-2", title: "Cobas wash buffer below target minimums",
    message: "Quantity is currently 12 (Minimum targets: 15). Automated reorder report prepared.",
    type: "WARNING", isRead: false, timestamp: "2026-06-05T08:20:00Z"
  }
];

let activeRequestIndex = -1;
let ticksInCurrentState = 0;
let lastTickTime = Date.now();

// ==========================================
// SIMULATION TICK (called lazily on each API poll)
// ==========================================
function mapGridLocationToCoords(locationStr: string): { x: number; y: number; z: number } {
  const parts = locationStr.split("-");
  const rack = parts[1] || "A";
  const zone = parts[2] || "Z1";
  const slot = parseInt(parts[3] || "1");
  let x = 300, y = 200, z = 150;
  if (rack === "B") x = 800;
  else if (rack === "C") x = 1400;
  else x = 400;
  const zoneNum = parseInt(zone.replace("Z", "")) || 1;
  y = zoneNum * 350;
  z = slot * 120;
  return { x, y, z };
}

function runSimulationTick() {
  const now = Date.now();
  // Only run a tick if at least ~1 second has passed since last tick
  if (now - lastTickTime < 900) return;
  lastTickTime = now;

  if (robot.status === "IDLE") {
    const pendingIndex = requests.findIndex(r => r.status === "PENDING" || r.status === "QUEUED");
    if (pendingIndex !== -1) {
      activeRequestIndex = pendingIndex;
      const actReq = requests[pendingIndex];
      actReq.status = "RETRIEVING";
      const matchedInventory = inventory.find(i => i.sku === actReq.itemSku);
      const targetLocation = matchedInventory ? matchedInventory.locationGrid : "RACK-A-Z3-01";
      const targetCoords = mapGridLocationToCoords(targetLocation);
      robot.status = "MOVING";
      robot.targetCoords = targetCoords;
      robot.carryingItemSku = actReq.itemSku;
      robot.errorCode = undefined;
      ticksInCurrentState = 0;
      notifications.unshift({
        id: `notif-auto-${Date.now()}`,
        title: `Dispatching ${robot.designation}`,
        message: `Retrieving item: ${actReq.itemName} (${actReq.priority})`,
        type: "INFO", isRead: false, timestamp: new Date().toISOString()
      });
    }
  } else if (robot.status === "MOVING") {
    ticksInCurrentState++;
    const target = robot.targetCoords || { x: 500, y: 350, z: 200 };
    const step = 0.5;
    robot.coords.x = Math.round(robot.coords.x + (target.x - robot.coords.x) * step);
    robot.coords.y = Math.round(robot.coords.y + (target.y - robot.coords.y) * step);
    robot.coords.z = Math.round(robot.coords.z + (target.z - robot.coords.z) * step);
    const dist = Math.hypot(robot.coords.x - target.x, robot.coords.y - target.y, robot.coords.z - target.z);
    if (dist < 10 || ticksInCurrentState >= 2) {
      robot.coords = { ...target };
      robot.status = "PICKING";
      ticksInCurrentState = 0;
    }
  } else if (robot.status === "PICKING") {
    ticksInCurrentState++;
    if (ticksInCurrentState >= 2) {
      robot.status = "DELIVERING";
      robot.targetCoords = { x: 2200, y: 50, z: 120 };
      ticksInCurrentState = 0;
      if (activeRequestIndex !== -1 && requests[activeRequestIndex]) {
        requests[activeRequestIndex].status = "DELIVERING";
      }
    }
  } else if (robot.status === "DELIVERING") {
    ticksInCurrentState++;
    const target = robot.targetCoords || { x: 2200, y: 50, z: 120 };
    const step = 0.5;
    robot.coords.x = Math.round(robot.coords.x + (target.x - robot.coords.x) * step);
    robot.coords.y = Math.round(robot.coords.y + (target.y - robot.coords.y) * step);
    robot.coords.z = Math.round(robot.coords.z + (target.z - robot.coords.z) * step);
    const dist = Math.hypot(robot.coords.x - target.x, robot.coords.y - target.y, robot.coords.z - target.z);
    if (dist < 10 || ticksInCurrentState >= 2) {
      robot.coords = { ...target };
      robot.status = "PLACING";
      ticksInCurrentState = 0;
    }
  } else if (robot.status === "PLACING") {
    ticksInCurrentState++;
    if (ticksInCurrentState >= 2) {
      if (activeRequestIndex !== -1 && requests[activeRequestIndex]) {
        const completedRequest = requests[activeRequestIndex];
        completedRequest.status = "COMPLETED";
        const invItemIdx = inventory.findIndex(i => i.sku === completedRequest.itemSku);
        if (invItemIdx !== -1) {
          inventory[invItemIdx].quantity = Math.max(0, inventory[invItemIdx].quantity - completedRequest.quantity);
          if (inventory[invItemIdx].quantity === 0) inventory[invItemIdx].status = "EXPIRED";
          else if (inventory[invItemIdx].quantity <= inventory[invItemIdx].targetMin) inventory[invItemIdx].status = "LOW_STOCK";
        }
        auditLogs.unshift({
          id: `log-auto-${Date.now()}`, actorName: completedRequest.requestedBy,
          actorRole: completedRequest.requestedRole, action: "RETRIVAL_FULL_DISPATCH",
          targetEntity: completedRequest.itemSku, status: "SUCCESS",
          timestamp: new Date().toISOString(),
          details: `Successfully completed high priority mechanical routing of ${completedRequest.itemName} to department: ${completedRequest.recipientDept}.`
        });
        notifications.unshift({
          id: `notif-deliv-${Date.now()}`, title: "Robotic retrieval completed",
          message: `${completedRequest.itemName} successfully dispatched to checkout portal for dispatch to ${completedRequest.recipientDept}.`,
          type: "SUCCESS", isRead: false, timestamp: new Date().toISOString()
        });
      }
      robot.status = "RETURNING";
      robot.targetCoords = { x: 0, y: 0, z: 0 };
      robot.carryingItemSku = undefined;
      ticksInCurrentState = 0;
    }
  } else if (robot.status === "RETURNING") {
    ticksInCurrentState++;
    const step = 0.5;
    robot.coords.x = Math.round(robot.coords.x + (0 - robot.coords.x) * step);
    robot.coords.y = Math.round(robot.coords.y + (0 - robot.coords.y) * step);
    robot.coords.z = Math.round(robot.coords.z + (0 - robot.coords.z) * step);
    const dist = Math.hypot(robot.coords.x, robot.coords.y, robot.coords.z);
    if (dist < 10 || ticksInCurrentState >= 2) {
      robot.coords = { x: 0, y: 0, z: 0 };
      robot.status = "IDLE";
      robot.targetCoords = undefined;
      activeRequestIndex = -1;
      ticksInCurrentState = 0;
    }
  }
}

// ==========================================
// EXPRESS APP
// ==========================================
const app = express();
app.use(express.json());

// Auth
app.post("/api/auth/login", (req: Request, res: Response) => {
  const { username, role } = req.body;
  if (!username) return res.status(400).json({ error: "Username is required" });
  const tokenPayload = {
    username, role: role || "LABORATORY_STAFF",
    issuedAt: new Date().toISOString(), expiresIn: "8h",
    facility: "Central BioBank Diagnostic Lab v4.1"
  };
  auditLogs.unshift({
    id: `log-auth-${Date.now()}`, actorName: username, actorRole: tokenPayload.role,
    action: "SECURE_FACILITY_LOGIN", targetEntity: "AUTHENTICATION_SERVICE", status: "SUCCESS",
    timestamp: new Date().toISOString(),
    details: `Issued JWT session bearer context to actor with verified permission level: ${tokenPayload.role}.`
  });
  res.json({
    success: true,
    token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.simulatedTokenBase.${Buffer.from(JSON.stringify(tokenPayload)).toString("base64")}`,
    user: { name: username, role: tokenPayload.role }
  });
});

// Inventory
app.get("/api/inventory", (req: Request, res: Response) => {
  runSimulationTick();
  const { search, type, status } = req.query;
  let filtered = [...inventory];
  if (search) {
    const s = String(search).toLowerCase();
    filtered = filtered.filter(item =>
      item.name.toLowerCase().includes(s) ||
      item.sku.toLowerCase().includes(s) ||
      item.barcode.includes(s)
    );
  }
  if (type && type !== "ALL") filtered = filtered.filter(item => item.type === type);
  if (status && status !== "ALL") filtered = filtered.filter(item => item.status === status);
  res.json(filtered);
});

app.post("/api/inventory", (req: Request, res: Response) => {
  const { name, type, quantity, targetMin, unit, locationGrid, temperatureGroup, expiryDate, bloodDetails, actorName, actorRole } = req.body;
  if (!name || !type || !quantity || !locationGrid) return res.status(400).json({ error: "Required fields missing" });
  const sku = `${type.substring(0, 3)}-${name.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
  const barcode = Math.floor(100000000000 + Math.random() * 900000000000).toString();
  const newItem: InventoryItem = {
    id: `inv-${Date.now()}`, sku, name, type, barcode,
    quantity: Number(quantity), targetMin: Number(targetMin || 0),
    unit: unit || "Units", locationGrid,
    expiryDate: expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    temperatureGroup: temperatureGroup || "ROOM_TEMP",
    tempCelsiusCurrent: temperatureGroup === "FROZEN_DEEP" ? -22.5 : temperatureGroup === "REFRIGERATED" ? 4.1 : 21.5,
    batchNumber: `B-BATCH-${Math.floor(1000 + Math.random() * 9000)}`,
    status: Number(quantity) <= Number(targetMin || 0) ? "LOW_STOCK" : "NORMAL",
    bloodDetails
  };
  inventory.push(newItem);
  auditLogs.unshift({
    id: `log-inv-${Date.now()}`, actorName: actorName || "Standard Personnel",
    actorRole: actorRole || "LABORATORY_STAFF", action: "ITEM_RECORD_CREATION",
    targetEntity: sku, status: "SUCCESS", timestamp: new Date().toISOString(),
    details: `Added new inventory record to grid ${locationGrid} with initial quantity ${quantity} ${unit}.`
  });
  notifications.unshift({
    id: `notif-inv-${Date.now()}`, title: "New Inventory Stock Record Added",
    message: `${name} has been added to the automated database and allocated inside storage slot ${locationGrid}.`,
    type: "SUCCESS", isRead: false, timestamp: new Date().toISOString()
  });
  res.status(201).json(newItem);
});

app.put("/api/inventory/:sku", (req: Request, res: Response) => {
  const { sku } = req.params;
  const { quantity, actorName, actorRole } = req.body;
  const itemIdx = inventory.findIndex(item => item.sku === sku);
  if (itemIdx === -1) return res.status(404).json({ error: "Item code not found" });
  const oldQty = inventory[itemIdx].quantity;
  inventory[itemIdx].quantity = Number(quantity);
  if (inventory[itemIdx].quantity <= 0) inventory[itemIdx].status = "EXPIRED";
  else if (inventory[itemIdx].quantity <= inventory[itemIdx].targetMin) inventory[itemIdx].status = "LOW_STOCK";
  else inventory[itemIdx].status = "NORMAL";
  auditLogs.unshift({
    id: `log-repl-${Date.now()}`, actorName: actorName || "Automatic Supply Flow",
    actorRole: actorRole || "LABORATORY_STAFF", action: "STOCK_QUANTITY_OVERRIDE",
    targetEntity: sku, status: "SUCCESS", timestamp: new Date().toISOString(),
    details: `Adjusted barcode quantity of ${inventory[itemIdx].name} from ${oldQty} to ${quantity}.`
  });
  res.json(inventory[itemIdx]);
});

// Requests
app.get("/api/requests", (req: Request, res: Response) => {
  runSimulationTick();
  res.json(requests);
});

app.post("/api/requests", (req: Request, res: Response) => {
  const { itemSku, quantity, requestedBy, requestedRole, priority, recipientDept } = req.body;
  if (!itemSku || !quantity || !requestedBy || !recipientDept) return res.status(400).json({ error: "Incomplete dispatch details" });
  const matchedItem = inventory.find(i => i.sku === itemSku);
  if (!matchedItem) return res.status(404).json({ error: "Requested item SKU code not found in laboratory storage indexes" });
  if (matchedItem.quantity < quantity) return res.status(400).json({ error: `Insufficient stock. Requested ${quantity}, but only ${matchedItem.quantity} units are available inside ${matchedItem.locationGrid}` });
  const newReq: RetrievalRequest = {
    id: `req-${Date.now()}`, itemSku, itemName: matchedItem.name,
    itemType: matchedItem.type, quantity: Number(quantity),
    requestedBy, requestedRole: requestedRole || "LABORATORY_STAFF",
    priority: priority || "ROUTINE", recipientDept, status: "PENDING",
    timestamp: new Date().toISOString(),
    trackingCode: `RET-${Math.floor(10000 + Math.random() * 90000)}-${priority?.substring(0, 3).toUpperCase()}`
  };
  requests.push(newReq);
  auditLogs.unshift({
    id: `log-req-${Date.now()}`, actorName: requestedBy,
    actorRole: requestedRole || "LABORATORY_STAFF", action: "RETRIEVAL_REQUEST_SUBMITTED",
    targetEntity: itemSku, status: "SUCCESS", timestamp: new Date().toISOString(),
    details: `Requested ${quantity} units of ${matchedItem.name} with ${priority} level urgency for target room/dept ${recipientDept}.`
  });
  res.status(201).json(newReq);
});

// Robot
app.get("/api/robot/telemetry", (req: Request, res: Response) => {
  runSimulationTick();
  res.json(robot);
});

app.post("/api/robot/command", (req: Request, res: Response) => {
  const { command, actorName, actorRole } = req.body;
  if (command === "EMERGENCY_STOP") {
    robot.status = "MAINTENANCE";
    robot.errorCode = "ERR_EMERG_STOP_SAFETY";
    auditLogs.unshift({
      id: `log-rob-${Date.now()}`, actorName: actorName || "Manual Override Operator",
      actorRole: actorRole || "ADMINISTRATOR", action: "ROBOTIC_EMERGENCY_HALT",
      targetEntity: robot.designation, status: "SECURITY_ALERT",
      timestamp: new Date().toISOString(),
      details: "Emergency physical safety trip-wire activated manually by clinical supervisor."
    });
    notifications.unshift({
      id: `notif-rob-${Date.now()}`, title: "Robotic Retriever Core Halted",
      message: `Emergency stop initiated on ${robot.designation}. System locked in Maintenance Mode.`,
      type: "CRITICAL", isRead: false, timestamp: new Date().toISOString()
    });
  } else if (command === "CALIBRATE") {
    robot.alignmentOffsetMm = 0.00;
    robot.errorCode = undefined;
    robot.status = "IDLE";
    robot.coords = { x: 0, y: 0, z: 0 };
    auditLogs.unshift({
      id: `log-rob-${Date.now()}`, actorName: actorName || "Calibration Service",
      actorRole: actorRole || "ADMINISTRATOR", action: "RE_ALIGN_CALIBRATION",
      targetEntity: robot.designation, status: "SUCCESS",
      timestamp: new Date().toISOString(),
      details: "In-line positioning laser recalibrated. Angular alignment offset reset to 0.00mm."
    });
    notifications.unshift({
      id: `notif-rob-${Date.now()}`, title: "Robot Alpha Calibration Successful",
      message: `${robot.designation} laser navigation arrays adjusted to maximum tolerance margins. Ready for autonomous duty cycles.`,
      type: "SUCCESS", isRead: false, timestamp: new Date().toISOString()
    });
  }
  res.json({ success: true, telemetry: robot });
});

// Audit logs
app.get("/api/audit-logs", (req: Request, res: Response) => {
  res.json(auditLogs);
});

// Notifications
app.get("/api/notifications", (req: Request, res: Response) => {
  runSimulationTick();
  res.json(notifications);
});

app.post("/api/notifications/read", (req: Request, res: Response) => {
  notifications = notifications.map(n => ({ ...n, isRead: true }));
  res.json({ success: true });
});

// AI Copilot
app.post("/api/gemini/copilot", async (req: Request, res: Response) => {
  const { prompt, currentRole } = req.body;
  if (!prompt) return res.status(400).json({ error: "Instruction prompt cannot be blank" });

  const ai = getGeminiClient();
  const contextDescription = `
You are the AI Clinical Copilot for the "Smart Lab Inventory & Robotic Retrieval Management System".
Below is the current REAL-TIME state of the health facility:

SYSTEM TIME: ${new Date().toISOString().split("T")[0]}
FACILITY MODEL: Central Blood Bank & Diagnostic Lab, Facility Block F-02
VERIFIED ACTOR ROLE: ${currentRole || "LAB_STAFF"}

--- CURRENT REAL-TIME STOCK INVENTORY ---
${JSON.stringify(inventory.map(i => ({
  sku: i.sku, name: i.name, type: i.type, qty: i.quantity, targetMin: i.targetMin,
  location: i.locationGrid, expiry: i.expiryDate, tempCelsius: i.tempCelsiusCurrent,
  status: i.status, bloodGroup: i.bloodDetails?.bloodType || "N/A",
  component: i.bloodDetails?.component || "N/A"
})), null, 2)}

--- ROBOT TELEMETRY ---
Robot Name: ${robot.designation}
Robot State: ${robot.status}
Coordinates: X:${robot.coords.x} Y:${robot.coords.y} Z:${robot.coords.z}
Carrying SKU: ${robot.carryingItemSku || "Nothing"}
Calibration Laser Offset: ${robot.alignmentOffsetMm}mm
ErrorCode: ${robot.errorCode || "None"}

--- ACTIVE & HISTORIC DISPATCH QUEUES ---
${JSON.stringify(requests.slice(0, 5), null, 2)}

--- SYSTEM CRITICAL AUDIT LOG HISTORY ---
${JSON.stringify(auditLogs.slice(0, 5), null, 2)}

CRITICAL AI INSTRUCTIONS:
- Act as an elite Clinical Chief of Logistics & Robotic Safety Auditor.
- Address the user's laboratory questions accurately based ONLY on the context data.
- Offer predictive assistance for critical shortages and expired reagents.
- Provide crisp, scannable markdown responses with bullet points.
`;

  try {
    let resultText = "";
    if (ai) {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: { systemInstruction: contextDescription, temperature: 0.2 }
      });
      resultText = response.text || "No diagnostics yielded by primary model.";
    } else {
      resultText = `### SYSTEM ADVISORY: Mock AI Diagnostics Mode
*Note: No valid 'GEMINI_API_KEY' configured. Using local deterministic intelligence core.*

Based on real-time diagnostic telemetry scanning:
1. **Critical Blood Reserve Depletion**: 
   - **O- Transfusion cells (SKU: BB-O-NEG-EMR)** is at **3 unit bags**, below the safety floor (**8 bags**). 
   - *Action advised*: Trigger reorder from Regional Blood Center immediately.
2. **Expired Reagents Flagged**:
   - **Diatron Lyse Diff Reagent (SKU: RE-DIA-LYS)** passed its expiry of **2026-04-01**.
3. **Robotic Physical Performance**:
   - **${robot.designation}** reports healthy alignment (${robot.alignmentOffsetMm}mm variance). Temperature: ${robot.temperatureCelsius}°C. No current faults.`;
    }
    res.json({ response: resultText });
  } catch (error: any) {
    console.error("Gemini API error:", error);
    res.status(500).json({ error: "Failed to communicate with diagnostic core service.", details: error.message });
  }
});

export default app;
