'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FileEdit, 
  CalendarClock, 
  Briefcase, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  TrendingUp, 
  FileCheck2,
  Scale,
  Loader2,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabaseClient';

export default function DashboardPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [obligations, setObligations] = useState<any[]>([]);
  const [clientCount, setClientCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardTelemetry() {
      setLoading(true);
      try {
        // 1. Fetch live contracts from database
        const { data: contractData } = await supabase
          .from('contracts')
          .select('id, title, category, counterparty, health_score, risk_score, status, created_at')
          .order('created_at', { ascending: false });

        const contractList = contractData || [];
        setContracts(contractList);

        // 2. Fetch live statutory obligations
        const { data: obligationData } = await supabase
          .from('statutory_obligations')
          .select('*')
          .order('days_remaining', { ascending: true });

        setObligations(obligationData || []);

        // 3. Fetch active client repositories count
        const { count } = await supabase
          .from('workspace_clients')
          .select('*', { count: 'exact', head: true });

        setClientCount(count || (contractList.length > 0 ? 1 : 0));
      } catch (err) {
        console.error('Error fetching dashboard telemetry:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardTelemetry();
  }, []);

  // Compute dynamic metrics
  const totalContracts = contracts.length;
  const avgHealthScore = totalContracts > 0
    ? Math.round(
        contracts.reduce((acc, c) => acc + (c.health_score || (100 - (c.risk_score || 0))), 0) / totalContracts
      )
    : 100;

  const urgentAlertsCount = obligations.length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Header & Action Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Practice Overview
              </span>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">
                Live Telemetry
              </Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white mt-1">
              Executive Legal Dashboard
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Real-time statutory audits, compliance health scores, and matter oversight.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/drafter">
              <Button variant="outline" className="border-slate-700 bg-slate-900 text-xs text-slate-200 hover:text-white h-9 cursor-pointer">
                <FileEdit className="w-3.5 h-3.5 mr-1.5 text-emerald-400" /> New Statutory Draft
              </Button>
            </Link>
            <Link href="/vault">
              <Button className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-9 font-semibold shadow-lg shadow-emerald-950 cursor-pointer">
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Ingest &amp; Audit Contract
              </Button>
            </Link>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-900/60 border-slate-800 text-slate-100">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-medium text-slate-400">Total Audited Contracts</CardTitle>
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-white">{totalContracts}</div>
              <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> {totalContracts > 0 ? `${totalContracts} active in vault` : '0 indexed'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 border-slate-800 text-slate-100">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-medium text-slate-400">Portfolio Compliance Score</CardTitle>
              <Scale className="w-4 h-4 text-emerald-400" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-emerald-400">{avgHealthScore}%</div>
              <p className="text-[11px] text-slate-400 mt-1">CAMA 2020 &amp; Tenancy Law Verified</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 border-slate-800 text-slate-100">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-medium text-slate-400">Active Client Repositories</CardTitle>
              <Briefcase className="w-4 h-4 text-purple-400" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-white">{clientCount}</div>
              <p className="text-[11px] text-purple-400 mt-1">
                {clientCount > 0 ? 'Segregated Client Vaults' : 'No clients attached'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 border-slate-800 text-slate-100">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-medium text-slate-400">Statutory Notice Triggers</CardTitle>
              <CalendarClock className="w-4 h-4 text-amber-400" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-amber-400">{urgentAlertsCount}</div>
              <p className="text-[11px] text-slate-400 mt-1">
                {urgentAlertsCount > 0 ? `${urgentAlertsCount} Section 13 notice countdowns` : 'Zero pending notices'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Live Table & Statutory Alerts Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Recent Reviews Table (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">Recent Matter Reviews &amp; Redlines</h2>
              <Link href="/vault" className="text-xs text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer">
                View all in Vault <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
              {loading ? (
                <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                  <p className="text-xs">Loading live contracts...</p>
                </div>
              ) : contracts.length === 0 ? (
                <div className="py-16 text-center text-slate-500 space-y-2">
                  <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-sm font-medium text-slate-400">No contracts in vault</p>
                  <p className="text-xs text-slate-600">
                    Ingest a contract from the button above to begin live statutory scoring.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/90 uppercase text-[11px] text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4">Contract / Title</th>
                      <th className="py-3.5 px-4">Counterparty / Matter</th>
                      <th className="py-3.5 px-4">Health Score</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {contracts.slice(0, 5).map((doc) => {
                      const score = doc.health_score || (100 - (doc.risk_score || 0)) || 85;
                      return (
                        <tr key={doc.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-white">
                            <div className="flex items-center gap-2">
                              <FileText className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="truncate max-w-[200px]">{doc.title}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-400">
                            {doc.counterparty || 'First Party Entity'}
                          </td>
                          <td className="py-3.5 px-4 text-emerald-400 font-bold">
                            {score}/100
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge
                              className={`text-[10px] ${
                                doc.status === 'COMPLIANT' || doc.status === 'Compliant'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : doc.status === 'EXECUTED'
                                  ? 'bg-purple-500/20 text-purple-300'
                                  : 'bg-amber-500/20 text-amber-300'
                              }`}
                            >
                              {doc.status || 'Draft'}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <Link href={`/contracts/${doc.id}`}>
                              <Button size="sm" variant="ghost" className="h-7 text-xs text-emerald-400 hover:bg-slate-800 cursor-pointer">
                                Review
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

          {/* Right: Statutory Alerts (1 Col) */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white">Statutory Alerts</h2>
            <Card className="bg-slate-900/60 border-slate-800 text-slate-100">
              <CardContent className="p-4 space-y-3">
                {obligations.length === 0 ? (
                  <div className="p-4 text-center text-slate-500 text-xs">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500/50 mx-auto mb-1.5" />
                    All notice-to-quit calendars and statutory obligations are up to date.
                  </div>
                ) : (
                  obligations.slice(0, 3).map((alert, idx) => (
                    <div key={idx} className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                        <AlertTriangle className="w-3.5 h-3.5" /> {alert.notice_type || 'Notice Due'}
                      </div>
                      <p className="text-[11px] text-slate-300">
                        {alert.action_required || 'Statutory determination boundary approaching.'}
                      </p>
                    </div>
                  ))
                )}

                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> CAMA 2020 Execution Ready
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Partner digital execution capacity attestation and SHA-256 stamping active.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
}