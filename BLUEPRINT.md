# Hemato-Robotic™ v4.1: Technical Architecture & Implementation Blueprint
### Enterprise-Grade Smart Laboratory Biorepository & Autonomous Retrieval System

---

## 1. System Engineering Overview
This document specifies the complete production-grade implementation architecture for the **Hemato-Robotic™ Smart Laboratory Inventory & Autonomous Retrieval Platform**. It bridges secure administrative/medical digital client control interfaces with real-time physical robotic gantry microcontrollers to automate biologic sample management, cold-chain monitoring, and transfusion and reagent safety lifecycles.

```
[ CLINICAL CLIENTS ]             [ EXPRESS EDGE APIS ]          [ PHYSICAL VAULT ]
   Workstation UI ----------------> REST (JWT Bearer) ------------> Relational DB
         |                                |                               |
         | websocket                      v events                        | PLC Stepper
         +=========================> [WS Orchestrator] ==================> Motors Control
```

---

## 2. Directory Structure Blueprint & Component Locations

### 2.1 Unified Frontend Structure (App Router Next.js + React)
```
/frontend
├── .env.example                      # public variables definitions
├── package.json                      # client metadata and dependencies
├── tailwind.config.js                # medical high-contrast palette definition
├── tsconfig.json                     # strict clinical typing configurations
├── /public
│   ├── /fonts                        # Space Grotesk, Inter, JetBrains Mono
│   └── /icons                        # high-contrast vector assets
└── /src
    ├── /app
    │   ├── layout.tsx                # main frame & frame permission safety hooks
    │   ├── page.tsx                  # real-time diagnostic operational monitor page
    │   ├── /login
    │   │   └── page.tsx              # multi-role secure physician PIN/RFID login portal
    │   ├── /analytics
    │   │   └── page.tsx              # forecasting, thermal charts & FDA reporting
    │   ├── /blood-bank
    │   │   └── page.tsx              # compatibility, transfusion approval workflows
    │   ├── /robot-controls
    │   │   └── page.tsx              # laser coordinate offsets & gantry status tools
    │   └── /error.tsx                # safety hardware disconnect error page
    ├── /components
    │   ├── /ui                       # glassmorphism inputs, tables and buttons
    │   ├── GantryMonitor.tsx         # real-time responsive coordinate canvas
    │   ├── BarcodeScannerHUD.tsx     # simulated aiming reticles and decoders
    │   ├── NotificationsCenter.tsx   # emergency priority alerts panel
    │   └── ReportDownloader.tsx      # secure certified audit report downloader
    ├── /hooks
    │   ├── useWebSocket.ts           # automatic reconnection subscription hook
    │   ├── useTheme.ts               # Midnight/Daylight mode persistence hook
    │   └── useSampleScanner.ts       # scan hardware trigger listener
    ├── /services
    │   ├── api.ts                    # HTTP Client with secure JWT interceptors
    │   └── auth.ts                   # authentication and session handlers
    └── /types
        └── index.ts                  # shared TypeScript interfaces (Inventory, RobotState)
```

### 2.2 Unified Backend Structure (Node.js + Express + PostgreSQL)
```
/backend
├── .env.example                      # database passwords and secret hashes
├── package.json                      # server configuration
├── tsconfig.json                     # strict runtime compilation type maps
├── server.ts                         # server bootstrap, HTTP layer, and Vite dev proxy
├── /prisma                           # DB management (or drizzle migration suite)
│   └── schema.prisma                 # database normalized entity schemas
└── /src
    ├── /controllers
    │   ├── auth.controller.ts        # physician JWT sign/verify
    │   ├── inventory.controller.ts   # CRUD, stock levels verification
    │   ├── blood.controller.ts       # compatibility checks and crossmatch registries
    │   ├── robot.controller.ts       # coordinate calculators and calibration endpoints
    │   ├── logs.controller.ts        # legal audit logs management (FDA 21 CFR)
    │   └── reports.controller.ts     # authenticated cryptographic PDF exports
    ├── /middleware
    │   ├── auth.middleware.ts        # JWT decode and Bearer authorization extractor
    │   ├── rbac.middleware.ts        # security role validation assertions
    │   └── logger.middleware.ts      # HTTP response latency and integrity monitoring
    ├── /services
    │   ├── websocket.service.ts      # room-based coordinates and alarm broadcaster
    │   └── gemini.service.ts         # generative diagnostics copilot
    ├── /repositories
    │   ├── inventory.repository.ts   # atomic database transaction queries
    │   └── logs.repository.ts        # write-once append-only database logs
    └── /types
        └── server-types.ts           # server-side declarations and payload standards
```

---

## 3. Data Integrity & PostgreSQL Relational Schema

Enforces strict relational integrity with foreign keys, unique indexed constraints on SKU codes, cascade exclusions, and absolute data persistence for audit validation.

```sql
-- Security Role Table
CREATE TYPE user_role AS ENUM ('ADMINISTRATOR', 'LABORATORY_STAFF', 'BLOOD_BANK_STAFF');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    assigned_department VARCHAR(100),
    rfid_card_num VARCHAR(50) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inventory and Specimen Core Table
CREATE TYPE item_type AS ENUM ('REAGENT', 'SPECIMEN', 'BLOOD_BAG', 'SUPPLY');
CREATE TYPE temperature_group AS ENUM ('FROZEN_DEEP', 'REFRIGERATED', 'ROOM_TEMP');

CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    item_type item_type NOT NULL,
    barcode VARCHAR(100) UNIQUE NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    target_min INTEGER NOT NULL DEFAULT 0,
    unit VARCHAR(50) NOT NULL,
    location_grid_address VARCHAR(50) NOT NULL, -- e.g., 'RACK-A-Z3-05'
    expiry_date DATE NOT NULL,
    temp_group temperature_group NOT NULL,
    temp_celsius_current DECIMAL(5,2) NOT NULL,
    batch_number VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Blood Bank Specific Entity Relational Mapping
CREATE TYPE blood_group_type AS ENUM ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');
CREATE TYPE blood_component_type AS ENUM ('WHOLE_BLOOD', 'PACKED_RED_CELLS', 'FRESH_FROZEN_PLASMA', 'PLATELETS');

CREATE TABLE blood_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_item_sku VARCHAR(100) REFERENCES inventory_items(sku) ON DELETE CASCADE,
    blood_type blood_group_type NOT NULL,
    component blood_component_type NOT NULL,
    donor_id VARCHAR(100) NOT NULL,
    cross_match_status VARCHAR(50) DEFAULT 'UNTESTED' NOT NULL,
    compatibility_signature VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Automated Gantry Robot Status Matrix
CREATE TYPE robot_state AS ENUM ('IDLE', 'MOVING', 'PICKING', 'DELIVERING', 'PLACING', 'RETURNING', 'MAINTENANCE', 'ERROR');

CREATE TABLE robot_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    designation VARCHAR(100) NOT NULL,
    status robot_state NOT NULL DEFAULT 'IDLE',
    coord_x INT NOT NULL DEFAULT 0,
    coord_y INT NOT NULL DEFAULT 0,
    coord_z INT NOT NULL DEFAULT 0,
    carrying_item_sku VARCHAR(100) REFERENCES inventory_items(sku) ON DELETE SET NULL,
    speed_mm_ps INT DEFAULT 450,
    temperature_celsius DECIMAL(4,1) DEFAULT 24.5,
    alignment_offset_mm DECIMAL(4,2) NOT NULL DEFAULT 0.00,
    error_code VARCHAR(50),
    last_maintenance_date DATE
);

-- Retrieval Requests (Gantry Scheduling Table)
CREATE TYPE retrieval_status AS ENUM ('PENDING', 'QUEUED', 'RETRIEVING', 'DELIVERING', 'COMPLETED', 'CANCELED', 'ERROR');
CREATE TYPE urgency_level AS ENUM ('ROUTINE', 'URGENT', 'STAT_EMERGENCY');

CREATE TABLE retrieval_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_sku VARCHAR(100) REFERENCES inventory_items(sku) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    requested_by UUID REFERENCES users(id),
    priority urgency_level NOT NULL DEFAULT 'ROUTINE',
    recipient_dept VARCHAR(100) NOT NULL,
    status retrieval_status NOT NULL DEFAULT 'PENDING',
    tracking_code VARCHAR(100) UNIQUE NOT NULL,
    assigned_robot_id UUID REFERENCES robot_status(id),
    error_reason TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- FDA 21 CFR Part 11 Append-Only Audit Logging
CREATE TABLE clinical_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_name VARCHAR(150) NOT NULL,
    actor_role VARCHAR(100) NOT NULL,
    action_name VARCHAR(100) NOT NULL, -- e.g., 'STOCK_REPLENISHED', 'ROBOT_CALIBRATE', 'EMERGENCY_DISPENSE'
    target_entity VARCHAR(150),
    status_flag VARCHAR(50) NOT NULL,   -- e.g., 'SUCCESS', 'FAILED', 'SECURITY_ALERT'
    details TEXT NOT NULL,
    ip_address VARCHAR(45),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. RESTful API Specification & Payload Guidelines

All requests must configure `Header: Authorization` set to `Bearer <JWT_HASH>`. Standard responses must return unified content.

### 4.1 Authentication Service Portal
* **POST `/api/auth/login`**
  * *Request Body:*
    ```json
    { "username": "Evelyn Winters", "passcode": "8842", "role": "BLOOD_BANK_STAFF" }
    ```
  * *Response (Success - 200 OK):*
    ```json
    {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": { "name": "Evelyn Winters", "role": "BLOOD_BANK_STAFF", "dept": "Transfusion Clinic" }
    }
    ```

### 4.2 Medical Inventory Queries & Stock Additions
* **GET `/api/inventory`**
  * *Query Params:* `search=O-`, `type=BLOOD_BAG`, `status=LOW_STOCK`
  * *Response (200 OK):*
    ```json
    [
      {
        "id": "inv-6",
        "sku": "BB-O-NEG-EMR",
        "name": "O- Emergency Transfusion Red Cells",
        "type": "BLOOD_BAG",
        "barcode": "BLOOD-0001",
        "quantity": 3,
        "locationGrid": "RACK-A-Z2-04",
        "status": "LOW_STOCK",
        "expiryDate": "2026-07-02"
      }
    ]
    ```
* **POST `/api/inventory`** (Gated: `BLOOD_BANK_STAFF`, `ADMINISTRATOR`)
  * *Request Body:*
    ```json
    {
      "name": "Diatron Lyse Diff Reagent",
      "type": "REAGENT",
      "quantity": 10,
      "locationGrid": "RACK-A-Z1-02",
      "expiryDate": "2026-11-30",
      "temperatureGroup": "REFRIGERATED"
    }
    ```

### 4.3 Robot Navigation & Alignment Command Core
* **GET `/api/robot/status`**
  * *Response (200 OK):*
    ```json
    {
      "id": "rob-alpha",
      "status": "IDLE",
      "coords": { "x": 12, "y": 8, "z": 4 },
      "speedMmPs": 450,
      "alignmentOffsetMm": 0.02
    }
    ```
* **POST `/api/robot/recalibrate`** (Gated: `ADMINISTRATOR` only)
  * *Request Body:* `{ "robotId": "rob-alpha", "axis": "all", "offsetTargetMm": 0.00 }`
  * *Response (200 OK):*
    ```json
    { "status": "SUCCESS", "message": "Laser optical alignment recalibrated.", "offset": 0.00 }
    ```

### 4.4 Certified Reporting and FDA Compilations
* **POST `/api/reports/reconcile`** (Audit History Logger)
  * *Request Body:* `{ "reportType": "FDA_21_CFR_AUDIT", "dateSpan": "30_DAYS" }`
  * *Response (201 Created):*
    ```json
    {
      "status": "SUCCESS",
      "reportId": "rep-779A31",
      "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "indexedRecords": 115
    }
    ```

---

## 5. Real-time Events & WebSocket Schema
Enforces room subscriptions and asynchronous state distribution from the robotic coordinator microservices.

### 5.1 Event Payload Matrix
* **`ROBOT_TELEMETRY_EMIT`** (Frequency: 250ms during motor sweep)
  ```json
  {
    "eventId": "evt-rob-coords",
    "robotId": "rob-alpha",
    "status": "MOVING",
    "currentCoords": { "x": 124, "y": 341, "z": 92 },
    "errorStatus": null,
    "currentSpeed": 1150
  }
  ```
* **`RETRIEVAL_STAGE_UPDATE`** (Status propagation)
  ```json
  {
    "requestId": "req-9821",
    "sku": "BB-O-NEG-EMR",
    "currentStatus": "DELIVERING",
    "completedPercent": 75,
    "courierStation": "HATCH-1"
  }
  ```
* **`CRITICAL_STOCK_SHADOW_ALERT`** (Low Stock alerts & Thermal faults warning)
  ```json
  {
    "eventId": "evt-alarm-023",
    "severity": "CRITICAL",
    "scope": "THERMAL_COMPONENT",
    "details": "Cryogenic storage Cell Rack-A temperature climbed to -12.4°C (Limit: -20.0°C)",
    "timestamp": "2026-06-05T09:07:21Z"
  }
  ```

---

## 6. Smart Blood Compatibility Logic (Transfusion Security Engine)

The matching system checks medical infusable compatibility according to international transfusion protocols, with fallback alerts to protect surgical recipients.

```
                  +-----------------------------------+
                  |  Patient Blood Group Requested    |
                  +-----------------+-----------------+
                                    |
          +-------------------------+-------------------------+
          | (A+)                    | (O-)                    | (AB+)
          v                         v                         v
  +---------------+         +---------------+         +----------------------------+
  | Matches:      |         | Matches:      |         | Matches:                   |
  | A+, A-, O+, O-|         | O- ONLY       |         | Universal Donor Compatible |
  +---------------+         +---------------+         | All clinical groups accepted|
                                                      +----------------------------+
```

### 6.1 Logical Fallback & Priority Matching Array (TypeScript Rules Engine)
```typescript
export interface CompatibilityConfig {
  patientGroup: string;
  allowedDonorGroups: string[];
  alertLevel: "STANDARD" | "WARNING" | "CRITICAL";
  validationWarning?: string;
}

export const BloodTransfusionMatcher: Record<string, CompatibilityConfig> = {
  "O-": {
    patientGroup: "O-",
    allowedDonorGroups: ["O-"],
    alertLevel: "CRITICAL",
    validationWarning: "HIGH EMERGENCY RISK: Patient is O-Negative and can ONLY receive O-Negative cells. Double-check duplicate agglutination slides before dispenser release."
  },
  "O+": {
    patientGroup: "O+",
    allowedDonorGroups: ["O+", "O-"],
    alertLevel: "STANDARD"
  },
  "A-": {
    patientGroup: "A-",
    allowedDonorGroups: ["A-", "O-"],
    alertLevel: "WARNING"
  },
  "A+": {
    patientGroup: "A+",
    allowedDonorGroups: ["A+", "A-", "O+", "O-"],
    alertLevel: "STANDARD"
  },
  "B-": {
    patientGroup: "B-",
    allowedDonorGroups: ["B-", "O-"],
    alertLevel: "WARNING"
  },
  "B+": {
    patientGroup: "B+",
    allowedDonorGroups: ["B+", "B-", "O+", "O-"],
    alertLevel: "STANDARD"
  },
  "AB-": {
    patientGroup: "AB-",
    allowedDonorGroups: ["AB-", "A-", "B-", "O-"],
    alertLevel: "WARNING"
  },
  "AB+": {
    patientGroup: "AB+",
    allowedDonorGroups: ["AB+", "AB-", "A+", "A-", "B+", "B-", "O+", "O-"],
    alertLevel: "STANDARD",
    validationWarning: "Universal acceptor signature active. All available stored bags match infusable criteria."
  }
};
```

### 6.2 Patient Agglutination Verification Logic
Whenever a blood unit with a status of `UNTESTED` is selected under high-urgency states, the Express router prevents mechanical dispatch until the clinician uploads a valid crossmatch approval payload containing:
1. Patient slide test validation timestamp.
2. Verified secondary clinician ID electronic signature.

---

## 7. Gantry Robot Dispatch Planning Lifecycle

### 7.1 Coordinate Interpolation Path Matrix
The repository uses an automated 3-axis rack structure:
- **X-Axis:** Horizontal track positioning (rack segments 1 to 24).
- **Y-Axis:** Vertical shelf height (racks coordinate level 1 to 10).
- **Z-Axis:** Direct slot retrieval linear actuator (extension 0mm to 1200mm).

```
       [ IDLE ]                 [ MOUNTING ]               [ PICKING ]
         │ (Command Dispatch)        │ (Coordinates Target)     │ (Laser scan SKU)
         ▼                           ▼                          ▼
   Moving to Track ------------> Laser Alignment ----------> Linear Extension
         │                           │ (Recalibrate request)    │
         ▼                           ▼                          ▼
   Dispense Hatch <---------- Alignment Tolerated <------- Deduct Inventory
```

### 7.2 Safety Interception Protocol (Hardware Guard)
If linear encoders detect physical resistance exceeding **3.4 Newtons** or laser alignment measures variance greater than **0.12mm**, the PLC controller initiates emergency braking (`ERR_COLL_AVOID`) and notifies the workstation UI via WebSockets. It remains physically locked out until authorization recovery overrides are signed.

---

## 8. Deployment Architecture (Continuous High Availability)

### 8.1 Docker Multi-Container Architecture (Production Stack)
```yaml
version: '3.8'

services:
  db-postgres:
    image: postgres:15-alpine
    container_name: clinical_database
    restart: always
    environment:
      POSTGRES_DB: hematorobotic_store
      POSTGRES_USER: admin_clinical
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    secrets:
      - db_password
    volumes:
      - clinical_data:/var/lib/postgresql/data
    networks:
      - medical_backbone

  clinical-redis-cache:
    image: redis:7-alpine
    container_name: telemetry_cache
    restart: always
    networks:
      - medical_backbone

  express-app-server:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: clinical_express_api
    depends_on:
      - db-postgres
      - clinical-redis-cache
    environment:
      NODE_ENV: production
      PORT: 3000
    ports:
      - "3000:3000"
    networks:
      - medical_backbone
    restart: always

networks:
  medical_backbone:
    driver: bridge

secrets:
  db_password:
    external: true
```

### 8.2 Safe Backup Strategy
1. **Database Snapshots:** Daily incremental replication to certified air-gapped storage systems utilizing secure SFTP, keeping logs for 7 years to comply with FDA mandates.
2. **Dynamic Log Replication:** Write-ahead logs (WAL) shipped to secondary read-replicas for sub-second recovery states.

---

## 9. Security Best Practices & FDA 21 CFR Compliance Checklist

Ensure complete compliance before dispatching the platform in certified clinical centers:
* [ ] **Cryptographic Signing:** Enforce SSL/TLS v1.3 with standard SHA-2.
* [ ] **Session Lockout:** Invalidate idle clinician workstations after 120 seconds of no interaction.
* [ ] **Audit Trail Integrity:** Check that `clinical_audit_logs` includes write-once properties, preventing updates on existing rows.
* [ ] **Database Encryption:** Ensure transparent database encryption is enabled at rest for clinical diagnostic samples.
