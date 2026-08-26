'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  ShieldAlert, 
  Scale, 
  AlertTriangle, 
  Building2, 
  Briefcase, 
  Users, 
  CheckCircle,
  FileText,
  ArrowRight,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

interface RiskExposureItem {
  id: string;
  contractTitle: string;
  counterparty: string;
  category: 'LAGOS_TENANCY' | 'CAMA_2020' | 'LABOUR_ACT' | 'GENERAL_CONTRACT';
  riskLevel: 'CRITICAL' | 'ELEVATED' | 'LOW';
  statutoryBasis: string;
  exposureSummary: string;
  remedy: string;
}

const DEFAULT_RISK_MATRIX: RiskExposureItem[] = [
  {
    id: 'r-1',
    contractTitle: 'Commercial Lease Agreement - Lekki Phase 1',
    counterparty: 'Oakwood Properties Ltd',
    category: 'LAGOS_TENANCY',
    riskLevel: 'CRITICAL',
    statutoryBasis: 'Lagos State Tenancy Law 2011, Section 4',
    exposureSummary: '2-year advance rent demanded for yearly tenant; exceeds statutory 1-year ceiling.',
    remedy: 'Amend consideration clause to annual ₦7,000,000 disbursement.'
  },
  {
    id: 'r-2',
    contractTitle: 'Commercial Lease Agreement - Lekki Phase 1',
    counterparty: 'Oakwood Properties Ltd',
    category: 'LAGOS_TENANCY',
    riskLevel: 'CRITICAL',
    statutoryBasis: 'Lagos State Tenancy Law 2011, Section 13(1)',
    exposureSummary: 'Deficient 2-week notice to quit on yearly term instead of mandatory 6 months.',
    remedy: 'Insert statutory 6-month notice requirement.'
  },
  {
    id: 'r-3',
    contractTitle: 'Cloud Infrastructure & Maintenance SLA',
    counterparty: 'CloudCore Systems Nigeria',
    category: 'CAMA_2020',
    riskLevel: 'ELEVATED',
    statutoryBasis: 'Nigerian Tax Laws / WHT Provisions',
    exposureSummary: 'Unilateral tax gross-up clause shifting statutory withholding tax deduction back to client.',
    remedy: 'Strike gross-up condition; specify net-of-tax remittance to FIRS/LIRS.'
  },
  {
    id: 'r-4',
    contractTitle: 'Mutual Non-Disclosure Agreement',
    counterparty: 'Apex Fintech Solutions',
    category: 'GENERAL_CONTRACT',
    riskLevel: 'LOW',
    statutoryBasis: 'Nigerian Restraint of Trade Precedents',
    exposureSummary: 'Perpetual confidentiality term with wide geographic West Africa restraint.',
    remedy: 'Limit confidentiality term to 2-3 years post-expiration.'
  }
];

export default function RiskHeatmapPage() {
  const { user } = useAuth();
  const [riskData, setRiskData] = useState<RiskExposureItem[]>(DEFAULT_RISK_MATRIX);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');

  useEffect(() => {
    async function loadRiskData() {
      try {
        let currentUserId = user?.id;
        if (!currentUserId) {
          const { data: authData } = await supabase.auth.getUser();
          currentUserId = authData?.user?.id;
        }

        if (!currentUserId) return;

        const { data: contracts } = await supabase
          .from('contracts')
          .select('*')
          .order('risk_score', { ascending: false });

        if (contracts && contracts.length > 0) {
          const mappedRisks: RiskExposureItem[] = [];

          contracts.forEach((c) => {
            const flags = c.metadata?.risk_flags;
            if (Array.isArray(flags) && flags.length > 0) {
              flags.forEach((f: any, idx: number) => {
                let cat: RiskExposureItem['category'] = 'GENERAL_CONTRACT';
                if ((f.legalBasis || '').includes('Tenancy')) cat = 'LAGOS_TENANCY';
                else if ((f.legalBasis || '').includes('CAMA') || (f.legalBasis || '').includes('Tax')) cat = 'CAMA_2020';
                else if ((f.legalBasis || '').includes('Labour')) cat = 'LABOUR_ACT';

                mappedRisks.push({
                  id: `${c.id}-${idx}`,
                  contractTitle: c.title,
                  counterparty: c.counterparty || 'Counterparty',
                  category: cat,
                  riskLevel: f.riskLevel === 'HIGH' ? 'CRITICAL' : f.riskLevel === 'MEDIUM' ? 'ELEVATED' : 'LOW',
                  statutoryBasis: f.legalBasis || 'Statutory Non-Compliance',
                  exposureSummary: f.plainEnglishExplanation || f.issueSummary || 'Flagged statutory risk clause.',
                  remedy: f.recommendedRedline || 'Apply recommended statutory redline.'
                });
              });
            }
          });

          if (mappedRisks.length > 0) {
            setRiskData(mappedRisks);
          }
        }
      } catch (err: any) {
        console.warn('Risk matrix query fallback:', err.message);
      }
    }

    loadRiskData();
  }, [user]);

  const filteredRisks = useMemo(() => {
    if (selectedFilter === 'ALL') return riskData;
    return riskData.filter((r) => r.category === selectedFilter);
  }, [riskData, selectedFilter]);

  const criticalCount = riskData.filter(r => r.riskLevel === 'CRITICAL').length;
  const elevatedCount = riskData.filter(r => r.riskLevel === 'ELEVATED').length;
  const lowCount = riskData.filter(r => r.riskLevel === 'LOW').length;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-rose-400" />
            Statutory Risk Heatmap Matrix
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Contractual exposure classified against Lagos Tenancy Law 2011, CAMA 2020, and Labour Act baselines.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/vault">
            <button className="bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors">
              <FileText className="w-3.5 h-3.5 text-emerald-400" /> Go to Vault
            </button>
          </Link>
        </div>
      </div>

      {/* Risk Distribution Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-rose-950/30 border border-rose-500/30 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-rose-300">Critical Statutory Violations</span>
            <div className="text-2xl font-bold text-rose-400 mt-0.5">{criticalCount}</div>
            <p className="text-[11px] text-rose-300/70 mt-1">Void ab initio or criminalized by statute</p>
          </div>
          <AlertTriangle className="w-8 h-8 text-rose-500/40" />
        </div>

        <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-amber-300">Elevated Commercial Risks</span>
            <div className="text-2xl font-bold text-amber-400 mt-0.5">{elevatedCount}</div>
            <p className="text-[11px] text-amber-300/70 mt-1">Unbalanced liability or tax indemnities</p>
          </div>
          <Scale className="w-8 h-8 text-amber-500/40" />
        </div>

        <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-300">Low Risk / Advisory Items</span>
            <div className="text-2xl font-bold text-emerald-400 mt-0.5">{lowCount}</div>
            <p className="text-[11px] text-emerald-300/70 mt-1">Minor restraint or clarity adjustments</p>
          </div>
          <CheckCircle className="w-8 h-8 text-emerald-500/40" />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 pt-2">
        {[
          { key: 'ALL', label: 'All Frameworks' },
          { key: 'LAGOS_TENANCY', label: 'Lagos Tenancy Law 2011' },
          { key: 'CAMA_2020', label: 'CAMA 2020 / Tax' },
          { key: 'LABOUR_ACT', label: 'Labour Act' },
          { key: 'GENERAL_CONTRACT', label: 'General Commercial' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedFilter(tab.key)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              selectedFilter === tab.key
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Risk Cards Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRisks.map((item) => (
          <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3.5 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className={`text-[10px] ${
                  item.riskLevel === 'CRITICAL' 
                    ? 'border-rose-500/40 text-rose-400 bg-rose-500/10'
                    : item.riskLevel === 'ELEVATED'
                    ? 'border-amber-500/40 text-amber-400 bg-amber-500/10'
                    : 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                }`}>
                  {item.riskLevel} EXPOSURE
                </Badge>
                <span className="text-[11px] font-mono text-slate-400">{item.statutoryBasis}</span>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white">{item.contractTitle}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Counterparty: {item.counterparty}</p>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                <span className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider block mb-0.5">
                  Statutory Violation:
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">{item.exposureSummary}</p>
              </div>
            </div>

            <div className="bg-emerald-950/20 p-3 rounded-lg border border-emerald-900/30">
              <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider block mb-0.5">
                Recommended Redline / Remedy:
              </span>
              <p className="text-xs text-slate-200 leading-relaxed">{item.remedy}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}