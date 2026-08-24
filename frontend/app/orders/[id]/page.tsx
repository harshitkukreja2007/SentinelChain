"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card as TremorCard,
  Metric,
  Text,
  ProgressBar,
  CategoryBar,
  BadgeDelta,
  Callout,
  Flex,
  Grid,
} from "@tremor/react";
import {
  ArrowLeft,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Building2,
  CloudLightning,
  Scale,
  Truck,
  MapPin,
  Calendar,
  Sparkles,
  RefreshCw,
  FileText,
  TrendingUp,
  Link as LinkIcon,
  ShieldAlert,
  HelpCircle,
  ExternalLink,
} from "lucide-react";

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

interface OrderDetail {
  id: string;
  supplier_name: string;
  item: string;
  expected_delivery_date: string;
  supplier_location: string;
  category: string;
  order_value_inr?: number;
  dispatch_port?: string;
  riskLevel: "low" | "medium" | "high";
  overall_score: number;
  critical_findings_count: number;
  executive_summary: string;
  primary_recommendation: string;
  findings: AgentFinding[];
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

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzeApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysisAndOrder = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setAnalyzing(true);
    setError(null);

    try {
      // 1. Fetch factual order & telemetry from backend
      const orderRes = await fetch(`http://127.0.0.1:8000/api/orders/${orderId}`);
      if (orderRes.ok) {
        const orderData = await orderRes.json();
        setOrder(orderData);
      }

      // 2. Call POST /api/analyze for plain-language explanation and cited sources
      const analyzeRes = await fetch("http://127.0.0.1:8000/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId }),
      });

      if (analyzeRes.ok) {
        const analyzeData: AnalyzeApiResponse = await analyzeRes.json();
        setAnalysis(analyzeData);
      } else {
        throw new Error(`Analyze API returned status ${analyzeRes.status}`);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to load risk analysis";
      setError(errMsg);
    } finally {
      setLoading(false);
      setAnalyzing(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchAnalysisAndOrder();
  }, [fetchAnalysisAndOrder]);

  const getRiskBadge = (level?: "low" | "medium" | "high") => {
    if (level === "high") {
      return (
        <Badge className="bg-red-500/15 text-red-500 border border-red-500/30 text-xs px-2.5 py-0.5">
          <AlertCircle className="w-3.5 h-3.5 mr-1" />
          High Risk
        </Badge>
      );
    }
    if (level === "medium") {
      return (
        <Badge className="bg-amber-500/15 text-amber-500 border border-amber-500/30 text-xs px-2.5 py-0.5">
          <AlertTriangle className="w-3.5 h-3.5 mr-1" />
          Medium Risk
        </Badge>
      );
    }
    return (
      <Badge className="bg-green-500/15 text-green-500 border border-green-500/30 text-xs px-2.5 py-0.5">
        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
        Low Risk
      </Badge>
    );
  };

  const getAgentIcon = (name: string) => {
    if (name.includes("supplier")) return <Building2 className="w-4 h-4 text-neutral-300" />;
    if (name.includes("weather")) return <CloudLightning className="w-4 h-4 text-neutral-300" />;
    if (name.includes("policy")) return <Scale className="w-4 h-4 text-neutral-300" />;
    return <Truck className="w-4 h-4 text-neutral-300" />;
  };

  // Convert risk level to Tremor CategoryBar indicator value (0-100)
  const getCategoryBarValue = (level?: "low" | "medium" | "high") => {
    if (level === "high") return 85;
    if (level === "medium") return 50;
    return 15;
  };

  const currentRiskLevel = analysis?.risk_level || order?.riskLevel || "low";

  if (loading && !order) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-sm text-neutral-400">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
          <span>Analyzing order with multi-agent orchestrator & Gemini...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans antialiased">
      {/* Top Header Navigation */}
      <header className="h-14 border-b border-neutral-800 bg-neutral-900/80 px-6 flex items-center justify-between sticky top-0 z-10 backdrop-blur">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/")}
            className="text-xs text-neutral-300 hover:text-white hover:bg-neutral-800"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to All Orders
          </Button>
          <div className="h-4 w-px bg-neutral-800" />
          <div className="flex items-center gap-2 text-xs">
            <span className="font-mono text-neutral-400">{orderId}</span>
            {order && (
              <>
                <span className="text-neutral-500">/</span>
                <span className="text-neutral-200 font-semibold">{order.supplier_name}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {getRiskBadge(currentRiskLevel)}
          <Button
            size="sm"
            variant="outline"
            onClick={fetchAnalysisAndOrder}
            disabled={analyzing}
            className="h-8 text-xs border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${analyzing ? "animate-spin" : ""}`} />
            Re-run Analysis
          </Button>
        </div>
      </header>

      {/* Main Container */}
      <main className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Error Callout if API failed */}
        {error && (
          <Callout
            title="Analysis Warning"
            icon={AlertTriangle}
            color="amber"
            className="bg-neutral-900 border border-amber-500/30 text-amber-300"
          >
            {error}. Displaying available cached order context.
          </Callout>
        )}

        {/* Top Order Context Card */}
        {order && (
          <Card className="bg-neutral-900 border-neutral-800 text-neutral-100">
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-neutral-300 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                      {order.id}
                    </span>
                    <Badge variant="outline" className="text-xs border-neutral-700 text-neutral-400">
                      {order.category}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-bold text-neutral-100">
                    {order.supplier_name}
                  </CardTitle>
                  <CardDescription className="text-xs text-neutral-400 flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                      {order.supplier_location}
                    </span>
                    <span>•</span>
                    <span>Dispatch Gateway: <strong>{order.dispatch_port || "Inland Dry Port"}</strong></span>
                  </CardDescription>
                </div>

                {/* Tremor Visual Risk Indicator */}
                <div className="w-full md:w-64 space-y-2 p-3 bg-neutral-950 rounded-lg border border-neutral-800">
                  <Flex justifyContent="between" alignItems="center">
                    <Text className="text-[11px] text-neutral-400 uppercase font-bold">Threat Severity</Text>
                    <BadgeDelta
                      deltaType={currentRiskLevel === "high" ? "increase" : currentRiskLevel === "medium" ? "unchanged" : "decrease"}
                      className="text-xs"
                    >
                      {currentRiskLevel.toUpperCase()}
                    </BadgeDelta>
                  </Flex>
                  <CategoryBar
                    values={[33, 33, 34]}
                    colors={["emerald", "amber", "red"]}
                    markerValue={getCategoryBarValue(currentRiskLevel)}
                    className="mt-1"
                  />
                  <Flex justifyContent="between" className="text-[10px] text-neutral-500 font-mono">
                    <span>Low</span>
                    <span>Medium</span>
                    <span>High</span>
                  </Flex>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-0 text-xs border-t border-neutral-800/80 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-neutral-500">Procured Component</div>
                  <div className="font-medium text-neutral-200 text-sm">{order.item}</div>
                </div>
                <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-neutral-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-neutral-500" />
                    Expected Delivery Date
                  </div>
                  <div className="font-mono font-semibold text-neutral-200 text-sm">{order.expected_delivery_date}</div>
                </div>
                <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-neutral-500 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-neutral-500" />
                    Capital Allocation
                  </div>
                  <div className="font-mono font-semibold text-neutral-200 text-sm">
                    INR {order.order_value_inr ? `${(order.order_value_inr / 100000).toFixed(2)} Lakhs` : "N/A"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tremor KPI Indicator Grid */}
        <Grid numItemsSm={1} numItemsLg={3} className="gap-4">
          <TremorCard decoration="top" decorationColor={currentRiskLevel === "high" ? "red" : currentRiskLevel === "medium" ? "amber" : "emerald"} className="bg-neutral-900 border-neutral-800 text-neutral-100 ring-0 p-4">
            <Flex justifyContent="between" alignItems="center">
              <Text className="text-neutral-400 text-xs">Evaluated Risk Level</Text>
              <ShieldAlert className={`w-4 h-4 ${currentRiskLevel === "high" ? "text-red-500" : currentRiskLevel === "medium" ? "text-amber-500" : "text-green-500"}`} />
            </Flex>
            <Metric className={`text-2xl font-bold mt-1 ${currentRiskLevel === "high" ? "text-red-500" : currentRiskLevel === "medium" ? "text-amber-500" : "text-green-500"}`}>
              {currentRiskLevel.toUpperCase()} RISK
            </Metric>
            <Text className="text-neutral-500 text-xs mt-2">
              {currentRiskLevel === "high" ? "Urgent mitigation & rerouting required" : currentRiskLevel === "medium" ? "Compliance check & monitoring recommended" : "Optimal supply chain execution"}
            </Text>
          </TremorCard>

          <TremorCard decoration="top" decorationColor="indigo" className="bg-neutral-900 border-neutral-800 text-neutral-100 ring-0 p-4">
            <Flex justifyContent="between" alignItems="center">
              <Text className="text-neutral-400 text-xs">Intelligence Sources Consulted</Text>
              <FileText className="w-4 h-4 text-indigo-400" />
            </Flex>
            <Metric className="text-neutral-100 text-2xl font-bold mt-1">
              {analysis?.sources ? `${analysis.sources.length} Sources` : "Consulting..."}
            </Metric>
            <Text className="text-neutral-500 text-xs mt-2">
              Vector DB regulatory documents + 4 risk agents
            </Text>
          </TremorCard>

          <TremorCard decoration="top" decorationColor="emerald" className="bg-neutral-900 border-neutral-800 text-neutral-100 ring-0 p-4">
            <Flex justifyContent="between" alignItems="center">
              <Text className="text-neutral-400 text-xs">AI Synthesis Status</Text>
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </Flex>
            <Metric className="text-emerald-400 text-2xl font-bold mt-1">
              {analyzing ? "Synthesizing..." : "Active & Verified"}
            </Metric>
            <Text className="text-neutral-500 text-xs mt-2">
              Google Gemini plain-language reasoning
            </Text>
          </TremorCard>
        </Grid>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Plain-Language Risk Explanation & Cited Sources */}
          <div className="lg:col-span-7 space-y-6">
            {/* Plain-Language Explanation Card */}
            <Card className="bg-neutral-900 border-neutral-800 text-neutral-100">
              <CardHeader className="pb-3 border-b border-neutral-800/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-amber-500/10 border border-amber-500/30 rounded text-amber-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold text-neutral-100">
                        Plain-Language Risk Explanation
                      </CardTitle>
                      <CardDescription className="text-xs text-neutral-400">
                        Synthesized by Gemini from multi-agent telemetry and vector disruption intelligence
                      </CardDescription>
                    </div>
                  </div>
                  {analyzing ? (
                    <Badge variant="secondary" className="text-xs animate-pulse">Analyzing...</Badge>
                  ) : (
                    getRiskBadge(currentRiskLevel)
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-5 space-y-4 text-xs leading-relaxed text-neutral-200">
                {analysis ? (
                  <div className="space-y-4">
                    {/* Readable Formatted Narrative */}
                    <div className="whitespace-pre-line leading-relaxed text-neutral-200 text-xs font-normal">
                      {analysis.explanation}
                    </div>

                    {/* Cited Sources List (Explicitly Labeled) */}
                    {analysis.sources && analysis.sources.length > 0 && (
                      <div className="pt-4 border-t border-neutral-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                            <LinkIcon className="w-3.5 h-3.5 text-indigo-400" />
                            Cited Intelligence Sources ({analysis.sources.length})
                          </h4>
                          <span className="text-[10px] text-neutral-500 font-mono">Traceable Citations</span>
                        </div>

                        <div className="space-y-2">
                          {analysis.sources.map((source, sIdx) => {
                            const isDoc = source.type === "vector_intelligence_document";
                            return (
                              <div
                                key={sIdx}
                                className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:border-neutral-700 transition-colors"
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      variant="outline"
                                      className={`text-[10px] font-mono px-1.5 py-0 ${
                                        isDoc ? "border-indigo-800 text-indigo-300 bg-indigo-950/40" : "border-neutral-700 text-neutral-300 bg-neutral-900"
                                      }`}
                                    >
                                      {source.source_id}
                                    </Badge>
                                    <span className="font-semibold text-neutral-200 text-xs">
                                      {source.title}
                                    </span>
                                  </div>
                                  {source.category && (
                                    <div className="text-[11px] text-neutral-500 pl-0.5">
                                      Category: {source.category}
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 self-start sm:self-center">
                                  {source.similarity !== undefined && (
                                    <span className="text-[11px] font-mono text-emerald-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                                      {(source.similarity * 100).toFixed(1)}% vector match
                                    </span>
                                  )}
                                  {source.confidence !== undefined && (
                                    <span className="text-[11px] font-mono text-indigo-300 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                                      {Math.round(source.confidence * 100)}% agent confidence
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 text-center text-neutral-400 space-y-2">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-indigo-400" />
                    <p>Generating risk assessment explanation with Gemini...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Labeled Findings for Each Specialized Agent */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="bg-neutral-900 border-neutral-800 text-neutral-100">
              <CardHeader className="pb-3 border-b border-neutral-800/80">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-neutral-400" />
                      Domain Agent Findings
                    </CardTitle>
                    <CardDescription className="text-xs text-neutral-400">
                      Independent assessments from 4 modular risk agents
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-neutral-700 text-neutral-300">
                    4 Agents Active
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-3 pt-4">
                {order?.findings.map((finding) => {
                  const findingRiskColor = finding.risk_level === "high" ? "red" : finding.risk_level === "medium" ? "amber" : "emerald";
                  return (
                    <div
                      key={finding.agent}
                      className="p-3.5 rounded-lg bg-neutral-950 border border-neutral-800 space-y-2.5 text-xs hover:border-neutral-750 transition-colors"
                    >
                      {/* Header with Labeled Source Tag */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-semibold text-neutral-200">
                          {getAgentIcon(finding.agent)}
                          <span>{finding.agent}</span>
                          <span className="font-mono text-[10px] text-neutral-500 font-normal">
                            ({Math.round(finding.confidence * 100)}% conf)
                          </span>
                        </div>
                        {getRiskBadge(finding.risk_level)}
                      </div>

                      {/* Visual Progress Severity Bar (Tremor) */}
                      <ProgressBar
                        value={finding.score}
                        color={findingRiskColor}
                        className="h-1.5"
                      />

                      {/* Readable Narrative Summary */}
                      <p className="text-[11px] text-neutral-300 leading-relaxed">
                        {finding.summary}
                      </p>

                      {/* Source Document Tag if Matched */}
                      {finding.matched_doc_id && (
                        <div className="flex items-center gap-1.5 text-[10px] text-indigo-400 bg-indigo-950/40 p-1.5 rounded border border-indigo-900/60 font-mono">
                          <ExternalLink className="w-3 h-3" />
                          <span>Matched Vector Document: <strong>{finding.matched_doc_id}</strong></span>
                        </div>
                      )}

                      {/* Evidence Factors */}
                      {finding.factors && finding.factors.length > 0 && (
                        <div className="space-y-1 pt-1.5 border-t border-neutral-850">
                          <div className="text-[10px] font-bold uppercase text-neutral-500">Evidence Factors:</div>
                          <ul className="list-disc list-inside text-[11px] text-neutral-400 space-y-0.5">
                            {finding.factors.map((factor, fIdx) => (
                              <li key={fIdx}>{factor}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Actionable Mitigation */}
                      {finding.recommendation && (
                        <div className="p-2 rounded bg-neutral-900/90 border border-neutral-800 text-[11px] text-neutral-300">
                          <strong className="text-neutral-200">Recommended Action:</strong> {finding.recommendation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Procurement Action Checklist Callout */}
            <Card className="bg-neutral-900 border-neutral-800 text-neutral-100 p-4">
              <div className="flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" />
                <div className="space-y-1 text-xs">
                  <span className="font-bold text-neutral-200 block">Operational Procedure</span>
                  <p className="text-neutral-400 text-[11px] leading-relaxed">
                    Prior to dispatch authorization, ensure all cited regulatory notices and carrier advisories are reconciled against the supplier Bill of Lading.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
