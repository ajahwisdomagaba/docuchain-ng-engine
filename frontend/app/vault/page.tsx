'use client';

import React, { useEffect, useState } from 'react';
import { UploadDropzone } from '@/components/vault/upload-dropzone';
import { ContractTable } from '@/components/vault/contract-table';
import { ReviewResult } from '@/lib/api';
import { Contract } from '@/lib/types';
import { ShieldAlert, Scale, Users, Calendar, RefreshCw } from 'lucide-react';

export default function VaultPage() {
  const [auditData, setAuditData] = useState<ReviewResult | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loadingContracts, setLoadingContracts] = useState<boolean>(false);

  const fetchContracts = async () => {
    try {
      setLoadingContracts(true);
      const res = await fetch('http://localhost:3000/api/contracts');
      if (res.ok) {
        const data = await res.json();
        setContracts(data.contracts || []);
      }
    } catch (err) {
      console.error('Failed to load vault contracts:', err);
    } finally {
      setLoadingContracts(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const formatNaira = (amount?: number) => {
    if (!amount) return '₦0';
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto text-slate-900">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Contract Vault & Smart Ingestion</h1>
        <p className="text-sm text-slate-500 mt-1">
          Ingest agreements for automated extraction, statutory audit, and compliance storage.
        </p>
      </div>

      {/* Direct Ingestion Dropzone */}
      <UploadDropzone
        onAuditComplete={(res) => {
          setAuditData(res);
          fetchContracts();
        }}
      />

      {/* Live Audit Report */}
      {auditData && (
        <div className="space-y-6 border-t border-slate-200 pt-8 mt-6">
          {/* Audit Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
                <Scale className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Audit Report: {auditData.extractedData.documentTitle || 'Tenancy Agreement'}
                </h2>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                  <Users className="h-3.5 w-3.5 text-slate-400" />
                  <span>
                    {auditData.extractedData.parties?.map((p) => `${p.name} (${p.role})`).join(' vs ') || 'Parties extracted'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border ${
                  auditData.redlineReport.overallRiskLevel === 'High'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                {auditData.redlineReport.overallRiskLevel} Risk Status
              </span>
            </div>
          </div>

          {/* Extracted Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
              <span className="text-slate-500 text-xs font-medium uppercase tracking-wider block">Jurisdiction</span>
              <span className="text-slate-900 text-sm font-semibold mt-1 block">
                {auditData.extractedData.propertyLocationState || 'Lagos'}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Exempt Area: {auditData.extractedData.isExemptArea ? 'Yes' : 'No'}
              </span>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
              <span className="text-slate-500 text-xs font-medium uppercase tracking-wider block">Tenancy Structure</span>
              <span className="text-slate-900 text-sm font-semibold mt-1 block">
                {auditData.extractedData.tenancyType}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Duration: {auditData.extractedData.tenureDurationMonths || 12} Mo.
              </span>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
              <span className="text-slate-500 text-xs font-medium uppercase tracking-wider block">Rent & Demand</span>
              <span className="text-slate-900 text-sm font-semibold mt-1 block">
                {formatNaira(auditData.extractedData.paymentTerms?.amount)} / yr
              </span>
              <span className="text-[11px] font-semibold text-rose-600 mt-0.5 block">
                {auditData.extractedData.paymentTerms?.advanceRentMonthsDemanded} Months Demanded
              </span>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
              <span className="text-slate-500 text-xs font-medium uppercase tracking-wider block">Notice Period</span>
              <span className="text-slate-900 text-sm font-semibold mt-1 block">
                {auditData.extractedData.noticePeriodDays} Days
              </span>
              <span className="text-[11px] text-amber-600 mt-0.5 block font-medium">
                Statutory: 180 Days
              </span>
            </div>
          </div>

          {/* Statutory Redlines Recommendations */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-rose-600" />
                Statutory Redline Recommendations ({auditData.redlineReport.recommendations.length})
              </h3>
              <span className="text-xs text-slate-500">Lagos Tenancy Law 2011 Compliance</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {auditData.redlineReport.recommendations.map((rec, i) => (
                <div key={i} className="bg-white border border-rose-200 rounded-xl p-5 space-y-3 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-rose-700 text-xs bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      {rec.statutoryReference}
                    </span>
                    <span className="text-slate-400 font-mono text-[10px] uppercase font-semibold">
                      {rec.fieldPath}
                    </span>
                  </div>

                  <p className="text-xs text-rose-900 font-medium leading-relaxed">
                    {rec.legalViolation}
                  </p>

                  <div className="bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-lg text-xs font-mono text-emerald-900">
                    <span className="text-[10px] text-emerald-700 block font-sans uppercase font-bold mb-1">
                      Proposed Statutory Redline:
                    </span>
                    "{rec.proposedRedlineClause}"
                  </div>

                  <p className="text-[11px] text-slate-600 italic">
                    {rec.redlineRationale}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Historical Repository Section */}
      <div className="pt-8 border-t border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Ingested Contracts Repository</h2>
            <p className="text-xs text-slate-500">All historical agreements and audits stored in Supabase</p>
          </div>
          <button
            onClick={fetchContracts}
            disabled={loadingContracts}
            className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-1.5 disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingContracts ? 'animate-spin' : ''}`} />
            Refresh Repository
          </button>
        </div>

        <ContractTable contracts={contracts} />
      </div>
    </div>
  );
}