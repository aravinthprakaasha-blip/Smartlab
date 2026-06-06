/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum ItemType {
  REAGENT = "REAGENT",
  SPECIMEN = "SPECIMEN",
  BLOOD_BAG = "BLOOD_BAG",
  SUPPLY = "SUPPLY"
}

export enum BloodType {
  A_POS = "A+",
  A_NEG = "A-",
  B_POS = "B+",
  B_NEG = "B-",
  AB_POS = "AB+",
  AB_NEG = "AB-",
  O_POS = "O+",
  O_NEG = "O-"
}

export enum BloodComponent {
  WHOLE_BLOOD = "WHOLE_BLOOD",
  PACKED_RED_CELLS = "PACKED_RED_CELLS",
  FRESH_FROZEN_PLASMA = "FRESH_FROZEN_PLASMA",
  PLATELETS = "PLATELETS"
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  type: ItemType;
  barcode: string;
  quantity: number;
  targetMin: number;
  unit: string;
  locationGrid: string; // Formatting e.g., "RACK-A-Z1-05" (Rack, Zone, Slot)
  expiryDate: string; // YYYY-MM-DD
  temperatureGroup: "FROZEN_DEEP" | "REFRIGERATED" | "ROOM_TEMP";
  tempCelsiusCurrent: number;
  batchNumber: string;
  status: "NORMAL" | "LOW_STOCK" | "EXPIRED" | "CRITICAL";
  bloodDetails?: {
    bloodType: BloodType;
    component: BloodComponent;
    donorId: string;
    crossMatchStatus: "COMPATIBLE" | "UNTESTED";
  };
}

export type RobotState = "IDLE" | "MOVING" | "PICKING" | "DELIVERING" | "PLACING" | "RETURNING" | "MAINTENANCE" | "ERROR";

export interface RobotStatus {
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

export interface RetrievalRequest {
  id: string;
  itemSku: string;
  itemName: string;
  itemType: ItemType;
  quantity: number;
  requestedBy: string;
  requestedRole: string; // ADMIN | LAB_STAFF | BLOOD_BANK_STAFF
  priority: "ROUTINE" | "URGENT" | "STAT_EMERGENCY";
  recipientDept: string;
  status: "PENDING" | "QUEUED" | "RETRIEVING" | "DELIVERING" | "COMPLETED" | "CANCELED" | "ERROR";
  timestamp: string;
  trackingCode: string; // barcode sequence
  robotId?: string;
  errorReason?: string;
}

export interface AuditLog {
  id: string;
  actorName: string;
  actorRole: string;
  action: string;
  targetEntity: string;
  status: "SUCCESS" | "WARNING" | "FAILED" | "SECURITY_ALERT";
  timestamp: string;
  details: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "WARNING" | "CRITICAL" | "INFO" | "SUCCESS";
  isRead: boolean;
  timestamp: string;
}

export interface ClinicalAnalytics {
  dailyRetrievals: number;
  bloodBagUsageForecast: { [key in BloodType]?: number };
  systemEfficiency: number; // e.g. 98.4
  robotVibrationsMm: number;
  expiringIn30Days: number;
  criticalShortagesCount: number;
}
