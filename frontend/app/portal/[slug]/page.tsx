'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  Building2, 
  FileText, 
  ShieldCheck, 
  ShieldAlert, 
  Download, 
  Phone, 
  CheckCircle2, 
  Loader2, 
  AlertTriangle,
  Scale,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ClientPortalView() {
  const params = useParams();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portalData, setPortalData] = useState<{
    workspace: any;
    whiteLabel: any;
    contracts: any[];
  } | null>(null);
  const [selectedContract, setSelectedContract] = useState<any | null>(null);

  useEffect(() => {
    async function fetchPortal() {
      try {
        const res = await fetch(`/api/portal/${slug}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to load client portal');
        }

        setPortalData(data);
        if (data.contracts.length > 0) {
          setSelectedContract(data.contracts[0]);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (slug) fetchPortal();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
        <p className="text-xs">Loading secure client workspace...</p>
      </div>
    );
  }

  if (error || !portalData) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4 shadow-2xl">
          <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Invalid or Expired Portal Link</h2>
          <p className="text-xs text-slate-400">
            {error || 'This client workspace could not be verified. Please contact your law firm representative for an updated access link.'}
          </p>
        </div>
      </div>
    );
  }

  const { workspace, whiteLabel, contracts } = portalData;
  const brandColor = whiteLabel?.brand_primary_color || '#059669';

  const handleDownloadReport = (contract: any) => {
    const reportText = `STATUTORY AUDIT & REDLINE REPORT\nPrepared by: ${whiteLabel.firm_name}\nClient: ${workspace.client_name} (RC: ${workspace.company_rc_number || 'N/A'})\nContract Title: ${contract.title}\nCompliance Score: ${contract.risk_score ? 100 - contract.risk_score : 90}/100\nGoverning Framework: CAMA 2020 & Lagos State Tenancy Law 2011\n\nDISCLAIMER:\n${whiteLabel.custom_disclaimer}\n\nCONTENT PREVIEW:\n${contract.content || 'Document content archived.'}`;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${contract.title.replace(/\s+/g, '_')}_Certified_Report.txt`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      
      {/* Dynamic White-Label Navigation Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-lg"
              style={{ backgroundColor: brandColor }}
            >
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white tracking-tight">{whiteLabel.firm_name}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                Client Workspace Portal
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {whiteLabel.support_whatsapp && (
              <a 
                href={`https://wa.me/${whiteLabel.support_whatsapp.replace(/[^0-9]/g, '')}`} 
                target="_blank" 
                rel="noreferrer"
              >
                <Button size="sm" variant="outline" className="border-slate-700 bg-slate-900 text-xs text-emerald-400 hover:bg-slate-800 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> Support Line
                </Button>
              </a>
            )}
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
              Verified Client
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="max-w-7xl mx-auto w-full p-6 sm:p-8 space-y-8 flex-1">
        
        {/* Workspace Overview Banner */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-white">{workspace.client_name}</h1>
            <p className="text-xs text-slate-400">
              {workspace.industry} • RC Number: <span className="font-mono text-slate-300">{workspace.company_rc_number || 'N/A'}</span>
            </p>
          </div>

          <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6 text-xs">
            <div>
              <span className="text-slate-500 text-[11px]">Vault Status</span>
              <div className="font-semibold text-emerald-400 flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active & Audited
              </div>
            </div>
            <div>
              <span className="text-slate-500 text-[11px]">Total Documents</span>
              <div className="font-semibold text-white text-base mt-0.5">{contracts.length}</div>
            </div>
          </div>
        </div>

        {/* Contract Viewer Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Document List */}
          <div className="lg:col-span-4 space-y-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" /> Workspace Documents ({contracts.length})
            </h2>

            {contracts.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center text-xs text-slate-500">
                No contracts uploaded for this workspace yet.
              </div>
            ) : (
              <div className="space-y-2">
                {contracts.map((c) => {
                  const isSelected = selectedContract?.id === c.id;
                  const score = c.risk_score ? 100 - c.risk_score : 90;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedContract(c)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                        isSelected
                          ? 'bg-slate-900 border-emerald-500/60 shadow-lg'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-xs font-semibold text-white truncate max-w-[180px]">{c.title}</span>
                        <Badge variant="outline" className={`text-[10px] ${score >= 70 ? 'border-emerald-500/30 text-emerald-400' : 'border-rose-500/30 text-rose-400'}`}>
                          {score}/100
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>{c.domain_category || 'Commercial'}</span>
                        <span>{new Date(c.created_at).toLocaleDateString('en-GB')}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Contract Audit Inspector */}
          <div className="lg:col-span-8">
            {selectedContract ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                
                {/* Inspector Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-white">{selectedContract.title}</h3>
                    <p className="text-xs text-slate-400">
                      Counterparty: <span className="text-slate-200">{selectedContract.counterparty || 'Unspecified'}</span> • Audited on {new Date(selectedContract.created_at).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleDownloadReport(selectedContract)}
                    style={{ backgroundColor: brandColor }}
                    className="text-white text-xs font-semibold shadow-md flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" /> Download Audit Report
                  </Button>
                </div>

                {/* Score Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-xs text-slate-400">Statutory Compliance Score</span>
                    <div className="text-2xl font-bold text-emerald-400">
                      {selectedContract.risk_score ? 100 - selectedContract.risk_score : 90}/100
                    </div>
                    <p className="text-[11px] text-slate-500">Benchmarked against CAMA 2020 & Lagos Tenancy</p>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-xs text-slate-400">Auditing Firm</span>
                    <div className="text-base font-bold text-white truncate">{whiteLabel.firm_name}</div>
                    <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Certified Statutory Review
                    </p>
                  </div>
                </div>

                {/* Statutory Findings & Redlines */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Scale className="w-4 h-4 text-emerald-400" /> Legal Audit Findings & Recommendations
                  </h4>

                  {Array.isArray(selectedContract.risk_flags) && selectedContract.risk_flags.length > 0 ? (
                    selectedContract.risk_flags.map((flag: any, idx: number) => (
                      <div key={idx} className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-rose-300 flex items-center gap-1.5">
                            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" /> {flag.rule || 'Statutory Non-Compliance'}
                          </span>
                          <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 text-[10px]">
                            {flag.type || 'FLAGGED'}
                          </Badge>
                        </div>
                        <p className="text-slate-300">{flag.issue}</p>
                        {flag.recommendation && (
                          <div className="bg-emerald-950/20 border border-emerald-900/40 p-2.5 rounded-lg text-emerald-300">
                            <strong>Recommended Revision:</strong> {flag.recommendation}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 text-xs text-slate-400 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>No major statutory infringements identified in this agreement.</span>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-xs text-slate-500 space-y-2">
                <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                <p>Select a document from the left to inspect its statutory audit.</p>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Footer with Custom Disclaimer */}
      <footer className="border-t border-slate-800 bg-slate-900/40 py-6 px-6 text-center text-[11px] text-slate-500 space-y-1">
        <p>{whiteLabel.custom_disclaimer}</p>
        <p className="text-slate-600">Powered by DocuChain NG Legal AI Engine</p>
      </footer>

    </div>
  );
}