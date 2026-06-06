/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { 
  InventoryItem, 
  ItemType, 
  BloodType, 
  BloodComponent, 
  RobotStatus, 
  RetrievalRequest, 
  AuditLog, 
  Notification, 
  ClinicalAnalytics 
} from "./src/types.js";

// Initialize Gemini SDK with telemetry User-Agent lazily
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
  }
  return aiClient;
}

const app = express();
app.use(express.json());

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// ==========================================
// STATE MANAGEMENT (Simulated DB)
// ==========================================

let inventory: InventoryItem[] = [
  {
    id: "inv-1",
    sku: "RE-COB-WSH",
    name: "Cobas Wash Buffer Concentrate",
    type: ItemType.REAGENT,
    barcode: "931289122340",
    quantity: 12,
    targetMin: 15,
    unit: "Bottles (500ml)",
    locationGrid: "RACK-A-Z1-01",
    expiryDate: "2026-12-15",
    temperatureGroup: "ROOM_TEMP",
    tempCelsiusCurrent: 21.4,
    batchNumber: "B-Roche-8893",
    status: "LOW_STOCK"
  },
  {
    id: "inv-2",
    sku: "RE-DIA-LYS",
    name: "Diatron Lyse Diff Reagent",
    type: ItemType.REAGENT,
    barcode: "931289122345",
    quantity: 4,
    targetMin: 10,
    unit: "Canisters (1L)",
    locationGrid: "RACK-A-Z1-02",
    expiryDate: "2026-04-01", // Expired in real timeline (June 2026)
    temperatureGroup: "REFRIGERATED",
    tempCelsiusCurrent: 4.2,
    batchNumber: "B-Dia-77A",
    status: "EXPIRED"
  },
  {
    id: "inv-3",
    sku: "SPEC-HEM-902",
    name: "Stat Pediatric CBC EDTA Tube",
    type: ItemType.SPECIMEN,
    barcode: "880912301",
    quantity: 1,
    targetMin: 0,
    unit: "Vial",
    locationGrid: "RACK-B-Z2-01",
    expiryDate: "2026-06-10",
    temperatureGroup: "REFRIGERATED",
    tempCelsiusCurrent: 4.4,
    batchNumber: "S-CRIT-092",
    status: "NORMAL"
  },
  {
    id: "inv-4",
    sku: "SPEC-CMP-443",
    name: "Comprehensive Metabolic Panel Sample",
    type: ItemType.SPECIMEN,
    barcode: "880912305",
    quantity: 1,
    targetMin: 0,
    unit: "Vial",
    locationGrid: "RACK-B-Z2-02",
    expiryDate: "2026-06-08",
    temperatureGroup: "REFRIGERATED",
    tempCelsiusCurrent: 4.1,
    batchNumber: "S-ROUT-114",
    status: "NORMAL"
  },
  // BLOOD BAGS
  {
    id: "inv-5",
    sku: "BB-O-POS-WB",
    name: "O+ Whole Human Blood Pack",
    type: ItemType.BLOOD_BAG,
    barcode: "BLOOD-70912",
    quantity: 18,
    targetMin: 10,
    unit: "Unit Bags (450ml)",
    locationGrid: "RACK-A-Z2-03",
    expiryDate: "2026-07-20",
    temperatureGroup: "REFRIGERATED",
    tempCelsiusCurrent: 3.8,
    batchNumber: "D-998-33421",
    status: "NORMAL",
    bloodDetails: {
      bloodType: BloodType.O_POS,
      component: BloodComponent.WHOLE_BLOOD,
      donorId: "DN-4829",
      crossMatchStatus: "COMPATIBLE"
    }
  },
  {
    id: "inv-6",
    sku: "BB-O-NEG-EMR",
    name: "O- Emergency Transfusion Red Cells",
    type: ItemType.BLOOD_BAG,
    barcode: "BLOOD-0001",
    quantity: 3,
    targetMin: 8,
    unit: "Unit Bags (450ml)",
    locationGrid: "RACK-A-Z2-04",
    expiryDate: "2026-07-02",
    temperatureGroup: "REFRIGERATED",
    tempCelsiusCurrent: 3.9,
    batchNumber: "D-001-99812",
    status: "CRITICAL",
    bloodDetails: {
      bloodType: BloodType.O_NEG,
      component: BloodComponent.PACKED_RED_CELLS,
      donorId: "DN-0001",
      crossMatchStatus: "COMPATIBLE"
    }
  },
  {
    id: "inv-7",
    sku: "BB-AB-POS-PLT",
    name: "AB+ Human Platelet Apheresis",
    type: ItemType.BLOOD_BAG,
    barcode: "BLOOD-22019",
    quantity: 8,
    targetMin: 6,
    unit: "Bags (250ml)",
    locationGrid: "RACK-A-Z3-01",
    expiryDate: "2026-06-09", // platelets expire quickly (typically 5 days)
    temperatureGroup: "ROOM_TEMP", // platelets agitator is stored around 22C
    tempCelsiusCurrent: 22.1,
    batchNumber: "D-PLT-8890C",
    status: "NORMAL",
    bloodDetails: {
      bloodType: BloodType.AB_POS,
      component: BloodComponent.PLATELETS,
      donorId: "DN-3312",
      crossMatchStatus: "COMPATIBLE"
    }
  },
  {
    id: "inv-8",
    sku: "BB-A-POS-FFP",
    name: "A+ Fresh Frozen Plasma Pack",
    type: ItemType.BLOOD_BAG,
    barcode: "BLOOD-11045",
    quantity: 14,
    targetMin: 12,
    unit: "Bags (300ml)",
    locationGrid: "RACK-C-Z1-01",
    expiryDate: "2027-01-30",
    temperatureGroup: "FROZEN_DEEP",
    tempCelsiusCurrent: -24.6,
    batchNumber: "D-FFP-4109",
    status: "NORMAL",
    bloodDetails: {
      bloodType: BloodType.A_POS,
      component: BloodComponent.FRESH_FROZEN_PLASMA,
      donorId: "DN-9011",
      crossMatchStatus: "COMPATIBLE"
    }
  },
  {
    id: "inv-9",
    sku: "SUP-VAC-NEED",
    name: "BD Vacutainer Blood Collection G21",
    type: ItemType.SUPPLY,
    barcode: "38291024",
    quantity: 450,
    targetMin: 200,
    unit: "PCS Box",
    locationGrid: "RACK-A-Z3-05",
    expiryDate: "2029-10-10",
    temperatureGroup: "ROOM_TEMP",
    tempCelsiusCurrent: 21.8,
    batchNumber: "M-BD-908127",
    status: "NORMAL"
  }
];

let robot: RobotStatus = {
  id: "robot-alpha-1",
  designation: "MED-RETRIEVER-01",
  status: "IDLE",
  coords: { x: 0, y: 0, z: 0 },
  speedMmPs: 1200,
  temperatureCelsius: 18.5,
  alignmentOffsetMm: 0.04,
  lastMaintenanceDate: "2026-05-10"
};

let requests: RetrievalRequest[] = [
  {
    id: "req-1",
    itemSku: "SPEC-HEM-902",
    itemName: "Stat Pediatric CBC EDTA Tube",
    itemType: ItemType.SPECIMEN,
    quantity: 1,
    requestedBy: "Dr. Marcus Vance",
    requestedRole: "LABORATORY_STAFF",
    priority: "STAT_EMERGENCY",
    recipientDept: "Pediatric Emergency Ward B",
    status: "COMPLETED",
    timestamp: "2026-06-05T07:12:00Z",
    trackingCode: "RET-SPEC-28190-STA",
    robotId: "robot-alpha-1"
  }
];

let auditLogs: AuditLog[] = [
  {
    id: "log-1",
    actorName: "Dr. Marcus Vance",
    actorRole: "LABORATORY_STAFF",
    action: "ITEM_RETIEVAL_DELIVERED",
    targetEntity: "SPEC-HEM-902",
    status: "SUCCESS",
    timestamp: "2026-06-05T07:15:00Z",
    details: "Pediatric CBC Sample was securely dispatched by MED-RETRIEVER-01 to dispatch portal."
  },
  {
    id: "log-2",
    actorName: "System Safety Monitor",
    actorRole: "SYSTEM",
    action: "TEMPERATURE_ALERT",
    targetEntity: "RACK-A-Z1-02",
    status: "WARNING",
    timestamp: "2026-06-05T08:00:00Z",
    details: "Refrigerated rack zone experienced minor fluctuations. Zone returned to 4.2C."
  }
];

let notifications: Notification[] = [
  {
    id: "notif-1",
    title: "O- Negative emergency blood bag levels low!",
    message: "Critical shortage of O- emergency units (3 remaining, minimum requirements are 8). Restack requested immediately.",
    type: "CRITICAL",
    isRead: false,
    timestamp: "2026-06-05T08:10:00Z"
  },
  {
    id: "notif-2",
    title: "Cobas wash buffer below target minimums",
    message: "Quantity is currently 12 (Minimum targets: 15). Automated reorder report prepared.",
    type: "WARNING",
    isRead: false,
    timestamp: "2026-06-05T08:20:00Z"
  }
];

// Active request tracking index
let activeRequestIndex = -1;
let ticksInCurrentState = 0;

// Coordinate Grid slot mapper helper
function mapGridLocationToCoords(locationStr: string): { x: number; y: number; z: number } {
  // Typical formats: "RACK-A-Z1-02" or similar
  const parts = locationStr.split("-");
  const rack = parts[1] || "A";
  const zone = parts[2] || "Z1";
  const slot = parseInt(parts[3] || "1");

  let x = 300, y = 200, z = 150;
  
  if (rack === "B") x = 800;
  else if (rack === "C") x = 1400;
  else x = 400; // Rack A

  const zoneNum = parseInt(zone.replace("Z", "")) || 1;
  y = zoneNum * 350;
  z = slot * 120;

  return { x, y, z };
}

// ==========================================
// BACKGROUND SIMULATION TICKER
// ==========================================
// Ticks every 1000ms. Runs autonomous control flow to drive the robotic arm visually!
setInterval(() => {
  if (robot.status === "IDLE") {
    // Check if there is a pending/queued request that is waiting
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
        type: "INFO",
        isRead: false,
        timestamp: new Date().toISOString()
      });
    }
  } else if (robot.status === "MOVING") {
    ticksInCurrentState++;
    const target = robot.targetCoords || { x: 500, y: 350, z: 200 };
    
    // Smoothly step position coordinates closer to destination
    const step = 0.5; // reach in 2 steps
    robot.coords.x = Math.round(robot.coords.x + (target.x - robot.coords.x) * step);
    robot.coords.y = Math.round(robot.coords.y + (target.y - robot.coords.y) * step);
    robot.coords.z = Math.round(robot.coords.z + (target.z - robot.coords.z) * step);

    // If close enough, switch to PICKING
    const dist = Math.hypot(robot.coords.x - target.x, robot.coords.y - target.y, robot.coords.z - target.z);
    if (dist < 10 || ticksInCurrentState >= 2) {
      robot.coords = { ...target };
      robot.status = "PICKING";
      ticksInCurrentState = 0;
    }
  } else if (robot.status === "PICKING") {
    ticksInCurrentState++;
    if (ticksInCurrentState >= 2) {
      // Finished picking item, transition status to DELIVERING towards Dispatch Hatch
      robot.status = "DELIVERING";
      robot.targetCoords = { x: 2200, y: 50, z: 120 }; // Hatch dropoff coordinates
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
      // Complete deliver action
      if (activeRequestIndex !== -1 && requests[activeRequestIndex]) {
        const completedRequest = requests[activeRequestIndex];
        completedRequest.status = "COMPLETED";
        
        // Decrement item amount in database
        const invItemIdx = inventory.findIndex(i => i.sku === completedRequest.itemSku);
        if (invItemIdx !== -1) {
          inventory[invItemIdx].quantity = Math.max(0, inventory[invItemIdx].quantity - completedRequest.quantity);
          if (inventory[invItemIdx].quantity === 0) {
            inventory[invItemIdx].status = "EXPIRED";
          } else if (inventory[invItemIdx].quantity <= inventory[invItemIdx].targetMin) {
            inventory[invItemIdx].status = "LOW_STOCK";
          }
        }

        // Add audit log
        auditLogs.unshift({
          id: `log-auto-${Date.now()}`,
          actorName: completedRequest.requestedBy,
          actorRole: completedRequest.requestedRole,
          action: "RETRIVAL_FULL_DISPATCH",
          targetEntity: completedRequest.itemSku,
          status: "SUCCESS",
          timestamp: new Date().toISOString(),
          details: `Successfully completed high priority mechanical routing of ${completedRequest.itemName} to department: ${completedRequest.recipientDept}.`
        });

        // Add notification
        notifications.unshift({
          id: `notif-deliv-${Date.now()}`,
          title: "Robotic retrieval completed",
          message: `${completedRequest.itemName} successfully dispatched to checkout portal for dispatch to ${completedRequest.recipientDept}.`,
          type: "SUCCESS",
          isRead: false,
          timestamp: new Date().toISOString()
        });
      }

      // Transition robot back to standard resting zone (0, 0, 0)
      robot.status = "RETURNING";
      robot.targetCoords = { x: 0, y: 0, z: 0 };
      robot.carryingItemSku = undefined;
      ticksInCurrentState = 0;
    }
  } else if (robot.status === "RETURNING") {
    ticksInCurrentState++;
    const target = { x: 0, y: 0, z: 0 };
    
    const step = 0.5;
    robot.coords.x = Math.round(robot.coords.x + (target.x - robot.coords.x) * step);
    robot.coords.y = Math.round(robot.coords.y + (target.y - robot.coords.y) * step);
    robot.coords.z = Math.round(robot.coords.z + (target.z - robot.coords.z) * step);

    const dist = Math.hypot(robot.coords.x, robot.coords.y, robot.coords.z);
    if (dist < 10 || ticksInCurrentState >= 2) {
      robot.coords = { x: 0, y: 0, z: 0 };
      robot.status = "IDLE";
      robot.targetCoords = undefined;
      activeRequestIndex = -1;
      ticksInCurrentState = 0;
    }
  }
}, 1000);

// ==========================================
// ENDPOINTS
// ==========================================

// Authenticate Actor Simulation
app.post("/api/auth/login", (req, res) => {
  const { username, role } = req.body;
  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  // Simulate enterprise Token issuance & payload
  const tokenPayload = {
    username,
    role: role || "LABORATORY_STAFF",
    issuedAt: new Date().toISOString(),
    expiresIn: "8h",
    facility: "Central BioBank Diagnostic Lab v4.1"
  };

  auditLogs.unshift({
    id: `log-auth-${Date.now()}`,
    actorName: username,
    actorRole: tokenPayload.role,
    action: "SECURE_FACILITY_LOGIN",
    targetEntity: "AUTHENTICATION_SERVICE",
    status: "SUCCESS",
    timestamp: new Date().toISOString(),
    details: `Issued JWT session bearer context to actor with verified permission level: ${tokenPayload.role}.`
  });

  res.json({
    success: true,
    token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.simulatedTokenBase.${Buffer.from(JSON.stringify(tokenPayload)).toString("base64")}`,
    user: {
      name: username,
      role: tokenPayload.role
    }
  });
});

// GET complete inventory list
app.get("/api/inventory", (req, res) => {
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

  if (type && type !== "ALL") {
    filtered = filtered.filter(item => item.type === type);
  }

  if (status && status !== "ALL") {
    filtered = filtered.filter(item => item.status === status);
  }

  res.json(filtered);
});

// ADD manual stock or inventory record
app.post("/api/inventory", (req, res) => {
  const { name, type, quantity, targetMin, unit, locationGrid, temperatureGroup, expiryDate, bloodDetails, actorName, actorRole } = req.body;

  if (!name || !type || !quantity || !locationGrid) {
    return res.status(400).json({ error: "Required fields missing" });
  }

  const sku = `${type.substring(0, 3)}-${name.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
  const barcode = Math.floor(100000000000 + Math.random() * 900000000000).toString();

  const newItem: InventoryItem = {
    id: `inv-${Date.now()}`,
    sku,
    name,
    type,
    barcode,
    quantity: Number(quantity),
    targetMin: Number(targetMin || 0),
    unit: unit || "Units",
    locationGrid,
    expiryDate: expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    temperatureGroup: temperatureGroup || "ROOM_TEMP",
    tempCelsiusCurrent: temperatureGroup === "FROZEN_DEEP" ? -22.5 : temperatureGroup === "REFRIGERATED" ? 4.1 : 21.5,
    batchNumber: `B-BATCH-${Math.floor(1000 + Math.random() * 9000)}`,
    status: Number(quantity) <= Number(targetMin || 0) ? "LOW_STOCK" : "NORMAL",
    bloodDetails
  };

  inventory.push(newItem);

  auditLogs.unshift({
    id: `log-inv-${Date.now()}`,
    actorName: actorName || "Standard Personnel",
    actorRole: actorRole || "LABORATORY_STAFF",
    action: "ITEM_RECORD_CREATION",
    targetEntity: sku,
    status: "SUCCESS",
    timestamp: new Date().toISOString(),
    details: `Added new inventory record to grid ${locationGrid} with initial quantity ${quantity} ${unit}.`
  });

  notifications.unshift({
    id: `notif-inv-${Date.now()}`,
    title: "New Inventory Stock Record Added",
    message: `${name} has been added to the automated database and allocated inside storage slot ${locationGrid}.`,
    type: "SUCCESS",
    isRead: false,
    timestamp: new Date().toISOString()
  });

  res.status(201).json(newItem);
});

// UPDATE inventory quantity directly (manual replenishment)
app.put("/api/inventory/:sku", (req, res) => {
  const { sku } = req.params;
  const { quantity, actorName, actorRole } = req.body;

  const itemIdx = inventory.findIndex(item => item.sku === sku);
  if (itemIdx === -1) {
    return res.status(404).json({ error: "Item code not found" });
  }

  const oldQty = inventory[itemIdx].quantity;
  inventory[itemIdx].quantity = Number(quantity);
  
  if (inventory[itemIdx].quantity <= 0) {
    inventory[itemIdx].status = "EXPIRED";
  } else if (inventory[itemIdx].quantity <= inventory[itemIdx].targetMin) {
    inventory[itemIdx].status = "LOW_STOCK";
  } else {
    inventory[itemIdx].status = "NORMAL";
  }

  auditLogs.unshift({
    id: `log-repl-${Date.now()}`,
    actorName: actorName || "Automatic Supply Flow",
    actorRole: actorRole || "LABORATORY_STAFF",
    action: "STOCK_QUANTITY_OVERRIDE",
    targetEntity: sku,
    status: "SUCCESS",
    timestamp: new Date().toISOString(),
    details: `Adjusted barcode quantity of ${inventory[itemIdx].name} from ${oldQty} to ${quantity}.`
  });

  res.json(inventory[itemIdx]);
});

// GET current workflow request queue
app.get("/api/requests", (req, res) => {
  res.json(requests);
});

// REQUEST retrieval of sample
app.post("/api/requests", (req, res) => {
  const { itemSku, quantity, requestedBy, requestedRole, priority, recipientDept } = req.body;

  if (!itemSku || !quantity || !requestedBy || !recipientDept) {
    return res.status(400).json({ error: "Incomplete dispatch details" });
  }

  const matchedItem = inventory.find(i => i.sku === itemSku);
  if (!matchedItem) {
    return res.status(404).json({ error: "Requested item SKU code not found in laboratory storage indexes" });
  }

  if (matchedItem.quantity < quantity) {
    return res.status(400).json({ error: `Insufficient stock. Requested ${quantity}, but only ${matchedItem.quantity} units are available inside ${matchedItem.locationGrid}` });
  }

  // Generate new standard payload request
  const newReq: RetrievalRequest = {
    id: `req-${Date.now()}`,
    itemSku,
    itemName: matchedItem.name,
    itemType: matchedItem.type,
    quantity: Number(quantity),
    requestedBy,
    requestedRole: requestedRole || "LABORATORY_STAFF",
    priority: priority || "ROUTINE",
    recipientDept,
    status: "PENDING",
    timestamp: new Date().toISOString(),
    trackingCode: `RET-${Math.floor(10000 + Math.random() * 90000)}-${priority?.substring(0,3).toUpperCase()}`
  };

  requests.push(newReq);

  auditLogs.unshift({
    id: `log-req-${Date.now()}`,
    actorName: requestedBy,
    actorRole: requestedRole || "LABORATORY_STAFF",
    action: "RETRIEVAL_REQUEST_SUBMITTED",
    targetEntity: itemSku,
    status: "SUCCESS",
    timestamp: new Date().toISOString(),
    details: `Requested ${quantity} units of ${matchedItem.name} with ${priority} level urgency for target room/dept ${recipientDept}.`
  });

  res.status(201).json(newReq);
});

// GET real-time robot telemetry
app.get("/api/robot/telemetry", (req, res) => {
  res.json(robot);
});

// POST send manual manual command override (e.g. alignment calibrate or safety stop)
app.post("/api/robot/command", (req, res) => {
  const { command, actorName, actorRole } = req.body;

  if (command === "EMERGENCY_STOP") {
    robot.status = "MAINTENANCE";
    robot.errorCode = "ERR_EMERG_STOP_SAFETY";
    
    auditLogs.unshift({
      id: `log-rob-${Date.now()}`,
      actorName: actorName || "Manual Override Operator",
      actorRole: actorRole || "ADMINISTRATOR",
      action: "ROBOTIC_EMERGENCY_HALT",
      targetEntity: robot.designation,
      status: "SECURITY_ALERT",
      timestamp: new Date().toISOString(),
      details: "Emergency physical safety trip-wire activated manually by clinical supervisor."
    });

    notifications.unshift({
      id: `notif-rob-${Date.now()}`,
      title: "Robotic Retriever Core Halted",
      message: `Emergency stop initiated on ${robot.designation}. System locked in Maintenance Mode.`,
      type: "CRITICAL",
      isRead: false,
      timestamp: new Date().toISOString()
    });

  } else if (command === "CALIBRATE") {
    robot.alignmentOffsetMm = 0.00;
    robot.errorCode = undefined;
    robot.status = "IDLE";
    robot.coords = { x: 0, y: 0, z: 0 };

    auditLogs.unshift({
      id: `log-rob-${Date.now()}`,
      actorName: actorName || "Calibration Service",
      actorRole: actorRole || "ADMINISTRATOR",
      action: "RE_ALIGN_CALIBRATION",
      targetEntity: robot.designation,
      status: "SUCCESS",
      timestamp: new Date().toISOString(),
      details: "In-line positioning laser recalibrated. Angular alignment offset reset to 0.00mm."
    });

    notifications.unshift({
      id: `notif-rob-${Date.now()}`,
      title: "Robot Alpha Calibration Successful",
      message: `${robot.designation} laser navigation arrays adjusted to maximum tolerance margins. Ready for autonomous duty cycles.`,
      type: "SUCCESS",
      isRead: false,
      timestamp: new Date().toISOString()
    });
  }

  res.json({ success: true, telemetry: robot });
});

// GET complete audit history logs
app.get("/api/audit-logs", (req, res) => {
  res.json(auditLogs);
});

// GET real-time warnings and clinical events notifications
app.get("/api/notifications", (req, res) => {
  res.json(notifications);
});

// POST mark notifications as read
app.post("/api/notifications/read", (req, res) => {
  notifications = notifications.map(n => ({ ...n, isRead: true }));
  res.json({ success: true });
});

// ==========================================
// AI-POWERED CLINICAL DIAGNOSTICS & AUDITING
// ==========================================
// Invokes standard Gemini-3.5-flash model server-side as requested
app.post("/api/gemini/copilot", async (req, res) => {
  const { prompt, currentRole } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Instruction prompt cannot be blank" });
  }

  const ai = getGeminiClient();

  // Create context containing full live inventory stock status, robot logs and emergency states
  const contextDescription = `
You are the AI Clinical Copilot for the "Smart Lab Inventory & Robotic Retrieval Management System".
Below is the current REAL-TIME state of the health facility:

SYSTEM TIME: 2026-06-05
FACILITY MODEL: Central Blood Bank & Diagnostic Lab, Facility Block F-02
VERIFIED ACTOR ROLE: ${currentRole || "LAB_STAFF"}

--- CURRENT REAL-TIME STOCK INVENTORY ---
${JSON.stringify(inventory.map(i => ({
  sku: i.sku,
  name: i.name,
  type: i.type,
  qty: i.quantity,
  targetMin: i.targetMin,
  location: i.locationGrid,
  expiry: i.expiryDate,
  tempCelsius: i.tempCelsiusCurrent,
  status: i.status,
  bloodGroup: i.bloodDetails?.bloodType || "N/A",
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
- Offer predictive assistance! E.g. warn if blood packs (like emergency O- negative cells) are critically depleted (3 units remaining compared to min of 8) or if reagents like Diatron Lyse is expired (expiration was "2026-04-01").
- If the user asks about robot controller error codes, offer explicit mechanical and logic advice. For instance, describe how to calibrate the spatial laser coordinates or reset a motor thermal sensor fault.
- Provide crisp, scannable markdown responses with bullet points. Always mainain high professional gravity. Yes/no clinical validations should be bold.
`;

  try {
    let resultText = "";
    if (ai) {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: contextDescription,
          temperature: 0.2
        }
      });
      resultText = response.text || "No diagnostics yielded by primary model.";
    } else {
      // High quality local clinical fallback in case API key is missing during container preview
      resultText = `### SYSTEM ADVISORY: Mock AI Diagnostics Mode
*Note: No valid 'GEMINI_API_KEY' secret registered in environment. Utilizing local deterministic intelligence core.*

Based on real-time diagnostic telemetry scanning:
1. **Critical Blood Reserve Depletion**: 
   - **O- Transfusion cells (SKU: BB-O-NEG-EMR)** is currently at **3 unit bags**, falling well short of the safety floor threshold (**8 bags**). 
   - *Action advised*: Trigger reorder form from central Regional Blood Center immediately.
2. **Expired Reagents Flagged**:
   - **Diatron Lyse Diff Reagent (SKU: RE-DIA-LYS)** has passed its certified expiration date of **2026-04-01**. The robotic arm is currently **locking retrieval dispatch actions** on this specific slot to protect biological safety.
3. **Robotic Physical Performance**:
   - **${robot.designation}** is reporting healthy structural alignment (${robot.alignmentOffsetMm}mm laser variance). Temperature is locked at safety margin: ${robot.temperatureCelsius}°C. No current faults.`;
    }

    res.json({ response: resultText });
  } catch (error: any) {
    console.error("Gemini API error:", error);
    res.status(500).json({ error: "Failed to communicate with diagnostic core service.", details: error.message });
  }
});


// ==========================================
// VITE CLIENT INTEGRATION
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static frontend files in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Smart Healthcare Laboratory Server successfully deployed on host 0.0.0.0 and port ${PORT}`);
  });
}

startServer();
