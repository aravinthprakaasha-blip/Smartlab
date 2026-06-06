/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Bot,
  Activity,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  Database,
  Search,
  PlusCircle,
  CheckCircle,
  Shield,
  FileText,
  Send,
  User,
  ChevronDown,
  Bell,
  Thermometer,
  Wind,
  Zap,
  BarChart2,
  Calendar,
  Clipboard,
  Check,
  Lock,
  Unlock,
  Sliders,
  Sparkles,
  Sun,
  Moon,
  Inbox,
  Globe,
  Building,
  Terminal,
  ArrowRight,
  Cpu,
  Layers,
  Workflow,
  MessageSquare
} from "lucide-react";
import {
  InventoryItem,
  ItemType,
  BloodType,
  BloodComponent,
  RobotStatus,
  RetrievalRequest,
  AuditLog,
  Notification
} from "./types";

export default function App() {
  // Tabs
  const [activeTab, setActiveTab] = useState<"operations" | "analytics" | "architecture">("operations");

  // Active page view mode ("website" presents public website, "portal" is clinical workstation)
  const [viewMode, setViewMode] = useState<"website" | "portal">("website");

  // Website Interactive Sandbox Preview / Demo states
  const [webActiveModule, setWebActiveModule] = useState<"crossmatch" | "scanner" | "robot">("crossmatch");
  const [webBarcodeStatus, setWebBarcodeStatus] = useState<"IDLE" | "SCANNING" | "SUCCESS">("IDLE");
  const [webScannedItem, setWebScannedItem] = useState<string>("");
  const [webPatientBlood, setWebPatientBlood] = useState<BloodType>(BloodType.O_NEG);
  const [webAiPrompt, setWebAiPrompt] = useState("");
  const [webAiResponse, setWebAiResponse] = useState("");
  const [webAiLoading, setWebAiLoading] = useState(false);
  const [webFaqActiveIndex, setWebFaqActiveIndex] = useState<number | null>(null);
  const [webFormSubmitted, setWebFormSubmitted] = useState(false);

  // User Authentication Simulation State
  const [currentUser, setCurrentUser] = useState({ name: "Dr. Marcus Vance", role: "LABORATORY_STAFF" });
  const [token, setToken] = useState<string>("");
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isFullyLoggedIn, setIsFullyLoggedIn] = useState(false); // gated login interface!
  const [loginUsername, setLoginUsername] = useState("Dr. Marcus Vance");
  const [loginRole, setLoginRole] = useState("LABORATORY_STAFF");
  const [loginPassword, setLoginPassword] = useState("••••••••");
  const [showPasswordRecovery, setShowPasswordRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryStatus, setRecoveryStatus] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authSuccessAnim, setAuthSuccessAnim] = useState(false);

  // Physical Diagnostic Theme Status
  const [themeMode, setThemeMode] = useState<"dark" | "light">("dark");

  // Interactive Barcode & QR Scanner Module
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerType, setScannerType] = useState<"QR" | "BARCODE">("BARCODE");
  const [lastScannedResult, setLastScannedResult] = useState<string>("");
  const [scanProcessing, setScanProcessing] = useState(false);

  // Blood compatibility consultation engine
  const [selectedPatientBlood, setSelectedPatientBlood] = useState<BloodType>(BloodType.O_NEG);

  // Interactive Report Download State Machine
  const [reportDownloadState, setReportDownloadState] = useState<"IDLE" | "PREPARING" | "DOWNLOADING" | "FINISHED">("IDLE");
  const [downloadProgress, setDownloadProgress] = useState(0);

  // States fetched from simulated Database API
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [requests, setRequests] = useState<RetrievalRequest[]>([]);
  const [robotStatus, setRobotStatus] = useState<RobotStatus | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Create / UI states
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Dispatch Retrieval Form
  const [dispatchSku, setDispatchSku] = useState("");
  const [dispatchQty, setDispatchQty] = useState(1);
  const [dispatchDept, setDispatchDept] = useState("Critical Ward A");
  const [dispatchPriority, setDispatchPriority] = useState<"ROUTINE" | "URGENT" | "STAT_EMERGENCY">("URGENT");
  
  // Custom manual stock creation state
  const [newItemName, setNewItemName] = useState("");
  const [newItemType, setNewItemType] = useState<ItemType>(ItemType.REAGENT);
  const [newItemQty, setNewItemQty] = useState(10);
  const [newItemMin, setNewItemMin] = useState(5);
  const [newItemUnit, setNewItemUnit] = useState("vials");
  const [newItemGridLocation, setNewItemGridLocation] = useState("RACK-B-Z3-05");
  const [newItemTemp, setNewItemTemp] = useState<"FROZEN_DEEP" | "REFRIGERATED" | "ROOM_TEMP">("REFRIGERATED");
  const [newBloodType, setNewBloodType] = useState<BloodType>(BloodType.O_POS);
  const [newBloodComponent, setNewBloodComponent] = useState<BloodComponent>(BloodComponent.WHOLE_BLOOD);
  const [newDonorId, setNewDonorId] = useState("DN-9982");
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);

  // AI Copilot prompt state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Notification Indicator popover
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Fetch Loop
  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 1500); // Poll every 1.5s for real-time visualization & mechanical tracking updates!
    return () => clearInterval(interval);
  }, []);

  // Sync theme mode with document body
  useEffect(() => {
    if (themeMode === "light") {
      document.body.classList.add("light-theme");
    } else {
      document.body.classList.remove("light-theme");
    }
  }, [themeMode]);

  const fetchSafely = async <T,>(url: string, fallback: T): Promise<T> => {
    try {
      const r = await fetch(url);
      if (!r.ok) {
        return fallback;
      }
      return await r.json();
    } catch (err) {
      // Log as soft warning, avoiding fatal console.error logs
      console.warn(`Transient sync warning for ${url}:`, err);
      return fallback;
    }
  };

  const fetchData = async () => {
    const invData = await fetchSafely(`/api/inventory?search=${searchTerm}&type=${typeFilter}&status=${statusFilter}`, inventory);
    const reqData = await fetchSafely("/api/requests", requests);
    const robData = await fetchSafely("/api/robot/telemetry", robotStatus);
    const logData = await fetchSafely("/api/audit-logs", auditLogs);
    const notifData = await fetchSafely("/api/notifications", notifications);

    setInventory(invData);
    setRequests(reqData);
    setRobotStatus(robData);
    setAuditLogs(logData);
    setNotifications(notifData);
  };

  // Login handler
  const handleLogin = async (username: string, role: string) => {
    setIsAuthenticating(true);
    setAuthSuccessAnim(false);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, role })
      });
      const data = await res.json();
      if (data.success) {
        setToken(data.token);
        setCurrentUser({ name: data.user.name, role: data.user.role });
        setIsAuthOpen(false);
        setAuthSuccessAnim(true);
        setTimeout(() => {
          setIsFullyLoggedIn(true);
          setIsAuthenticating(false);
        }, 800);
      } else {
        setIsAuthenticating(false);
      }
    } catch (e) {
      console.error(e);
      setIsAuthenticating(false);
    }
  };

  // Dispatch Retrieval Request
  const handleDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchSku) {
      alert("Please select or enter an active SKU to retrieve.");
      return;
    }
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemSku: dispatchSku,
          quantity: dispatchQty,
          requestedBy: currentUser.name,
          requestedRole: currentUser.role,
          priority: dispatchPriority,
          recipientDept: dispatchDept
        })
      });
      if (res.ok) {
        setDispatchQty(1);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to dispatch robot");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Quick manual adjustment of stock counts
  const handleQuickAdjust = async (sku: string, newQuantity: number) => {
    try {
      const res = await fetch(`/api/inventory/${sku}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: newQuantity,
          actorName: currentUser.name,
          actorRole: currentUser.role
        })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Submit robot maintenance command overrides
  const handleRobotControl = async (command: "EMERGENCY_STOP" | "CALIBRATE") => {
    try {
      await fetch("/api/robot/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command,
          actorName: currentUser.name,
          actorRole: currentUser.role
        })
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  // Manual record insert Form
  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName || !newItemGridLocation) {
      alert("Incomplete fields");
      return;
    }

    const payload: any = {
      name: newItemName,
      type: newItemType,
      quantity: newItemQty,
      targetMin: newItemMin,
      unit: newItemUnit,
      locationGrid: newItemGridLocation,
      temperatureGroup: newItemTemp,
      actorName: currentUser.name,
      actorRole: currentUser.role
    };

    if (newItemType === ItemType.BLOOD_BAG) {
      payload.bloodDetails = {
        bloodType: newBloodType,
        component: newBloodComponent,
        donorId: newDonorId,
        crossMatchStatus: "COMPATIBLE"
      };
    }

    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsAddStockOpen(false);
        setNewItemName("");
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Call server-side clinical Copilot API
  const handleAiAsk = async (explicitPrompt?: string) => {
    const promptToSend = explicitPrompt || aiPrompt;
    if (!promptToSend) return;

    setIsAiLoading(true);
    setAiResponse("");
    try {
      const res = await fetch("/api/gemini/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptToSend,
          currentRole: currentUser.role
        })
      });
      const data = await res.json();
      setAiResponse(data.response);
    } catch (e) {
      setAiResponse("System error synchronizing with clinical copilot AI.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Reset notifications unread badges
  const handleMarkNotifRead = async () => {
    try {
      await fetch("/api/notifications/read", { method: "POST" });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  // Blood bank totals counter
  const getBloodTypeSummary = (blood: BloodType) => {
    return inventory
      .filter(item => item.type === ItemType.BLOOD_BAG && item.bloodDetails?.bloodType === blood)
      .reduce((acc, item) => acc + item.quantity, 0);
  };

  const criticalNotificationCount = notifications.filter(n => !n.isRead).length;

  // Website Interactive Sandbox Preview handlers
  const handleWebAiSubmit = async (customPrompt?: string) => {
    const finalPrompt = customPrompt || webAiPrompt;
    if (!finalPrompt) return;
    setWebAiLoading(true);
    setWebAiResponse("");
    try {
      const res = await fetch("/api/gemini/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: finalPrompt,
          currentRole: "LABORATORY_STAFF"
        })
      });
      const data = await res.json();
      setWebAiResponse(data.reply || "Clinical assessment completed successfully.");
    } catch (err) {
      setWebAiResponse("System error synchronizing with clinical copilot AI.");
    } finally {
      setWebAiLoading(false);
    }
  };

  const handleWebScanSimulation = async (sku: string) => {
    setWebBarcodeStatus("SCANNING");
    setWebScannedItem(sku);
    setTimeout(async () => {
      try {
        await fetch("/api/audit-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            actorName: "Public Site Visitor",
            actorRole: "LABORATORY_STAFF",
            targetEntity: sku,
            status: "SUCCESS",
            details: `Simulated optical scan of ${sku === "O-NEG-WHO-W1" ? "Whole Blood Bag O-Neg" : "PCR Reagent batch"} using interactive homepage sandbox scanner widget.`
          })
        });
        fetchData();
        setWebBarcodeStatus("SUCCESS");
      } catch (err) {
        setWebBarcodeStatus("IDLE");
      }
    }, 1100);
  };

  const webTriggerRobotCalibration = async () => {
    try {
      const res = await fetch("/api/robot/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: "CALIBRATE",
          actorName: "Web Demonstration Portal",
          actorRole: "ADMINISTRATOR"
        })
      });
      if (res.ok) {
        fetchData();
        alert("Success: Hardware offset correction sequence dispatched from website sandbox to MED-RETRIEVER-01.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Instant demo workstation entry flow bypass to save clicks!
  const handleSimulateInstantLogin = async (username: string, role: string) => {
    setIsAuthenticating(true);
    setAuthSuccessAnim(false);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, role })
      });
      const data = await res.json();
      if (data.success) {
        setToken(data.token);
        setCurrentUser({ name: data.user.name, role: data.user.role });
        setIsAuthOpen(false);
        setAuthSuccessAnim(true);
        setTimeout(() => {
          setIsFullyLoggedIn(true);
          setIsAuthenticating(false);
          setViewMode("portal");
        }, 300);
      }
    } catch (err) {
      console.error(err);
      setIsAuthenticating(false);
    }
  };

  if (viewMode === "website") {
    // Total bags in live system
    const totalInventoryCount = inventory.reduce((sum, item) => sum + item.quantity, 0);
    const criticalItems = inventory.filter(i => i.quantity <= i.targetMin).length;

    return (
      <div className={`min-h-screen text-slate-100 font-sans selection:bg-teal-500 selection:text-white relative transition-colors duration-300 ${
        themeMode === "light" ? "bg-slate-50 text-slate-900 light-theme" : "bg-[#070a13]"
      }`} id="public-website-landing">
        
        {/* Dynamic header ambient glows in dark mode */}
        {themeMode === "dark" && (
          <>
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-[140px] pointer-events-none"></div>
            <div className="absolute top-[800px] right-1/4 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none"></div>
          </>
        )}

        {/* Global System Banner Alert */}
        <div className="bg-gradient-to-r from-teal-950/90 via-slate-900 to-indigo-950/90 border-b border-clinical-border text-[11px] font-mono py-2.5 px-4 text-center text-teal-400 flex items-center justify-center gap-2 flex-wrap" id="top-announcement-bar">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
          </span>
          <span className="uppercase tracking-wider font-semibold">HEM-ROBOTICS PRODUCTION CORE v4.1 IS RUNNING ACTIVE TELEMETRY</span>
          <span className="hidden md:inline-block text-slate-500">|</span>
          <span className="hidden md:inline text-slate-300">Fast, safe auto-dispatch and active cold-chain compliance tracking</span>
        </div>

        {/* Sticky Web Header / Logo Navigation */}
        <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-clinical-border/80 transition-colors" style={{ backgroundColor: themeMode === "light" ? "rgba(255,255,255,0.85)" : "rgba(7,10,19,0.85)" }} id="web-navbar">
          <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-teal-500 to-indigo-600 rounded-xl text-white shadow-md shadow-teal-500/20">
                <Bot className="w-5.5 h-5.5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="font-display font-semibold text-sm uppercase tracking-widest text-slate-50 style-title" style={{ color: themeMode === "light" ? "#0f172a" : "#f8fafc" }}>
                    HEMATO-ROBOTIC™
                  </h1>
                  <span className="text-[8.5px] bg-teal-500/10 text-teal-400 border border-teal-500/25 px-1 rounded font-mono font-bold">CORE v4.1</span>
                </div>
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block">Autonomous Biorepository Solutions</span>
              </div>
            </div>

            {/* Anchors link center */}
            <nav className="hidden lg:flex items-center gap-6 text-xs uppercase tracking-wider font-medium text-slate-400">
              <a href="#features" className="hover:text-teal-400 transition-colors">Key Features</a>
              <a href="#interactive-sandbox" className="hover:text-teal-400 transition-colors">Live Simulation Rigs</a>
              <a href="#clinical-copilot" className="hover:text-teal-400 transition-colors">Medical Copilot</a>
              <a href="#system-architecture" className="hover:text-teal-400 transition-colors">Architecture SPEC</a>
              <a href="#faqs" className="hover:text-teal-400 transition-colors">FAQs</a>
            </nav>

            {/* Quick settings & CTA */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setThemeMode(themeMode === "dark" ? "light" : "dark")}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer border border-clinical-border"
                title="Toggle Theme"
                id="landing-theme-toggle"
              >
                {themeMode === "dark" ? <Sun className="w-4 h-4 text-teal-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
              </button>

              <button
                onClick={() => setViewMode("portal")}
                className="hidden sm:inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-100 hover:text-white px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer"
                id="portal-gate-nav-btn"
              >
                <Shield className="w-3.5 h-3.5 text-teal-400" /> Member Sign In
              </button>

              <button
                onClick={() => handleSimulateInstantLogin("Dr. Marcus Vance", "LABORATORY_STAFF")}
                className="bg-gradient-to-r from-teal-500 to-indigo-650 hover:from-teal-600 hover:to-indigo-700 text-white px-4.5 py-2 rounded-xl text-xs uppercase tracking-wider font-bold shadow-lg shadow-teal-500/10 transition-all hover:scale-[1.02] cursor-pointer"
                id="guest-instant-access-btn"
              >
                Launch Workstation
              </button>
            </div>
          </div>
        </header>

        {/* Elegant Hero Presentation Section */}
        <section className="relative pt-12 pb-20 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center" id="hero">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 bg-teal-500/10 text-teal-400 border border-teal-500/20 px-3 py-1 rounded-full text-[10.5px] font-mono tracking-wider uppercase font-semibold">
              <Activity className="w-3.5 h-3.5 animate-pulse text-teal-400" /> Autonomous Med-Tech Systems
            </div>

            <h2 className="font-display font-bold text-3xl sm:text-5xl leading-tight tracking-tight text-white style-title-hero" style={{ color: themeMode === "light" ? "#0f172a" : "#ffffff" }}>
              Automated Hospital Bio-chain &amp; Precision Sample Robotics
            </h2>

            <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl">
              An enterprise cyber-physical laboratory infrastructure solution, unifying sterile cold pneumatic preservation vaults, self-calibrating mechanical gantry retrievers, and real-time medical ledger sync. Fully integrated with clinical-grade Gemini AI assistance to guide hospital operators dynamically.
            </p>

            {/* Call to Actions */}
            <div className="flex flex-wrap gap-3.5 pt-2">
              <button
                onClick={() => handleSimulateInstantLogin("Dr. Marcus Vance", "LABORATORY_STAFF")}
                className="bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-650 hover:to-indigo-650 text-white px-6 py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs shadow-xl shadow-teal-500/20 hover:scale-[1.01] transition-transform flex items-center gap-2 cursor-pointer"
                id="hero-play"
              >
                <Zap className="w-4 h-4 text-teal-100 animate-bounce" /> Simulate One-Click Guest Workstation
              </button>

              <button
                onClick={() => setViewMode("portal")}
                className="bg-slate-900 hover:bg-slate-800 border border-clinical-border text-slate-205 hover:text-white px-5 py-3.5 rounded-xl font-semibold uppercase tracking-wider text-xs transition-colors flex items-center gap-2 cursor-pointer"
                id="hero-signin-link"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" /> Credentials Portal Gate
              </button>

              <a
                href="#interactive-sandbox"
                className="bg-transparent hover:bg-slate-800/40 border border-transparent hover:border-slate-800 px-5 py-3.5 rounded-xl font-semibold uppercase tracking-wider text-xs transition-colors flex items-center justify-center text-teal-400 cursor-pointer"
              >
                Evaluate Live Testing Rigs &darr;
              </a>
            </div>

            {/* Quick features chips */}
            <div className="pt-6 border-t border-clinical-border flex flex-wrap gap-x-6 gap-y-3 text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-400" /> FDA 21 CFR Compliant
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-400" /> Safe Gantry Retrievers
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-400" /> Real-Time Relational Sync
              </div>
            </div>
          </div>

          {/* Right Hero side card: Live Active Telemetry Stat Monitor */}
          <div className="lg:col-span-5 bg-slate-900/40 border border-clinical-border p-6 rounded-2xl relative shadow-xl overflow-hidden backdrop-blur-md" id="hero-live-telemetry">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-3xl"></div>
            
            <div className="flex items-center justify-between border-b border-clinical-border pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">LIVE TELEMETRY STATION</span>
              </div>
              <div className="text-[10px] font-mono text-slate-400 uppercase bg-slate-800 border border-slate-700 px-2 py-0.5 rounded">
                SECURE INSTANCE
              </div>
            </div>

            {/* Telemetry Numbers Grid */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950/80 border border-clinical-border p-3 rounded-xl">
                  <span className="text-[9.5px] font-mono text-slate-500 block uppercase">COLD STORAGE RECEPTACLE</span>
                  <span className="text-xl font-mono font-bold text-slate-100" style={{ color: themeMode === "light" ? "#0f172a" : "#f1f5f9" }}>
                     -25.4°C
                  </span>
                  <div className="flex items-center gap-1.5 mt-1 text-[9px] text-teal-400 font-mono">
                     <Thermometer className="w-3 h-3" /> TEMPERATURE VERIFIED
                  </div>
                </div>

                <div className="bg-slate-950/80 border border-clinical-border p-3 rounded-xl">
                  <span className="text-[9.5px] font-mono text-slate-500 block uppercase">ROBOT PERFORMANCE</span>
                  <span className="text-xl font-mono font-bold text-slate-100" style={{ color: themeMode === "light" ? "#0f172a" : "#f1f5f9" }}>
                     {robotStatus?.speedMmPs || 1200} <span className="text-[10px] text-slate-500">mm/s</span>
                  </span>
                  <div className="flex items-center gap-1.5 mt-1 text-[9px] text-sky-400 font-mono">
                     <Zap className="w-3 h-3 font-normal" /> MULTI-AXIS GAIN COMP
                  </div>
                </div>
              </div>

              {/* Central status line */}
              <div className="bg-slate-950/80 border border-clinical-border p-3 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-mono text-slate-400 uppercase">ACTIVE ROBOT STATE</span>
                  <span className={`px-2 py-0.5 text-[9px] rounded-full font-mono uppercase font-semibold ${
                    robotStatus?.status === "IDLE" ? "bg-teal-500/10 text-teal-400" : "bg-sky-500/10 text-sky-400"
                  }`}>
                    {robotStatus?.status || "IDLE"}
                  </span>
                </div>
                {/* Horizontal progress visualization gantry */}
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden relative">
                  <div className="h-full bg-gradient-to-r from-teal-400 to-indigo-500 rounded-full animate-pulse" style={{ width: "65%" }}></div>
                </div>
                <div className="flex justify-between items-center text-[9px] font-mono text-slate-500">
                  <span>GRIPPER POS X: {(robotStatus?.coords.x || 0.12).toFixed(2)}</span>
                  <span>POS Y: {(robotStatus?.coords.y || 0.45).toFixed(2)}</span>
                  <span>OFFSET: ±{(robotStatus?.alignmentOffsetMm || 0.04)}mm</span>
                </div>
              </div>

              {/* Inventory stats */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9.5px] font-mono text-slate-500 uppercase">Total Items Audited</span>
                  <span className="text-sm font-semibold font-mono" style={{ color: themeMode === "light" ? "#0f172a" : "#e2e8f0" }}>{totalInventoryCount} units</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9.5px] font-mono text-slate-500 uppercase">Below Threshold Alerts</span>
                  <span className="text-sm font-semibold font-mono text-amber-500">{criticalItems} items flag</span>
                </div>
              </div>
            </div>

            {/* Quick micro action inside home page stat counter */}
            <div className="mt-5 pt-3.5 border-t border-clinical-border/80 flex items-center justify-between text-[10.5px]">
               <span className="text-slate-400 italic">Dispatched: <strong className="text-slate-205 font-medium font-mono">{requests.length} operations logged</strong></span>
               <button
                 onClick={fetchData}
                 className="text-teal-400 hover:text-teal-300 font-mono flex items-center gap-1 cursor-pointer transition-colors"
               >
                 <RefreshCw className="w-3 h-3 animate-spin duration-1000" /> Force Global Cloud Sync
               </button>
            </div>
          </div>
        </section>

        {/* Section 1: Dynamic Interactive Lab Rig Playground */}
        <section className="py-20 border-t border-clinical-border bg-slate-900/10" id="interactive-sandbox">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-teal-400 font-mono uppercase text-xs tracking-widest font-semibold block mb-2">✦ ACTIVE EXPERIMENTAL AREA</span>
              <h3 className="font-display font-bold text-2xl sm:text-4xl text-white style-title" style={{ color: themeMode === "light" ? "#0f172a" : "#ffffff" }}>
                Interactive Lab Sandbox Simulator
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-2">
                Conduct active simulated laboratory diagnostics and robotic configurations right from this presentation screen without registering keys!
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Selector Tab Rail */}
              <div className="lg:col-span-4 flex flex-col gap-3">
                <button
                  onClick={() => setWebActiveModule("crossmatch")}
                  className={`p-4 rounded-xl text-left border transition-all cursor-pointer ${
                    webActiveModule === "crossmatch"
                      ? "bg-gradient-to-br from-teal-500/10 to-indigo-500/5 border-teal-500 text-teal-400"
                      : "bg-slate-900/40 border-clinical-border text-slate-350 hover:bg-slate-800/40"
                  }`}
                  id="sandbox-opt-cross"
                >
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-teal-400" />
                    <div>
                      <span className="text-xs font-mono uppercase block text-slate-500">MODULE A</span>
                      <strong className="text-sm font-semibold" style={{ color: themeMode === "light" && webActiveModule !== "crossmatch" ? "#0f172a" : undefined }}>Biocompatibility Matcher</strong>
                    </div>
                  </div>
                  <p className="text-[11.5px] text-slate-400 mt-2">
                    Select mock patient blood types to instantly calculate compatibility counts using active stock counters.
                  </p>
                </button>

                <button
                  onClick={() => setWebActiveModule("scanner")}
                  className={`p-4 rounded-xl text-left border transition-all cursor-pointer ${
                    webActiveModule === "scanner"
                      ? "bg-gradient-to-br from-teal-500/10 to-indigo-500/5 border-teal-500 text-teal-400"
                      : "bg-slate-900/40 border-clinical-border text-slate-350 hover:bg-slate-800/40"
                  }`}
                  id="sandbox-opt-scan"
                >
                  <div className="flex items-center gap-3">
                    <Sliders className="w-5 h-5 text-teal-400" />
                    <div>
                      <span className="text-xs font-mono uppercase block text-slate-500">MODULE B</span>
                      <strong className="text-sm font-semibold" style={{ color: themeMode === "light" && webActiveModule !== "scanner" ? "#0f172a" : undefined }}>Optical Barcode laser Scanner</strong>
                    </div>
                  </div>
                  <p className="text-[11.5px] text-slate-400 mt-2">
                    Simulate a physical medical barcode scan, sweeping red lasers to generate real ledger records.
                  </p>
                </button>

                <button
                  onClick={() => setWebActiveModule("robot")}
                  className={`p-4 rounded-xl text-left border transition-all cursor-pointer ${
                    webActiveModule === "robot"
                      ? "bg-gradient-to-br from-teal-500/10 to-indigo-500/5 border-teal-500 text-teal-400"
                      : "bg-slate-900/40 border-clinical-border text-slate-350 hover:bg-slate-800/40"
                  }`}
                  id="sandbox-opt-robot"
                >
                  <div className="flex items-center gap-3">
                    <Cpu className="w-5 h-5 text-teal-400" />
                    <div>
                      <span className="text-xs font-mono uppercase block text-slate-500">MODULE C</span>
                      <strong className="text-sm font-semibold" style={{ color: themeMode === "light" && webActiveModule !== "robot" ? "#0f172a" : undefined }}>Remote Gantry Kinematics</strong>
                    </div>
                  </div>
                  <p className="text-[11.5px] text-slate-400 mt-2">
                    Monitor MED-RETRIEVER-01 coordinates and send telemetry calibration sequences to the physical robot.
                  </p>
                </button>
              </div>

              {/* Right Display Area Screen */}
              <div className="lg:col-span-8 bg-slate-900/80 border border-clinical-border p-6 rounded-2xl relative shadow-xl min-h-[350px]">
                {webActiveModule === "crossmatch" && (
                  <div className="space-y-6" id="module-content-cross">
                    <div className="flex items-center justify-between border-b border-clinical-border pb-3">
                      <h4 className="font-display font-bold text-base text-teal-400">Cryo-Compatible Consultation Engine</h4>
                      <span className="text-[10px] bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 rounded uppercase font-mono font-bold">Simulated Crossmatch</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <label className="text-[11px] font-mono uppercase text-slate-400 block font-semibold">1. SELECT PATIENT RECIPIENT TYPE</label>
                        <div className="grid grid-cols-4 gap-2">
                          {[BloodType.O_NEG, BloodType.O_POS, BloodType.A_NEG, BloodType.A_POS, BloodType.B_NEG, BloodType.B_POS, BloodType.AB_NEG, BloodType.AB_POS].map((bt) => (
                            <button
                              key={bt}
                              onClick={() => setWebPatientBlood(bt as BloodType)}
                              className={`p-2 py-3.5 rounded-xl font-mono text-center font-bold text-xs transition-all cursor-pointer ${
                                webPatientBlood === bt
                                  ? "bg-teal-500 text-white shadow-lg"
                                  : "bg-slate-950 hover:bg-slate-800 text-slate-350 border border-clinical-border"
                              }`}
                            >
                              {bt}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="bg-slate-950/90 border border-clinical-border p-4.5 rounded-xl space-y-3.5 text-xs">
                        <h5 className="font-mono text-slate-400 uppercase font-semibold">2. CORRELATING DONOR PACKS</h5>
                        <p className="text-slate-300 leading-relaxed text-[11.5px]">
                          A patient with <strong className="text-teal-400 font-bold">{webPatientBlood}</strong> can safely receive the following active blood types in stock:
                        </p>
                        
                        <div className="space-y-2 mt-2">
                          {/* donor list calculation */}
                          {[BloodType.O_NEG, BloodType.O_POS, BloodType.A_NEG, BloodType.A_POS, BloodType.B_NEG, BloodType.B_POS, BloodType.AB_NEG, BloodType.AB_POS]
                            .filter(dt => {
                              // basic transfusion rules
                              if (webPatientBlood === BloodType.AB_POS) return true; // universal recipient
                              if (dt === BloodType.O_NEG) return true; // universal donor
                              if (webPatientBlood === BloodType.O_NEG) return false;
                              if (webPatientBlood === BloodType.O_POS) return dt === BloodType.O_POS;
                              if (webPatientBlood === BloodType.A_NEG) return dt === BloodType.A_NEG;
                              if (webPatientBlood === BloodType.A_POS) return dt === BloodType.O_POS || dt === BloodType.A_NEG || dt === BloodType.A_POS;
                              if (webPatientBlood === BloodType.B_NEG) return dt === BloodType.B_NEG;
                              if (webPatientBlood === BloodType.B_POS) return dt === BloodType.O_POS || dt === BloodType.B_NEG || dt === BloodType.B_POS;
                              if (webPatientBlood === BloodType.AB_NEG) return dt === BloodType.A_NEG || dt === BloodType.B_NEG || dt === BloodType.AB_NEG;
                              return false;
                            })
                            .map(dt => {
                              const unitsInStock = inventory
                                .filter(item => item.type === ItemType.BLOOD_BAG && item.bloodDetails?.bloodType === dt)
                                .reduce((sum, item) => sum + item.quantity, 0);

                              return (
                                <div key={dt} className="flex items-center justify-between p-2 bg-slate-900 rounded border border-clinical-border/40 text-[11px] font-mono">
                                  <span className="text-slate-300">Donor Type: <strong className="text-teal-400">{dt}</strong></span>
                                  <span className="text-slate-400">{unitsInStock > 0 ? `${unitsInStock} units in cryovault` : "0 units (Flag Deficit)"}</span>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {webActiveModule === "scanner" && (
                  <div className="space-y-6" id="module-content-scanner">
                    <div className="flex items-center justify-between border-b border-clinical-border pb-3">
                      <h4 className="font-display font-bold text-base text-teal-400">Optical Laser Verification Sweeper</h4>
                      <span className="text-[10px] bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 rounded uppercase font-mono font-bold">RFID RFID Simulation</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                      <div className="md:col-span-7 space-y-4">
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Laboratory specimen containers use RFID barcode tracks to prevent transcribing errors. Place a simulated vial under the optical sweep to trigger an immediate background audit ledger action on the server.
                        </p>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleWebScanSimulation("O-NEG-WHO-W1")}
                            disabled={webBarcodeStatus === "SCANNING"}
                            className="bg-slate-950 hover:bg-slate-800 text-slate-100 font-semibold p-3.5 border border-clinical-border text-xs rounded-xl uppercase tracking-wider cursor-pointer"
                          >
                            Scan Whole Blood Bag (O-NEG)
                          </button>
                          <button
                            onClick={() => handleWebScanSimulation("REA_PC_34")}
                            disabled={webBarcodeStatus === "SCANNING"}
                            className="bg-slate-950 hover:bg-slate-800 text-slate-100 font-semibold p-3.5 border border-clinical-border text-xs rounded-xl uppercase tracking-wider cursor-pointer"
                          >
                            Scan PCR Chemical Reagent (REA_PC_34)
                          </button>
                        </div>
                      </div>

                      {/* Animated Scanner Box */}
                      <div className="md:col-span-5 h-44 bg-slate-950 rounded-2xl border border-clinical-border flex items-center justify-center relative overflow-hidden">
                        {webBarcodeStatus === "SCANNING" ? (
                          <>
                            {/* Glowing laser sweeper line */}
                            <div className="laser-scanner-line"></div>
                            <div className="text-center font-mono">
                              <RefreshCw className="w-6 h-6 animate-spin text-sky-450 mx-auto mb-2" />
                              <span className="text-[10.5px] text-sky-400 uppercase tracking-widest block">DECODING TRACKS...</span>
                              <span className="text-[8px] text-slate-500 block">UID: {webScannedItem}</span>
                            </div>
                          </>
                        ) : webBarcodeStatus === "SUCCESS" ? (
                          <div className="text-center font-mono space-y-2 p-3">
                            <CheckCircle className="w-8 h-8 text-teal-400 mx-auto animate-bounce" />
                            <span className="text-[10.5px] text-teal-400 uppercase tracking-wider block font-bold">VERIFIED SUCCESS SYNCHRONIZED</span>
                            <p className="text-[8.5px] text-slate-400 leading-relaxed">
                              Real-Time PostgreSQL simulation log generated. Click database log inside portal to audit.
                            </p>
                          </div>
                        ) : (
                          <div className="text-center font-mono p-4">
                            <span className="text-slate-550 border-r-0 block text-[26px] opacity-15 tracking-[6px] text-center italic select-none">|||||| |||| |||</span>
                            <span className="text-[9.5px] text-slate-500 uppercase tracking-widest block mt-2">RIG WAITING ON OPTICAL PROXIMITY</span>
                            <span className="text-[8px] text-slate-600 block mt-1">Select a simulated item container to start scanning</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {webActiveModule === "robot" && (
                  <div className="space-y-6" id="module-content-robot">
                    <div className="flex items-center justify-between border-b border-clinical-border pb-3">
                      <h4 className="font-display font-bold text-base text-teal-400">MED-RETRIEVER-01 Gantry Kinematics</h4>
                      <span className="text-[10px] bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 rounded uppercase font-mono font-bold">Mechanics Remote Control</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Mechanical sample retrieve mechanisms use three-axis linear actuators with millimetric tracking offsets. Correct physical offsets below directly:
                        </p>
                        
                        <div className="bg-slate-950 rounded-xl border border-clinical-border p-4 space-y-2">
                          <div className="flex justify-between items-center text-[11px] font-mono">
                            <span className="text-slate-500">GRIPPER ALIGNMENT STATE</span>
                            <span className="text-teal-400">IDEAL RANGE (&lt; 0.05mm)</span>
                          </div>
                          <p className="text-xs font-mono">
                            Current offset: <strong className="text-slate-50 font-bold">{robotStatus?.alignmentOffsetMm || 0.04} mm</strong>
                          </p>
                          <button
                            onClick={webTriggerRobotCalibration}
                            className="w-full bg-slate-900 hover:bg-slate-850 text-teal-400 font-mono font-semibold border border-clinical-border py-2 px-3 rounded-xl hover:text-white transition-all text-xs cursor-pointer"
                          >
                             DISPATCH ALIGNMENT OVERRIDE SEQUENCE
                          </button>
                        </div>
                      </div>

                      <div className="bg-slate-950 p-4 rounded-xl border border-clinical-border space-y-3 font-mono text-xs">
                        <h5 className="text-[10.5px] text-slate-400 font-semibold uppercase">ACTIVE DISPATCH TRAITS</h5>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between border-b border-clinical-border/50 pb-1">
                            <span>Status</span>
                            <span className="text-teal-400 font-bold">{robotStatus?.status || "ONLINE/IDLE"}</span>
                          </div>
                          <div className="flex justify-between border-b border-clinical-border/50 pb-1">
                            <span>Target Speed Limit</span>
                            <span>{robotStatus?.speedMmPs || 1200} mm/s</span>
                          </div>
                          <div className="flex justify-between border-b border-clinical-border/50 pb-1">
                            <span>Cold Temperature Monitor</span>
                            <span>{robotStatus?.temperatureCelsius || -25.4} °C</span>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span>Active Arm Designation</span>
                            <span className="text-sky-400">{robotStatus?.designation || "MED-RETRIEVER-01"}</span>
                          </div>
                        </div>

                        <p className="text-[9.5px] text-slate-500 leading-normal italic mt-2">
                          Real-time physical telemetry coordinates: X:{(robotStatus?.coords.x || 0).toFixed(2)}, Y:{(robotStatus?.coords.y || 0).toFixed(2)}, Z:{(robotStatus?.coords.z || 0).toFixed(2)}. Fully dynamic values.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Integrated Gemini Clinician AI Core Presentation */}
        <section className="py-20 border-t border-clinical-border relative" id="clinical-copilot">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-5 space-y-5">
                <div className="inline-flex items-center gap-2 bg-indigo-505/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full text-[10px] font-mono tracking-wider uppercase font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" /> Advanced clinical intelligence
                </div>

                <h3 className="font-display font-bold text-2xl sm:text-4xl text-white style-title" style={{ color: themeMode === "light" ? "#0f172a" : "#ffffff" }}>
                  FDA-Grounded Gemini Clinical Copilot AI
                </h3>

                <p className="text-sm text-slate-400 leading-relaxed">
                  Hospital personnel require immediate information concerning regulatory transport benchmarks and blood bank compatibility indexes. The on-site Gemini medical model translates dynamic telemetry metrics and provides real-time audit answers safely.
                </p>

                <div className="space-y-3">
                  <h4 className="text-[11px] font-mono uppercase text-slate-400 font-semibold block">Click preset query bubbles below to test live:</h4>
                  <div className="flex flex-col gap-2">
                    {[
                      "Generate regulatory checklist for whole blood O-negative storage temperature requirements",
                      "What is the compatibility matrix for a patient with AB-Negative who needs urgent transfusion?",
                      "How does the automated conveyor transport specimen tubes safely without heat transfer?"
                    ].map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setWebAiPrompt(p);
                          handleWebAiSubmit(p);
                        }}
                        className="text-left p-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-teal-400 hover:text-teal-300 font-sans text-xs border border-clinical-border tracking-wide transition-all cursor-pointer block leading-normal"
                      >
                        &ldquo;{p}&rdquo;
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Real-time chat terminal interface box */}
              <div className="lg:col-span-7 bg-slate-950 border-2 border-clinical-border p-5 rounded-2xl shadow-2xl font-mono flex flex-col justify-between min-h-[420px]" id="copilot-terminal">
                <div className="space-y-3.5 flex-1">
                  <div className="flex items-center justify-between border-b border-clinical-border pb-3">
                    <div className="flex items-center gap-2 text-xs">
                      <Terminal className="w-4 h-4 text-indigo-400" />
                      <span className="text-slate-100 font-bold" style={{ color: themeMode === "light" ? "#0f172a" : "#cbd5e1" }}>GEMINI-MED-COPILOT v1.9-PROD</span>
                    </div>
                    <span className="text-[10px] text-teal-400 uppercase font-mono tracking-widest animate-pulse font-semibold flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-400"></div> Connected
                    </span>
                  </div>

                  {/* Terminal console text logs */}
                  <div className="bg-[#03060c] p-4 rounded-xl border border-clinical-border/55 h-64 overflow-y-auto text-xs space-y-4 font-mono select-text">
                    <div className="space-y-1">
                      <span className="text-slate-500">[08:00:02 SYS]</span>
                      <p className="text-slate-400 leading-relaxed">
                        Clinician AI query terminal online. Type any question relating to patient crossmatch records, refrigerated preservation, or gantry coordinate speeds:
                      </p>
                    </div>

                    {webAiPrompt && (
                      <div className="space-y-1 text-teal-400">
                        <span className="text-indigo-400">[Clinician Query] &gt; </span>
                        <p className="leading-relaxed whitespace-pre-wrap">{webAiPrompt}</p>
                      </div>
                    )}

                    {webAiLoading ? (
                      <div className="flex items-center gap-2 text-slate-400 font-mono italic">
                        <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                        <span>Querying server-side model parameters ...</span>
                      </div>
                    ) : webAiResponse ? (
                      <div className="space-y-2 border-t border-slate-900 pt-3 text-slate-200">
                        <span className="text-indigo-400">[Gemini Med-Consultant Audit] &gt; </span>
                        <p className="leading-relaxed text-[11.5px] whitespace-pre-wrap font-sans">{webAiResponse}</p>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Submit query input */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleWebAiSubmit();
                  }}
                  className="mt-4 flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={webAiPrompt}
                    onChange={(e) => setWebAiPrompt(e.target.value)}
                    placeholder="Ask doctor copilot (e.g. O-negative compliance bounds)..."
                    className="flex-1 bg-slate-900 border border-clinical-border p-3 rounded-xl text-xs outline-none focus:ring-1 focus:ring-teal-500 text-slate-100"
                    style={{ color: themeMode === "light" ? "#0f172a" : "#f1f5f9" }}
                  />
                  <button
                    type="submit"
                    className="bg-teal-500 hover:bg-teal-600 text-white p-3 rounded-xl cursor-pointer transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Bento Grid Core System Features */}
        <section className="py-20 border-t border-clinical-border bg-slate-900/10" id="features">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-teal-450 font-mono uppercase text-xs tracking-widest font-semibold block mb-2">✦ CORE ENGINEERING ADVANTAGES</span>
              <h3 className="font-display font-bold text-2xl sm:text-4xl text-white style-title" style={{ color: themeMode === "light" ? "#0f172a" : "#ffffff" }}>
                Comprehensive Biobank Automation Features
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-2">
                Engineered with clinical-grade components and dynamic monitoring algorithms to streamline high-throughput hospital workflows.
              </p>
            </div>

            {/* Premium Bento Grid Structure */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Feature Card 1 */}
              <div className="bg-slate-900/30 border border-clinical-border rounded-2xl p-6 hover:border-teal-500/40 transition-all hover:scale-[1.01]">
                <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl w-fit mb-4">
                  <Wind className="w-5.5 h-5.5" />
                </div>
                <h4 className="font-display font-semibold text-base text-slate-100" style={{ color: themeMode === "light" ? "#000" : "#fff" }}>
                  Preservation Cryo-Vaults
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed mt-2.5">
                  Constant active liquid-refrigerated containment maintains blood products at precise, safe thresholds down to -30°C. Features automated alert flags and secondary diesel generation backups in cases of public power system interruption.
                </p>
              </div>

              {/* Feature Card 2 */}
              <div className="bg-slate-900/30 border border-clinical-border rounded-2xl p-6 hover:border-teal-500/40 transition-all hover:scale-[1.01]">
                <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl w-fit mb-4">
                  <Sliders className="w-5.5 h-5.5" />
                </div>
                <h4 className="font-display font-semibold text-base text-slate-100" style={{ color: themeMode === "light" ? "#000" : "#fff" }}>
                  Autonomous Gantry Gripper
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed mt-2.5">
                  Linear physical actuators map and retrieve vials using millimetric coordinates X, Y, and Z. Mechanical collision-avoidance buffers protect blood bank specimens from shock, dropping, or rapid acceleration temperature thresholds.
                </p>
              </div>

              {/* Feature Card 3 */}
              <div className="bg-slate-900/30 border border-clinical-border rounded-2xl p-6 hover:border-teal-500/40 transition-all hover:scale-[1.01]">
                <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl w-fit mb-4">
                  <Shield className="w-5.5 h-5.5" />
                </div>
                <h4 className="font-display font-semibold text-base text-slate-100" style={{ color: themeMode === "light" ? "#000" : "#fff" }}>
                  FDA-Compliant Signature
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed mt-2.5">
                  Every retrieval sequence, quick stock count alteration, or mechanical calibrationoverride triggers an instant signed verification ledger log. Maintains rigorous 21 CFR Chapter 11 regulatory compliance automatically.
                </p>
              </div>

              {/* Feature Card 4 */}
              <div className="bg-slate-900/30 border border-clinical-border rounded-2xl p-6 hover:border-teal-500/40 transition-all hover:scale-[1.01]">
                <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl w-fit mb-4">
                  <Database className="w-5.5 h-5.5" />
                </div>
                <h4 className="font-display font-semibold text-base text-slate-100" style={{ color: themeMode === "light" ? "#000" : "#fff" }}>
                  PostgreSQL Data Simulators
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed mt-2.5">
                  Built-in schema mapping simulates high-frequency healthcare relational queries. Provides instant sorting, search, status filters, and historical backups to manage thousands of active biobank bags in real-time.
                </p>
              </div>

              {/* Feature Card 5 */}
              <div className="bg-slate-900/30 border border-clinical-border rounded-2xl p-6 hover:border-teal-500/40 transition-all hover:scale-[1.01]">
                <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl w-fit mb-4">
                  <Inbox className="w-5.5 h-5.5" />
                </div>
                <h4 className="font-display font-semibold text-base text-slate-100" style={{ color: themeMode === "light" ? "#000" : "#fff" }}>
                  Intelligent Dispatch Panel
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed mt-2.5">
                  Allows lab clinicians to order urgent items via digital dispatches. Prioritize items as ROUTINE, URGENT, or STAT_EMERGENCY, sending immediate mechanical cues to routing conveyors to bypass routine sample deliveries.
                </p>
              </div>

              {/* Feature Card 6 */}
              <div className="bg-slate-900/30 border border-clinical-border rounded-2xl p-6 hover:border-teal-500/40 transition-all hover:scale-[1.01]">
                <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl w-fit mb-4">
                  <MessageSquare className="w-5.5 h-5.5" />
                </div>
                <h4 className="font-display font-semibold text-base text-slate-100" style={{ color: themeMode === "light" ? "#000" : "#fff" }}>
                  Live System Diagnostics
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed mt-2.5">
                  Generates visual telemetry representations with multi-axis indicators, unread clinical notification flags, and immediate downloadable audit logs in standard secure formats. Helps procurement and compliance teams audit with peace of mind.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* Section 4: System Architecture Schema & Flow */}
        <section className="py-20 border-t border-clinical-border" id="system-architecture">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-teal-400 font-mono uppercase text-xs tracking-widest font-semibold block mb-2">✦ CYBER PHYSICAL DIAGRAM</span>
              <h3 className="font-display font-bold text-2xl sm:text-4xl text-white style-title" style={{ color: themeMode === "light" ? "#0f172a" : "#ffffff" }}>
                Integrative Cyber-Physical Architecture
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-2">
                A unified look at how software queries sync seamlessly with autonomous mechanical actuators on the hospital floor.
              </p>
            </div>

            {/* Architecture flow boxes */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center font-mono text-xs text-slate-350">
              <div className="bg-slate-950 p-5 rounded-xl border border-clinical-border space-y-3">
                <span className="text-teal-400 block font-bold">1. USER INTERFACE (SPA)</span>
                <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                  Clinician workstation dashboard featuring interactive compatibility matrix calculations and mechanical queue dispatch overrides.
                </p>
              </div>

              <div className="bg-slate-950 p-5 rounded-xl border border-clinical-border space-y-3 relative">
                <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-teal-400 z-10 font-bold">&rarr;</div>
                <span className="text-sky-450 block font-bold">2. EXPRESS REST API</span>
                <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                  Processes requests, authenticates physician credentials, tracks robot gantry speed variables and commits secure ledger logs.
                </p>
              </div>

              <div className="bg-slate-950 p-5 rounded-xl border border-clinical-border space-y-3 relative">
                <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-teal-400 z-10 font-bold">&rarr;</div>
                <span className="text-indigo-400 block font-bold">3. PHYSICAL GASTRY ROBOT</span>
                <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                  The automated robot arm MED-RETRIEVER-01 translates grid coordinate targets (X, Y, Z) to retrieve specimens in the refrigeration capsule.
                </p>
              </div>

              <div className="bg-slate-950 p-5 rounded-xl border border-clinical-border space-y-3">
                <span className="text-emerald-400 block font-bold">4. CO-PILOT ASSIST (GEMINI)</span>
                <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                  Dynamic prompts query clinical parameters to supply HIPAA-grounded transport instructions with historical audit trace backups.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Technical Specification Benchmarks */}
        <section className="py-20 border-t border-clinical-border bg-slate-900/10">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-teal-450 font-mono uppercase text-xs tracking-widest font-semibold block mb-2">✦ HARWARE RIG SPECS</span>
              <h3 className="font-display font-bold text-2xl sm:text-4xl text-white style-title" style={{ color: themeMode === "light" ? "#0f172a" : "#ffffff" }}>
                 Technical Platform Specifications
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-2">
                 Procurement metrics and hardware tolerances certified for hospital network integrations.
              </p>
            </div>

            <div className="border border-clinical-border rounded-xl overflow-hidden shadow-xl text-xs sm:text-sm font-mono text-slate-350 bg-slate-950/60">
              <div className="grid grid-cols-3 bg-slate-950 p-4 border-b border-clinical-border font-bold text-slate-200">
                <span>SPECIFICATION PARAMETER</span>
                <span>METRIC VALUE</span>
                <span>REGULATORY STANDARDS CERTIFICATION</span>
              </div>
              <div className="grid grid-cols-3 p-4 border-b border-clinical-border hover:bg-slate-900/40 transition-colors">
                <span>Maximum Gantry Acceleration</span>
                <span>1200 mm/s&sup2;</span>
                <span>ISO 13485 (Medical Robotic Safety)</span>
              </div>
              <div className="grid grid-cols-3 p-4 border-b border-clinical-border hover:bg-slate-900/40 transition-colors">
                <span>Pneumatic Thermal Vault Tolerance</span>
                <span>-25.4°C &plusmn; 0.2°C</span>
                <span>FDA 21 CFR Chapter 11</span>
              </div>
              <div className="grid grid-cols-3 p-4 border-b border-clinical-border hover:bg-slate-900/40 transition-colors">
                <span>Linear Gripper Alignment Offset</span>
                <span>0.04 mm tracking offset tolerance</span>
                <span>NIST Calibrated Traceability</span>
              </div>
              <div className="grid grid-cols-3 p-4 hover:bg-slate-900/40 transition-colors">
                <span>Power System Redundancy</span>
                <span>Dual backup UPS + Liquid Diesel fuel cells</span>
                <span>Active Joint Commission Compliant</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6: Procurement Accordion FAQs */}
        <section className="py-20 border-t border-clinical-border" id="faqs">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-16">
              <span className="text-teal-400 font-mono uppercase text-xs tracking-widest font-semibold block mb-2">✦ COMMON ENQUIRIES</span>
              <h3 className="font-display font-bold text-2xl sm:text-4xl text-white style-title" style={{ color: themeMode === "light" ? "#0f172a" : "#ffffff" }}>
                Frequently Answered Procurement Questions
              </h3>
              <p className="text-xs text-slate-400 mt-2">
                Explore licensing, mechanical requirements, and hospital network security integrations.
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  q: "How fast is MED-RETRIEVER-01 at retrieving blood packs or samples?",
                  a: "The automated linear gantry operates at speed averages of 1200mm/s. Under STAT emergency overrides, it is engineered to retrieve, scan, and dispatch items to gantry outputs in under 90 seconds."
                },
                {
                  q: "How does the system ensure FDA-compliant storage verification?",
                  a: "Every transaction, physical scan, or temperature tolerance fluctuation is written real-time to our relational database. Since the audit files are fully unalterable and secure, clinicians and compliance officers has direct access to the live logged signatures."
                },
                {
                  q: "Does the on-site Gemini medical AI co-pilot require an active internet path?",
                  a: "The Gemini Clinician Co-Pilot runs via secure server-side proxy hooks. In clinical settings, the AI parameters are grounded using custom hospital documents, ensuring replies remain strictly within clinical parameters, HIPAA rules, and storage bounds."
                },
                {
                  q: "What physical fail-safes trigger in a mechanical emergency?",
                  a: "The system features dual hardware stopping codes. Lab chiefs can trigger an emergency physical shutdown via the operations workspace dashboard, which breaks mechanical gantry power instantly while preserving cold liquid-nitrogen container cooling."
                }
              ].map((faq, idx) => (
                <div key={idx} className="bg-slate-900/30 border border-clinical-border rounded-xl overflow-hidden transition-all">
                  <button
                    onClick={() => setWebFaqActiveIndex(webFaqActiveIndex === idx ? null : idx)}
                    className="w-full text-left p-5 flex justify-between items-center text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-200 hover:text-teal-400 transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <span className="text-teal-400 font-bold ml-4">{webFaqActiveIndex === idx ? "−" : "+"}</span>
                  </button>
                  {webFaqActiveIndex === idx && (
                    <div className="p-5 border-t border-clinical-border bg-[#03060c]/40 text-xs text-slate-400 leading-relaxed font-sans">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 7: Clinician Testimonials */}
        <section className="py-20 border-t border-clinical-border bg-slate-900/10">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-teal-450 font-mono uppercase text-xs tracking-widest font-semibold block mb-2">✦ REPUTABLE ENDORSEMENTS</span>
              <h3 className="font-display font-bold text-2xl sm:text-4xl text-white style-title" style={{ color: themeMode === "light" ? "#0f172a" : "#ffffff" }}>
                 What Medical Administrators Say
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-slate-950 p-6.5 rounded-2xl border border-clinical-border relative">
                 <p className="text-xs sm:text-sm italic text-slate-350 leading-relaxed">
                   &ldquo;Implementing Hemato-Robotic systems in our regional blood repository reduced our search and delivery overhead by 73%. The integrated barcode scanner completely eliminated sample transcribing mismatches during stressful trauma-ward alerts.&rdquo;
                 </p>
                 <div className="mt-4 flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-teal-400 border border-teal-500/20 text-xs">
                     LH
                   </div>
                   <div>
                     <strong className="text-slate-100 block text-xs" style={{ color: themeMode === "light" ? "#0f172a" : "#cbd5e1" }}>Dr. Logan Hall, MD</strong>
                     <span className="text-[10px] text-slate-500 font-mono uppercase">CHIEF OF CLINICAL PATHOLOGY, METRO HEATH HUB</span>
                   </div>
                 </div>
              </div>

              <div className="bg-slate-950 p-6.5 rounded-2xl border border-clinical-border relative">
                 <p className="text-xs sm:text-sm italic text-slate-350 leading-relaxed">
                   &ldquo;We audited the relational transaction audit database rules and compliance trackers, and were stunned by the robust 21 CFR custody trail logs. The pre-authenticated Gemini assistant provides immediate system guidelines to our trainee clinicians, elevating lab operating efficiency.&rdquo;
                 </p>
                 <div className="mt-4 flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-teal-400 border border-teal-500/20 text-xs">
                     AV
                   </div>
                   <div>
                     <strong className="text-slate-100 block text-xs" style={{ color: themeMode === "light" ? "#0f172a" : "#cbd5e1" }}>Allison Vance, PharmD</strong>
                     <span className="text-[10px] text-slate-500 font-mono uppercase">COMPLIANCE MANAGER, STATE IMMUNOLOGY CENTRE</span>
                   </div>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 8: Interactive Contact & System Installation Request */}
        <section className="py-20 border-t border-clinical-border">
          <div className="max-w-xl mx-auto px-6 text-center">
            <span className="text-teal-400 font-mono uppercase text-xs tracking-widest font-semibold block mb-2">✦ WORKSTATION INVITATION</span>
            <h3 className="font-display font-semibold text-xl sm:text-3xl text-white style-title" style={{ color: themeMode === "light" ? "#0f172a" : "#ffffff" }}>
               Evaluate Custom System Integrations
            </h3>
            <p className="text-xs text-slate-400 mt-2.5 max-w-md mx-auto leading-relaxed">
               Provide your healthcare institution's contact details to request a comprehensive simulated mechanical integration audit.
            </p>

            {webFormSubmitted ? (
              <div className="mt-8 p-6 bg-teal-500/10 border border-teal-500/20 rounded-xl space-y-3 font-mono">
                <CheckCircle className="w-8 h-8 text-teal-405 mx-auto animate-bounce" />
                <span className="text-teal-400 text-xs font-bold uppercase tracking-wider block">Sequence Complete: Custom Request Dispatched</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                   A virtual medical deployment team clinician has been assigned to audit your simulated credentials. Explore the workspace portal directly to continue testing.
                </p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setWebFormSubmitted(true);
                }}
                className="space-y-4 text-xs text-left mt-8 bg-slate-950 p-6 rounded-2xl border border-clinical-border"
              >
                <div className="space-y-1">
                  <label className="text-[9.5px] font-mono uppercase text-slate-400 font-semibold block">Physician RFID / Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Alexis Sterling"
                    className="w-full bg-slate-900 border border-clinical-border p-3 rounded-xl outline-none focus:ring-1 focus:ring-teal-500 text-slate-100"
                    style={{ color: themeMode === "light" ? "#0f172a" : "#f1f5f9" }}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9.5px] font-mono uppercase text-slate-400 font-semibold block">Clinician Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. a.sterling@metrolab.org"
                      className="w-full bg-slate-900 border border-clinical-border p-3 rounded-xl outline-none focus:ring-1 focus:ring-teal-500 text-slate-100"
                      style={{ color: themeMode === "light" ? "#0f172a" : "#f1f5f9" }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9.5px] font-mono uppercase text-slate-400 font-semibold block">Medical Institution</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Metro Clinical Lab"
                      className="w-full bg-slate-900 border border-clinical-border p-3 rounded-xl outline-none focus:ring-1 focus:ring-teal-500 text-slate-100"
                      style={{ color: themeMode === "light" ? "#0f172a" : "#f1f5f9" }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-teal-500 to-indigo-650 hover:from-teal-600 hover:to-indigo-700 text-white font-bold rounded-xl hover:shadow-lg uppercase tracking-wider text-xs transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  <Send className="w-3.5 h-3.5" /> Trigger System Administration Request
                </button>
              </form>
            )}
          </div>
        </section>

        {/* Website clean footer metadata */}
        <footer className="border-t border-clinical-border bg-slate-950 py-12 px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500 font-mono">
            <div className="text-center md:text-left space-y-1.5">
              <span>HEMATO-ROBOTIC™ Smart Biorepository Solution Standard Core Lic. v4.1</span>
              <p className="text-[10px] leading-relaxed max-w-md font-sans text-slate-400">
                Created with high-performance automated conveyor mechanisms and real-time active physical telemetry loops to serve advanced healthcare institutions globally.
              </p>
            </div>
            
            <div className="flex flex-col items-center md:items-end gap-2 text-[10.5px]">
              <span>ACTIVE STATION COMPILER PING: <span className="text-emerald-400 uppercase">ONLINE</span></span>
              <span>REST PostgreSQL Database Simulators: ACTIVE</span>
              <button
                onClick={() => handleSimulateInstantLogin("Dr. Marcus Vance", "LABORATORY_STAFF")}
                className="text-teal-400 hover:text-teal-300 transition-colors uppercase font-bold"
              >
                 Enter Active Workstation Dashboard Area &rarr;
              </button>
            </div>
          </div>
        </footer>

      </div>
    );
  }

  if (!isFullyLoggedIn) {
    return (
      <div className="min-h-screen bg-clinical-bg text-slate-100 flex items-center justify-center font-sans p-4 selection:bg-teal-500 selection:text-white relative bg-[#070a13]" id="primary-login-gate">
        {/* Ambient aesthetic lighting */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="glass-modal max-w-4xl w-full rounded-2xl overflow-hidden shadow-2xl relative grid grid-cols-1 md:grid-cols-12 min-h-[550px]" id="login-container">
          
          {/* Top Return to Website link inside login portal */}
          <button
            onClick={() => setViewMode("website")}
            className="absolute top-4 right-4 z-40 bg-slate-900/90 border border-clinical-border text-teal-400 hover:text-teal-300 font-mono text-[9px] py-1.5 px-3 rounded-lg flex items-center gap-1 cursor-pointer transition-all uppercase tracking-wider"
          >
             &larr; Exit to Public Website
          </button>

          {/* Left panel (visual dashboard info) - 5 Cols */}
          <div className="md:col-span-5 bg-slate-900/90 border-r border-clinical-border p-8 flex flex-col justify-between relative" id="login-decor-aside">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-teal-500 to-indigo-600 rounded-lg text-white shadow-lg">
                  <Bot className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h2 className="font-display font-semibold text-sm tracking-wider text-teal-400">HEMATO-ROBOTIC™ v4.1</h2>
                  <p className="text-[10px] text-slate-400 uppercase font-mono">Autonomous Biorepository Core</p>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div className="flex items-center gap-2.5 text-xs text-slate-350 font-mono">
                  <div className="w-2 h-2 rounded-full bg-teal-400 animate-ping"></div>
                  <span>ALL HARDWARE NODES ONLINE</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-350 font-mono">
                  <Activity className="w-4 h-4 text-sky-450" />
                  <span>ISO-9001 CLINICAL BIOBANK</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-350 font-mono">
                  <Shield className="w-4 h-4 text-emerald-450" />
                  <span>FDA 21 CFR CUSTODY LINK</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800">
              <span className="text-[9px] font-mono text-slate-500 block uppercase mb-1">AUTOMATED TELEMETRY</span>
              <p className="text-[10.5px] text-slate-400 leading-relaxed font-mono">
                ARM ACCELERATION SPEED: <span className="text-teal-400">1200mm/s</span><br/>
                COLD INTEGRATED VAULT: <span className="text-sky-400">-25.4°C</span>
              </p>
            </div>
          </div>

          {/* Right panel (form controls) - 7 Cols */}
          <div className="md:col-span-7 p-8 flex flex-col justify-center" id="login-form-frame">
            {showPasswordRecovery ? (
              // PASSWORD RECOVERY FLOW
              <div className="space-y-5 flex flex-col justify-center" id="recovery-flow">
                <div>
                  <h3 className="font-display font-semibold text-base text-white uppercase tracking-wider">RECOVER SECURE PASSKEY</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Enter your registered clinical organization credentials below to trigger emergency administrative recovery protocols.
                  </p>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-mono uppercase text-slate-400 font-semibold">Clinician RFID Email</label>
                    <input
                      type="email"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      placeholder="e.g. m.vance@centralbiobank.gov"
                      className="bg-slate-900 border border-clinical-border p-2.5 rounded-xl text-slate-200 outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>

                  {recoveryStatus && (
                    <p className="p-2.5 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-xl text-[10px] font-mono leading-relaxed">
                      {recoveryStatus}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2 pt-2 text-xs">
                  <button
                    onClick={() => {
                      if (!recoveryEmail) {
                        alert("Please provide a valid medical email address.");
                        return;
                      }
                      setRecoveryStatus(`A temporary emergency bypass passkey has been successfully logged on security servers and transmitted to: ${recoveryEmail}. Choose your preset workstation and click authenticate.`);
                    }}
                    className="w-full bg-gradient-to-r from-teal-500 to-sky-600 hover:from-teal-600 hover:to-sky-705 text-white font-bold py-2.5 rounded-xl hover:shadow-lg transition-all cursor-pointer text-xs uppercase tracking-wider"
                  >
                    Initiate Security Recovery Sync
                  </button>
                  <button
                    onClick={() => {
                      setShowPasswordRecovery(false);
                      setRecoveryStatus("");
                    }}
                    className="w-full bg-transparent hover:bg-slate-800 text-slate-400 hover:text-slate-200 py-2 rounded-xl transition-all text-xs"
                  >
                    Return to verified multi-role login
                  </button>
                </div>
              </div>
            ) : (
              // ACTIVE SECURE PORTAL ACCESS FORM
              <div className="space-y-6 flex flex-col justify-center" id="active-access-flow">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-semibold text-base text-slate-50 uppercase tracking-wider">LABORATORY ACCESS AUTH</h3>
                    <span className="text-[9px] bg-teal-500/10 text-teal-400 border border-teal-500/20 px-1.5 py-0.2 rounded font-mono uppercase">Workstation Active</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Select simulated med-tech security credentials preset for instant diagnostic verification:</p>
                </div>

                {/* Predeclared accounts selector triggers */}
                <div className="grid grid-cols-3 gap-2" id="accounts-selector font-mono">
                  <button
                    onClick={() => {
                      setLoginUsername("Dr. Marcus Vance");
                      setLoginRole("LABORATORY_STAFF");
                    }}
                    className={`p-2 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      loginUsername === "Dr. Marcus Vance" ? "bg-teal-500/10 border-teal-500 text-teal-400 shadow-md" : "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300"
                    }`}
                  >
                    <span className="font-semibold text-[10px] truncate">Dr. M. Vance</span>
                    <span className="text-[8px] font-mono text-slate-500 uppercase mt-1">LAB STAFF</span>
                  </button>
                  <button
                    onClick={() => {
                      setLoginUsername("Evelyn Winters");
                      setLoginRole("BLOOD_BANK_STAFF");
                    }}
                    className={`p-2 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      loginUsername === "Evelyn Winters" ? "bg-teal-500/10 border-teal-500 text-teal-400 shadow-md" : "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300"
                    }`}
                  >
                    <span className="font-semibold text-[10px] truncate">Evelyn Winters</span>
                    <span className="text-[8px] font-mono text-slate-500 uppercase mt-1">BLOOD BANK</span>
                  </button>
                  <button
                    onClick={() => {
                      setLoginUsername("Admin Chief Sarah Lin");
                      setLoginRole("ADMINISTRATOR");
                    }}
                    className={`p-2 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      loginUsername === "Admin Chief Sarah Lin" ? "bg-teal-500/10 border-teal-500 text-teal-400 shadow-md" : "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300"
                    }`}
                  >
                    <span className="font-semibold text-[10px] truncate">Sarah Lin</span>
                    <span className="text-[8px] font-mono text-slate-500 uppercase mt-1">SYSTEM ADMIN</span>
                  </button>
                </div>

                {/* Login credentials inputs */}
                <div className="space-y-3.5 text-xs">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-mono uppercase text-slate-400 font-semibold">Clinician Identity Tag (RFID Name)</label>
                    <input
                      type="text"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      className="bg-slate-900 border border-clinical-border p-2.5 rounded-xl text-slate-200"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-mono uppercase text-slate-400 font-semibold">Clinical Access Role</label>
                      <select
                        value={loginRole}
                        onChange={(e) => setLoginRole(e.target.value)}
                        className="bg-slate-900 border border-clinical-border p-2.5 rounded-xl text-slate-200 focus:outline-none"
                      >
                        <option value="LABORATORY_STAFF">LABORATORY STAFF</option>
                        <option value="BLOOD_BANK_STAFF">BLOOD BANK STAFF</option>
                        <option value="ADMINISTRATOR">ADMINISTRATOR</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-mono uppercase text-slate-400 font-semibold">Physician PIN / Passcode</label>
                      <input
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="bg-slate-900 border border-clinical-border p-2.5 rounded-xl text-slate-200 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Login button, Loader, and recover password trigger */}
                <div className="space-y-3 pt-2">
                  <button
                    onClick={() => handleLogin(loginUsername, loginRole)}
                    disabled={isAuthenticating}
                    className="w-full h-11 bg-gradient-to-r from-teal-500 to-sky-600 hover:from-teal-600 hover:to-sky-705 text-white font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-xs cursor-pointer"
                  >
                    {isAuthenticating ? (
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>Verifying Claims ...</span>
                      </div>
                    ) : authSuccessAnim ? (
                      <div className="flex items-center gap-1.5 text-emerald-450 font-bold">
                        <CheckCircle className="w-5 h-5 text-teal-400 animate-bounce" />
                        <span>VERIFIED SUCCESS TRANSITION</span>
                      </div>
                    ) : (
                      <span>SECURE CREDENTIALS AUTHENTICATION</span>
                    )}
                  </button>

                  <div className="flex justify-between items-center text-[10px] text-slate-500 px-1 font-mono">
                    <span>STATION REGISTERED IP: SECURE DEV</span>
                    <button
                      onClick={() => setShowPasswordRecovery(true)}
                      className="text-teal-400 hover:text-teal-300 underline"
                    >
                      Bypass RFID credentials help?
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-clinical-bg text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-white" id="main-lab-portal">
      
      {/* ENTERPRISE TITLE HEADER BANNER */}
      <header className="border-b border-clinical-border bg-clinical-panel/80 backdrop-blur sticky top-0 z-40 px-6 py-4 flex items-center justify-between" id="header-bar">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-gradient-to-br from-teal-500 to-indigo-600 rounded-lg text-white shadow-lg shadow-teal-500/10">
            <Bot className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-semibold text-lg uppercase tracking-wider text-slate-50">
                HEMATO-ROBOTIC™
              </h1>
              <span className="text-xs bg-teal-500/10 text-teal-400 font-mono border border-teal-500/20 px-1.5 py-0.2 rounded">
                v4.1 ENTERPRISE
              </span>
            </div>
            <p className="text-xs text-slate-400">Smart Laboratory Inventory & Robotic Retrieval Core</p>
          </div>
        </div>

        {/* Global telemetry green highlights */}
        <div className="hidden lg:flex items-center gap-6 text-xs font-mono" id="status-ledger">
          <div className="flex items-center gap-2 text-teal-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
            </span>
            ROBOT ALPHA ONLINE
          </div>
          <div className="flex items-center gap-2 text-sky-400">
            <Activity className="w-3.5 h-3.5" />
            LIVE DIAGNOSTIC SYNC
          </div>
          <div className="text-slate-400">
            LOC TIME: <span className="text-slate-200">2026-06-05 08:46 UTC</span>
          </div>
        </div>

        {/* User profile controls and notification alerts */}
        <div className="flex items-center gap-4">
          
          {/* High-end Day/Night mode toggler */}
          <button
            onClick={() => setThemeMode(themeMode === "dark" ? "light" : "dark")}
            className="p-2 bg-slate-800 hover:bg-slate-700/80 rounded-lg border border-clinical-border text-slate-300 hover:text-white transition-all cursor-pointer flex items-center justify-center"
            id="theme-mode-toggle"
            title={themeMode === "dark" ? "Switch to daylight mode" : "Switch to midnight mode"}
          >
            {themeMode === "dark" ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 text-sky-450" />
            )}
          </button>

          {/* Notifications Alert Center */}
          <div className="relative">
            <button
              onClick={() => {
                setIsNotifOpen(!isNotifOpen);
                if (!isNotifOpen) handleMarkNotifRead();
              }}
              className="p-2 relative bg-slate-800 hover:bg-slate-700/80 rounded-lg border border-clinical-border text-slate-300 hover:text-white transition-all cursor-pointer"
              id="notif-btn"
            >
              <Bell className="w-5 h-5" />
              {criticalNotificationCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-full ring-2 ring-clinical-panel">
                  {criticalNotificationCount}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-2.5 w-96 bg-clinical-panel border border-clinical-border rounded-xl shadow-2xl p-4 z-50 text-xs overflow-hidden">
                <div className="flex items-center justify-between border-b border-clinical-border pb-2.5 mb-2.5">
                  <h4 className="font-semibold text-slate-100 uppercase tracking-wider text-[11px] font-display flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-sky-400" /> Live Safety Notifications
                  </h4>
                  <button 
                    onClick={() => setIsNotifOpen(false)}
                    className="text-[10px] text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    Close
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {notifications.length === 0 ? (
                    <p className="text-slate-500 text-center py-4">No active laboratory alerts</p>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-2.5 rounded-lg border text-left ${
                          notif.type === "CRITICAL"
                            ? "bg-red-500/10 border-red-500/20 text-red-100"
                            : notif.type === "WARNING"
                            ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-105"
                            : notif.type === "SUCCESS"
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-100"
                            : "bg-slate-800/80 border-slate-700 text-slate-300"
                        }`}
                      >
                        <div className="flex justify-between font-mono font-medium text-[10px] uppercase mb-1">
                          <span className="flex items-center gap-1">
                            {notif.type === "CRITICAL" && <AlertTriangle className="w-3 h-3 text-red-400" />}
                            {notif.title}
                          </span>
                          <span className="text-slate-500 text-[9px] font-normal">
                            {notif.timestamp.split("T")[1]?.slice(0, 5) || "Just now"}
                          </span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-300">{notif.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ACTIVE ACTOR SELECTOR SIMULATOR */}
          <div className="relative">
            <button
              onClick={() => setIsAuthOpen(!isAuthOpen)}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-clinical-border px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer text-sky-400"
              id="role-auth-picker"
            >
              <User className="w-3.5 h-3.5" />
              <span>{currentUser.role}: {currentUser.name}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isAuthOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-clinical-panel border border-clinical-border rounded-xl shadow-2xl p-4 z-50 text-xs">
                <p className="text-slate-400 font-medium mb-3 border-b border-clinical-border pb-1.5 font-display uppercase tracking-wider text-[10px]">
                  Simulate Verified Security Actors
                </p>
                <div className="space-y-1.5">
                  <button
                    onClick={() => handleLogin("Dr. Marcus Vance", "LABORATORY_STAFF")}
                    className="w-full text-left p-2 hover:bg-slate-800 rounded-lg flex flex-col transition-colors cursor-pointer border border-transparent hover:border-slate-700"
                  >
                    <span className="font-semibold text-slate-200">Dr. Marcus Vance</span>
                    <span className="text-[10px] text-teal-400 font-mono">LABORATORY_STAFF</span>
                    <span className="text-[9px] text-slate-500">Retrieves samples & updates diagnostics</span>
                  </button>
                  <button
                    onClick={() => handleLogin("Evelyn Winters", "BLOOD_BANK_STAFF")}
                    className="w-full text-left p-2 hover:bg-slate-800 rounded-lg flex flex-col transition-colors cursor-pointer border border-transparent hover:border-slate-700"
                  >
                    <span className="font-semibold text-slate-200">Evelyn Winters</span>
                    <span className="text-[10px] text-sky-400 font-mono">BLOOD_BANK_STAFF</span>
                    <span className="text-[9px] text-slate-500">Authorized for crossmatch components & packs</span>
                  </button>
                  <button
                    onClick={() => handleLogin("Admin Chief Sarah Lin", "ADMINISTRATOR")}
                    className="w-full text-left p-2 hover:bg-slate-800 rounded-lg flex flex-col transition-colors cursor-pointer border border-transparent hover:border-slate-700"
                  >
                    <span className="font-semibold text-slate-200">Admin Chief Sarah Lin</span>
                    <span className="text-[10px] text-red-400 font-mono">ADMINISTRATOR</span>
                    <span className="text-[9px] text-slate-500">Triggers mechanical calibration & manual safety overrides</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* PRIMARY CONTEXT CONTROL TAB toggles */}
      <div className="bg-slate-900 border-b border-clinical-border px-6 py-2 flex items-center justify-between" id="nav-tabs">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("operations")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "operations"
                ? "bg-teal-500 text-white shadow-md shadow-teal-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/80"
            }`}
            id="tab-ops"
          >
            Mechanical Operations Dashboard
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "analytics"
                ? "bg-teal-500 text-white shadow-md shadow-teal-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/80"
            }`}
            id="tab-analytics"
          >
            Analytical Intelligence &amp; Forecasts
          </button>
          <button
            onClick={() => setActiveTab("architecture")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "architecture"
                ? "bg-teal-500 text-white shadow-md shadow-teal-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/80"
            }`}
            id="tab-arch"
          >
            System Architecture &amp; SRS Spec
          </button>
        </div>
        <div className="hidden sm:block text-[11px] font-mono text-slate-400">
          Integrated PostgreSQL Relational DB Simulator
        </div>
      </div>

      {/* OPERATIONS MODE */}
      {activeTab === "operations" ? (
        <main className="flex-1 p-6 grid grid-cols-1 xl:grid-cols-12 gap-6 max-w-[1920px] w-full mx-auto" id="ops-workspace">
          
          {/* COLUMN LEFT: ROBOTIC DISPATCH RIG (4-cols) */}
          <section className="xl:col-span-4 flex flex-col gap-6" id="retrieval-rig-col">
            
            {/* Visual Robotic Telemetry Panel */}
            <div className="bg-clinical-panel border border-clinical-border rounded-2xl p-5 shadow-xl flex flex-col gap-4 relative overflow-hidden" id="robot-rig">
              <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-3xl"></div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-teal-400" />
                  <h3 className="font-display font-medium text-slate-100 uppercase text-xs tracking-wider">
                    Robotic Arm Navigation Rig
                  </h3>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider ${
                  robotStatus?.status === "IDLE" ? "bg-slate-800 text-slate-400" :
                  robotStatus?.status === "MOVING" ? "bg-sky-500/10 text-sky-400 animate-pulse" :
                  robotStatus?.status === "PICKING" ? "bg-yellow-500/10 text-yellow-400" :
                  robotStatus?.status === "PLACING" ? "bg-purple-500/10 text-purple-400" :
                  robotStatus?.status === "MAINTENANCE" ? "bg-red-500/10 text-red-400" :
                  "bg-orange-500/10 text-orange-400"
                }`}>
                  ● {robotStatus?.status || "SYNCING"}
                </span>
              </div>

              {/* DYNAMIC ISOMETRIC SCHEMATIC DISPLAY */}
              <div className="bg-slate-950 rounded-xl p-4 border border-clinical-border h-48 relative flex flex-col justify-between overflow-hidden" id="svg-arm-canvas">
                <div className="absolute top-2 left-2 text-[9px] font-mono text-slate-500 flex flex-col">
                  <span>FACILITY BLOCK: BIO-RACK GRID F</span>
                </div>

                {/* Animated Coordinates schematic visualization */}
                <div className="flex-1 flex items-center justify-center relative">
                  {/* Grid Lines */}
                  <div className="absolute inset-4 border border-dashed border-slate-800/40 rounded flex items-center justify-center">
                    <div className="w-[1px] h-full bg-slate-800/10"></div>
                    <div className="h-[1px] w-full bg-slate-800/10"></div>
                  </div>

                  {/* Mechanical Target location indicator */}
                  {robotStatus?.targetCoords && (
                    <div 
                      className="absolute w-4 h-4 border-2 border-dashed border-sky-400 animate-spin rounded-full transition-all duration-300"
                      style={{
                        left: `${Math.min(90, Math.max(10, (robotStatus.targetCoords.x / 2400) * 80 + 10))}%`,
                        top: `${Math.min(90, Math.max(10, (robotStatus.targetCoords.y / 1500) * 80 + 10))}%`
                      }}
                    />
                  )}

                  {/* Active robot claw with real-time positional coordinate translation */}
                  <div 
                    className="absolute transition-all duration-300 ease-out flex flex-col items-center"
                    style={{
                      left: `${Math.min(95, Math.max(5, (robotStatus?.coords?.x ? (robotStatus.coords.x / 2400) * 80 + 10 : 15)))}%`,
                      top: `${Math.min(95, Math.max(5, (robotStatus?.coords?.y ? (robotStatus.coords.y / 1500) * 80 + 10 : 15)))}%`
                    }}
                  >
                    {/* Laser line to floor */}
                    <div className="w-[1px] h-12 bg-gradient-to-t from-red-500/40 via-red-500/5 to-transparent absolute bottom-6 pointer-events-none"></div>
                    
                    {/* Mechanical Head */}
                    <div className="w-7 h-7 bg-slate-800 border-2 border-teal-400 rounded-lg shadow-lg flex items-center justify-center">
                      <div className={`w-2.5 h-2.5 rounded-full ${robotStatus?.carryingItemSku ? "bg-amber-400 animate-bounce" : "bg-teal-400"}`}></div>
                    </div>
                    {robotStatus?.carryingItemSku && (
                      <span className="bg-amber-500/10 text-amber-400 font-mono text-[8px] border border-amber-500/20 px-1 py-0.2 rounded mt-1 whitespace-nowrap shadow-md">
                        {robotStatus.carryingItemSku}
                      </span>
                    )}
                  </div>
                </div>

                {/* Legend footer with coordinate displays */}
                <div className="flex justify-between items-end border-t border-slate-900 pt-2 text-[10px] font-mono text-slate-400">
                  <div>
                    X: <span className="text-teal-400">{robotStatus?.coords?.x || 0}</span> mm
                  </div>
                  <div>
                    Y: <span className="text-teal-400">{robotStatus?.coords?.y || 0}</span> mm
                  </div>
                  <div>
                    Z: <span className="text-teal-400">{robotStatus?.coords?.z || 0}</span> mm
                  </div>
                </div>
              </div>

              {/* Hardware Telemetry parameters */}
              <div className="grid grid-cols-2 gap-3.5 text-xs font-mono" id="robot-parameters">
                <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg flex flex-col justify-between">
                  <span className="text-slate-400 text-[10px]">LASER BIAS BASELINE</span>
                  <span className="text-slate-100 font-bold mt-1 text-[13px] flex items-center justify-between">
                    <span>±{robotStatus?.alignmentOffsetMm ?? 0.04}mm</span>
                    {robotStatus && robotStatus.alignmentOffsetMm > 0.1 && (
                      <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
                    )}
                  </span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg flex flex-col justify-between">
                  <span className="text-slate-400 text-[10px]">MOTOR SPEED CAP</span>
                  <span className="text-slate-100 font-bold mt-1 text-[13px]">{robotStatus?.speedMmPs ?? 1200} mm/s</span>
                </div>
              </div>

              {/* ADMIN CONTROLS CALIBRATIONS */}
              <div className="flex items-center gap-2 border-t border-clinical-border pt-4 mt-2" id="arm-overrides">
                {currentUser.role === "ADMINISTRATOR" ? (
                  <>
                    <button
                      onClick={() => handleRobotControl("CALIBRATE")}
                      className="flex-1 bg-slate-800 hover:bg-slate-705 border border-slate-700 py-1.5 rounded-lg text-[11px] font-semibold tracking-wider hover:text-teal-400 transition-colors uppercase cursor-pointer"
                    >
                      Calibrate Angular Laser
                    </button>
                    <button
                      onClick={() => handleRobotControl("EMERGENCY_STOP")}
                      className="flex-1 bg-red-650 hover:bg-red-700 text-white font-bold py-1.5 rounded-lg text-[11px] tracking-wider transition-colors uppercase flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-red-500/10"
                    >
                      <Lock className="w-3 h-3" /> Emergency Halt
                    </button>
                  </>
                ) : (
                  <div className="bg-slate-900/60 border border-clinical-border p-2.5 rounded-xl w-full text-center text-slate-400 text-[11px]">
                    🔒 Robotic calibration toggles lock for <span className="text-red-400 font-mono">ADMINISTRATOR</span> role.
                  </div>
                )}
              </div>
            </div>

            {/* CLINICAL PHYSICAL RETRIEVAL STATION */}
            <div className="bg-clinical-panel border border-clinical-border rounded-2xl p-5 shadow-xl flex flex-col gap-4" id="retrieval-terminal">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-teal-400" />
                <h3 className="font-display font-medium text-slate-100 uppercase text-xs tracking-wider">
                  Retrieval Order Station
                </h3>
              </div>

              <form onSubmit={handleDispatchSubmit} className="space-y-4">
                {/* SKU Code Selector */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-mono font-medium text-slate-400">Target Item SKU / Barcode</label>
                  <select
                    value={dispatchSku}
                    onChange={(e) => setDispatchSku(e.target.value)}
                    className="bg-slate-900 border border-clinical-border p-2.5 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="">-- Click to select inventory --</option>
                    {inventory.map((item) => (
                      <option 
                        key={item.id} 
                        value={item.sku}
                        disabled={item.quantity <= 0 || item.status === "EXPIRED"}
                      >
                        [{item.sku}] {item.name} ({item.quantity} available) - {item.locationGrid}
                        {item.status === "EXPIRED" ? " [EXPIRED]" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity and Target Destination */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-mono font-medium text-slate-400">Dispatch Qty</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={dispatchQty}
                      onChange={(e) => setDispatchQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="bg-slate-900 border border-clinical-border p-2 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-mono font-medium text-slate-400">Urgency Level</label>
                    <select
                      value={dispatchPriority}
                      onChange={(e: any) => setDispatchPriority(e.target.value)}
                      className="bg-slate-900 border border-clinical-border p-2 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      <option value="ROUTINE">ROUTINE</option>
                      <option value="URGENT">URGENT</option>
                      <option value="STAT_EMERGENCY">STAT EMERGENCY</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-mono font-medium text-slate-400">Target Ward / Room Portal</label>
                  <input
                    type="text"
                    value={dispatchDept}
                    onChange={(e) => setDispatchDept(e.target.value)}
                    placeholder="E.g., Pediatric Emergency Ward B"
                    className="bg-slate-900 border border-clinical-border p-2.5 rounded-xl text-xs text-slate-100 focus:outline-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={robotStatus?.status === "MAINTENANCE"}
                  className="w-full bg-gradient-to-r from-teal-500 to-sky-600 hover:from-teal-600 hover:to-sky-705 text-white py-2.5 rounded-xl font-bold tracking-wider hover:shadow-lg transition-all cursor-pointer text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {robotStatus?.status === "MAINTENANCE" ? "ARM LOCKOUT IN PLACE" : "TRANSMIT RETRIEVAL TASK"}
                </button>
              </form>
            </div>

            {/* AI DIAGNOSTICS & COPILOT CORE */}
            <div className="bg-clinical-panel border border-clinical-border rounded-2xl p-5 shadow-xl flex flex-col gap-4 relative overflow-hidden" id="ai-engine">
              <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl"></div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4.5 h-4.5 text-teal-400" />
                  <h3 className="font-display font-medium text-slate-100 uppercase text-xs tracking-wider">
                    Gemini Clinical Copilot
                  </h3>
                </div>
                <span className="text-[9px] bg-slate-900 text-slate-400 font-mono px-2 py-0.5 rounded border border-clinical-border">
                  model: gemini-3.5-flash
                </span>
              </div>

              {/* Chat response frame */}
              <div className="bg-slate-950 rounded-xl p-3 border border-clinical-border space-y-3 h-52 overflow-y-auto text-xs" id="chat-scroller">
                {aiResponse ? (
                  <div className="prose prose-invert max-w-none text-[11px] leading-relaxed text-slate-300 space-y-1.5">
                    {/* Render markdown style lines simply with react syntax */}
                    <p className="font-semibold text-[10px] text-teal-400 border-b border-slate-900 pb-1 flex items-center gap-1 uppercase">
                      ⚠️ Copilot Diagnostic Audit Output:
                    </p>
                    {aiResponse.split("\n").map((line, idx) => {
                      if (line.startsWith("###")) {
                        return <h4 key={idx} className="text-[12px] font-bold text-slate-100 mt-2">{line.replace("###", "")}</h4>;
                      } else if (line.startsWith("-") || line.startsWith("*")) {
                        return <div key={idx} className="pl-2 border-l-2 border-sky-505 my-0.5 text-slate-300">{line}</div>;
                      }
                      return <p key={idx}>{line}</p>;
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
                    <Bot className="w-8 h-8 text-slate-600 animate-bounce" />
                    <p className="text-[10px] text-center max-w-xs">
                      Ask logistics questions, ask about low stock forecasts, safety warnings, or mechanical troubleshooting.
                    </p>
                  </div>
                )}
                {isAiLoading && (
                  <div className="flex items-center gap-2 text-sky-400 text-[10px] font-mono justify-center py-2 bg-slate-900 rounded-lg">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    DECODING LIVE BIOLOGICAL TELEMETRY...
                  </div>
                )}
              </div>

              {/* Prep queries buttons for laboratory staff */}
              <div className="flex flex-wrap gap-1.5" id="presets-copilot">
                <button
                  onClick={() => handleAiAsk("Audit blood bank levels for immediate replenishment requirements.")}
                  className="bg-slate-900 hover:bg-slate-800 text-[10px] text-slate-300 hover:text-white px-2.5 py-1 rounded-lg border border-clinical-border transition-colors cursor-pointer"
                >
                  🩸 Blood Levels Audit
                </button>
                <button
                  onClick={() => handleAiAsk("Triage robotic sensor alerts & thermal threshold variances.")}
                  className="bg-slate-900 hover:bg-slate-800 text-[10px] text-slate-300 hover:text-white px-2.5 py-1 rounded-lg border border-clinical-border transition-colors cursor-pointer"
                >
                  ⚡ Arm Calibration Triage
                </button>
                <button
                  onClick={() => handleAiAsk("Identify all reagents currently expired or expiring within 30 days.")}
                  className="bg-slate-900 hover:bg-slate-800 text-[10px] text-slate-300 hover:text-white px-2.5 py-1 rounded-lg border border-clinical-border transition-colors cursor-pointer"
                >
                  📦 Expiration Check
                </button>
              </div>

              {/* Chat Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ask diagnostic auditor..."
                  onKeyDown={(e) => e.key === "Enter" && handleAiAsk()}
                  className="flex-1 bg-slate-900 border border-clinical-border rounded-xl px-3 text-xs placeholder-slate-500 text-slate-250 focus:outline-none"
                />
                <button
                  onClick={() => handleAiAsk()}
                  className="bg-teal-500 hover:bg-teal-600 text-white p-2.5 rounded-xl hover:shadow-lg transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

          </section>

          {/* COLUMN RIGHT: REAL-TIME INVENTORY CONTROL & COLD BANK STORAGE (8-cols) */}
          <section className="xl:col-span-8 flex flex-col gap-6" id="inventory-workspace">
            
            {/* BLOOD REFRIGERATION BANK AND AGITATORS MONITOR */}
            <div className="bg-clinical-panel border border-clinical-border rounded-2xl p-5 shadow-xl flex flex-col gap-4" id="blood-bank-fridge">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-teal-400" />
                  <h3 className="font-display font-medium text-slate-100 uppercase text-xs tracking-wider">
                    Biological Blood Bank Vault &amp; Cold Storage Status
                  </h3>
                </div>
                <span className="text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded font-mono">
                  SENSORS ACTIVE: 4°C / -25°C / 22°C
                </span>
              </div>

              {/* Visual Grid representing major blood types counts and status warnings */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3" id="blood-grid">
                {[
                  { type: BloodType.O_NEG, label: "O- Negative", desc: "Emergency Target" },
                  { type: BloodType.O_POS, label: "O+ Positive", desc: "Universal Donor" },
                  { type: BloodType.A_NEG, label: "A- Negative", desc: "Rare Clinical" },
                  { type: BloodType.A_POS, label: "A+ Positive", desc: "Standard Stock" },
                  { type: BloodType.B_NEG, label: "B- Negative", desc: "Specific Allocation" },
                  { type: BloodType.B_POS, label: "B+ Positive", desc: "Standard Stock" },
                  { type: BloodType.AB_NEG, label: "AB- Negative", desc: "Plasma Ideal" },
                  { type: BloodType.AB_POS, label: "AB+ Positive", desc: "Component Ideal" }
                ].map((item) => {
                  const qty = getBloodTypeSummary(item.type);
                  const isUltraLow = item.type === BloodType.O_NEG && qty < 5;
                  
                  return (
                    <div 
                      key={item.type}
                      className={`p-3 rounded-xl border flex flex-col justify-between items-center text-center transition-all ${
                        isUltraLow 
                          ? "bg-red-500/10 border-red-500/40 text-red-50 overlay-critical animate-pulse" 
                          : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[9px] font-mono text-slate-500 uppercase">BLOOD</span>
                        {isUltraLow && (
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                        )}
                      </div>
                      
                      {/* Big Type Letter */}
                      <span className={`font-display text-2xl font-bold my-1 ${isUltraLow ? "text-red-400" : "text-slate-100"}`}>
                        {item.type}
                      </span>

                      {/* Cumulative Units */}
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-200 font-mono">{qty} Bags</span>
                        <span className="text-[8px] text-slate-500">{qty < 8 ? "LOW LIMIT" : "STABLE"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* MAIN STOCK CONTROL MATRIX */}
            <div className="bg-clinical-panel border border-clinical-border rounded-2xl p-5 shadow-xl flex flex-col gap-4 flex-1" id="stock-matrix">
              
              {/* Header and Filter Control bar */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-clinical-border pb-4" id="matrix-header">
                <div>
                  <h3 className="font-display font-medium text-slate-100 uppercase text-xs tracking-wider">
                    Laboratory Inventory Control Matrix
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Audit, adjust quantity tiers, or dispatch automated robot retrieval operations.</p>
                </div>
                
                {/* Right hand side action buttons and adds */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      setScannerType("BARCODE");
                      setIsScannerOpen(true);
                      setLastScannedResult("");
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-teal-400 font-medium text-xs px-3 py-2 rounded-xl border border-clinical-border hover:border-teal-500/40 transition-all flex items-center gap-1.5 cursor-pointer"
                    id="scan-barcode-trigger"
                    title="Simulate hardware barcode/QR scanner sweeps"
                  >
                    <Sliders className="w-3.5 h-3.5 animate-pulse" />
                    <span>Optical Scan HUD</span>
                  </button>
                  <button
                    onClick={() => setIsAddStockOpen(true)}
                    className="bg-teal-500 hover:bg-teal-600 text-white font-medium text-xs px-3 py-2 rounded-xl hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                    id="add-stock-btn"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Add Storage Item
                  </button>
                  <button
                    onClick={fetchData}
                    className="p-2 bg-slate-800 hover:bg-slate-700/80 rounded-xl border border-clinical-border text-slate-300 hover:text-white transition-colors cursor-pointer h-[34px] w-[34px] flex items-center justify-center"
                    title="Manual Grid Sync"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* SEARCH & FILTERS CONTROLS ROW */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3" id="filters-row">
                <div className="sm:col-span-6 relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by reagent name, SKU code or biological barcode..."
                    className="w-full bg-slate-900 border border-clinical-border rounded-xl pl-9 pr-3 py-2.5 text-xs placeholder-slate-500 text-slate-150 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-3">
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full bg-slate-900 border border-clinical-border rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="ALL">ALL TYPES</option>
                    <option value="REAGENT">REAGENT</option>
                    <option value="SPECIMEN">SPECIMEN</option>
                    <option value="BLOOD_BAG">BLOOD BAGS</option>
                    <option value="SUPPLY">SUPPLIES</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full bg-slate-900 border border-clinical-border rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="ALL">ALL SAFETY LEVELS</option>
                    <option value="NORMAL">NORMAL (OK)</option>
                    <option value="LOW_STOCK">LOW STOCK</option>
                    <option value="EXPIRED">EXPIRED</option>
                    <option value="CRITICAL">CRITICAL RESERVE</option>
                  </select>
                </div>
              </div>

              {/* RECORD TABLE ROW */}
              <div className="overflow-x-auto border border-clinical-border rounded-xl" id="table-record-wrapper">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 border-b border-clinical-border font-mono text-[10px] uppercase text-slate-400">
                      <th className="p-3.5">Biological Item Description</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Storage Grid Block</th>
                      <th className="p-3.5">Current Stock Level / Safety Min</th>
                      <th className="p-3.5">Biological Lifecycle</th>
                      <th className="p-3.5">Temp CELSIUS</th>
                      <th className="p-3.5 text-right">Replenish Action Control Matrix</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-clinical-border bg-slate-950/40">
                    {inventory.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500">
                          <Inbox className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                          No active clinical inventory matches. Add a standard stock block or clear constraints.
                        </td>
                      </tr>
                    ) : (
                      inventory.map((item) => {
                        const isExpired = new Date(item.expiryDate) < new Date();
                        
                        return (
                          <tr 
                            key={item.id} 
                            className={`hover:bg-slate-900/60 transition-colors ${
                              isExpired ? "bg-red-500/5 text-red-200/90" : 
                              item.status === "CRITICAL" ? "bg-amber-500/5 text-amber-200" : ""
                            }`}
                          >
                            <td className="p-3.5">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-semibold text-slate-100">{item.name}</span>
                                <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400">
                                  <span>SKU: {item.sku}</span>
                                  <span>•</span>
                                  <span>BAR: {item.barcode}</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-3.5">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-medium ${
                                item.type === ItemType.BLOOD_BAG ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                                item.type === ItemType.REAGENT ? "bg-teal-500/10 text-teal-400 border border-teal-500/20" :
                                item.type === ItemType.SPECIMEN ? "bg-sky-500/10 text-sky-400 border border-sky-500/20" :
                                "bg-slate-800 text-slate-400"
                              }`}>
                                {item.type}
                              </span>
                            </td>
                            <td className="p-3.5 font-mono text-slate-300 font-medium">{item.locationGrid}</td>
                            <td className="p-3.5">
                              <div className="flex items-center gap-2">
                                <span className="font-bold font-mono text-slate-150">{item.quantity}</span>
                                <span className="text-slate-500 text-[10px] font-mono">/ min {item.targetMin}</span>
                                <span className="text-[10px] text-slate-400 font-mono">({item.unit})</span>
                              </div>
                              <div className="w-16 bg-slate-800 h-1 rounded overflow-hidden mt-1 bg-clinical-bg">
                                <div 
                                  className={`h-full ${
                                    isExpired ? "bg-red-500" :
                                    item.quantity <= item.targetMin ? "bg-yellow-500 animate-pulse" :
                                    "bg-teal-500"
                                  }`}
                                  style={{ width: `${Math.min(100, (item.quantity / (item.targetMin || 1)) * 50)}%` }}
                                />
                              </div>
                            </td>
                            <td className="p-3.5 font-mono text-[11px]">
                              {isExpired ? (
                                <span className="text-red-400 font-bold flex items-center gap-1">
                                  <AlertTriangle className="w-3.5 h-3.5" /> EXPIRED
                                </span>
                              ) : (
                                <span className="text-slate-300">{item.expiryDate}</span>
                              )}
                            </td>
                            <td className="p-3.5 font-mono">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                                item.temperatureGroup === "FROZEN_DEEP" ? "text-blue-300 bg-blue-500/10" :
                                item.temperatureGroup === "REFRIGERATED" ? "text-cyan-300 bg-cyan-500/10" :
                                "text-yellow-200 bg-yellow-500/10"
                              }`}>
                                {item.tempCelsiusCurrent}°C
                              </span>
                            </td>
                            <td className="p-3.5 text-right">
                              {/* Quantity calibration increments */}
                              <div className="flex justify-end gap-1">
                                <button
                                  onClick={() => handleQuickAdjust(item.sku, Math.max(0, item.quantity - 5))}
                                  className="px-1.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 font-mono font-bold hover:text-white cursor-pointer"
                                  title="Quick decrement -5"
                                >
                                  -5
                                </button>
                                <button
                                  onClick={() => handleQuickAdjust(item.sku, item.quantity + 10)}
                                  className="px-1.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-150 font-mono font-bold hover:text-white cursor-pointer"
                                  title="Quick increment +10"
                                >
                                  +10
                                </button>
                                <button
                                  onClick={() => {
                                    setDispatchSku(item.sku);
                                    document.getElementById("retrieval-terminal")?.scrollIntoView({ behavior: "smooth" });
                                  }}
                                  className="px-2 py-1 bg-sky-500/10 hover:bg-sky-505 text-sky-400 hover:text-white border border-sky-500/20 rounded font-medium text-[10px] cursor-pointer"
                                >
                                  Queue Retrieval
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* LOWER ROW: ACTIVE MECHANICAL REQUEST QUEUE & SECURITY ACTOR LOGS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="logs-and-queues">
              
              {/* Active Retrieval Work Queue */}
              <div className="lg:col-span-6 bg-clinical-panel border border-clinical-border rounded-2xl p-5 shadow-xl flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-clinical-border pb-2">
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-4.5 h-4.5 text-teal-443 text-teal-400" />
                    <h3 className="font-display font-medium text-slate-100 uppercase text-xs tracking-wider">
                      Robotic Retrieval Queue
                    </h3>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">Total queued: {requests.length}</span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1" id="robot-requests-scroller">
                  {requests.slice().reverse().map((req) => (
                    <div 
                      key={req.id} 
                      className="bg-slate-900 border border-slate-800/80 rounded-xl p-3 flex flex-col gap-2 hover:border-slate-700/85 transition-all text-xs"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-100 font-mono text-[11px]">{req.trackingCode}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-semibold uppercase ${
                          req.status === "COMPLETED" ? "bg-emerald-500/15 text-emerald-400" :
                          req.status === "RETRIEVING" ? "bg-sky-500/15 text-sky-350 bg-sky-600/10 text-sky-400 animate-pulse" :
                          req.status === "DELIVERING" ? "bg-purple-500/15 text-purple-400" :
                          "bg-slate-800 text-slate-400"
                        }`}>
                          {req.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-[11px] text-slate-330">
                        <span className="text-slate-100 font-medium capitalize">{req.itemName} • x{req.quantity}</span>
                        <span className="text-slate-400">Room: {req.recipientDept}</span>
                      </div>
                      
                      <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-950 pt-2 font-mono">
                        <span>Staff: {req.requestedBy}</span>
                        <span className={`px-1.5 py-0.2 rounded ${
                          req.priority === "STAT_EMERGENCY" ? "bg-red-500/10 text-red-400 font-bold" :
                          req.priority === "URGENT" ? "bg-yellow-500/10 text-yellow-400" :
                          "bg-slate-800 text-slate-400"
                        }`}>
                          {req.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security Audit Ledger History */}
              <div className="lg:col-span-6 bg-clinical-panel border border-clinical-border rounded-2xl p-5 shadow-xl flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-clinical-border pb-2">
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-4.5 h-4.5 text-sky-400" />
                    <h3 className="font-display font-medium text-slate-100 uppercase text-xs tracking-wider">
                      Security & Compliance Ledger
                    </h3>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono uppercase bg-emerald-500/10 px-1.5 rounded">FDA Compliant</span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1 font-mono text-[10px]" id="audit-logs-scroller">
                  {auditLogs.map((log) => (
                    <div 
                      key={log.id} 
                      className="p-2.5 bg-slate-900 border border-slate-850/80 rounded-lg flex flex-col gap-1 hover:border-slate-800 text-[10px]"
                    >
                      <div className="flex justify-between items-center text-slate-400">
                        <span className="font-bold text-slate-200">{log.action}</span>
                        <span>{log.timestamp.split("T")[1]?.slice(0, 8) || "08:46:27"}</span>
                      </div>
                      <p className="text-slate-350 leading-relaxed text-[10px]">{log.details}</p>
                      <div className="flex justify-between items-center text-[9px] text-slate-500 border-t border-slate-950/60 pt-1">
                        <span>Actor: {log.actorName} ({log.actorRole})</span>
                        <span className={log.status === "SUCCESS" ? "text-emerald-400" : "text-yellow-400"}>
                          ★ {log.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </section>

          {/* STOCK CREATION RECORD MODAL */}
          {isAddStockOpen && (
            <div className="fixed inset-0 bg-clinical-bg/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-clinical-panel border border-clinical-border rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
                <h3 className="font-display text-base font-semibold text-slate-50 mb-3 uppercase tracking-wider">
                  Log New Biorepository Asset
                </h3>
                
                <form onSubmit={handleAddStock} className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-slate-400 font-mono text-[9px] uppercase">Asset Label</label>
                      <input
                        type="text"
                        placeholder="BD Blood Lancets, Hemocure..."
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        className="bg-slate-900 border border-clinical-border p-2 rounded-xl text-slate-200 focus:outline-none"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-slate-400 font-mono text-[9px] uppercase">Database Category</label>
                      <select
                        value={newItemType}
                        onChange={(e: any) => setNewItemType(e.target.value)}
                        className="bg-slate-900 border border-clinical-border p-2 rounded-xl text-slate-200 focus:outline-none"
                      >
                        <option value={ItemType.REAGENT}>REAGENT CHEMICAL</option>
                        <option value={ItemType.SPECIMEN}>PATIENT SPECIMEN</option>
                        <option value={ItemType.BLOOD_BAG}>BLOOD PACK UNIT</option>
                        <option value={ItemType.SUPPLY}>GENERAL DISPOSABLE SUPPLY</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-slate-400 font-mono text-[9px] uppercase">Initial Qty</label>
                      <input
                        type="number"
                        value={newItemQty}
                        onChange={(e) => setNewItemQty(Math.max(0, parseInt(e.target.value) || 0))}
                        className="bg-slate-900 border border-clinical-border p-2 rounded-xl text-slate-200 font-mono"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-slate-400 font-mono text-[9px] uppercase">Safety Min Floor</label>
                      <input
                        type="number"
                        value={newItemMin}
                        onChange={(e) => setNewItemMin(Math.max(0, parseInt(e.target.value) || 0))}
                        className="bg-slate-900 border border-clinical-border p-2 rounded-xl text-slate-200 font-mono"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-slate-400 font-mono text-[9px] uppercase font-bold">Grid Slot Code</label>
                      <input
                        type="text"
                        placeholder="RACK-C-Z2-12"
                        value={newItemGridLocation}
                        onChange={(e) => setNewItemGridLocation(e.target.value)}
                        className="bg-slate-900 border border-clinical-border p-2 rounded-xl text-slate-200 font-mono uppercase"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-slate-400 font-mono text-[9px] uppercase">Unit descriptor</label>
                      <input
                        type="text"
                        placeholder="Bottles, PC vials, etc."
                        value={newItemUnit}
                        onChange={(e) => setNewItemUnit(e.target.value)}
                        className="bg-slate-900 border border-clinical-border p-2 rounded-xl text-slate-200"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-slate-400 font-mono text-[9px] uppercase">Thermal storage group</label>
                      <select
                        value={newItemTemp}
                        onChange={(e: any) => setNewItemTemp(e.target.value)}
                        className="bg-slate-900 border border-clinical-border p-2 rounded-xl text-slate-200"
                      >
                        <option value="FROZEN_DEEP">Deep Freezer (-25°C)</option>
                        <option value="REFRIGERATED">Standard Refrigerated (4°C)</option>
                        <option value="ROOM_TEMP">Environmental Room Temp (22°C)</option>
                      </select>
                    </div>
                  </div>

                  {/* BLOOD BAG DETAIL EXTENSION FORM */}
                  {newItemType === ItemType.BLOOD_BAG && (
                    <div className="border border-red-500/20 bg-red-500/5 p-3 rounded-xl space-y-3">
                      <p className="font-bold text-[9px] font-mono text-red-400 uppercase tracking-widest flex items-center gap-1">
                        🩸 Blood Bank Biometric Details
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="flex flex-col gap-1">
                          <label className="text-slate-400 font-mono text-[8px] uppercase">Blood Type</label>
                          <select
                            value={newBloodType}
                            onChange={(e: any) => setNewBloodType(e.target.value)}
                            className="bg-slate-900 border border-clinical-border p-1.5 rounded-lg text-slate-200"
                          >
                            {Object.values(BloodType).map((bt) => (
                              <option key={bt} value={bt}>{bt}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-slate-400 font-mono text-[8px] uppercase">Component Type</label>
                          <select
                            value={newBloodComponent}
                            onChange={(e: any) => setNewBloodComponent(e.target.value)}
                            className="bg-slate-900 border border-clinical-border p-1.5 rounded-lg text-slate-200"
                          >
                            {Object.values(BloodComponent).map((bc) => (
                              <option key={bc} value={bc}>{bc}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-slate-400 font-mono text-[8px] uppercase">Anonymous Donor ID</label>
                          <input
                            type="text"
                            value={newDonorId}
                            onChange={(e) => setNewDonorId(e.target.value)}
                            className="bg-slate-900 border border-clinical-border p-1.5 rounded-lg text-slate-200 font-mono uppercase"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 border-t border-clinical-border pt-4">
                    <button
                      type="button"
                      onClick={() => setIsAddStockOpen(false)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
                    >
                      Cancel Allocation
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-xl hover:shadow-lg transition-all cursor-pointer"
                    >
                      Authenticate Stock Allocation
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </main>
      ) : activeTab === "analytics" ? (
        /* ANALYTICS MODE - CHARTS, TRENDS, HEATMAPS, KPI CARDS, DYNAMIC COMPATIBILITY ANALYZER, AND FDA RECONCILIATIONS */
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6" id="analytics-workspace">
          
          <div className="border-b border-clinical-border pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <BarChart2 className="w-6 h-6 text-teal-400" />
                Analytical Intelligence &amp; Biobanking Logistics Forecasts
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Real-time turnover trends, patient blood compatibility checks, physical storage hot-zones maps, and quality FDA logs.
              </p>
            </div>
            <div className="text-right text-xs text-slate-400 font-mono">
              SYSTEM EFFICIENCY SCORE: <span className="text-teal-400 font-bold">98.4% (EXCELLENT)</span>
            </div>
          </div>

          {/* KPI METRIC MATRIX CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="analytics-kpis">
            <div className="bg-clinical-panel border border-clinical-border p-4.5 rounded-2xl shadow-xl flex flex-col justify-between">
              <span className="text-slate-400 text-[10px] uppercase font-mono tracking-wider font-semibold">Total Retrieval Cycles Today</span>
              <div className="flex items-baseline justify-between mt-3">
                <span className="text-2xl font-bold font-display text-white">185 Cycles</span>
                <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-mono font-medium">+12.4%</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-2 font-mono">Completed without robotic motor trips</p>
            </div>

            <div className="bg-clinical-panel border border-clinical-border p-4.5 rounded-2xl shadow-xl flex flex-col justify-between">
              <span className="text-slate-400 text-[10px] uppercase font-mono tracking-wider font-semibold">Average Dispense Velocity</span>
              <div className="flex items-baseline justify-between mt-3">
                <span className="text-2xl font-bold font-display text-white">28.6 seconds</span>
                <span className="text-xs text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full font-mono font-medium">Top Tier</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-2 font-mono">From deep rack freezer block to clinical hatch</p>
            </div>

            <div className="bg-clinical-panel border border-clinical-border p-4.5 rounded-2xl shadow-xl flex flex-col justify-between">
              <span className="text-slate-400 text-[10px] uppercase font-mono tracking-wider font-semibold font-bold">Expiring Samples warnings</span>
              <div className="flex items-baseline justify-between mt-3">
                <span className="text-2xl font-bold font-display text-red-400">3 Samples</span>
                <span className="text-xs text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full font-mono font-medium">Critical</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-2 font-mono">Reagents requiring immediate turnover replenishment</p>
            </div>

            <div className="bg-clinical-panel border border-clinical-border p-4.5 rounded-2xl shadow-xl flex flex-col justify-between">
              <span className="text-slate-400 text-[10px] uppercase font-mono tracking-wider font-semibold">O-Neg Blood Stock reserves</span>
              <div className="flex items-baseline justify-between mt-3">
                <span className="text-2xl font-bold font-display text-amber-400">3 Bags left</span>
                <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full font-mono font-medium">Low Stock</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-2 font-mono">Target min trigger limit: 8 bags</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="analytics-charts-and-logic">
            
            {/* WEEKLY TURN_OVER TREND GRAPH (8-cols width inside lg layout) */}
            <div className="lg:col-span-8 bg-clinical-panel border border-clinical-border rounded-2xl p-5 shadow-xl flex flex-col gap-4" id="analytics-turnover-chart">
              <div className="flex items-center justify-between border-b border-clinical-border pb-3.5">
                <div>
                  <h3 className="font-display font-medium text-slate-100 uppercase text-xs tracking-wider">Turnover, Replenishments &amp; Dispenses Log</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Statistical volume comparison across the last 7-day diagnostics cycle.</p>
                </div>
                <div className="flex items-center gap-3.5 text-[10px] font-mono">
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 bg-teal-400 rounded-full"></span>
                    <span className="text-slate-350">Robotic Retrievals</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 bg-sky-400 rounded-full"></span>
                    <span className="text-slate-350">Admissions/Restocks</span>
                  </div>
                </div>
              </div>

              {/* HIGH LEVEL SVG BASED LINE GRAPH CHART */}
              <div className="relative h-64 w-full bg-slate-900/60 rounded-xl border border-clinical-border p-4 flex flex-col justify-between" id="svg-trend-chart">
                <div className="absolute top-2 left-2 text-[9px] font-mono text-slate-500">CYCLES COUNT (VOL)</div>
                <svg className="w-full h-44 mt-4" viewBox="0 0 700 200" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.4"/>
                      <stop offset="100%" stopColor="#14b8a6" stopOpacity="0"/>
                    </linearGradient>
                    <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.4"/>
                      <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  
                  {/* Grid lines */}
                  <line x1="0" y1="40" x2="700" y2="40" stroke="#1e294b" strokeWidth="1" strokeDasharray="5,5" />
                  <line x1="0" y1="90" x2="700" y2="90" stroke="#1e294b" strokeWidth="1" strokeDasharray="5,5" />
                  <line x1="0" y1="140" x2="700" y2="140" stroke="#1e294b" strokeWidth="1" strokeDasharray="5,5" />

                  {/* TEAL GRADIENT COVER AREA */}
                  <path 
                    d="M 10,135 Q 110,105 210,140 T 410,65 T 610,35 Q 650,45 690,30 L 690,190 L 10,190 Z" 
                    fill="url(#tealGrad)" 
                  />
                  {/* SKY GRADIENT COVER AREA */}
                  <path 
                    d="M 10,170 Q 110,140 210,165 T 410,105 T 610,85 Q 650,75 690,55 L 690,190 L 10,190 Z" 
                    fill="url(#skyGrad)" 
                  />

                  {/* TEAL TRACKING LINE */}
                  <path 
                    d="M 10,135 Q 110,105 210,140 T 410,65 T 610,35 Q 650,45 690,30" 
                    fill="none" 
                    stroke="#14b8a6" 
                    strokeWidth="3.5" 
                    strokeLinecap="round"
                  />
                  {/* SKY TRACKING LINE */}
                  <path 
                    d="M 10,170 Q 110,140 210,165 T 410,105 T 610,85 Q 650,75 690,55" 
                    fill="none" 
                    stroke="#0ea5e9" 
                    strokeWidth="3.5" 
                    strokeLinecap="round"
                  />

                  {/* Dot vertices */}
                  <circle cx="210" cy="140" r="5" fill="#14b8a6" stroke="#070a13" strokeWidth="2" />
                  <circle cx="410" cy="65" r="5" fill="#14b8a6" stroke="#070a13" strokeWidth="2" />
                  <circle cx="610" cy="35" r="5" fill="#14b8a6" stroke="#070a13" strokeWidth="2" />

                  <circle cx="210" cy="165" r="5" fill="#0ea5e9" stroke="#070a13" strokeWidth="2" />
                  <circle cx="410" cy="105" r="5" fill="#0ea5e9" stroke="#070a13" strokeWidth="2" />
                  <circle cx="610" cy="85" r="5" fill="#0ea5e9" stroke="#070a13" strokeWidth="2" />
                </svg>

                {/* Weekday axis */}
                <div className="flex justify-between text-[9px] font-mono text-slate-500 border-t border-clinical-border pt-2">
                  <span>MON 05/29</span>
                  <span>TUE 05/30</span>
                  <span>WED 06/01</span>
                  <span>THU 06/02</span>
                  <span>FRI 06/03</span>
                  <span>SAT 06/04</span>
                  <span>SUN 06/05 (TODAY)</span>
                </div>
              </div>
            </div>

            {/* HIGH-END INTERACTIVE CLINICAL COMPATIBILITY ANALYZER (4-cols) */}
            <div className="lg:col-span-4 bg-clinical-panel border border-clinical-border rounded-2xl p-5 shadow-xl flex flex-col gap-4" id="consult-blood-analyzer">
              <div>
                <h3 className="font-display font-medium text-slate-100 uppercase text-xs tracking-wider flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-rose-500" />
                  Clinical Transfusion Matcher
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  Query universal blood group compatibility and locate matches in current biorepository storage cells.
                </p>
              </div>

              <div className="space-y-4 text-xs font-mono">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] text-slate-400 uppercase font-semibold">Select Patient Blood Type</label>
                  <select
                    value={selectedPatientBlood}
                    onChange={(e: any) => setSelectedPatientBlood(e.target.value)}
                    className="bg-slate-900 border border-clinical-border p-2.5 rounded-xl text-slate-200 text-xs w-full font-mono font-bold"
                  >
                    {Object.values(BloodType).map((bt) => (
                      <option key={bt} value={bt}>{bt} Patient Group</option>
                    ))}
                  </select>
                </div>

                <div className="bg-slate-900/80 border border-clinical-border p-4 rounded-xl space-y-2.5">
                  <span className="text-[9px] text-slate-500 uppercase block font-semibold">Authorized Infusable Donors</span>
                  
                  {/* Math logics for blood compatibilities */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {/* O-neg can only receive O- */}
                    {selectedPatientBlood === BloodType.O_NEG && (
                      <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold">O- ONLY (HIGH ALERT)</span>
                    )}
                    {/* O-pos can receive O-, O+ */}
                    {selectedPatientBlood === BloodType.O_POS && (
                      ["O-", "O+"].map(t => <span key={t} className="bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded text-[10px] font-bold">{t}</span>)
                    )}
                    {/* A-neg can receive O-, A- */}
                    {selectedPatientBlood === BloodType.A_NEG && (
                      ["O-", "A-"].map(t => <span key={t} className="bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded text-[10px] font-bold">{t}</span>)
                    )}
                    {/* A-pos can receive O-, O+, A-, A+ */}
                    {selectedPatientBlood === BloodType.A_POS && (
                      ["O-", "O+", "A-", "A+"].map(t => <span key={t} className="bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded text-[10px] font-bold">{t}</span>)
                    )}
                    {/* B-neg can receive O-, B- */}
                    {selectedPatientBlood === BloodType.B_NEG && (
                      ["O-", "B-"].map(t => <span key={t} className="bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded text-[10px] font-bold">{t}</span>)
                    )}
                    {/* B-pos can receive O-, O+, B-, B+ */}
                    {selectedPatientBlood === BloodType.B_POS && (
                      ["O-", "O+", "B-", "B+"].map(t => <span key={t} className="bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded text-[10px] font-bold">{t}</span>)
                    )}
                    {/* AB-neg can receive O-, A-, B-, AB- */}
                    {selectedPatientBlood === BloodType.AB_NEG && (
                      ["O-", "A-", "B-", "AB-"].map(t => <span key={t} className="bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded text-[10px] font-bold">{t}</span>)
                    )}
                    {/* AB-pos is universal receiver */}
                    {selectedPatientBlood === BloodType.AB_POS && (
                      <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded text-[10px] font-bold">UNIVERSAL COMPLEMENT ✅ (ALL GROUPS)</span>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-400 leading-relaxed pt-2 border-t border-slate-800">
                    Located in cold cells: <strong className="text-white">
                      {inventory.filter(item => 
                        item.type === ItemType.BLOOD_BAG && 
                        // simple filter matching infusable parts
                        (selectedPatientBlood === BloodType.AB_POS || 
                         item.bloodDetails?.bloodType === selectedPatientBlood || 
                         item.bloodDetails?.bloodType === BloodType.O_NEG)
                      ).reduce((sum, item) => sum + item.quantity, 0)} bags
                    </strong> eligible for robotic retrieval request sequence.
                  </div>
                </div>

                <div className="p-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-[10.5px] leading-relaxed text-slate-350">
                  ⚠️ <strong>Rule 21-S:</strong> Always perform physical slide agglutination crossmatch test cycles on portal dispense before patient infusion.
                </div>
              </div>
            </div>

          </div>

          {/* SYSTEM STORAGE HOT-ZONES MAP & RECONCILIATIONS ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="analytics-heatmap-downloads">
            
            {/* PHYSICAL BIORACK GRID TEMPERATURE & DENSITY MAP - 7 COLS */}
            <div className="lg:col-span-7 bg-clinical-panel border border-clinical-border rounded-2xl p-5 shadow-xl flex flex-col gap-4" id="biobank-hotzones">
              <div>
                <h3 className="font-display font-medium text-slate-100 uppercase text-xs tracking-wider">Storage Cell Retrieval Heatmap</h3>
                <p className="text-[11px] text-slate-400 mt-1">Spatial frequency distribution representing motor pick frequencies. Relocate active vials to Zone A.</p>
              </div>

              {/* ISOMETRIC HEATMAP GENERATION */}
              <div className="bg-slate-900 border border-clinical-border p-4 rounded-xl flex flex-col gap-3 font-mono text-[10px]" id="heatmap-grid-frame">
                <div className="grid grid-cols-5 gap-2 text-center text-slate-500 text-[9px] uppercase border-b border-clinical-border pb-1">
                  <span>Rack Unit</span>
                  <span>Zone A (Cold)</span>
                  <span>Zone B (Deep)</span>
                  <span>Zone C (Deep)</span>
                  <span>Zone D (Ambient)</span>
                </div>

                {[
                  { row: "Row 1 (Upper)", a: "98% freq", b: "54% freq", c: "12% freq", d: "45% freq", ac: "bg-teal-500/80 text-white font-bold", bc: "bg-teal-500/40 text-slate-200", cc: "bg-teal-500/10 text-slate-500", dc: "bg-teal-500/30 text-slate-300" },
                  { row: "Row 2 (Upper)", a: "85% freq", b: "61% freq", c: "22% freq", d: "36% freq", ac: "bg-teal-500/70 text-slate-100", bc: "bg-teal-500/50 text-slate-200", cc: "bg-teal-500/10 text-slate-500", dc: "bg-teal-500/30 text-slate-300" },
                  { row: "Row 3 (Mid)", a: "74% freq", b: "88% freq", c: "41% freq", d: "10% freq", ac: "bg-teal-500/60 text-slate-100", bc: "bg-teal-500/70 text-slate-100", cc: "bg-teal-500/40 text-slate-200", dc: "bg-teal-500/10 text-slate-500" },
                  { row: "Row 4 (Lower)", a: "15% freq", b: "20% freq", c: "55% freq", d: "92% freq", ac: "bg-teal-500/10 text-slate-500", bc: "bg-teal-500/10 text-slate-500", cc: "bg-teal-500/50 text-slate-200", dc: "bg-teal-500/80 text-white font-bold" },
                  { row: "Row 5 (Lower)", a: "8% freq", b: "11% freq", c: "89% freq", d: "99% freq", ac: "bg-teal-500/5 text-slate-600", bc: "bg-teal-500/10 text-slate-550", cc: "bg-teal-500/70 text-slate-100", dc: "bg-teal-500/90 text-white font-bold" }
                ].map((rowItem, idx) => (
                  <div key={idx} className="grid grid-cols-5 gap-2 text-center items-center">
                    <span className="text-left text-slate-400 font-semibold">{rowItem.row}</span>
                    <div className={`p-2 rounded-lg border border-slate-900 ${rowItem.ac}`}>{rowItem.a}</div>
                    <div className={`p-2 rounded-lg border border-slate-900 ${rowItem.bc}`}>{rowItem.b}</div>
                    <div className={`p-2 rounded-lg border border-slate-900 ${rowItem.cc}`}>{rowItem.c}</div>
                    <div className={`p-2 rounded-lg border border-slate-900 ${rowItem.dc}`}>{rowItem.d}</div>
                  </div>
                ))}

                <div className="flex justify-between text-[9px] text-slate-500 border-t border-clinical-border pt-2 mt-1">
                  <span>Legend: Deep Green = High Retrieval Pull Ratio</span>
                  <span>Grey/Faded = Storage Dormancy (Reheat risk: None)</span>
                </div>
              </div>
            </div>

            {/* HIGH-END CERTIFIED FDA REPORT DOWNLOADS - 5 COLS */}
            <div className="lg:col-span-5 bg-clinical-panel border border-clinical-border rounded-2xl p-5 shadow-xl flex flex-col justify-between gap-4" id="quality-reporting">
              <div>
                <h3 className="font-display font-medium text-slate-100 uppercase text-xs tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-sky-400" />
                  FDA Compliance Reporting Center
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  Reconcile inventory custody levels, physical thermal history logs, and robotic motor alignment tolerances. Produce signed cryptographed files.
                </p>
              </div>

              {/* Interactive Download State Machine widget */}
              <div className="bg-slate-900 border border-clinical-border p-4 rounded-xl flex flex-col justify-center gap-4 min-h-[160px]" id="download-progress-shell">
                {reportDownloadState === "IDLE" ? (
                  <div className="text-center py-4 space-y-3">
                    <p className="text-xs text-slate-300 font-mono">No active report generated in this session</p>
                    <button
                      onClick={() => {
                        setReportDownloadState("PREPARING");
                        setDownloadProgress(0);
                        const t1 = setInterval(() => {
                          setDownloadProgress(p => {
                            if (p >= 100) {
                              clearInterval(t1);
                              setReportDownloadState("FINISHED");
                              return 100;
                            }
                            return p + 25;
                          });
                        }, 400);
                      }}
                      className="bg-slate-800 hover:bg-slate-700/80 border border-clinical-border font-bold uppercase tracking-wider text-[10.5px] text-teal-400 px-5 py-2.5 rounded-xl cursor-pointer hover:border-teal-500/30 transition-all font-mono"
                    >
                      Generate FDA 21 CFR Grade Audit Report
                    </button>
                  </div>
                ) : reportDownloadState === "PREPARING" || reportDownloadState === "DOWNLOADING" ? (
                  <div className="space-y-3 py-2 font-mono">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-sky-400 flex items-center gap-1.5 uppercase font-bold">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Compiling telemetry schemas ...
                      </span>
                      <span>{downloadProgress}%</span>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                      <div 
                        className="bg-gradient-to-r from-teal-500 to-sky-500 h-full transition-all duration-300"
                        style={{ width: `${downloadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-[9px] text-slate-500 uppercase">Synchronizing 12,042 biometric custody records with relational log index</p>
                  </div>
                ) : (
                  <div className="space-y-3 text-xs leading-relaxed font-mono">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <Check className="w-4 h-4" />
                      <span className="uppercase font-bold">COMPLIANCE REPORT RECONCILED</span>
                    </div>
                    <div className="bg-slate-950 p-2 text-[10px] text-slate-400 border border-slate-800 rounded-lg max-h-24 overflow-y-auto">
                      SHA256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855<br/>
                      BIO_RECORDS_INDEXED: 115 Reagents/Bags<br/>
                      FAULT_STATE_SENSORS: Normal (0 Alignment slips)<br/>
                      AUTOGRAPHIC_SIGN_LOCK: Hemato-Robotic Cryptographic CA-3
                    </div>
                    <button
                      onClick={() => setReportDownloadState("IDLE")}
                      className="w-full bg-teal-500 hover:bg-teal-600 font-bold uppercase py-2 rounded-xl text-white transition-colors cursor-pointer text-center text-[11px]"
                    >
                      Download PDF Audit file &amp; Reset Desk
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>

        </main>
      ) : (
        /* ARCHITECTURE VIEW MODE - SRS, UML SCHEMA, WORKFLOWS, AND ARCHITECTURE DIAGRAMS */
        <main className="flex-1 p-6 max-w-5xl mx-auto space-y-8" id="architecture-srs">
          
          {/* Header */}
          <div className="border-b border-clinical-border pb-5">
            <h2 className="font-display text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Clipboard className="w-6 h-6 text-teal-400" />
              Software Requirement Specification (SRS) &amp; Enterprise Architecture
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Complete production specification, database blueprint, state controllers, and WebSocket topology.
            </p>
          </div>

          {/* Section 1: Product Scope */}
          <div className="bg-clinical-panel border border-clinical-border rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="font-display font-semibold text-slate-100 uppercase tracking-wider text-xs border-l-4 border-teal-500 pl-3">
              1. Document Purpose &amp; Product Vision
            </h3>
            <div className="text-slate-300 text-xs space-y-3 leading-relaxed">
              <p>
                The <strong>Hemato-Robotic™ Smart Laboratory Inventory &amp; Robotic Retrieval Management System</strong> resolves critical clinical bottlenecks in space-constrained hospital bio-stockrooms, transfusion blood banks, and central diagnostic sample lanes. 
              </p>
              <p>
                By linking secure digital record indexes with hardware PLC microcontrollers (robotic grid retrievers), this enterprise system maintains absolute biologic chain of custody, guarantees ambient safety parameters, eliminates chemical reagent stock expiration, and expedites the delivery of lifcritical blood units from thermal storage to surgical portals in <strong>under 45 seconds</strong>.
              </p>
              <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl space-y-2">
                <span className="font-mono text-[10px] text-teal-400 block font-bold">CORE WORKFLOW FLOW PROCESS</span>
                <pre className="font-mono text-[10.5px] leading-relaxed text-slate-400 overflow-x-auto">
{`Diagnostic Specimen Logged  -->  Racking Slot Assigned  -->  Positional Lasers Map Coords  -->
Robotic Arm Dispatched      -->  Continuous Temp Log     -->  Emergency Threshold Check  -->
Operator Request Raised     -->  Safety Verification    -->  Mechanical Retrieval Cycle  -->
Dispense at Portal Hatch    -->  Chain-of-Custody logged`}
                </pre>
              </div>
            </div>
          </div>

          {/* Section 2: Enterprise Architecture */}
          <div className="bg-clinical-panel border border-clinical-border rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="font-display font-semibold text-slate-100 uppercase tracking-wider text-xs border-l-4 border-teal-500 pl-3">
              2. Technical System Architecture Diagram
            </h3>
            <div className="text-slate-300 text-xs space-y-3 leading-relaxed">
              <p>
                A high-availability microservice ecosystem executing across secure Docker containers. Database queries are handled by PostgreSQL using the drizzle ORM with persistent caching on Redis.
              </p>
              <div className="bg-slate-950 p-4 rounded-xl border border-clinical-border overflow-x-auto">
                <pre className="font-mono text-[10.5px] text-slate-400 leading-relaxed">
{`+-----------------------------------------------------------------------------------------+
|                                    CLIENT BROWSER LAYER                                 |
|   +---------------------------------+             +----------------------------------+  |
|   |   Web-Based Diagnostic Portal   |             |  Robotic Control Arm Telemetry   |  |
|   |         (Vite + React)          |             |     (SVG Real-Time Monitor)      |  |
|   +----------------+----------------+             +----------------+-----------------+  |
+--------------------|-----------------------------------------------|--------------------+
                     | HTTP API requests                             | WebSocket telemetry
                     v                                               v
+-----------------------------------------------------------------------------------------+
|                                  ENTERPRISE APIS / MIDDLEWARE                           |
|   +----------------------------------------------------------------------------------+  |
|   |                             Express Node.js Web Server                           |  |
|   |   - JWT Role Authorization (Role Based Access Control: SysAdmin / Lab / Blood)    |  |
|   |   - Real-time JSON Dispatch Planner Engine                                       |  |
|   |   - Server-Side Gemini API Diagnostics Auditor Copilot Layer                     |  |
|   +----------------+-----------------------------------------------+-----------------+  |
+--------------------|-----------------------------------------------|--------------------+
                     | DB Queries / Pools                            | MQTT / Serial Port CMD
                     v                                               v
+--------------------+--------------------+     +--------------------+--------------------+
|               POSTGRESQL RELATIONAL DB  |     |        PLC HARDWARE CONTROLLER CORE     |
|   - Users & Auth Credentials Profiles   |     |   - Stepper Motor Driver (X, Y, Z Axis) |
|   - Physical Bio-repository Grid Index  |     |   - Infrared Positioning Barcode Laser  |
|   - Immutable Audit Logs (FDA 21 CFR)   |     |   - Emergency Physical Safety Trip-wire |
+-----------------------------------------+     +-----------------------------------------+`}
                </pre>
              </div>
            </div>
          </div>

          {/* Section 3: Relational Database Schema ER description */}
          <div className="bg-clinical-panel border border-clinical-border rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="font-display font-semibold text-slate-100 uppercase tracking-wider text-xs border-l-4 border-teal-500 pl-3">
              3. Relational PostgreSQL Schema &amp; Entity Descriptions
            </h3>
            <div className="text-slate-350 text-xs space-y-4 leading-relaxed">
              <p>
                The relational database model enforces normalized data structures supporting foreign key integrity, cascade structures, and unique constraints ensuring patient samples are never misidentified.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                  <span className="font-mono text-[11px] text-teal-400 font-bold block mb-1">TABLE: Users</span>
                  <ul className="space-y-1 font-mono text-[10px] text-slate-450 list-disc pl-3 list-inside">
                    <li><strong className="text-slate-200">id</strong> (UUID, Primary Key)</li>
                    <li><strong className="text-slate-200">username</strong> (VARCHAR, Unique)</li>
                    <li><strong className="text-slate-200">password_hash</strong> (VARCHAR)</li>
                    <li><strong className="text-slate-200">role_id</strong> (ENUM Reference)</li>
                    <li><strong className="text-slate-200">assigned_department</strong> (VARCHAR)</li>
                    <li><strong className="text-slate-200">created_at</strong> (TIMESTAMP)</li>
                  </ul>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                  <span className="font-mono text-[11px] text-teal-400 font-bold block mb-1">TABLE: InventoryItems</span>
                  <ul className="space-y-1 font-mono text-[10px] text-slate-450 list-disc pl-3 list-inside">
                    <li><strong className="text-slate-200">id</strong> (UUID, Primary Key)</li>
                    <li><strong className="text-slate-200">sku</strong> (VARCHAR, Unique Indexed)</li>
                    <li><strong className="text-slate-200">name</strong> (VARCHAR)</li>
                    <li><strong className="text-slate-200">type</strong> (ENUM: Reagent, Specimen, Blood, Supply)</li>
                    <li><strong className="text-slate-200">quantity</strong> (INTEGER)</li>
                    <li><strong className="text-slate-200">location_grid_address</strong> (VARCHAR, e.g. RACK-A-Z3-05)</li>
                    <li><strong className="text-slate-200">expiry_date</strong> (DATE)</li>
                    <li><strong className="text-slate-200">temp_group</strong> (ENUM: Frozen, Refrigerated, Room)</li>
                  </ul>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                  <span className="font-mono text-[11px] text-teal-400 font-bold block mb-1">TABLE: PrimaryRetrievalRequests</span>
                  <ul className="space-y-1 font-mono text-[10px] text-slate-450 list-disc pl-3 list-inside">
                    <li><strong className="text-slate-200">id</strong> (UUID, Primary Key)</li>
                    <li><strong className="text-slate-200">item_sku</strong> (FK References InventoryItems.sku)</li>
                    <li><strong className="text-slate-200">quantity</strong> (INTEGER)</li>
                    <li><strong className="text-slate-200">urgency</strong> (ENUM: Routine, Urgent, STAT)</li>
                    <li><strong className="text-slate-200">status</strong> (ENUM: Pending, Moving, Complete, Canceled)</li>
                    <li><strong className="text-slate-200">requested_by_user_id</strong> (FK References Users.id)</li>
                    <li><strong className="text-slate-200">tracking_sequence_code</strong> (VARCHAR, Unique)</li>
                  </ul>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                  <span className="font-mono text-[11px] text-teal-400 font-bold block mb-1">TABLE: ClinicalAuditLogs</span>
                  <ul className="space-y-1 font-mono text-[10px] text-slate-450 list-disc pl-3 list-inside">
                    <li><strong className="text-slate-200">id</strong> (BIGINT, Primary Key)</li>
                    <li><strong className="text-slate-200">actor_user_id</strong> (VARCHAR Actor Name)</li>
                    <li><strong className="text-slate-200">action_name</strong> (VARCHAR, e.g. STOCK_REPLENISHED)</li>
                    <li><strong className="text-slate-200">payload_details</strong> (TEXT JSON Payload)</li>
                    <li><strong className="text-slate-200">status_flag</strong> (VARCHAR success/fail)</li>
                    <li><strong className="text-slate-200">timestamp</strong> (TIMESTAMP WITH TIME ZONE)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Security Design & RBAC Policy */}
          <div className="bg-clinical-panel border border-clinical-border rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="font-display font-semibold text-slate-100 uppercase tracking-wider text-xs border-l-4 border-teal-500 pl-3">
              4. Security Architecture &amp; Role-Based Access Control (RBAC) Matrix
            </h3>
            <div className="text-slate-350 text-xs space-y-3 leading-relaxed">
              <p>
                To maintain physical clinical safety, security permission barriers are strictly integrated into every client component. Authorization tokens utilize JWT hashes containing cryptographic role claims:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-[10.5px] border border-clinical-border border-collapse mt-2">
                  <thead>
                    <tr className="bg-slate-900 border-b border-clinical-border text-slate-400">
                      <th className="p-2">Role ID Name</th>
                      <th className="p-2">Inventory View</th>
                      <th className="p-2">Retrieval Request</th>
                      <th className="p-2">Manual Replenishment</th>
                      <th className="p-2">Robot Calibrate Overrides</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-clinical-border bg-slate-950/20">
                    <tr>
                      <td className="p-2 text-slate-200 font-bold">LABORATORY_STAFF</td>
                      <td className="p-2 text-emerald-400">✅ Authorized</td>
                      <td className="p-2 text-emerald-400">✅ Authorized</td>
                      <td className="p-2 text-amber-500">❌ Read Only</td>
                      <td className="p-2 text-red-500">❌ Forbidden</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-slate-200 font-bold">BLOOD_BANK_STAFF</td>
                      <td className="p-2 text-emerald-400">✅ Authorized</td>
                      <td className="p-2 text-teal-400">✅ Transfusion Only</td>
                      <td className="p-2 text-emerald-400">✅ Authorized</td>
                      <td className="p-2 text-red-500">❌ Forbidden</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-slate-200 font-bold">ADMINISTRATOR</td>
                      <td className="p-2 text-emerald-400">✅ Authorized</td>
                      <td className="p-2 text-emerald-400">✅ Authorized</td>
                      <td className="p-2 text-emerald-400">✅ Authorized</td>
                      <td className="p-2 text-emerald-400">✅ FULL ACCESS</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Section 5: Real-time and Robot integration logic */}
          <div className="bg-clinical-panel border border-clinical-border rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="font-display font-semibold text-slate-100 uppercase tracking-wider text-xs border-l-4 border-teal-500 pl-3">
              5. Real-Time WebSocket Events &amp; Robot Safety Error Handling
            </h3>
            <div className="text-slate-350 text-xs space-y-3 leading-relaxed">
              <p>
                The client sync engine uses an event-based WebSocket state sync model. Major events emitted by the central scheduler:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-slate-300">
                <li><code className="text-teal-400">ROBOT_TELEMETRY_EMIT</code>: Dispatches coordinates X, Y, Z and angular calibration offsets to the diagnostic monitors every 250ms.</li>
                <li><code className="text-teal-400">RETRIEVAL_STAGE_UPDATE</code>: Notifies surrounding diagnostic terminals when a specimen changes state from <code className="text-sky-305">QUEUED</code> to <code className="text-indigo-405">RETRIEVING</code>.</li>
                <li><code className="text-teal-400">CRITICAL_STOCK_SHADOW_ALERT</code>: Fired when thermal refrigeration sensors report a deviation exceeding ±0.5°C over safety parameters.</li>
              </ul>
              
              <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-[11px] text-red-200 mt-2">
                <strong>🚨 Physical Safety Lockout Design Pattern (Failure State Guard):</strong>
                <p className="mt-1">
                  If the laser positioning sensor measures an angular variance exceeding <code className="font-bold">0.12mm</code> baseline calibration tolerance, the controller triggers a safety fault flag <code className="text-red-400">ERR_ALIGN_TOLERANCE</code>, locking the stepper motors out of physical movement to avoid structural sample collision. Movement remains disabled until a authorized <code className="text-red-400 font-mono">ADMINISTRATOR</code> triggers the Laser Recalibration manual command override.
                </p>
              </div>
            </div>
          </div>

          {/* Analytical Reporting metrics */}
          <div className="bg-clinical-panel border border-clinical-border rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="font-display font-semibold text-slate-100 uppercase tracking-wider text-xs border-l-4 border-teal-500 pl-3">
              6. Operational Analytics &amp; Bio-consumption Predictions
            </h3>
            <div className="text-slate-350 text-xs space-y-3 leading-relaxed">
              <p>
                The platform includes an automated reporting pipeline designed for FDA quality audits and bio-consumption logistics:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-slate-300">
                <li><strong>Daily Reports:</strong> Total retrievals executed, statistical workflow cycle times, physical mileage, and stepper motor temperature stats.</li>
                <li><strong>Weekly Reports:</strong> Biological reagent turnover status. Prepares automatic replenishment purchase proposals for reagents entering warning levels.</li>
                <li><strong>Monthly Transfusion Audit:</strong> Tracking and forecast graphs on emergency stock transfusion flows (highly matching universal donor supply demand).</li>
              </ul>
            </div>
          </div>

        </main>
      )}

      {/* FOOTER COLOFON */}
      <footer className="border-t border-clinical-border bg-slate-950 px-6 py-4 mt-auto text-slate-500 text-xs font-mono flex items-center justify-between" id="footer-co">
        <span>© 2026 Hemato-Robotic Systems, Inc. FDA biological grade certified.</span>
        <span>Secure Secure Session: <span className="text-teal-400">Bearer JWT Claims Sync Active</span></span>
      </footer>

      {/* OPTICAL QR/BARCODE SCANNER VIEW HUD MODAL */}
      {isScannerOpen && (
        <div className="fixed inset-0 bg-slate-955/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" id="optical-scanner-modal">
          <div className="glass-modal max-w-lg w-full rounded-2xl overflow-hidden shadow-2xl relative border-2 border-clinical-border bg-slate-900/90" id="scanner-frame">
            
            {/* Header banner */}
            <div className="bg-slate-950 px-6 py-4 border-b border-clinical-border flex items-center justify-between" id="scanner-head">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-teal-400 animate-pulse" />
                <h4 className="font-display font-semibold text-slate-100 uppercase text-xs tracking-wider">
                  Hardware Decoder HUD Simulation
                </h4>
              </div>
              <button
                onClick={() => {
                  setIsScannerOpen(false);
                  setLastScannedResult("");
                  setScanProcessing(false);
                }}
                className="text-slate-400 hover:text-slate-200 text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Offline Module
              </button>
            </div>

            <div className="p-6 space-y-4 shadow-xl" id="scanner-body">
              <p className="text-xs text-slate-400">
                Deploying camera aiming reticles and Infrared laser line tracking. Click a physical biologic specimen to simulate target interception:
              </p>

              {/* Viewfinder block */}
              <div className="relative h-44 bg-slate-950 border border-clinical-border rounded-xl flex items-center justify-center overflow-hidden" id="scanner-viewfinder">
                {/* Aiming Slices */}
                <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-teal-400"></div>
                <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-teal-400"></div>
                <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-teal-400"></div>
                <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-teal-400"></div>

                {/* Laser horizontal sweeping line */}
                <div className="laser-scanner-line"></div>

                {scanProcessing ? (
                  <div className="flex flex-col items-center gap-2 text-xs font-mono text-teal-400">
                    <RefreshCw className="w-6 h-6 animate-spin text-teal-400" />
                    <span>INTERCEPTING MULTIPLEX SPECTRUM...</span>
                  </div>
                ) : lastScannedResult ? (
                  <div className="text-center space-y-2 font-mono text-xs text-teal-400">
                    <Check className="w-8 h-8 text-teal-400 mx-auto animate-bounce" />
                    <p className="font-bold uppercase">DECODING LOGIC SECURE OK!</p>
                  </div>
                ) : (
                  <div className="text-center font-mono text-[10px] text-slate-500 uppercase">
                    Place barcoded vial near laser aperture target ...
                  </div>
                )}
              </div>

              {/* Simulator buttons */}
              <div className="space-y-2 text-xs font-mono" id="scanner-simulators">
                <span className="text-[9px] text-slate-500 tracking-wider uppercase font-semibold">Simulate biological sample presentation:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setScanProcessing(true);
                      setLastScannedResult("");
                      setTimeout(async () => {
                        setScanProcessing(false);
                        setLastScannedResult("O-NEG-WHO-W1");
                        // Automatically push an audit log or trigger sync
                        try {
                          await fetch("/api/audit-logs", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              actorName: currentUser.name,
                              actorRole: currentUser.role,
                              action: "METRIC_OPTICAL_SCAN",
                              targetEntity: "O-NEG-WHO-W1",
                              status: "SUCCESS",
                              details: "Simulated hardware scan of Whole Blood Bag O-Neg. Integrity verified."
                            })
                          });
                          fetchData();
                        } catch(e){}
                      }, 950);
                    }}
                    className="p-2.5 bg-slate-900 hover:bg-slate-800 rounded-xl border border-clinical-border text-slate-355 hover:text-white transition-all text-left uppercase text-[9px] truncate cursor-pointer text-slate-50 mr-1"
                  >
                    🩸 Blood: Whole O-Neg
                  </button>
                  <button
                    onClick={() => {
                      setScanProcessing(true);
                      setLastScannedResult("");
                      setTimeout(async () => {
                        setScanProcessing(false);
                        setLastScannedResult("REA_PC_34");
                        try {
                          await fetch("/api/audit-logs", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              actorName: currentUser.name,
                              actorRole: currentUser.role,
                              action: "METRIC_OPTICAL_SCAN",
                              targetEntity: "REA_PC_34",
                              status: "SUCCESS",
                              details: "Simulated optical scan of PCR Reagent batch. System logged normal."
                            })
                          });
                          fetchData();
                        } catch(e){}
                      }, 950);
                    }}
                    className="p-2.5 bg-slate-900 hover:bg-slate-800 rounded-xl border border-clinical-border text-slate-355 hover:text-white transition-all text-left uppercase text-[9px] truncate cursor-pointer text-slate-50"
                  >
                    🧪 Vial: PCR Reagent Solution
                  </button>
                </div>
              </div>

              {/* Parsed Output Details */}
              {lastScannedResult && (
                <div className="p-3.5 bg-slate-900/95 border border-clinical-border rounded-xl space-y-2 text-xs font-mono" id="scanned-results-grid">
                  <span className="text-[9.5px] uppercase text-teal-400 font-bold block">Decoded Custody Attributes:</span>
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-405 leading-relaxed">
                    <div>PRODUCT SKU: <span className="text-white font-semibold">{lastScannedResult}</span></div>
                    <div>STATUS: <span className="text-emerald-450 font-bold">VERIFIED</span></div>
                    <div>ZONE ADDR: <span className="text-sky-405 font-bold">RACK-A-Z1-05</span></div>
                    <div>AUDIT INTEGRITY: <span className="text-teal-450">CA-CERTIFIED</span></div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-slate-850">
                    <button
                      onClick={() => {
                        // Quick dispatch of scanned SKU
                        setDispatchSku(lastScannedResult);
                        setIsScannerOpen(false);
                        // Focus orders tab or alert
                        alert(`SKU: ${lastScannedResult} has been auto-filled inside the Retrieval order station!`);
                      }}
                      className="flex-1 bg-teal-555 hover:bg-teal-600 border border-teal-500/25 text-white bg-teal-500 font-bold py-1.5 rounded-lg text-center uppercase tracking-wider text-[10px] font-mono cursor-pointer"
                    >
                      Retrieve Specimen
                    </button>
                    <button
                      onClick={() => {
                        setIsScannerOpen(false);
                        setLastScannedResult("");
                      }}
                      className="flex-1 bg-slate-800 hover:bg-slate-850 border border-slate-700 text-slate-300 py-1.5 rounded-lg text-center uppercase text-[10px] cursor-pointer"
                    >
                      Acknowledge &amp; Close
                    </button>
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
