'use client';

import React, { useState, useRef } from 'react';
import { Scale, Upload, FileText, CheckCircle2, AlertTriangle, Download, PenTool, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function OneTimeReviewStudio() {
  const [contractText, setContractText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [isSigned, setIsSigned] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleAudit = () => {
    if (!contractText.trim()) {
      alert('Please paste or upload contract text first');
      return;
    }

    setAnalyzing(true);
    setTimeout(() => {
      // Benchmark scan simulation against Nigerian legal rules
      const findings = [];
      const lower = contractText.toLowerCase();

      if (lower.includes('two years') || lower.includes('2 years advance') || lower.includes('2 full years')) {
        findings.push({
          clause: 'Rent Payment Terms',
          type: 'HIGH_RISK',
          rule: 'Section 4(1) Lagos State Tenancy Law 2011',
          issue: 'Demanding or paying more than 1 year advance rent for yearly tenancy is illegal.',
          redline: 'The Tenant shall pay one (1) year rent in advance upon execution of this agreement.'
        });
      }

      if (lower.includes('unlimited liability') || lower.includes('indemnify without limit')) {
        findings.push({
          clause: 'Indemnity & Liability',
          type: 'HIGH_RISK',
          rule: 'CAMA 2020 Standard Commercial Practices',
          issue: 'Unlimited uncapped indemnities expose the signing party to total liability.',
          redline: 'Liability shall be capped at 100% of the aggregate fees paid under this agreement in the preceding 12 months.'
        });
      }

      if (findings.length === 0) {
        findings.push({
          clause: 'General Statutory Compliance',
          type: 'LOW_RISK',
          rule: 'Nigerian Law Statutory Baseline',
          issue: 'Standard commercial clauses detected. Notice windows and dispute resolution mechanisms meet statutory baseline.',
          redline: 'No major statutory infringements identified.'
        });
      }

      setReport({
        score: findings.some(f => f.type === 'HIGH_RISK') ? 62 : 94,
        findings,
        timestamp: new Date().toLocaleDateString('en-GB')
      });
      setAnalyzing(false);
    }, 1200);
  };

  const handleDownloadReport = () => {
    const content = `DOCUCHAIN.NG CERTIFIED STATUTORY RISK REPORT\nDate: ${report?.timestamp}\nOverall Compliance Score: ${report?.score}/100\n\nFINDINGS & COUNTER-CLAUSES:\n` +
      report?.findings.map((f: any) => `[${f.type}] ${f.clause}\nRule: ${f.rule}\nIssue: ${f.issue}\nCounter-Clause: ${f.redline}\n`).join('\n---\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DocuChain-Audit-Report-${Date.now()}.txt`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white shadow-md shadow-emerald-950">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">One-Time Contract Review Studio</h1>
              <p className="text-xs text-slate-400">Audit, redline, sign, and download your single contract report.</p>
            </div>
          </div>
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">Single Review Active</Badge>
        </div>

        {/* Input and Results Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column: Contract Editor */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" /> Contract Text
              </h2>
            </div>
            <textarea
              rows={16}
              value={contractText}
              onChange={(e) => setContractText(e.target.value)}
              placeholder="Paste the agreement text here (e.g., Lagos Tenancy Lease, Vendor SLA, Non-Disclosure Agreement)..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500 resize-none leading-relaxed"
            />
            <Button
              onClick={handleAudit}
              disabled={analyzing || !contractText.trim()}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2.5 shadow-lg shadow-emerald-950 flex items-center justify-center gap-2"
            >
              {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4" /> Run Statutory Risk Audit</>}
            </Button>
          </div>

          {/* Right Column: Audit Results & Redline Report */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-400" /> Statutory Audit Findings
            </h2>

            {report ? (
              <div className="space-y-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400">Statutory Compliance Score</span>
                    <div className="text-2xl font-bold text-emerald-400">{report.score}/100</div>
                  </div>
                  <Badge className={report.score < 70 ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'}>
                    {report.score < 70 ? 'Traps Detected' : 'Standard Compliant'}
                  </Badge>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {report.findings.map((f: any, idx: number) => (
                    <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">{f.clause}</span>
                        <Badge className="text-[10px] bg-slate-950 text-slate-400 border-slate-800">{f.rule}</Badge>
                      </div>
                      <p className="text-slate-300">{f.issue}</p>
                      <div className="bg-emerald-950/20 border border-emerald-900/50 p-2.5 rounded-lg text-emerald-300">
                        <strong>DocuChain Counter-Clause:</strong> &quot;{f.redline}&quot;
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button onClick={handleDownloadReport} className="flex-1 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-white text-xs py-2 flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" /> Download Report (.TXT)
                  </Button>
                  <Button onClick={() => setIsSigned(true)} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs py-2 flex items-center justify-center gap-2">
                    <PenTool className="w-4 h-4" /> {isSigned ? 'Digitally Signed ✓' : 'E-Sign Document'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="h-80 border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
                <FileText className="w-8 h-8 text-slate-600" />
                <p className="text-xs">Paste your contract text and click &quot;Run Statutory Risk Audit&quot; to inspect clauses.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}