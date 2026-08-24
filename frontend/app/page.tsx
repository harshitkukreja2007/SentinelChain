"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card as TremorCard,
  Metric,
  Text,
  AreaChart,
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
  Truck,
  CloudLightning,
  Scale,
  Building2,
  ChevronRight,
  Database,
  Search,
  FileText,
  MapPin,
  Calendar,
  Sparkles,
  Link as LinkIcon,
  Layers,
} from "lucide-react";

interface HealthData {
  status: string;
  timestamp: string;
  version: string;
  service: string;
  vector_db_documents?: number;
  gemini_configured?: boolean;
}

interface AgentFinding {
  agent: string;
  type: string;
  summary: string;
  confidence: number;
  risk_level: "low" | "medium" | "high";
  score: number;
  matched_doc_id?: string | null;
  factors?: string[];
  recommendation?: string;
  metadata?: Record<string, unknown>;
}

interface DynamicOrderAssessment {
  order_id: string;
  supplier_name: string;
  supplier_location: string;
  item: string;
  category?: string;
  riskLevel: "low" | "medium" | "high";
  overall_risk_level: "low" | "medium" | "high";
  risk_status: string;
  overall_score: number;
  findings_count: number;
  critical_findings_count: number;
  findings: AgentFinding[];
  executive_summary: string;
  primary_recommendation: string;
  evaluated_at: string;
}

interface SourceItem {
  source_id: string;
  title: string;
  type: string;
  category?: string;
  similarity?: number;
  confidence?: number;
  matched_doc?: string;
}

interface AnalyzeApiResponse {
  risk_level: "low" | "medium" | "high";
  explanation: string;
  sources: SourceItem[];
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
  overall_score?: number;
  executive_summary?: string;
  primary_recommendation?: string;
}

interface VectorDocumentMatch {
  doc_id: string;
  title: string;
  category: string;
  severity: "low" | "medium" | "high";
  date: string;
  affected_locations: string[];
  affected_sectors: string[];
  content_snippet: string;
  similarity_score: number;
  distance: number;
}

const factualFallbackOrders: FactualMSMEOrder[] = [
  {
    id: "MSME-ORD-101",
    supplier_name: "Kaveri Precision Forgings Pvt Ltd",
    item: "CNC Machined High-Tensile Crankshafts (Grade 42CrMo4)",
    expected_delivery_date: "2026-09-05",
    supplier_location: "Chennai, Tamil Nadu",
    category: "Automotive & Heavy Engineering",
    order_value_inr: 2850000,
    dispatch_port: "Chennai Port (Ennore)",
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
  }
];

const telemetryData = [
  { time: "06:00", HighRisk: 2, MedRisk: 2, LowRisk: 2 },
  { time: "09:00", HighRisk: 2, MedRisk: 3, LowRisk: 3 },
  { time: "12:00", HighRisk: 3, MedRisk: 2, LowRisk: 4 },
  { time: "15:00", HighRisk: 2, MedRisk: 2, LowRisk: 4 },
  { time: "18:00", HighRisk: 2, MedRisk: 3, LowRisk: 3 },
  { time: "21:00", HighRisk: 2, MedRisk: 2, LowRisk: 2 },
];

export default function Dashboard() {
  const [orders, setOrders] = useState<FactualMSMEOrder[]>(factualFallbackOrders);
  const [selectedOrder, setSelectedOrder] = useState<FactualMSMEOrder>(factualFallbackOrders[0]);
  const [liveAssessment, setLiveAssessment] = useState<DynamicOrderAssessment | null>(null);
  const [geminiAnalysis, setGeminiAnalysis] = useState<AnalyzeApiResponse | null>(null);
  const [analyzingWithGemini, setAnalyzingWithGemini] = useState(false);
  const [backendHealth, setBackendHealth] = useState<HealthData | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState("orders-tab");
  
  // Vector search input state
  const [searchQuery, setSearchQuery] = useState("Bay of Bengal Cyclone Chennai Port disruption");
  const [searchResults, setSearchResults] = useState<VectorDocumentMatch[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/orders?include_live_risk=true");
      if (res.ok) {
        const data = await res.json();
        if (data.orders && data.orders.length > 0) {
          setOrders(data.orders);
        }
      }
    } catch {
      // Fallback
    }
  }, []);

  const checkHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/health");
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

  const triggerGeminiAnalysis = useCallback(async (orderId: string) => {
    setAnalyzingWithGemini(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId }),
      });
      if (res.ok) {
        const data: AnalyzeApiResponse = await res.json();
        setGeminiAnalysis(data);
      }
    } catch {
      // Fallback
    } finally {
      setAnalyzingWithGemini(false);
    }
  }, []);

  const runLiveOrchestration = useCallback(async (order: FactualMSMEOrder) => {
    try {
      // 1. Trigger live multi-agent orchestrator evaluation
      const res = await fetch("http://127.0.0.1:8000/api/risk/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      });

      if (res.ok) {
        const data: DynamicOrderAssessment = await res.json();
        setLiveAssessment(data);
      }

      // 2. Trigger Gemini synthesis
      triggerGeminiAnalysis(order.id);
    } catch {
      // Fallback
    }
  }, [triggerGeminiAnalysis]);

  const handleVectorSearch = useCallback(async (queryText: string) => {
    setSearchLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/documents/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: queryText, n_results: 3 }),
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results || []);
      }
    } catch {
      // Fallback
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    fetchOrders();
    runLiveOrchestration(selectedOrder);
    handleVectorSearch(searchQuery);
  }, [checkHealth, fetchOrders, handleVectorSearch, runLiveOrchestration, searchQuery, selectedOrder]);

  const handleSelectOrder = (order: FactualMSMEOrder) => {
    setSelectedOrder(order);
  };

  const getRiskBadge = (level?: "low" | "medium" | "high") => {
    if (level === "high") {
      return (
        <Badge className="bg-red-500/15 text-red-500 border border-red-500/30">
          <AlertCircle className="w-3 h-3 mr-1" />
          High Risk
        </Badge>
      );
    }
    if (level === "medium") {
      return (
        <Badge className="bg-amber-500/15 text-amber-500 border border-amber-500/30">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Medium Risk
        </Badge>
      );
    }
    return (
      <Badge className="bg-green-500/15 text-green-500 border border-green-500/30">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        No Active Risk
      </Badge>
    );
  };

  const getAgentIcon = (name: string) => {
    if (name.includes("supplier")) return <Building2 className="w-4 h-4 text-neutral-300" />;
    if (name.includes("weather")) return <CloudLightning className="w-4 h-4 text-neutral-300" />;
    if (name.includes("policy")) return <Scale className="w-4 h-4 text-neutral-300" />;
    return <Truck className="w-4 h-4 text-neutral-300" />;
  };

  const currentRiskLevel = liveAssessment?.riskLevel || "low";

  return (
    <div className="flex min-h-screen bg-neutral-950 text-neutral-100 font-sans antialiased">
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
              <div className="text-[11px] font-mono text-neutral-400">GEMINI + CHROMA OPS</div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 text-xs">
            <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-neutral-500 uppercase">
              Operations Control
            </div>
            <button
              onClick={() => setActiveMainTab("orders-tab")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded font-medium transition-colors ${
                activeMainTab === "orders-tab" ? "bg-neutral-800 text-neutral-100" : "text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-200"
              }`}
            >
              <span className="flex items-center gap-2">
                <Box className="w-4 h-4 text-red-500" />
                Live MSME Orders (6)
              </span>
              <Badge className="bg-neutral-800 border border-neutral-700 text-neutral-300 text-[10px] px-1.5 py-0 h-4">Factual</Badge>
            </button>

            <button
              onClick={() => setActiveMainTab("chroma-tab")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded font-medium transition-colors ${
                activeMainTab === "chroma-tab" ? "bg-neutral-800 text-neutral-100" : "text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-200"
              }`}
            >
              <span className="flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" />
                ChromaDB Vector Store
              </span>
              <Badge className="bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] px-1.5 py-0 h-4">5 Docs</Badge>
            </button>

            <button className="w-full flex items-center gap-2 px-3 py-2 rounded text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-200 transition-colors">
              <Sparkles className="w-4 h-4 text-amber-400" />
              POST /api/analyze
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-200 transition-colors">
              <Sliders className="w-4 h-4" />
              Dynamic Scoring Matrix
            </button>
          </nav>

          {/* Connected Agent Pipeline Status */}
          <div className="pt-4 border-t border-neutral-800/80 space-y-2 text-xs">
            <div className="px-2 text-[10px] font-semibold tracking-wider text-neutral-500 uppercase">
              Orchestrated Agents (4)
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
            <span>Gemini API Key:</span>
            {backendHealth?.gemini_configured ? (
              <span className="font-mono text-emerald-400 font-semibold">Active (.env)</span>
            ) : (
              <span className="font-mono text-amber-400">Ready for key (.env)</span>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Control Bar */}
        <header className="h-14 border-b border-neutral-800 bg-neutral-900/60 px-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <span>Operations</span>
              <span>/</span>
              <span className="text-neutral-100 font-medium">MSME Risk & Gemini Reasoning Engine</span>
            </div>
            <Badge variant="outline" className="hidden sm:inline-flex text-[10px] border-neutral-700 text-neutral-400">
              Computed: <span className="text-red-500 mx-1 font-bold">Red (High)</span> | <span className="text-amber-500 mx-1 font-bold">Amber (Med)</span> | <span className="text-green-500 mx-1 font-bold">Green (Low / Safe)</span>
            </Badge>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={checkHealth}
              disabled={healthLoading}
              className="h-8 text-xs border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${healthLoading ? "animate-spin" : ""}`} />
              Poll Backend
            </Button>
            <Dialog>
              <DialogTrigger render={<Button size="sm" className="h-8 text-xs bg-neutral-100 text-neutral-900 hover:bg-neutral-200">Rule & API Inspector</Button>} />
              <DialogContent className="bg-neutral-900 border-neutral-800 text-neutral-100">
                <DialogHeader>
                  <DialogTitle className="text-base font-bold">POST /api/analyze Integration</DialogTitle>
                  <DialogDescription className="text-neutral-400 text-xs">
                    Synthesizes multi-agent telemetry and vector documents with Google Gemini.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-2 text-xs border-y border-neutral-800 text-neutral-300">
                  <div className="p-2.5 bg-neutral-950 rounded border border-neutral-800 space-y-1">
                    <strong className="text-neutral-100 block">POST /api/analyze Contract</strong>
                    <p className="text-neutral-400">Takes <code className="text-neutral-200">{`{ "order_id": "MSME-ORD-101" }`}</code> and returns <code className="text-neutral-200">{`{ risk_level, explanation, sources }`}</code>.</p>
                  </div>
                  <div className="p-2.5 bg-neutral-950 rounded border border-neutral-800 space-y-1">
                    <strong className="text-neutral-100 block">Gemini API Key Location</strong>
                    <p className="text-neutral-400">Configure your key in <code className="text-neutral-200 bg-neutral-900 px-1 py-0.5 rounded">backend/.env</code> as <code className="text-neutral-200">GEMINI_API_KEY=...</code>.</p>
                  </div>
                  <div className="p-2.5 bg-neutral-950 rounded border border-neutral-800 space-y-1">
                    <strong className="text-neutral-100 block">Explicit Source Citations</strong>
                    <p className="text-neutral-400">Cites vector documents like <code className="text-neutral-300">[DOC-WX-2026-08]</code> and agent findings.</p>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose render={<Button variant="outline" size="sm" className="border-neutral-700 text-neutral-300">Close</Button>} />
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        {/* Dashboard Body */}
        <div className="p-6 space-y-6">
          {/* Top KPI Metrics Row (Tremor) */}
          <Grid numItemsSm={2} numItemsLg={4} className="gap-4">
            <TremorCard decoration="top" decorationColor="red" className="bg-neutral-900 border-neutral-800 text-neutral-100 ring-0 p-4">
              <Flex justifyContent="between" alignItems="center">
                <Text className="text-neutral-400 text-xs">Active High-Threat Corridors</Text>
                <BadgeDelta deltaType="increase" className="text-xs">Live Vector Match</BadgeDelta>
              </Flex>
              <Metric className="text-red-500 text-2xl font-bold mt-1">2 Orders</Metric>
              <ProgressBar value={33} color="red" className="mt-3" />
            </TremorCard>

            <TremorCard decoration="top" decorationColor="amber" className="bg-neutral-900 border-neutral-800 text-neutral-100 ring-0 p-4">
              <Flex justifyContent="between" alignItems="center">
                <Text className="text-neutral-400 text-xs">Elevated Regulatory / Capacity</Text>
                <BadgeDelta deltaType="unchanged" className="text-xs">Monitored</BadgeDelta>
              </Flex>
              <Metric className="text-amber-500 text-2xl font-bold mt-1">2 Orders</Metric>
              <ProgressBar value={33} color="amber" className="mt-3" />
            </TremorCard>

            <TremorCard decoration="top" decorationColor="emerald" className="bg-neutral-900 border-neutral-800 text-neutral-100 ring-0 p-4">
              <Flex justifyContent="between" alignItems="center">
                <Text className="text-neutral-400 text-xs">Safe / No Active Risk Detected</Text>
                <BadgeDelta deltaType="moderateIncrease" className="text-xs">Optimal Flow</BadgeDelta>
              </Flex>
              <Metric className="text-green-500 text-2xl font-bold mt-1">2 Orders</Metric>
              <ProgressBar value={34} color="emerald" className="mt-3" />
            </TremorCard>

            <TremorCard decoration="top" decorationColor="indigo" className="bg-neutral-900 border-neutral-800 text-neutral-100 ring-0 p-4">
              <Flex justifyContent="between" alignItems="center">
                <Text className="text-neutral-400 text-xs">Gemini Reasoning Engine</Text>
                <BadgeDelta deltaType="moderateIncrease" className="text-xs">Active</BadgeDelta>
              </Flex>
              <Metric className="text-neutral-100 text-2xl font-bold mt-1">POST /api/analyze</Metric>
              <ProgressBar value={100} color="indigo" className="mt-3" />
            </TremorCard>
          </Grid>

          {/* Tabs Container */}
          <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="w-full">
            <TabsList className="bg-neutral-900 border border-neutral-800">
              <TabsTrigger value="orders-tab" className="text-xs">Factual MSME Orders & Live Risk</TabsTrigger>
              <TabsTrigger value="chroma-tab" className="text-xs">ChromaDB Vector Store Explorer</TabsTrigger>
            </TabsList>

            {/* Tab 1: Orders View */}
            <TabsContent value="orders-tab" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Factual MSME Purchase Orders Table */}
                <div className="lg:col-span-6 space-y-4">
                  <Card className="bg-neutral-900 border-neutral-800 text-neutral-100">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                      <div>
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <Box className="w-4 h-4 text-neutral-400" />
                          Factual MSME Purchase Orders Queue
                        </CardTitle>
                        <CardDescription className="text-xs text-neutral-400 mt-0.5">
                          Risk levels computed live by the multi-agent orchestrator against ChromaDB events
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="text-[10px] border-neutral-700 text-neutral-300">
                        {orders.length} Orders
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader className="bg-neutral-950/60">
                          <TableRow className="border-neutral-800 hover:bg-transparent">
                            <TableHead className="text-neutral-400 text-xs">Order ID / Supplier</TableHead>
                            <TableHead className="text-neutral-400 text-xs">City & Item</TableHead>
                            <TableHead className="text-neutral-400 text-xs">Delivery Date</TableHead>
                            <TableHead className="text-neutral-400 text-xs text-right">Computed Risk</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orders.map((order) => {
                            const isSelected = selectedOrder.id === order.id;
                            const displayedRisk = isSelected && liveAssessment ? liveAssessment.riskLevel : order.riskLevel;
                            return (
                              <TableRow
                                key={order.id}
                                onClick={() => handleSelectOrder(order)}
                                className={`border-neutral-800 cursor-pointer transition-colors ${
                                  isSelected ? "bg-neutral-800/80 border-l-2 border-l-neutral-200" : "hover:bg-neutral-800/40"
                                }`}
                              >
                                <TableCell className="py-2.5">
                                  <div className="font-mono text-xs font-semibold text-neutral-100 flex items-center gap-1.5">
                                    {order.id}
                                    {isSelected && <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />}
                                  </div>
                                  <div className="text-[11px] text-neutral-400 truncate max-w-[150px]">{order.supplier_name}</div>
                                </TableCell>
                                <TableCell className="py-2.5 text-xs text-neutral-300">
                                  <div className="flex items-center gap-1 text-[11px] font-semibold text-neutral-200">
                                    <MapPin className="w-3 h-3 text-neutral-400" />
                                    {order.supplier_location}
                                  </div>
                                  <div className="text-[10px] text-neutral-400 truncate max-w-[160px]">{order.item}</div>
                                </TableCell>
                                <TableCell className="py-2.5 font-mono text-xs text-neutral-300">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-neutral-500" />
                                    {order.expected_delivery_date}
                                  </div>
                                </TableCell>
                                <TableCell className="py-2.5 text-right">
                                  {getRiskBadge(displayedRisk)}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </CardContent>
                    <CardFooter className="border-t border-neutral-800 p-3 text-xs text-neutral-400 flex justify-between">
                      <span>Clicking an order triggers live orchestrator + POST /api/analyze</span>
                      <span className="font-mono text-[11px] text-neutral-500">Live Gemini Sync</span>
                    </CardFooter>
                  </Card>

                  {/* 24-Hour Risk Distribution Chart (Tremor) */}
                  <TremorCard className="bg-neutral-900 border-neutral-800 text-neutral-100 ring-0 p-4">
                    <Flex justifyContent="between" alignItems="center">
                      <Text className="text-neutral-300 text-xs font-semibold">Dynamic Risk Severity Across Indian Manufacturing Corridors</Text>
                      <Text className="text-neutral-500 text-[10px]">red-500 / amber-500 / green-500</Text>
                    </Flex>
                    <AreaChart
                      className="h-36 mt-3"
                      data={telemetryData}
                      index="time"
                      categories={["HighRisk", "MedRisk", "LowRisk"]}
                      colors={["red", "amber", "emerald"]}
                      yAxisWidth={25}
                    />
                  </TremorCard>
                </div>

                {/* Right Column: Gemini Plain-Language Explanation & Agent Findings */}
                <div className="lg:col-span-6 space-y-4">
                  {/* Gemini AI Plain-Language Risk Explanation Card */}
                  <Card className="bg-neutral-900 border-neutral-800 text-neutral-100">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1 bg-amber-500/10 border border-amber-500/30 rounded text-amber-400">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                            <CardTitle className="text-sm font-semibold">
                              Gemini Plain-Language Risk Intelligence
                            </CardTitle>
                            <CardDescription className="text-xs text-neutral-400">
                              Direct output from <code className="text-neutral-300">POST /api/analyze</code> citing source documents
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {analyzingWithGemini ? (
                            <Badge variant="secondary" className="text-[10px] animate-pulse">Analyzing...</Badge>
                          ) : (
                            getRiskBadge(geminiAnalysis?.risk_level || currentRiskLevel)
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0 text-xs">
                      {geminiAnalysis ? (
                        <div className="p-3.5 rounded-lg bg-neutral-950 border border-neutral-800 space-y-3 leading-relaxed text-neutral-200">
                          <div className="whitespace-pre-line text-xs font-normal text-neutral-200">
                            {geminiAnalysis.explanation}
                          </div>

                          {/* Sources Cited Section */}
                          {geminiAnalysis.sources && geminiAnalysis.sources.length > 0 && (
                            <div className="pt-2.5 border-t border-neutral-800 space-y-1.5">
                              <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold flex items-center gap-1">
                                <LinkIcon className="w-3 h-3 text-indigo-400" />
                                Cited Intelligence Sources ({geminiAnalysis.sources.length})
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {geminiAnalysis.sources.map((s, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="outline"
                                    className="text-[10px] border-neutral-700 bg-neutral-900 text-neutral-300 flex items-center gap-1"
                                  >
                                    <FileText className="w-2.5 h-2.5 text-neutral-400" />
                                    {s.source_id}
                                    {s.similarity ? ` (${(s.similarity * 100).toFixed(0)}% match)` : ""}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-4 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-400 text-center">
                          Analyzing order with Gemini and retrieving vector citations...
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="border-t border-neutral-800 p-2.5 flex justify-between items-center text-[11px]">
                      <span className="text-neutral-500 font-mono">Gemini 2.5 / 1.5 Flash Reasoning API</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => triggerGeminiAnalysis(selectedOrder.id)}
                        disabled={analyzingWithGemini}
                        className="h-6 text-[11px] border-neutral-700 text-neutral-200 hover:bg-neutral-800"
                      >
                        Re-analyze with Gemini
                      </Button>
                    </CardFooter>
                  </Card>

                  {/* 4 Agent Telemetry Breakdown */}
                  <Card className="bg-neutral-900 border-neutral-800 text-neutral-100">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5" />
                          Modular Agent Telemetry (Input to Gemini)
                        </CardTitle>
                        {liveAssessment && (
                          <span className="font-mono text-[11px] text-neutral-400">
                            Score: <strong className="text-neutral-100">{liveAssessment.overall_score}/100</strong>
                          </span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 pt-0">
                      {liveAssessment?.findings.map((finding) => (
                        <div
                          key={finding.agent}
                          className="p-2 rounded bg-neutral-950/80 border border-neutral-800 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 font-medium text-neutral-200">
                              {getAgentIcon(finding.agent)}
                              {finding.agent}
                              <span className="font-mono text-[10px] text-neutral-500 font-normal">
                                (Conf: {(finding.confidence * 100).toFixed(0)}%)
                              </span>
                            </div>
                            {getRiskBadge(finding.risk_level)}
                          </div>
                          <ProgressBar
                            value={finding.score}
                            color={finding.risk_level === "high" ? "red" : finding.risk_level === "medium" ? "amber" : "emerald"}
                            className="h-1"
                          />
                          <p className="text-[11px] text-neutral-400 leading-tight">
                            {finding.summary}
                          </p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Tab 2: ChromaDB Vector Store Explorer */}
            <TabsContent value="chroma-tab" className="mt-4">
              <div className="space-y-6">
                <Card className="bg-neutral-900 border-neutral-800 text-neutral-100">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                          <Database className="w-5 h-5 text-indigo-400" />
                          ChromaDB Local Vector Database Explorer
                        </CardTitle>
                        <CardDescription className="text-neutral-400 text-xs mt-1">
                          5 sample supply chain disruption documents loaded with 256-dim deterministic semantic embeddings.
                        </CardDescription>
                      </div>
                      <Badge className="bg-indigo-950 text-indigo-300 border border-indigo-800">
                        Zero External API Dependencies
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Semantic Search Box */}
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleVectorSearch(searchQuery)}
                            placeholder="Search disruptions (e.g., 'cyclone in Chennai', 'GST tariff Surat', 'JNPT port strike', 'Ludhiana BIS fasteners')..."
                            className="w-full h-9 pl-9 pr-3 text-xs bg-neutral-950 border border-neutral-800 rounded-md text-neutral-100 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleVectorSearch(searchQuery)}
                          disabled={searchLoading}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-9 px-4"
                        >
                          {searchLoading ? "Searching..." : "Vector Query"}
                        </Button>
                      </div>

                      {/* Quick Preset Queries */}
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="text-neutral-500 text-[11px]">Preset Queries:</span>
                        {[
                          "Bay of Bengal Cyclone Chennai Port disruption",
                          "Surat synthetic textile GST rate change",
                          "JNPT Nhava Sheva container drayage truck strike",
                          "Bureau of Indian Standards BIS fastener inspection in Ludhiana",
                          "Pig iron blast furnace overhaul in Rajkot foundry"
                        ].map((preset) => (
                          <button
                            key={preset}
                            onClick={() => {
                              setSearchQuery(preset);
                              handleVectorSearch(preset);
                            }}
                            className="px-2 py-0.5 rounded bg-neutral-800/80 hover:bg-neutral-850 text-neutral-300 border border-neutral-700 text-[10px] transition-colors"
                          >
                            {preset.split(" ")[0]} {preset.split(" ")[1]} {preset.split(" ")[2]}...
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Search Results */}
                    <div className="space-y-3 pt-2">
                      <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                        Vector Similarity Matches ({searchResults.length})
                      </h3>
                      <div className="grid grid-cols-1 gap-3">
                        {searchResults.map((match, idx) => (
                          <div
                            key={match.doc_id}
                            className="p-4 rounded-lg bg-neutral-950 border border-neutral-800 space-y-2.5 hover:border-neutral-700 transition-colors"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-indigo-950 border border-indigo-800 text-indigo-300 text-[11px] font-mono flex items-center justify-center font-bold">
                                  #{idx + 1}
                                </span>
                                <span className="font-mono text-xs font-bold text-neutral-200">{match.doc_id}</span>
                                <Badge variant="outline" className="text-[10px] border-neutral-700 text-neutral-300">
                                  {match.category}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                {getRiskBadge(match.severity)}
                                <span className="text-[11px] font-mono text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                                  Similarity: <strong className="text-emerald-400">{(match.similarity_score * 100).toFixed(1)}%</strong> (Dist: {match.distance})
                                </span>
                              </div>
                            </div>

                            <h4 className="font-semibold text-sm text-neutral-100">
                              {match.title}
                            </h4>

                            <p className="text-xs text-neutral-400 leading-relaxed bg-neutral-900/50 p-2.5 rounded border border-neutral-850">
                              {match.content_snippet}
                            </p>

                            <div className="flex flex-wrap items-center gap-4 text-[11px] text-neutral-500 pt-1">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-neutral-400" />
                                Locations: {match.affected_locations.join(", ")}
                              </span>
                              <span className="flex items-center gap-1">
                                <FileText className="w-3 h-3 text-neutral-400" />
                                Sectors: {match.affected_sectors.join(", ")}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-neutral-400" />
                                Date: {match.date}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
