"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Card as TremorCard,
  Metric,
  Text,
  ProgressBar,
  BadgeDelta,
  Flex,
  Grid,
} from "@tremor/react";
import {
  Server,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ShieldAlert,
  Sliders,
  Box,
  Database,
  MapPin,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Send,
  Bot,
  User,
  Link as LinkIcon,
  FileText,
  Radio,
  Activity,
  Play,
  Pause,
  Bell,
  X,
  FilterX,
} from "lucide-react";

interface HealthData {
  status: string;
  timestamp: string;
  version: string;
  service: string;
  vector_db_documents?: number;
  gemini_configured?: boolean;
}

interface FactualMSMEOrder {
  id: string;
  supplier_name: string;
  item: string;
  expected_delivery_date: string;
  supplier_location: string;
  category: string;
  order_value_inr?: number;
  dispatch_port?: string;
  riskLevel?: "low" | "medium" | "high";
  overall_risk_level?: "low" | "medium" | "high";
  overall_score?: number;
  critical_findings_count?: number;
  executive_summary?: string;
  primary_recommendation?: string;
  last_disruption_id?: string | null;
}

interface ChatSource {
  source_id: string;
  title: string;
  category?: string;
  similarity?: number;
}

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  sources?: ChatSource[];
  timestamp: string;
}

interface ActivityFeedItem {
  id: string;
  title: string;
  category: string;
  severity: "low" | "medium" | "high";
  affected_locations: string[];
  affected_sectors: string[];
  content_snippet: string;
  target_orders: string[];
  toast_message: string;
  time_str: string;
  timestamp: string;
}

interface ToastNotification {
  id: string;
  message: string;
  severity: "low" | "medium" | "high";
  target_orders: string[];
  timestamp: string;
}

// Fallback baseline if server is initializing
const fallbackOrders: FactualMSMEOrder[] = [
  {
    id: "MSME-ORD-101",
    supplier_name: "Kaveri Precision Forgings Pvt Ltd",
    item: "CNC Machined High-Tensile Crankshafts (Grade 42CrMo4)",
    expected_delivery_date: "2026-09-05",
    supplier_location: "Chennai, Tamil Nadu",
    category: "Automotive & Heavy Engineering",
    order_value_inr: 2850000,
    dispatch_port: "Chennai Port (Ennore)",
    riskLevel: "high",
    overall_score: 80.2,
    critical_findings_count: 3,
    executive_summary: "IMD Red Alert Active: Severe Cyclonic Storm 'Varun' affecting Chennai port corridor.",
    primary_recommendation: "Activate emergency inland rail rerouting via Bangalore ICD.",
  },
  {
    id: "MSME-ORD-102",
    supplier_name: "Vibrant Synthetic Silk Mills",
    item: "Polyester Filament Yarn & Mercerized Viscose Fabric (10,000 m)",
    expected_delivery_date: "2026-09-12",
    supplier_location: "Surat, Gujarat",
    category: "Technical Textiles",
    order_value_inr: 1420000,
    dispatch_port: "Hazira Port / JNPT",
    riskLevel: "high",
    overall_score: 82.5,
    critical_findings_count: 2,
    executive_summary: "JNPT Nhava Sheva Drayage Flash Strike & CBIC GST 18% MMF rationalization.",
    primary_recommendation: "Divert container bookings to Hazira or Mundra Port via rail rakes.",
  },
  {
    id: "MSME-ORD-103",
    supplier_name: "Guru Nanak Auto Components Ltd",
    item: "Hardened Hexagonal Bolts, Fasteners & Threaded Studs (M12-M24)",
    expected_delivery_date: "2026-09-02",
    supplier_location: "Ludhiana, Punjab",
    category: "Industrial Fasteners & Hardware",
    order_value_inr: 680000,
    dispatch_port: "ICD Dhandari Kalan (Dry Port)",
    riskLevel: "medium",
    overall_score: 45.5,
    critical_findings_count: 1,
    executive_summary: "DGFT Mandatory BIS Quality Control Order certification check required.",
    primary_recommendation: "Verify manufacturer's active BIS license number on Bill of Lading.",
  },
  {
    id: "MSME-ORD-104",
    supplier_name: "Sahyadri Hydraulics & Fluid Power",
    item: "Dual-Acting Hydraulic Cylinders & Pneumatic Control Valves",
    expected_delivery_date: "2026-09-08",
    supplier_location: "Pune, Maharashtra",
    category: "Fluid Power & Construction Equipment",
    order_value_inr: 3400000,
    dispatch_port: "JNPT / Nhava Sheva",
    riskLevel: "high",
    overall_score: 79.6,
    critical_findings_count: 2,
    executive_summary: "JNPT / Nhava Sheva Drayage Flash Strike halting container truck dispatch.",
    primary_recommendation: "Divert high-priority export container bookings to Hazira or Mundra Port.",
  },
  {
    id: "MSME-ORD-105",
    supplier_name: "Kongu Electro-Motors & Pumps",
    item: "Three-Phase Submersible Induction Motor Stators (5 HP, IE3)",
    expected_delivery_date: "2026-09-18",
    supplier_location: "Coimbatore, Tamil Nadu",
    category: "Electrical Machinery & Agro-Pumps",
    order_value_inr: 920000,
    dispatch_port: "Tuticorin (V.O. Chidambaranar Port)",
    riskLevel: "low",
    overall_score: 10.0,
    critical_findings_count: 0,
    executive_summary: "Optimal operational conditions across all 4 risk vectors with zero disruption.",
    primary_recommendation: "Maintain standard automated procurement and dispatch pipeline.",
  },
  {
    id: "MSME-ORD-106",
    supplier_name: "Saurashtra Casting & Dies LLP",
    item: "Spheroidal Graphite (SG) Iron Precision Pump Housings",
    expected_delivery_date: "2026-09-15",
    supplier_location: "Rajkot, Gujarat",
    category: "Foundry & Capital Goods",
    order_value_inr: 1750000,
    dispatch_port: "Kandla / Mundra Port",
    riskLevel: "medium",
    overall_score: 61.3,
    critical_findings_count: 1,
    executive_summary: "Saurashtra Foundry blast furnace relining causing 4-7 day pig iron delay.",
    primary_recommendation: "Adjust assembly schedule by +5 days and verify safety stock buffers.",
  }
];

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function Dashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<FactualMSMEOrder[]>(fallbackOrders);
  const [loading, setLoading] = useState(false);
  const [backendHealth, setBackendHealth] = useState<HealthData | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [filterRisk, setFilterRisk] = useState<"all" | "high" | "medium" | "low">("all");

  // Live Risk Feed state
  const [isLiveMonitoring, setIsLiveMonitoring] = useState(false);
  const [feedEvents, setFeedEvents] = useState<ActivityFeedItem[]>([
    {
      id: "INIT-EVT-00",
      title: "ChromaDB Supply Chain Vector Mesh Initialized",
      category: "Telemetry Initialization",
      severity: "low",
      affected_locations: ["Chennai", "Surat", "Ludhiana", "Pune", "Rajkot"],
      affected_sectors: ["Cross-Sector MSME Procurement"],
      content_snippet: "Baseline orchestrator synchronization complete across 4 risk intelligence domains.",
      target_orders: [],
      toast_message: "System baseline active. Vector telemetry online.",
      time_str: "18:00:00",
      timestamp: "2026-08-24T18:00:00Z",
    }
  ]);
  const [activeToast, setActiveToast] = useState<ToastNotification | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Chat Q&A state
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "initial",
      sender: "assistant",
      text: "Welcome to SentinelChain Grounded Intelligence. Ask any question regarding active port strikes, cyclone advisories, GST tariff updates, or sub-tier manufacturing delays in the vector database.",
      timestamp: "18:00",
    }
  ]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders?include_live_risk=true`);
      if (res.ok) {
        const data = await res.json();
        if (data.orders && data.orders.length > 0) {
          setOrders(data.orders);
        }
      }
    } catch {
      // Use existing state/fallback
    } finally {
      setLoading(false);
    }
  }, []);

  const checkHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      if (res.ok) {
        const data = await res.json();
        setBackendHealth(data);
      }
    } catch {
      setBackendHealth(null);
    } finally {
      setHealthLoading(false);
    }
  }, []);

  // Poll single live risk event
  const pollNextRiskEvent = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/feed/next-event`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        const newEvent: ActivityFeedItem = data.event;

        // 1. Update activity feed history (newest on top)
        setFeedEvents((prev) => [newEvent, ...prev.slice(0, 24)]);

        // 2. Update orders with live evaluated risk
        if (data.all_orders && data.all_orders.length > 0) {
          setOrders(data.all_orders);
        }

        // 3. Trigger visual toast notification
        const toastItem: ToastNotification = {
          id: String(Date.now()),
          message: data.toast_message || newEvent.title,
          severity: newEvent.severity,
          target_orders: data.impacted_order_ids || [],
          timestamp: newEvent.time_str,
        };
        setActiveToast(toastItem);

        // Auto-dismiss toast after 6 seconds
        setTimeout(() => {
          setActiveToast((curr) => (curr?.id === toastItem.id ? null : curr));
        }, 6000);
      }
    } catch {
      // Graceful poll skip
    }
  }, []);

  // Manage Live Polling Toggle (8-10 seconds interval)
  useEffect(() => {
    if (isLiveMonitoring) {
      pollNextRiskEvent();
      pollingRef.current = setInterval(() => {
        pollNextRiskEvent();
      }, 8500);
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [isLiveMonitoring, pollNextRiskEvent]);

  const handleAskQuestion = async (queryText?: string) => {
    const questionToAsk = queryText || chatInput;
    if (!questionToAsk || !questionToAsk.trim() || chatLoading) return;

    const currentTimeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: "user",
      text: questionToAsk.trim(),
      timestamp: currentTimeStr,
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: questionToAsk.trim(), n_results: 3 }),
      });

      if (res.ok) {
        const data = await res.json();
        const botMsg: ChatMessage = {
          id: String(Date.now() + 1),
          sender: "assistant",
          text: data.answer || "No response received.",
          sources: data.sources || [],
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setChatMessages((prev) => [...prev, botMsg]);
      } else {
        throw new Error("Ask API failed");
      }
    } catch {
      const errorMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: "assistant",
        text: "Based on current vector database intelligence, no active disruption notices were found or backend service is temporarily offline.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
    fetchOrders();
  }, [checkHealth, fetchOrders]);

  // Standard Risk Color Coding per Rule 2.2:
  // Red: red-500, Amber: amber-500, Green: green-500
  const getRiskBadge = (level?: "low" | "medium" | "high") => {
    if (level === "high") {
      return (
        <Badge className="bg-red-500/15 text-red-500 border border-red-500/30 text-xs px-2.5 py-0.5 font-medium flex items-center">
          <AlertCircle className="w-3.5 h-3.5 mr-1 text-red-500" />
          High Risk
        </Badge>
      );
    }
    if (level === "medium") {
      return (
        <Badge className="bg-amber-500/15 text-amber-500 border border-amber-500/30 text-xs px-2.5 py-0.5 font-medium flex items-center">
          <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-500" />
          Medium Risk
        </Badge>
      );
    }
    return (
      <Badge className="bg-green-500/15 text-green-500 border border-green-500/30 text-xs px-2.5 py-0.5 font-medium flex items-center">
        <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-green-500" />
        Low Risk
      </Badge>
    );
  };

  const filteredOrders = orders.filter((order) => {
    if (filterRisk === "all") return true;
    return order.riskLevel === filterRisk;
  });

  const highRiskCount = orders.filter((o) => o.riskLevel === "high").length;
  const medRiskCount = orders.filter((o) => o.riskLevel === "medium").length;
  const lowRiskCount = orders.filter((o) => o.riskLevel === "low").length;

  return (
    <div className="flex min-h-screen bg-neutral-950 text-neutral-100 font-sans antialiased relative">
      {/* Floating Live Real-Time Toast Notification */}
      {activeToast && (
        <div className="fixed top-4 right-4 z-50 max-w-md animate-in slide-in-from-top duration-300">
          <div
            className={`p-3.5 rounded-lg border shadow-2xl backdrop-blur-md flex items-start gap-3 ${
              activeToast.severity === "high"
                ? "bg-red-950/90 border-red-500/50 text-red-100"
                : activeToast.severity === "medium"
                ? "bg-amber-950/90 border-amber-500/50 text-amber-100"
                : "bg-green-950/90 border-green-500/50 text-green-100"
            }`}
          >
            <div className="p-1 rounded bg-black/40 mt-0.5">
              <Bell className={`w-4 h-4 ${activeToast.severity === "high" ? "text-red-400 animate-bounce" : activeToast.severity === "medium" ? "text-amber-400" : "text-green-400"}`} />
            </div>
            <div className="flex-1 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold uppercase tracking-wider text-[10px]" suppressHydrationWarning>
                  Live Threat Ingestion • {activeToast.timestamp}
                </span>
                <button
                  onClick={() => setActiveToast(null)}
                  className="text-neutral-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="font-medium text-xs leading-snug">{activeToast.message}</p>
              {activeToast.target_orders.length > 0 && (
                <div className="flex items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] text-neutral-300">Impacted:</span>
                  {activeToast.target_orders.map((ordId) => (
                    <Badge
                      key={ordId}
                      className="bg-black/60 border border-white/20 text-white font-mono text-[9px] px-1.5 py-0"
                    >
                      {ordId}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dense Enterprise Operations Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-neutral-800 bg-neutral-900/90 flex flex-col justify-between hidden md:flex">
        <div className="p-4 space-y-6">
          {/* Brand Header */}
          <div className="flex items-center gap-2.5 px-2 py-1">
            <div className="p-1.5 bg-neutral-800 border border-neutral-700 rounded text-red-500">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight text-neutral-100 uppercase">SentinelChain</div>
              <div className="text-[11px] font-mono text-neutral-400">OPERATIONS COCKPIT</div>
            </div>
          </div>

          {/* Live Monitoring Feed Control Panel in Sidebar */}
          <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 space-y-2.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <Radio className={`w-3.5 h-3.5 ${isLiveMonitoring ? "text-green-500 animate-pulse" : "text-neutral-500"}`} />
                Live Risk Feed
              </span>
              <Badge
                variant="outline"
                className={`text-[9px] px-1.5 py-0 font-mono ${
                  isLiveMonitoring ? "border-green-700 text-green-500 bg-green-950/40" : "border-neutral-700 text-neutral-500"
                }`}
              >
                {isLiveMonitoring ? "POLLING 8s" : "STANDBY"}
              </Badge>
            </div>

            <Button
              size="sm"
              onClick={() => setIsLiveMonitoring(!isLiveMonitoring)}
              className={`w-full h-8 text-xs font-semibold flex items-center justify-center gap-1.5 ${
                isLiveMonitoring
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-green-600 hover:bg-green-700 text-white"
              }`}
            >
              {isLiveMonitoring ? (
                <>
                  <Pause className="w-3.5 h-3.5" /> Stop Live Monitoring
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" /> Start Live Monitoring
                </>
              )}
            </Button>

            <button
              onClick={() => pollNextRiskEvent()}
              className="w-full text-center text-[10px] text-neutral-400 hover:text-neutral-200 transition-colors py-0.5"
            >
              + Trigger Next Scenario
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 text-xs">
            <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-neutral-500 uppercase">
              Operations Control
            </div>
            <Link
              href="/"
              className="w-full flex items-center justify-between px-3 py-2 rounded font-medium bg-neutral-800 text-neutral-100 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Box className="w-4 h-4 text-red-500" />
                Live MSME Orders
              </span>
              <Badge className="bg-neutral-800 border border-neutral-700 text-neutral-300 text-[10px] px-1.5 py-0 h-4">
                {orders.length}
              </Badge>
            </Link>

            <button
              onClick={() => fetchOrders()}
              className="w-full flex items-center justify-between px-3 py-2 rounded text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-200 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" />
                ChromaDB Vector Store
              </span>
              <Badge className="bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] px-1.5 py-0 h-4">5 Docs</Badge>
            </button>

            <button className="w-full flex items-center gap-2 px-3 py-2 rounded text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-200 transition-colors">
              <Sparkles className="w-4 h-4 text-amber-500" />
              POST /api/ask Q&A
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-200 transition-colors">
              <Sliders className="w-4 h-4" />
              Scoring Matrix
            </button>
          </nav>

          {/* Connected Agent Pipeline Status */}
          <div className="pt-4 border-t border-neutral-800/80 space-y-2 text-xs">
            <div className="px-2 text-[10px] font-semibold tracking-wider text-neutral-500 uppercase">
              Orchestrated Risk Agents (4)
            </div>
            <div className="space-y-1.5 px-2">
              <div className="flex items-center justify-between text-neutral-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  supplier_agent.py
                </span>
                <span className="font-mono text-[10px] text-neutral-500">check_risk()</span>
              </div>
              <div className="flex items-center justify-between text-neutral-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  weather_agent.py
                </span>
                <span className="font-mono text-[10px] text-neutral-500">check_risk()</span>
              </div>
              <div className="flex items-center justify-between text-neutral-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  policy_agent.py
                </span>
                <span className="font-mono text-[10px] text-neutral-500">check_risk()</span>
              </div>
              <div className="flex items-center justify-between text-neutral-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  logistics_agent.py
                </span>
                <span className="font-mono text-[10px] text-neutral-500">check_risk()</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Footer: System Venv & Gemini Status */}
        <div className="p-3 border-t border-neutral-800 bg-neutral-950/80 text-[11px] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-neutral-400 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-neutral-400" />
              FastAPI Gateway
            </span>
            {backendHealth ? (
              <span className="text-green-500 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> ONLINE
              </span>
            ) : (
              <span className="text-red-500 font-mono">OFFLINE</span>
            )}
          </div>
          <div className="flex items-center justify-between text-[10px] text-neutral-400">
            <span>Continuous Watch:</span>
            <span className={`font-mono font-semibold ${isLiveMonitoring ? "text-green-500" : "text-neutral-500"}`}>
              {isLiveMonitoring ? "Active (8s)" : "Paused"}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Area (Optimized for Laptop Viewport & High Density) */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="h-14 border-b border-neutral-800 bg-neutral-900/60 px-4 md:px-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <span>Operations</span>
              <span>/</span>
              <span className="text-neutral-100 font-medium">B2B Continuous Risk Intelligence & Live Feed</span>
            </div>
            <Badge variant="outline" className="hidden lg:inline-flex text-[10px] border-neutral-700 text-neutral-400">
              Color Rules: <span className="text-red-500 mx-1 font-bold">Red (High)</span> | <span className="text-amber-500 mx-1 font-bold">Amber (Med)</span> | <span className="text-green-500 mx-1 font-bold">Green (Low)</span>
            </Badge>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Live Monitoring Toggle in Topbar */}
            <Button
              variant={isLiveMonitoring ? "default" : "outline"}
              size="sm"
              onClick={() => setIsLiveMonitoring(!isLiveMonitoring)}
              className={`h-8 text-xs font-semibold flex items-center gap-1.5 ${
                isLiveMonitoring
                  ? "bg-green-600 hover:bg-green-700 text-white border-green-500"
                  : "border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800"
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${isLiveMonitoring ? "animate-pulse text-white" : "text-neutral-400"}`} />
              {isLiveMonitoring ? "Live Monitoring (Active)" : "Start Live Monitoring"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                checkHealth();
                fetchOrders();
              }}
              disabled={loading || healthLoading}
              className="h-8 text-xs border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Sync Orders
            </Button>

            <Dialog>
              <DialogTrigger render={<Button size="sm" className="h-8 text-xs bg-neutral-100 text-neutral-900 hover:bg-neutral-200">System Architecture</Button>} />
              <DialogContent className="bg-neutral-900 border-neutral-800 text-neutral-100">
                <DialogHeader>
                  <DialogTitle className="text-base font-bold">SentinelChain Continuous Watch System</DialogTitle>
                  <DialogDescription className="text-neutral-400 text-xs">
                    Autonomous multi-agent risk synthesis engine with live streaming telemetry.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-2 text-xs border-y border-neutral-800 text-neutral-300">
                  <div className="p-2.5 bg-neutral-950 rounded border border-neutral-800 space-y-1">
                    <strong className="text-neutral-100 block">Live Disruption Ingestion</strong>
                    <p className="text-neutral-400">Pulls realistic disruption scenarios (cyclones, tariffs, port strikes, manufacturing outages) every 8-10 seconds.</p>
                  </div>
                  <div className="p-2.5 bg-neutral-950 rounded border border-neutral-800 space-y-1">
                    <strong className="text-neutral-100 block">Dynamic Orchestrator Re-evaluation</strong>
                    <p className="text-neutral-400">Matching orders are re-scored live and their badges adapt in real time across the dashboard.</p>
                  </div>
                  <div className="p-2.5 bg-neutral-950 rounded border border-neutral-800 space-y-1">
                    <strong className="text-neutral-100 block">Standardized Color System</strong>
                    <p className="text-neutral-400">High Risk: red-500, Medium Risk: amber-500, Low Risk: green-500.</p>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose render={<Button variant="outline" size="sm" className="border-neutral-700 text-neutral-300">Close</Button>} />
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        {/* Dashboard Body Content */}
        <div className="p-4 md:p-6 space-y-6">
          {/* Top KPI Telemetry Grid (Tremor) */}
          <Grid numItemsSm={2} numItemsLg={4} className="gap-4">
            <TremorCard decoration="top" decorationColor="red" className="bg-neutral-900 border-neutral-800 text-neutral-100 ring-0 p-4">
              <Flex justifyContent="between" alignItems="center">
                <Text className="text-neutral-400 text-xs">High Risk Orders</Text>
                <BadgeDelta deltaType="increase" className="text-xs">Urgent Action</BadgeDelta>
              </Flex>
              <Metric className="text-red-500 text-2xl font-bold mt-1">{highRiskCount} Orders</Metric>
              <ProgressBar value={orders.length > 0 ? (highRiskCount / orders.length) * 100 : 0} color="red" className="mt-3" />
            </TremorCard>

            <TremorCard decoration="top" decorationColor="amber" className="bg-neutral-900 border-neutral-800 text-neutral-100 ring-0 p-4">
              <Flex justifyContent="between" alignItems="center">
                <Text className="text-neutral-400 text-xs">Medium Risk Exposure</Text>
                <BadgeDelta deltaType="unchanged" className="text-xs">Monitored</BadgeDelta>
              </Flex>
              <Metric className="text-amber-500 text-2xl font-bold mt-1">{medRiskCount} Orders</Metric>
              <ProgressBar value={orders.length > 0 ? (medRiskCount / orders.length) * 100 : 0} color="amber" className="mt-3" />
            </TremorCard>

            <TremorCard decoration="top" decorationColor="emerald" className="bg-neutral-900 border-neutral-800 text-neutral-100 ring-0 p-4">
              <Flex justifyContent="between" alignItems="center">
                <Text className="text-neutral-400 text-xs">Low Risk / Optimal Flow</Text>
                <BadgeDelta deltaType="moderateIncrease" className="text-xs">Clear Flow</BadgeDelta>
              </Flex>
              <Metric className="text-green-500 text-2xl font-bold mt-1">{lowRiskCount} Orders</Metric>
              <ProgressBar value={orders.length > 0 ? (lowRiskCount / orders.length) * 100 : 0} color="emerald" className="mt-3" />
            </TremorCard>

            <TremorCard decoration="top" decorationColor="indigo" className="bg-neutral-900 border-neutral-800 text-neutral-100 ring-0 p-4">
              <Flex justifyContent="between" alignItems="center">
                <Text className="text-neutral-400 text-xs">Live Risk Feed Status</Text>
                <Activity className={`w-4 h-4 ${isLiveMonitoring ? "text-green-500 animate-pulse" : "text-neutral-500"}`} />
              </Flex>
              <Metric className="text-neutral-100 text-2xl font-bold mt-1">
                {isLiveMonitoring ? "Continuous" : "Standby"}
              </Metric>
              <Text className="text-neutral-400 text-xs mt-2">
                {feedEvents.length} Events Detected in Session
              </Text>
            </TremorCard>
          </Grid>

          {/* Grounded Risk Intelligence Assistant Chat Card (POST /api/ask) */}
          <Card className="bg-neutral-900 border-neutral-800 text-neutral-100">
            <CardHeader className="pb-3 border-b border-neutral-800/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded text-indigo-400">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      Grounded Risk Assistant
                      <Badge className="bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] px-1.5 py-0">
                        POST /api/ask
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-xs text-neutral-400">
                      Ask any question grounded strictly in retrieved ChromaDB disruption notices with traceable source citations
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Grounded in Vector DB Notices
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              {/* Chat Messages Stream */}
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 text-xs leading-relaxed ${
                      msg.sender === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.sender === "assistant" && (
                      <div className="w-7 h-7 rounded-full bg-indigo-950 border border-indigo-800 text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`p-3.5 rounded-lg max-w-2xl space-y-2.5 ${
                        msg.sender === "user"
                          ? "bg-neutral-800 text-neutral-100 border border-neutral-700"
                          : "bg-neutral-950 text-neutral-200 border border-neutral-800"
                      }`}
                    >
                      <div className="whitespace-pre-line text-xs font-normal leading-relaxed">
                        {msg.text}
                      </div>

                      {/* Cited Sources for Assistant Response */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="pt-2 border-t border-neutral-800/80 space-y-1.5">
                          <span className="text-[10px] uppercase font-bold text-neutral-400 flex items-center gap-1">
                            <LinkIcon className="w-3 h-3 text-indigo-400" />
                            Grounded In Cited Sources:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.sources.map((src, sIdx) => (
                              <Badge
                                key={sIdx}
                                variant="outline"
                                className="text-[10px] border-indigo-900/60 bg-indigo-950/30 text-indigo-300 flex items-center gap-1 font-mono"
                              >
                                <FileText className="w-2.5 h-2.5 text-indigo-400" />
                                {src.source_id}
                                {src.similarity ? ` (${(src.similarity * 100).toFixed(0)}% match)` : ""}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="text-[10px] text-neutral-500 text-right" suppressHydrationWarning>
                        {msg.timestamp}
                      </div>
                    </div>

                    {msg.sender === "user" && (
                      <div className="w-7 h-7 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-300 flex items-center justify-center shrink-0 mt-0.5">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))}

                {chatLoading && (
                  <div className="flex gap-3 text-xs justify-start">
                    <div className="w-7 h-7 rounded-full bg-indigo-950 border border-indigo-800 text-indigo-300 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 animate-pulse" />
                    </div>
                    <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-400 flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                      <span>Retrieving vector context & generating grounded answer...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Preset Query Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-neutral-500">Quick Questions:</span>
                {[
                  "Are there any port strikes in JNPT / Nhava Sheva?",
                  "What is the cyclone alert status in Chennai Port?",
                  "Explain GST changes on synthetic yarn in Surat",
                  "What BIS rules apply to fasteners from Ludhiana?",
                  "Are blast furnace outages affecting Rajkot foundries?"
                ].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handleAskQuestion(preset)}
                    disabled={chatLoading}
                    className="px-2 py-0.5 rounded bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 text-[10px] transition-colors disabled:opacity-50"
                  >
                    {preset}
                  </button>
                ))}
              </div>

              {/* Interactive Chat Input Form */}
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAskQuestion()}
                  placeholder="Ask any question regarding supply chain disruptions, port delays, or policy notices..."
                  disabled={chatLoading}
                  className="flex-1 h-9 px-3 text-xs bg-neutral-950 border border-neutral-800 rounded-md text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-indigo-500"
                />
                <Button
                  size="sm"
                  onClick={() => handleAskQuestion()}
                  disabled={chatLoading || !chatInput.trim()}
                  className="h-9 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  Ask Assistant
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Filter Bar & MSME Orders Section Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
            <div>
              <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
                <Box className="w-5 h-5 text-neutral-400" />
                Live MSME Purchase Orders Matrix
              </h2>
              <p className="text-xs text-neutral-400">
                Continuous risk re-evaluation dynamically updates card severity badges and scores
              </p>
            </div>

            {/* Risk Category Filter Buttons */}
            <div className="flex items-center gap-1.5 bg-neutral-900 p-1 rounded-lg border border-neutral-800">
              <Button
                size="sm"
                variant={filterRisk === "all" ? "default" : "ghost"}
                onClick={() => setFilterRisk("all")}
                className={`h-7 text-xs ${filterRisk === "all" ? "bg-neutral-800 text-neutral-100" : "text-neutral-400 hover:text-neutral-200"}`}
              >
                All ({orders.length})
              </Button>
              <Button
                size="sm"
                variant={filterRisk === "high" ? "default" : "ghost"}
                onClick={() => setFilterRisk("high")}
                className={`h-7 text-xs ${filterRisk === "high" ? "bg-red-500/20 text-red-500 border border-red-500/40" : "text-red-500 hover:text-red-400"}`}
              >
                High ({highRiskCount})
              </Button>
              <Button
                size="sm"
                variant={filterRisk === "medium" ? "default" : "ghost"}
                onClick={() => setFilterRisk("medium")}
                className={`h-7 text-xs ${filterRisk === "medium" ? "bg-amber-500/20 text-amber-500 border border-amber-500/40" : "text-amber-500 hover:text-amber-400"}`}
              >
                Medium ({medRiskCount})
              </Button>
              <Button
                size="sm"
                variant={filterRisk === "low" ? "default" : "ghost"}
                onClick={() => setFilterRisk("low")}
                className={`h-7 text-xs ${filterRisk === "low" ? "bg-green-500/20 text-green-500 border border-green-500/40" : "text-green-500 hover:text-green-400"}`}
              >
                Low ({lowRiskCount})
              </Button>
            </div>
          </div>

          {/* Loading State Skeleton Grid */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((sk) => (
                <div
                  key={sk}
                  className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 space-y-3 animate-pulse"
                >
                  <div className="flex justify-between items-center">
                    <div className="h-4 w-24 bg-neutral-800 rounded" />
                    <div className="h-4 w-16 bg-neutral-800 rounded" />
                  </div>
                  <div className="h-5 w-48 bg-neutral-800 rounded" />
                  <div className="h-3 w-32 bg-neutral-800 rounded" />
                  <div className="h-12 w-full bg-neutral-950 rounded" />
                  <div className="h-2 w-full bg-neutral-800 rounded" />
                </div>
              ))}
            </div>
          )}

          {/* Empty State when no orders match filter */}
          {!loading && filteredOrders.length === 0 && (
            <Card className="bg-neutral-900 border-neutral-800 text-neutral-100 p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-neutral-800 text-neutral-400 flex items-center justify-center mx-auto">
                <FilterX className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-base font-bold">No Orders Match Current Risk Filter</CardTitle>
                <CardDescription className="text-xs text-neutral-400">
                  There are currently zero orders classified under the &quot;{filterRisk.toUpperCase()}&quot; risk tier.
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setFilterRisk("all")}
                className="border-neutral-700 text-neutral-200 hover:bg-neutral-800 text-xs"
              >
                Reset to All Orders ({orders.length})
              </Button>
            </Card>
          )}

          {/* Responsive Cards Grid */}
          {!loading && filteredOrders.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredOrders.map((order) => {
                const riskColor = order.riskLevel === "high" ? "red" : order.riskLevel === "medium" ? "amber" : "emerald";
                const borderHighlight = order.riskLevel === "high"
                  ? "hover:border-red-500/60"
                  : order.riskLevel === "medium"
                  ? "hover:border-amber-500/60"
                  : "hover:border-green-500/60";

                return (
                  <Card
                    key={order.id}
                    onClick={() => router.push(`/orders/${order.id}`)}
                    className={`bg-neutral-900 border-neutral-800 text-neutral-100 flex flex-col justify-between cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-neutral-950/50 hover:-translate-y-0.5 ${borderHighlight} group relative`}
                  >
                    <CardHeader className="pb-3 space-y-2">
                      {/* Top Row: Order ID + Risk Badge */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-neutral-300 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800 group-hover:border-neutral-700">
                            {order.id}
                          </span>
                          <span className="text-[11px] text-neutral-500 truncate max-w-[120px]">
                            {order.category}
                          </span>
                        </div>
                        {getRiskBadge(order.riskLevel)}
                      </div>

                      {/* Supplier Name */}
                      <div>
                        <CardTitle className="text-sm font-bold text-neutral-100 group-hover:text-white transition-colors">
                          {order.supplier_name}
                        </CardTitle>
                        <CardDescription className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-neutral-500 shrink-0" />
                          {order.supplier_location}
                        </CardDescription>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3 py-0 text-xs">
                      {/* Ordered Item */}
                      <div className="p-2.5 rounded bg-neutral-950 border border-neutral-800/80 space-y-1">
                        <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">Procured Item</div>
                        <div className="text-neutral-200 font-medium line-clamp-2 leading-relaxed">
                          {order.item}
                        </div>
                      </div>

                      {/* Expected Date & Order Value Row */}
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2 rounded bg-neutral-950/60 border border-neutral-850">
                          <div className="text-neutral-500 text-[10px] flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-neutral-500" />
                            Expected Delivery
                          </div>
                          <div className="font-mono font-semibold text-neutral-200 mt-0.5">
                            {order.expected_delivery_date}
                          </div>
                        </div>

                        <div className="p-2 rounded bg-neutral-950/60 border border-neutral-850">
                          <div className="text-neutral-500 text-[10px] flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-neutral-500" />
                            Order Value
                          </div>
                          <div className="font-mono font-semibold text-neutral-200 mt-0.5">
                            INR {order.order_value_inr ? `${(order.order_value_inr / 100000).toFixed(1)}L` : "N/A"}
                          </div>
                        </div>
                      </div>

                      {/* Risk Severity Bar & Summary */}
                      {order.overall_score !== undefined && (
                        <div className="space-y-1 pt-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-neutral-400">Composite Risk Score</span>
                            <span className="font-mono font-bold text-neutral-200">{order.overall_score}/100</span>
                          </div>
                          <ProgressBar value={order.overall_score} color={riskColor} className="h-1.5" />
                        </div>
                      )}

                      {/* Summary Snippet */}
                      {order.executive_summary && (
                        <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed italic">
                          &ldquo;{order.executive_summary}&rdquo;
                        </p>
                      )}
                    </CardContent>

                    <CardFooter className="border-t border-neutral-800/80 p-3 mt-3 flex items-center justify-between text-xs text-neutral-400 bg-neutral-950/40">
                      <span className="text-[11px] text-neutral-500 group-hover:text-neutral-300 transition-colors">
                        View multi-agent breakdown
                      </span>
                      <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1 group-hover:text-white group-hover:translate-x-0.5 transition-all">
                        Details
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Live Scrolling Activity Feed at Bottom of Dashboard */}
          <Card className="bg-neutral-900 border-neutral-800 text-neutral-100">
            <CardHeader className="pb-3 border-b border-neutral-800/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-green-500" />
                  <CardTitle className="text-sm font-bold">
                    Live Disruption Activity Feed ({feedEvents.length} Events Detected)
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-mono ${
                      isLiveMonitoring ? "border-green-700 text-green-500 bg-green-950/40" : "border-neutral-700 text-neutral-500"
                    }`}
                  >
                    {isLiveMonitoring ? "● CONTINUOUS STREAMING" : "○ STREAMING PAUSED"}
                  </Badge>
                </div>
              </div>
              <CardDescription className="text-xs text-neutral-400">
                Timestamped telemetry log of vector-matched weather alerts, tariff notices, port strikes, and supplier delays
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4">
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {feedEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3 rounded-lg bg-neutral-950 border border-neutral-800/80 hover:border-neutral-700 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] text-neutral-500 font-semibold" suppressHydrationWarning>
                          [{evt.time_str}]
                        </span>
                        <span className="font-bold text-neutral-200">
                          {evt.title}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] border-neutral-700 text-neutral-400 bg-neutral-900 py-0"
                        >
                          {evt.category}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-neutral-400 leading-relaxed">
                        {evt.content_snippet}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
                      {evt.target_orders && evt.target_orders.length > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-neutral-500">Target:</span>
                          {evt.target_orders.map((tId) => (
                            <Badge
                              key={tId}
                              className="bg-neutral-800 border border-neutral-700 text-neutral-200 font-mono text-[10px] px-1.5 py-0"
                            >
                              {tId}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {getRiskBadge(evt.severity)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
