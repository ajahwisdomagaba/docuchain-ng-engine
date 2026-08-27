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
  Layers,
  Sparkles,
  Search,
  FileEdit,
  Building2,
  Users,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { PLAN_PERMISSIONS, PlanTier, PlanLimits } from '@/lib/tierPermissions';
import TierFeatureLock from '@/components/TierFeatureLock';

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
  const [currentTier, setCurrentTier] = useState<PlanTier>('FREE');
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalContracts: 0,
    avgComplianceScore: 100,
    flaggedRisksCount: 0,
    pendingObligationsCount: 0,
    statutoryNoticesCount: 0,
  });
  const [recentContracts, setRecentContracts] = useState<any[]>([]);
  const [upcomingObligations, setUpcomingObligations] = useState<any[]>([]);

  const permissions: PlanLimits = PLAN_PERMISSIONS[currentTier] || PLAN_PERMISSIONS.FREE;

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

        // 1. Fetch Subscription Tier
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('plan_tier')
          .eq('user_id', currentUserId)
          .eq('status', 'ACTIVE')
          .single();

        if (sub?.plan_tier) {
          setCurrentTier(sub.plan_tier as PlanTier);
        }

        // 2. Fetch User Contracts
        const { data: contractsData } = await supabase
          .from('contracts')
          .select('*')
          .eq('user_id', currentUserId)
          .order('created_at', { ascending: false });

        // 3. Fetch User Obligations
        const { data: obligationsData } = await supabase
          .from('obligations')
          .select('*, contracts:contract_id(title, counterparty, user_id)')
          .order('due_date', { ascending: true });

        const userObligations = obligationsData?.filter(
          (o) => o.contracts?.user_id === currentUserId
        ) || [];

        if (contractsData && contractsData.length > 0) {
          const total = contractsData.length;
          const totalScore = contractsData.reduce(
            (acc, curr) => acc + (100 - (curr.risk_score || 0)),
            0
          );
          const avgScore = Math.round(totalScore / total);

          const totalFlags = contractsData.reduce((acc, curr) => {
            const flags = Array.isArray(curr.metadata?.risk_flags)
              ? curr.metadata.risk_flags.length
              : (curr.risk_score > 30 ? 2 : 0);
            return acc + flags;
          }, 0);

          const pendingObs = userObligations.filter((o) => o.status === 'PENDING');
          const statutoryNotices = pendingObs.filter((o) => o.obligation_type === 'NOTICE');

          setMetrics({
            totalContracts: total,
            avgComplianceScore: avgScore,
            flaggedRisksCount: totalFlags,
            pendingObligationsCount: pendingObs.length,
            statutoryNoticesCount: statutoryNotices.length,
          });

          setRecentContracts(contractsData.slice(0, 4));
        }

        if (userObligations.length > 0) {
          setUpcomingObligations(
            userObligations.filter((o) => o.status === 'PENDING').slice(0, 3)
          );
        }
      } catch (err: any) {
        console.warn('Dashboard live query fallback:', err.message);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 text-slate-100">
      
      {/* Welcome Banner & Tier Status */}
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
          <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-medium">Plan:</span>
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] uppercase font-bold">
              {currentTier.replace('_', ' ')}
            </Badge>
          </div>
          <Link href="/pricing">
            <Button size="sm" variant="outline" className="border-slate-700 bg-slate-900 text-xs text-slate-200 hover:bg-slate-800">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Manage Tier
            </Button>
          </Link>
          <Link href="/vault">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs">
              Open Vault
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-slate-400">Vault Capacity</CardTitle>
            <FileText className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-white mt-1">
              {metrics.totalContracts} <span className="text-xs text-slate-500 font-normal">/ {permissions.maxContracts === Infinity ? 'Unlimited' : permissions.maxContracts}</span>
            </div>
            <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Indexed in Vault
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-slate-400">Avg. Compliance Score</CardTitle>
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
            <p className="text-[11px] text-amber-400/80 mt-1">{metrics.statutoryNoticesCount} statutory notice windows</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid: Live Streams */}
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
              <div className="py-8 text-center text-xs text-slate-500">No contracts uploaded yet. Ingest a document in the vault to view metrics.</div>
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

      {/* Advanced Feature Suite (Tier-Gated) */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <h2 className="text-sm font-bold text-white tracking-tight uppercase">Advanced Feature Suite</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Feature 1: Cross-Vault Semantic RAG Search */}
          <TierFeatureLock
            featureName="Cross-Vault Semantic RAG Search"
            requiredTier="BUSINESS"
            description="Query your entire vault simultaneously with pgvector semantic similarity search and exact clause citations."
            isUnlocked={permissions.hasCrossVaultRag}
          >
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Search className="w-4 h-4 text-emerald-400" /> Cross-Vault Semantic Query
                </h3>
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">Business Tier</Badge>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ask cross-contract queries like <em>&quot;Which vendor agreements permit early determination?&quot;</em>
              </p>
              <Link href="/vault" className="block pt-2">
                <Button className="w-full bg-slate-800 hover:bg-slate-700 text-white text-xs py-2 flex items-center justify-center gap-2">
                  Launch Cross-Vault Query Assistant <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </TierFeatureLock>

          {/* Feature 2: Clause Risk Heatmap & Redlines */}
          <TierFeatureLock
            featureName="Clause Risk Heatmap & Redline Engine"
            requiredTier="BUSINESS"
            description="Automated statutory violation detection and counter-clause generator under CAMA 2020 & Lagos Tenancy rules."
            isUnlocked={permissions.hasRiskScoring}
          >
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-emerald-400" /> Clause Risk Heatmap & Redlines
                </h3>
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">Business Tier</Badge>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Inspect high-risk indemnity exposures and generate plain-English statutory counter-clauses.
              </p>
              <Link href="/risk" className="block pt-2">
                <Button className="w-full bg-slate-800 hover:bg-slate-700 text-white text-xs py-2 flex items-center justify-center gap-2">
                  Open Risk Heatmap <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </TierFeatureLock>

          {/* Feature 3: Statutory Template Drafter */}
          <TierFeatureLock
            featureName="Statutory Template Drafter & Multi-User"
            requiredTier="LEGAL_TEAM"
            description="Access full Nigerian template libraries (Tenancy, SLAs, NDAs) and invite multi-seat team members."
            isUnlocked={permissions.hasTemplateLibrary}
          >
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileEdit className="w-4 h-4 text-emerald-400" /> Nigerian Statutory Template Drafter
                </h3>
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">Legal Team Tier</Badge>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generate compliant agreements that auto-schedule notice periods in your obligation tracker.
              </p>
              <Link href="/drafter" className="block pt-2">
                <Button className="w-full bg-slate-800 hover:bg-slate-700 text-white text-xs py-2 flex items-center justify-center gap-2">
                  Open Template Drafter <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </TierFeatureLock>

          {/* Feature 4: Law Firm Reseller Client Manager */}
          <TierFeatureLock
            featureName="Law Firm Client Workspace Manager"
            requiredTier="LAW_FIRM_RESELLER"
            description="Manage distinct, white-labeled contract vaults for your corporate and property management clients."
            isUnlocked={permissions.hasClientVaultManager}
          >
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-400" /> Client Workspace Manager
                </h3>
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">Reseller Tier</Badge>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Create segregated client vaults and manage white-label branding across counterparty portals.
              </p>
              <Link href="/reseller/clients" className="block pt-2">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs py-2 flex items-center justify-center gap-2 shadow-md shadow-emerald-950">
                  <Users className="w-3.5 h-3.5" /> Manage Client Workspaces <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </TierFeatureLock>

        </div>
      </div>
    </div>
  );
}