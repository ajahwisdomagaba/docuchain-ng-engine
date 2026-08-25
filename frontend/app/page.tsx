import React from 'react';
import Link from 'next/link';
import { 
  FileCheck2, 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  ArrowRight,
  Building2,
  Scale
} from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Executive Control & Risk Center</h1>
        <p className="text-slate-400 text-sm mt-1">Real-time statutory audits and obligation monitors under Nigerian Law.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Active Contracts</span>
            <FileCheck2 className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="mt-3 text-2xl font-bold text-white">42</div>
          <span className="text-xs text-emerald-400 flex items-center gap-1 mt-1 font-medium">
            <TrendingUp className="h-3 w-3" /> +12% this quarter
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Upcoming Renewals</span>
            <Clock className="h-5 w-5 text-amber-500" />
          </div>
          <div className="mt-3 text-2xl font-bold text-white">7</div>
          <span className="text-xs text-amber-400 mt-1 block">3 expiring within 30 days</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Pending Rent / Payouts</span>
            <span className="text-emerald-400 font-bold text-lg">₦</span>
          </div>
          <div className="mt-3 text-2xl font-bold text-white">₦ 18,500,000</div>
          <span className="text-xs text-slate-400 mt-1 block">4 milestone releases pending</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">High Risk Flags</span>
            <AlertTriangle className="h-5 w-5 text-rose-500" />
          </div>
          <div className="mt-3 text-2xl font-bold text-rose-400">3</div>
          <span className="text-xs text-rose-400 mt-1 block">Lagos Tenancy Law breaches</span>
        </div>
      </div>

      {/* Action Feed & Quick Ingestion */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">Urgent Statutory & Action Feed</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">Action Required</span>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 bg-slate-950/60 border border-rose-500/20 rounded-lg flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-rose-400">ILLEGAL ADVANCE RENT DEMAND</span>
                  <span className="text-slate-500 text-[11px]">• Section 4, Lagos Tenancy Law</span>
                </div>
                <p className="text-sm text-slate-200">Chief Adebayo vs Emeka Obi (Surulere Tenancy)</p>
                <p className="text-xs text-slate-400">Demanding 2 years upfront rent on a yearly residential tenancy.</p>
              </div>
              <Link href="/vault" className="text-xs font-medium text-emerald-400 hover:underline flex items-center gap-1">
                Redline <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="p-3.5 bg-slate-950/60 border border-amber-500/20 rounded-lg flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-400">NOTICE DEFICIT</span>
                  <span className="text-slate-500 text-[11px]">• Section 13(1)(e)</span>
                </div>
                <p className="text-sm text-slate-200">Commercial Lease Agreement — Victoria Island Suite</p>
                <p className="text-xs text-slate-400">Termination clause specifies 1 month notice instead of statutory period.</p>
              </div>
              <Link href="/vault" className="text-xs font-medium text-emerald-400 hover:underline flex items-center gap-1">
                Redline <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Launch Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-white mb-2">Review New Contract</h2>
            <p className="text-xs text-slate-400 mb-4">
              Ingest PDF, DOCX, or text agreements for automated Lagos Tenancy Law 2011 redlining.
            </p>
            <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-lg p-6 text-center transition-colors">
              <Scale className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-xs text-slate-300 font-medium">Lagos Tenancy Law Compliance</p>
              <span className="text-[10px] text-slate-500">Statutory Redlines & Audit</span>
            </div>
          </div>
          <Link
            href="/vault"
            className="w-full mt-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg text-center transition-colors block"
          >
            Launch Vault Workspace
          </Link>
        </div>
      </div>
    </div>
  );
}