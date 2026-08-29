'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  ShieldAlert, 
  ShieldCheck, 
  FileText, 
  Copy, 
  Check, 
  Calendar, 
  Scale, 
  Sparkles, 
  Download, 
  Bot, 
  Send, 
  X, 
  Loader2,
  Building2,
  Lock,
  FileCode,
  RotateCcw,
  CheckCheck,
  Save,
  SplitSquareVertical
} from 'lucide-react';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabaseClient';

interface RiskFlag {
  id?: string;
  clauseTitle: string;
  originalText: string;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  issueSummary: string;
  legalBasis: string;
  recommendedRedline: string;
  plainEnglishExplanation: string;
  isApplied?: boolean;
}

interface WorkspaceBranding {
  firm_name: string;
  primary_color: string;
  portal_subheading: string;
  support_email?: string;
}

function hexToRgb(hex: string): [number, number, number] {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(char => char + char).join('');
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) return [16, 185, 129];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contractId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [savingChanges, setSavingChanges] = useState(false);
  const [contract, setContract] = useState<any>(null);
  const [originalDraft, setOriginalDraft] = useState<string>('');
  const [editedDraft, setEditedDraft] = useState<string>('');
  const [viewMode, setViewMode] = useState<'split' | 'editor'>('split');
  const [riskFlags, setRiskFlags] = useState<RiskFlag[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [branding, setBranding] = useState<WorkspaceBranding | null>(null);

  // AI Q&A Drawer State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string }>>([
    {
      sender: 'ai',
      text: 'DocuChain Statutory Co-Pilot online. Ask questions regarding clause redlines, Nigerian compliance, or execution.'
    }
  ]);

  useEffect(() => {
    async function loadContractData() {
      if (!contractId) return;
      setLoading(true);

      try {
        const { data, error } = await supabase
          .from('contracts')
          .select('*, risk_flags(*)')
          .eq('id', contractId)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setContract(data);

          let meta = data.metadata;
          if (typeof meta === 'string') {
            try { meta = JSON.parse(meta); } catch { meta = {}; }
          }

          const fullDraft = 
            data.content || 
            meta?.rawDraft || 
            meta?.extractedText || 
            meta?.rawText || 
            data.raw_text || 
            '';

          setOriginalDraft(fullDraft);
          setEditedDraft(fullDraft);

          if (Array.isArray(data.risk_flags) && data.risk_flags.length > 0) {
            setRiskFlags(data.risk_flags.map((rf: any) => ({
              id: rf.id,
              clauseTitle: rf.clause_title || 'Statutory Deviation',
              originalText: rf.original_text || '',
              riskLevel: (rf.risk_level || 'HIGH').toUpperCase(),
              issueSummary: rf.issue_summary || rf.plain_english_explanation || 'Statutory misalignment identified',
              legalBasis: rf.legal_basis || 'Nigerian Legal Framework',
              recommendedRedline: rf.recommended_redline || 'Standard statutory redline clause',
              plainEnglishExplanation: rf.plain_english_explanation || 'Requires redlining before execution',
              isApplied: rf.status === 'RESOLVED'
            })));
          } else if (Array.isArray(meta?.risk_flags) && meta.risk_flags.length > 0) {
            setRiskFlags(meta.risk_flags.map((rf: any) => ({
              ...rf,
              isApplied: rf.status === 'RESOLVED' || rf.isApplied === true
            })));
          }

          // Fetch firm branding
          let wsId = data.workspace_id || meta?.workspaceId;
          if (!wsId && data.client_id) {
            const { data: clientData } = await supabase
              .from('workspace_clients')
              .select('workspace_id')
              .eq('id', data.client_id)
              .maybeSingle();
            wsId = clientData?.workspace_id;
          }

          if (wsId) {
            const { data: wsData } = await supabase
              .from('workspaces')
              .select('firm_name, primary_color, portal_subheading, support_email')
              .eq('id', wsId)
              .maybeSingle();
            if (wsData) setBranding(wsData);
          }
        }
      } catch (err: any) {
        console.error('Failed to load contract:', err.message);
      } finally {
        setLoading(false);
      }
    }

    loadContractData();
  }, [contractId]);

  // Apply or Revert an Individual AI Redline
  const toggleApplyRedline = (index: number) => {
    const flag = riskFlags[index];
    const isCurrentlyApplied = flag.isApplied;

    if (!isCurrentlyApplied) {
      let updated = editedDraft;
      if (flag.originalText && updated.includes(flag.originalText.trim())) {
        updated = updated.replace(flag.originalText.trim(), flag.recommendedRedline.trim());
      } else {
        const firstLine = flag.originalText.split('\n')[0].trim();
        if (firstLine && updated.includes(firstLine)) {
          const regex = new RegExp(firstLine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[^\\n]*', 'g');
          updated = updated.replace(regex, flag.recommendedRedline.trim());
        } else {
          updated += `\n\n[STATUTORY REDLINE - ${flag.clauseTitle}]:\n${flag.recommendedRedline.trim()}`;
        }
      }
      setEditedDraft(updated);
    } else {
      let updated = editedDraft;
      if (flag.recommendedRedline && updated.includes(flag.recommendedRedline.trim())) {
        updated = updated.replace(flag.recommendedRedline.trim(), flag.originalText.trim());
      }
      setEditedDraft(updated);
    }

    setRiskFlags((prev) =>
      prev.map((f, i) => (i === index ? { ...f, isApplied: !isCurrentlyApplied } : f))
    );
  };

  // Apply ALL Redlines in one click
  const handleApplyAllRedlines = () => {
    let draft = originalDraft;
    const updatedFlags = riskFlags.map((flag) => {
      if (flag.originalText && draft.includes(flag.originalText.trim())) {
        draft = draft.replace(flag.originalText.trim(), flag.recommendedRedline.trim());
      } else {
        draft += `\n\n[STATUTORY REDLINE - ${flag.clauseTitle}]:\n${flag.recommendedRedline.trim()}`;
      }
      return { ...flag, isApplied: true };
    });
    setEditedDraft(draft);
    setRiskFlags(updatedFlags);
  };

  // Save Modified Redlined Version & Update Relational Risk Flags in Supabase
  const handleSaveDraftChanges = async () => {
    setSavingChanges(true);
    try {
      const currentMeta = typeof contract.metadata === 'string' 
        ? JSON.parse(contract.metadata) 
        : (contract.metadata || {});

      const appliedFlags = riskFlags.filter(f => f.isApplied);
      const remainingViolationsCount = riskFlags.length - appliedFlags.length;
      
      // Dynamic score computation
      const updatedRiskScore = Math.max(0, Math.round((remainingViolationsCount / Math.max(1, riskFlags.length)) * 50));
      const updatedOverallScore = 100 - updatedRiskScore;

      // 1. Update Contract Record & Metadata
      const { error: contractErr } = await supabase
        .from('contracts')
        .update({
          risk_score: updatedRiskScore,
          status: remainingViolationsCount === 0 ? 'Compliant' : 'Partially Redlined',
          version: (contract.version || 1) + 1,
          metadata: {
            ...currentMeta,
            rawDraft: editedDraft,
            extractedText: editedDraft,
            overallScore: updatedOverallScore,
            risk_flags: riskFlags.map(rf => ({ ...rf, status: rf.isApplied ? 'RESOLVED' : 'OPEN' })),
            last_redlined_at: new Date().toISOString()
          }
        })
        .eq('id', contract.id);

      if (contractErr) throw contractErr;

      // 2. Update Relational risk_flags Table Status
      for (const flag of riskFlags) {
        if (flag.id) {
          await supabase
            .from('risk_flags')
            .update({ status: flag.isApplied ? 'RESOLVED' : 'OPEN' })
            .eq('id', flag.id);
        }
      }

      setContract((prev: any) => ({
        ...prev,
        risk_score: updatedRiskScore,
        version: (prev.version || 1) + 1,
        status: remainingViolationsCount === 0 ? 'Compliant' : 'Partially Redlined'
      }));

      alert('Redlined contract saved! Risk score and portfolio heatmap updated.');
    } catch (err: any) {
      alert(`Failed to save redline revisions: ${err.message}`);
    } finally {
      setSavingChanges(false);
    }
  };

  // Export Clean Redlined Contract as .DOCX (Microsoft Word)
  const handleExportDocx = async () => {
    try {
      const cleanTitle = (contract?.title || 'Contract Agreement').replace(/[^a-zA-Z0-9 ]/g, '');
      const paragraphs = editedDraft.split('\n').map((line) => {
        const isHeader = line.trim().startsWith('#') || (line.trim().toUpperCase() === line && line.trim().length > 3 && line.trim().length < 60);
        return new Paragraph({
          text: line.replace(/^#+\s*/, ''),
          heading: isHeader ? HeadingLevel.HEADING_2 : undefined,
          spacing: { after: 120 }
        });
      });

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                text: cleanTitle,
                heading: HeadingLevel.TITLE,
                spacing: { after: 240 }
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: `Redlined & Statutory Verified by DocuChain NG (${branding?.firm_name || 'Legal Suite'})`, italics: true, color: '666666' })
                ],
                spacing: { after: 300 }
              }),
              ...paragraphs
            ]
          }
        ]
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${cleanTitle.replace(/\s+/g, '_')}_Redlined.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Failed to generate DOCX file: ${err.message}`);
    }
  };

  // Export Full Statutory PDF Certificate
  const handleExportPDF = () => {
    if (!contract) return;
    const doc = new jsPDF();
    const appliedCount = riskFlags.filter(f => f.isApplied).length;
    const remainingCount = riskFlags.length - appliedCount;
    const complianceScore = Math.max(0, 100 - Math.round((remainingCount / Math.max(1, riskFlags.length)) * 50));

    const firmName = branding?.firm_name || 'DocuChain NG Legal Intelligence';
    const primaryColorHex = branding?.primary_color || '#10b981';
    const [brandR, brandG, brandB] = hexToRgb(primaryColorHex);

    const cleanText = (str: string) => {
      if (!str) return '';
      return str.replace(/₦/g, 'NGN ').replace(/[^\x00-\x7F]/g, '');
    };

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setFillColor(brandR, brandG, brandB);
    doc.rect(0, 40, 210, 3, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(cleanText(firmName.toUpperCase()), 14, 18);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(brandR, brandG, brandB);
    doc.text('REDLINED STATUTORY COMPLIANCE CERTIFICATE', 14, 26);

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 49, 182, 32, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 49, 182, 32, 2, 2, 'S');

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('AUDIT & REDLINE SUMMARY', 20, 56);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Title: ${cleanText(contract.title || 'Audited Agreement')}`, 20, 63);
    doc.text(`Counterparty: ${cleanText(contract.counterparty || 'Entity')}`, 20, 69);
    doc.text(`Applied Redlines: ${appliedCount} of ${riskFlags.length} resolved`, 20, 75);

    doc.setFillColor(complianceScore >= 70 ? 236 : 255, complianceScore >= 70 ? 253 : 241, complianceScore >= 70 ? 245 : 242);
    doc.roundedRect(140, 53, 50, 24, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(complianceScore >= 70 ? 5 : 190, complianceScore >= 70 ? 150 : 18, complianceScore >= 70 ? 105 : 60);
    doc.text(`${complianceScore}/100`, 165, 64, { align: 'center' });
    doc.setFontSize(7.5);
    doc.text(complianceScore >= 70 ? 'COMPLIANT' : 'PARTIAL REDLINE', 165, 71, { align: 'center' });

    let yPos = 90;
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`STATUTORY REDLINE AUDIT TRAIL (${riskFlags.length})`, 14, yPos);
    yPos += 6;

    riskFlags.forEach((risk) => {
      if (yPos > 225) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFillColor(risk.isApplied ? 240 : 254, risk.isApplied ? 253 : 242, risk.isApplied ? 244 : 242);
      doc.rect(14, yPos, 182, 7, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(risk.isApplied ? 22 : 225, risk.isApplied ? 101 : 29, risk.isApplied ? 52 : 72);
      doc.text(`[${risk.isApplied ? 'RESOLVED REDLINE' : 'FLAGGED'}] ${cleanText(risk.clauseTitle)}`, 17, yPos + 5);
      yPos += 11;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text('Statutory Basis: ', 17, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(cleanText(risk.legalBasis), 42, yPos);
      yPos += 5;

      const redlineText = `Applied Text: ${cleanText(risk.recommendedRedline)}`;
      const redlineLines = doc.splitTextToSize(redlineText, 172);
      const boxHeight = redlineLines.length * 4.5 + 4;

      doc.setFillColor(248, 250, 252);
      doc.rect(17, yPos, 177, boxHeight, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(17, yPos, 177, boxHeight, 'S');

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(redlineLines, 20, yPos + 4);
      yPos += boxHeight + 8;
    });

    const cleanTitle = cleanText(contract.title || 'Contract').replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`${cleanTitle}_Statutory_Certificate.pdf`);
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const msg = chatInput;
    setChatMessages((prev) => [...prev, { sender: 'user', text: msg }]);
    setChatInput('');

    let aiAnswer = 'Under Nigerian commercial jurisprudence and statutory benchmarks, this clause must align with CAMA 2020 and relevant High Court rules.';
    if (msg.toLowerCase().includes('notice') || msg.toLowerCase().includes('terminate')) {
      aiAnswer = 'Under Section 13 of the Lagos State Tenancy Law 2011, a yearly tenancy mandates at least 6 months written notice to quit.';
    } else if (msg.toLowerCase().includes('rent') || msg.toLowerCase().includes('advance')) {
      aiAnswer = 'Demanding or paying rent in excess of 1 year in advance for a yearly tenancy in Lagos is an offense under Section 4 of the Lagos Tenancy Law 2011.';
    }

    setChatMessages((prev) => [...prev, { sender: 'ai', text: aiAnswer }]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
        <p className="text-xs">Loading contract and redline editor workspace...</p>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
        <h1 className="text-lg font-bold text-white mb-2">Contract Not Found</h1>
        <Button onClick={() => router.back()} variant="outline" size="sm" className="text-xs border-slate-700">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Return
        </Button>
      </div>
    );
  }

  const appliedRedlinesCount = riskFlags.filter((f) => f.isApplied).length;
  const remainingCount = riskFlags.length - appliedRedlinesCount;
  const dynamicComplianceScore = Math.max(0, 100 - Math.round((remainingCount / Math.max(1, riskFlags.length)) * 50));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header & Export Controls */}
      <div className="border-b border-slate-800 bg-slate-900/60 px-6 py-3.5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.back()}
            className="hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white">{contract.title}</h1>
              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                v{contract.version || 1}
              </Badge>
              {branding?.firm_name && (
                <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-400">
                  {branding.firm_name}
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Counterparty: <span className="text-slate-200">{contract.counterparty || 'Entity'}</span> • Governing Law: Laws of Lagos State / Nigeria
            </p>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('split')}
              className={`px-2.5 py-1 rounded-md transition-all ${viewMode === 'split' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
            >
              Split View
            </button>
            <button
              onClick={() => setViewMode('editor')}
              className={`px-2.5 py-1 rounded-md transition-all ${viewMode === 'editor' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
            >
              Clean Editor
            </button>
          </div>

          <Button
            size="sm"
            onClick={handleApplyAllRedlines}
            className="bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 text-xs flex items-center gap-1.5"
          >
            <CheckCheck className="w-3.5 h-3.5" /> Apply All Redlines
          </Button>

          <Button
            size="sm"
            onClick={handleSaveDraftChanges}
            disabled={savingChanges}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs flex items-center gap-1.5"
          >
            {savingChanges ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Revisions
          </Button>

          <Button 
            onClick={handleExportDocx}
            variant="outline" 
            size="sm"
            className="border-slate-700 bg-slate-900 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-1.5"
          >
            <FileCode className="w-3.5 h-3.5 text-blue-400" /> Export Word (.docx)
          </Button>

          <Button 
            onClick={handleExportPDF}
            variant="outline" 
            size="sm"
            className="border-slate-700 bg-slate-900 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" /> Export PDF
          </Button>

          <Button 
            onClick={() => setIsChatOpen(!isChatOpen)}
            variant="outline" 
            size="sm"
            className="border-emerald-600/40 text-emerald-400 bg-emerald-950/20 text-xs flex items-center gap-1.5"
          >
            <Bot className="w-3.5 h-3.5" /> AI Assistant
          </Button>
        </div>
      </div>

      {/* Metric Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 px-6 bg-slate-950 border-b border-slate-800 text-xs">
        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
          <span className="text-slate-400">Dynamic Score:</span>
          <span className={`font-bold text-base ${dynamicComplianceScore >= 70 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {dynamicComplianceScore}/100
          </span>
        </div>
        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
          <span className="text-slate-400">Resolved Flags:</span>
          <span className="font-bold text-white text-base">
            {appliedRedlinesCount} / {riskFlags.length} Applied
          </span>
        </div>
        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
          <span className="text-slate-400">Document Status:</span>
          <span className={remainingCount === 0 ? "font-bold text-emerald-400 flex items-center gap-1" : "font-bold text-amber-400 flex items-center gap-1"}>
            <ShieldCheck className="w-3.5 h-3.5" /> {remainingCount === 0 ? 'Compliant' : 'Partially Redlined'}
          </span>
        </div>
        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
          <span className="text-slate-400">Execution Readiness:</span>
          <span className="font-bold text-amber-400 flex items-center gap-1">
            <Scale className="w-3.5 h-3.5" /> Ready for Signature
          </span>
        </div>
      </div>

      {/* Main Diff & Redline Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* Left Pane: Live Redlined Document Draft */}
        <div className={`${viewMode === 'editor' ? 'lg:col-span-12' : 'lg:col-span-7'} p-6 border-r border-slate-800 overflow-y-auto max-h-[calc(100vh-190px)] bg-slate-950 flex flex-col`}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" /> 
              {appliedRedlinesCount > 0 ? 'Live Redlined Agreement (Editable)' : 'Contract Agreement Draft (Editable)'}
            </h2>
            <span className="text-[10px] text-slate-500 font-mono">
              Changes update real-time before Word / PDF download
            </span>
          </div>

          <textarea
            value={editedDraft}
            onChange={(e) => setEditedDraft(e.target.value)}
            rows={24}
            className="w-full flex-1 p-5 rounded-xl bg-slate-900/40 border border-slate-800 font-mono text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-emerald-500/50 resize-y"
            placeholder="Contract text will appear here..."
          />
        </div>

        {/* Right Pane: Statutory Redlines & Action Toggles */}
        {viewMode !== 'editor' && (
          <div className="lg:col-span-5 p-6 overflow-y-auto max-h-[calc(100vh-190px)] bg-slate-900/20 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" /> AI Statutory Redlines ({riskFlags.length})
              </h2>
              <span className="text-[10px] text-slate-500">Click &ldquo;Apply Redline&rdquo; to swap clause</span>
            </div>

            {riskFlags.map((risk, index) => (
              <Card 
                key={index} 
                className={`transition-all ${
                  risk.isApplied 
                    ? 'bg-emerald-950/20 border-emerald-500/40' 
                    : 'bg-slate-900/80 border-slate-800'
                }`}
              >
                <CardHeader className="p-4 pb-2 border-b border-slate-800/80 flex flex-row items-center justify-between">
                  <CardTitle className="text-xs font-bold text-white uppercase tracking-tight">
                    {risk.clauseTitle}
                  </CardTitle>
                  <Badge 
                    className={`text-[10px] font-bold ${
                      risk.isApplied 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : risk.riskLevel === 'HIGH' 
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {risk.isApplied ? '✓ REDLINE APPLIED' : `${risk.riskLevel} RISK`}
                  </Badge>
                </CardHeader>

                <CardContent className="p-4 pt-2 space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider block mb-0.5">
                      Statutory Violation
                    </span>
                    <p className="text-slate-300 leading-relaxed">{risk.issueSummary}</p>
                    <p className="text-[11px] text-slate-400 mt-1 font-mono">{risk.legalBasis}</p>
                  </div>

                  {risk.originalText && (
                    <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase block mb-0.5">Current Text</span>
                      <p className="font-mono text-slate-400 line-clamp-2 text-[11px]">{risk.originalText}</p>
                    </div>
                  )}

                  <div className="p-3 rounded bg-slate-950 border border-emerald-500/30 space-y-2">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Recommended Statutory Substitute
                    </span>
                    <p className="font-mono text-slate-200 leading-relaxed text-[11px]">
                      {risk.recommendedRedline}
                    </p>
                  </div>

                  {/* Apply / Revert Button */}
                  <div className="pt-1 flex items-center justify-between">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(risk.recommendedRedline);
                        setCopiedIndex(index);
                        setTimeout(() => setCopiedIndex(null), 2000);
                      }}
                      className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      {copiedIndex === index ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedIndex === index ? 'Copied' : 'Copy Text'}
                    </button>

                    <Button
                      size="sm"
                      onClick={() => toggleApplyRedline(index)}
                      className={`text-xs h-7 px-3 flex items-center gap-1.5 ${
                        risk.isApplied
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                    >
                      {risk.isApplied ? (
                        <>
                          <RotateCcw className="w-3 h-3" /> Revert Clause
                        </>
                      ) : (
                        <>
                          <Check className="w-3 h-3" /> Apply Redline
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Floating AI Drawer */}
      {isChatOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[460px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-5">
          <div className="p-3 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-white">Clause Intelligence Assistant</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsChatOpen(false)} className="h-6 w-6 p-0 text-slate-400">
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs">
            {chatMessages.map((msg, i) => (
              <div 
                key={i} 
                className={`p-2.5 rounded-lg leading-relaxed ${
                  msg.sender === 'user' 
                    ? 'bg-emerald-600 text-white ml-6' 
                    : 'bg-slate-800 text-slate-200 mr-6 border border-slate-700'
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>

          <div className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2">
            <Input
              placeholder="Ask about redline enforceability..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
              className="bg-slate-900 border-slate-700 text-xs text-slate-100 placeholder:text-slate-500"
            />
            <Button size="sm" onClick={handleSendChat} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3">
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}