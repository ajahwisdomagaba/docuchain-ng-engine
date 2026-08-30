"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck, // <--- Add this import
  Scale,
  Building2,
  Lock,
  Users,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Loader2,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";

export default function RiskHeatmapPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRiskData() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("contracts")
          .select("*, risk_flags(*)")
          .order("created_at", { ascending: false });

        if (data) {
          setContracts(data);
        }
      } catch (err) {
        console.error("Failed to load risk data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadRiskData();
  }, []);

  // Aggregate dynamic statutory metrics
  const totalContracts = contracts.length;
  const compliantContracts = contracts.filter(
    (c) => c.status === "COMPLIANT" || c.status === "Compliant" || c.health_score === 100
  ).length;

  const totalFlags = contracts.reduce((acc, c) => {
    const flags = c.risk_flags || c.metadata?.risk_flags || [];
    const openFlags = flags.filter((f: any) => f.status !== "RESOLVED" && !f.isApplied);
    return acc + openFlags.length;
  }, 0);

  const avgHealth = totalContracts > 0
    ? Math.round(
        contracts.reduce((acc, c) => acc + (c.health_score || (100 - (c.risk_score || 0))), 0) / totalContracts
      )
    : 100;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
                Statutory Risk &amp; Exposure Engine
              </span>
              <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30 text-[10px]">
                Real-Time Recalculation
              </Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white mt-1">
              Portfolio Compliance Risk Heatmap
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Live portfolio telemetry across Lagos Tenancy Law 2011, CAMA 2020, Labour Act 2024, and NDPA 2023.
            </p>
          </div>
        </div>

        {/* Dynamic Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-900/60 border-slate-800 text-slate-100">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-medium text-slate-400">Audited Portfolio</CardTitle>
              <FileText className="w-4 h-4 text-emerald-400" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-white">{totalContracts}</div>
              <p className="text-[11px] text-emerald-400 mt-1">
                {compliantContracts} Statutorily Compliant
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 border-slate-800 text-slate-100">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-medium text-slate-400">Open Statutory Breaches</CardTitle>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-rose-400">{totalFlags}</div>
              <p className="text-[11px] text-slate-400 mt-1">
                {totalFlags === 0 ? "Zero pending risks" : "Requires Redline Substitution"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 border-slate-800 text-slate-100">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-medium text-slate-400">Portfolio Health Score</CardTitle>
              <Scale className="w-4 h-4 text-emerald-400" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-emerald-400">{avgHealth}/100</div>
              <p className="text-[11px] text-slate-400 mt-1">Weighted Statutory Average</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 border-slate-800 text-slate-100">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-medium text-slate-400">Statutory Frameworks Grounded</CardTitle>
              <CheckCircle2 className="w-4 h-4 text-purple-400" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-white">4 Statutes</div>
              <p className="text-[11px] text-purple-400 mt-1">CAMA • NDPA • Tenancy • Labour</p>
            </CardContent>
          </Card>
        </div>

        {/* Live Contract Breakdown Table */}
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/30">
          <div className="p-4 bg-slate-900/80 border-b border-slate-800 font-bold text-sm text-white flex items-center justify-between">
            <span>Exposed Documents &amp; Identified Defects</span>
            <Link href="/vault" className="text-xs text-emerald-400 hover:underline">
              Go to Vault
            </Link>
          </div>

          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
              <p className="text-xs">Evaluating statutory risk landscape...</p>
            </div>
          ) : contracts.length === 0 ? (
            <div className="py-16 text-center text-slate-500 space-y-2">
              <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-sm font-medium text-slate-400">No active contracts</p>
              <p className="text-xs text-slate-600">
                Upload or ingest an agreement to begin risk scanning.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/60 uppercase text-[11px] text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-5">Contract Title</th>
                  <th className="py-3.5 px-5">Counterparty</th>
                  <th className="py-3.5 px-5">Compliance Health</th>
                  <th className="py-3.5 px-5">Open Statutory Risks</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {contracts.map((doc) => {
                  const flags = doc.risk_flags || doc.metadata?.risk_flags || [];
                  const openCount = flags.filter((f: any) => f.status !== "RESOLVED" && !f.isApplied).length;
                  const score = doc.health_score || (100 - (doc.risk_score || 0)) || 85;

                  return (
                    <tr key={doc.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-5 font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-emerald-400" />
                          {doc.title}
                        </div>
                      </td>
                      <td className="py-4 px-5 text-slate-400">
                        {doc.counterparty || "Counterparty"}
                      </td>
                      <td className="py-4 px-5">
                        <span className="text-emerald-400 font-bold">{score}/100</span>
                      </td>
                      <td className="py-4 px-5">
                        {openCount > 0 ? (
                          <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30 text-[10px]">
                            {openCount} Statutory Breaches
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">
                            0 (Compliant)
                          </Badge>
                        )}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <Link href={`/contracts/${doc.id}`}>
                          <Button size="sm" variant="ghost" className="h-7 text-xs text-emerald-400 hover:bg-slate-800 cursor-pointer">
                            Review &amp; Redline <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}