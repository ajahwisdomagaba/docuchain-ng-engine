'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  ShieldAlert, 
  FileText, 
  CalendarClock, 
  ArrowUpRight, 
  TrendingUp, 
  Layers
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

interface DashboardMetrics {
  totalContracts: number;
  avgComplianceScore: number;
  flaggedRisksCount: number;
  pendingObligationsCount: number;
  statutoryNoticesCount: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalContracts: 4,
    avgComplianceScore: 78,
    flaggedRisksCount: 7,
    pendingObligationsCount: 2,
    statutoryNoticesCount: 1,
  });
  const [recentContracts, setRecentContracts] = useState<any[]>([]);
  const [upcomingObligations, setUpcomingObligations] = useState<any[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        let currentUserId = user?.id;
        if (!currentUserId) {
          const { data: authData } = await supabase.auth.getUser();
          currentUserId = authData?.user?.id;
        }

        if (!currentUserId) {
          setLoading(false);
          return;
        }

        // Fetch user contracts
        const { data: contractsData } = await supabase
          .from('contracts')
          .select('*')
          .order('created_at', { ascending: false });

        // Fetch user obligations
        const { data: obligationsData } = await supabase
          .from('obligations')
          .select('*, contracts:contract_id(title, counterparty)')
          .order('due_date', { ascending: true });

        if (contractsData && contractsData.length > 0) {
          const total = contractsData.length;
          const totalScore = contractsData.reduce((acc, curr) => acc + (100 - (curr.risk_score || 0)), 0);
          const avgScore = Math.round(totalScore / total);

          const totalFlags = contractsData.reduce((acc, curr) => {
            const flags = Array.isArray(curr.metadata?.risk_flags) ? curr.metadata.risk_flags.length : (curr.risk_score > 30 ? 2 : 0);
            return acc + flags;
          }, 0);

          const pendingObs = obligationsData?.filter(o => o.status === 'PENDING') || [];
          const statutoryNotices = pendingObs.filter(o => o.obligation_type === 'NOTICE');

          setMetrics({
            totalContracts: total,
            avgComplianceScore: avgScore,
            flaggedRisksCount: totalFlags,
            pendingObligationsCount: pendingObs.length,
            statutoryNoticesCount: statutoryNotices.length,
          });

          setRecentContracts(contractsData.slice(0, 4));
        }

        if (obligationsData && obligationsData.length > 0) {
          setUpcomingObligations(obligationsData.filter(o => o.status === 'PENDING').slice(0, 3));
        }
      } catch (err: any) {
        console.warn('Dashboard live query fallback:', err.message);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [user]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>DocuChain NG Command Center</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Active Monitoring
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time statutory auditing, risk distributions, and obligation tracking under Lagos Tenancy Law 2011 & CAMA 2020.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/drafter">
            <Button size="sm" variant="outline" className="border-slate-700 bg-slate-900 text-xs text-slate-200 hover:bg-slate-800">
              Statutory Drafter
            </Button>
          </Link>
          <Link href="/vault">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs">
              Open Contract Vault
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-slate-400">Total Monitored Contracts</CardTitle>
            <FileText className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-white mt-1">{metrics.totalContracts}</div>
            <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Fully indexed in Vault
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-slate-400">Avg. Compliance Benchmark</CardTitle>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-white mt-1">{metrics.avgComplianceScore}<span className="text-sm font-normal text-slate-400">/100</span></div>
            <p className="text-[11px] text-slate-400 mt-1">Nigerian statutory alignment</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-slate-400">Active Statutory Flags</CardTitle>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-rose-400 mt-1">{metrics.flaggedRisksCount}</div>
            <p className="text-[11px] text-rose-400/80 mt-1">Requiring redlining or waiver</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-slate-400">Pending Obligations</CardTitle>
            <CalendarClock className="w-4 h-4 text-amber-400" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-amber-400 mt-1">{metrics.pendingObligationsCount}</div>
            <p className="text-[11px] text-amber-400/80 mt-1">{metrics.statutoryNoticesCount} statutory notice window</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Contracts Stream */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" /> Monitored Agreements
            </h2>
            <Link href="/vault" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentContracts.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">No contracts uploaded yet. Draft or ingest one to view metrics.</div>
            ) : (
              recentContracts.map((c) => (
                <div key={c.id} className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-white truncate max-w-xs">{c.title}</div>
                    <div className="text-[11px] text-slate-400">Party: {c.counterparty || 'Counterparty'}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-300 font-medium">
                      {100 - (c.risk_score || 0)}/100
                    </span>
                    <Badge variant="outline" className={`text-[10px] ${
                      (c.risk_score || 0) > 30 
                        ? 'border-rose-500/40 text-rose-400 bg-rose-500/10' 
                        : 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                    }`}>
                      {(c.risk_score || 0) > 30 ? 'High Risk' : 'Compliant'}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Statutory Deadlines */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-amber-400" /> Critical Statutory Deadlines
            </h2>
            <Link href="/obligations" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
              Obligations <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {upcomingObligations.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">No pending statutory obligations registered.</div>
            ) : (
              upcomingObligations.map((ob) => (
                <div key={ob.id} className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200 truncate max-w-[200px]">{ob.title}</span>
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-950/40 border border-amber-500/30 px-1.5 py-0.5 rounded">
                      Due {new Date(ob.due_date).toLocaleDateString('en-GB')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{ob.description || 'Statutory requirement execution'}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}