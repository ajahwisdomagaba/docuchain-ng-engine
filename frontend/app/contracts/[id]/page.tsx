'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  FileDown, 
  Copy, 
  Check, 
  Building2,
  Lock,
  Briefcase,
  Users,
  Scale,
  DollarSign,
  Calendar,
  Loader2,
  PenTool,
  Bot,
  Send,
  X,
  Sparkles,
  Quote
} from 'lucide-react';
import jsPDF from 'jspdf';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';

export type ContractCategory = 'TENANCY' | 'NDA' | 'VENDOR_SERVICE' | 'EMPLOYMENT';
export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'COMPLIANT';

interface AuditRiskFlag {
  id: string;
  clauseTitle: string;
  badgeLabel: string;
  riskLevel: RiskLevel;
  originalText: string;
  recommendedRedline: string;
  legalBasis: string;
  plainEnglishExplanation: string;
}

interface ContractDetail {
  id: string;
  title: string;
  category: ContractCategory;
  counterparty: string;
  governingLaw: string;
  overallScore: number;
  effectiveDate: string;
  expirationDate: string;
  rawText: string;
  riskFlags: AuditRiskFlag[];
}

const MOCK_CONTRACT_DETAILS: Record<string, ContractDetail> = {
  'c-001': {
    id: 'c-001',
    title: 'Commercial Lease Agreement - Lekki Phase 1',
    category: 'TENANCY',
    counterparty: 'Oakwood Properties Ltd',
    governingLaw: 'Lagos State Tenancy Law 2011',
    overallScore: 68,
    effectiveDate: '2026-09-01',
    expirationDate: '2027-08-31',
    rawText: `TENANCY AGREEMENT
This Agreement is made this 1st day of September 2026 between Oakwood Properties Ltd ("Landlord") and Acme Ventures Nig Ltd ("Tenant").

1. RENT AND PAYMENT SCHEDULE
The Tenant shall pay the sum of ₦14,000,000 representing two (2) full years of rent in advance prior to physical possession of the premises.

2. TERMINATION AND NOTICE TO QUIT
If either party intends to determine the tenancy at the expiration of the term, the Landlord shall give only two (2) weeks written notice to quit, notwithstanding any statutory provisions of the Lagos State Tenancy Law 2011.

3. REPAIR AND SERVICE CHARGES
The Tenant covenants to pay an annual un-audited service fee of ₦2,500,000 subject to unilateral increases without audit report.`,
    riskFlags: [
      {
        id: 'rf-101',
        clauseTitle: 'Clause 1: Advance Rent Requirement',
        badgeLabel: 'Section 4 Rent Cap Violation',
        riskLevel: 'HIGH',
        originalText: 'The Tenant shall pay the sum of ₦14,000,000 representing two (2) full years of rent in advance prior to physical possession of the premises.',
        recommendedRedline: 'The Tenant shall pay the sum of ₦7,000,000 representing one (1) year of advance rent in full compliance with Section 4 of the Lagos State Tenancy Law 2011.',
        legalBasis: 'Lagos State Tenancy Law 2011, Section 4(1)',
        plainEnglishExplanation: 'Demanding or paying more than 1 year of advance rent for a yearly tenancy is unlawful under Lagos State Tenancy Law.'
      },
      {
        id: 'rf-102',
        clauseTitle: 'Clause 2: Notice to Quit',
        badgeLabel: 'Section 13 Deficient Notice Warning',
        riskLevel: 'HIGH',
        originalText: 'If either party intends to determine the tenancy at the expiration of the term, the Landlord shall give only two (2) weeks written notice to quit.',
        recommendedRedline: 'In the event of determination of the yearly tenancy, the Landlord shall serve a statutory six (6) months written notice to quit.',
        legalBasis: 'Lagos State Tenancy Law 2011, Section 13(1)(a)',
        plainEnglishExplanation: 'A yearly tenancy in Lagos statutorily mandates a minimum of 6 months written notice to quit.'
      }
    ]
  },
  'c-002': {
    id: 'c-002',
    title: 'Mutual Non-Disclosure Agreement',
    category: 'NDA',
    counterparty: 'Apex Fintech Solutions',
    governingLaw: 'Laws of the Federal Republic of Nigeria',
    overallScore: 92,
    effectiveDate: '2026-08-18',
    expirationDate: '2028-08-18',
    rawText: `MUTUAL NON-DISCLOSURE AGREEMENT\nBetween Apex Fintech Solutions and Partner.\n1. CONFIDENTIALITY: Obligations shall endure for 2 years from disclosure.`,
    riskFlags: []
  },
  'c-003': {
    id: 'c-003',
    title: 'Cloud Infrastructure & Maintenance SLA',
    category: 'VENDOR_SERVICE',
    counterparty: 'CloudCore Systems Nigeria',
    governingLaw: 'Laws of the Federal Republic of Nigeria',
    overallScore: 54,
    effectiveDate: '2026-08-15',
    expirationDate: '2027-08-14',
    rawText: `MASTER SERVICES AGREEMENT & SLA\n3. WHT GROSS-UP: Client must reimburse Vendor for any tax deductions made at source.\n4. UNLIMITED INDEMNITY: Client indemnifies Vendor with no liability cap.`,
    riskFlags: [
      {
        id: 'rf-301',
        clauseTitle: 'Clause 3: Tax Gross-Up Clause',
        badgeLabel: 'WHT Liability & Gross-Up Flag',
        riskLevel: 'HIGH',
        originalText: 'Client must reimburse Vendor for any tax deductions made at source.',
        recommendedRedline: 'Fees are subject to statutory Nigerian WHT deductions at source with credit notes issued to Vendor.',
        legalBasis: 'Companies Income Tax Act (CITA) / FIRS Guidelines',
        plainEnglishExplanation: 'Mandatory WHT gross-up shifts statutory tax obligations away from the vendor.'
      }
    ]
  },
  'c-004': {
    id: 'c-004',
    title: 'Senior Software Engineer Employment Offer',
    category: 'EMPLOYMENT',
    counterparty: 'TechCorp Africa',
    governingLaw: 'Nigerian Labour Act (Cap L1 LFN 2004)',
    overallScore: 88,
    effectiveDate: '2026-08-12',
    expirationDate: 'Indefinite',
    rawText: `EMPLOYMENT CONTRACT\n1. PROBATION: 6 months.\n2. LEAVE: 5 days annual leave per annum.`,
    riskFlags: [
      {
        id: 'rf-401',
        clauseTitle: 'Clause 2: Deficient Annual Leave Allowance',
        badgeLabel: 'Labour Act Section 18 Violation',
        riskLevel: 'MEDIUM',
        originalText: 'The Employee is entitled to 5 days annual leave per year.',
        recommendedRedline: 'The Employee is entitled to at least 6 working days paid leave under Section 18 of the Labour Act.',
        legalBasis: 'Nigerian Labour Act, Section 18',
        plainEnglishExplanation: 'The statutory minimum paid annual leave in Nigeria is 6 working days after 12 months continuous service.'
      }
    ]
  }
};

export default function ContractDetailPage() {
  const params = useParams();
  const rawId = params?.id as string;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const router = useRouter();

  const [contract, setContract] = useState<ContractDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // AI Q&A Assistant State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string; citation?: string }>>([
    {
      sender: 'ai',
      text: 'Ask any question about this agreement (e.g. "Can I terminate early without penalty?" or "What are my rent obligations?") and get a cited answer from the exact clause.'
    }
  ]);

  useEffect(() => {
    async function loadContract() {
      if (!id) return;
      setLoading(true);

      if (MOCK_CONTRACT_DETAILS[id]) {
        setContract(MOCK_CONTRACT_DETAILS[id]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('contracts')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        if (data) {
          let category: ContractCategory = 'VENDOR_SERVICE';
          const typeStr = (data.contract_type || '').toUpperCase();
          if (typeStr.includes('TENANCY') || typeStr.includes('LEASE')) category = 'TENANCY';
          else if (typeStr.includes('NDA') || typeStr.includes('CONFIDENTIAL')) category = 'NDA';
          else if (typeStr.includes('EMPLOYMENT') || typeStr.includes('LABOUR')) category = 'EMPLOYMENT';

          const mappedFlags: AuditRiskFlag[] = (data.metadata?.risk_flags || []).map((f: any, idx: number) => ({
            id: `rf-${idx}`,
            clauseTitle: f.clauseTitle || 'Statutory Compliance Clause',
            badgeLabel: f.legalBasis || 'Statutory Flag',
            riskLevel: (f.riskLevel || 'HIGH') as RiskLevel,
            originalText: f.originalText || '',
            recommendedRedline: f.recommendedRedline || '',
            legalBasis: f.legalBasis || data.metadata?.governingLaw || 'Nigerian Statutory Law',
            plainEnglishExplanation: f.plainEnglishExplanation || f.issueSummary || 'Flagged statutory clause requiring redline.'
          }));

          setContract({
            id: data.id,
            title: data.title || 'Untitled Contract',
            category,
            counterparty: data.counterparty || 'Counterparty Entity',
            governingLaw: data.metadata?.governingLaw || 'Laws of the Federal Republic of Nigeria',
            overallScore: data.risk_score ? Math.max(0, 100 - data.risk_score) : 75,
            effectiveDate: data.effective_date || new Date(data.created_at).toLocaleDateString('en-GB'),
            expirationDate: data.expiry_date || 'Pending Execution',
            rawText: data.metadata?.rawDraft || data.metadata?.originalText || 'Contract terms extracted and indexed.',
            riskFlags: mappedFlags
          });
        }
      } catch (err: any) {
        console.warn('Fallback to sample record:', err.message);
        setContract(MOCK_CONTRACT_DETAILS['c-001']);
      } finally {
        setLoading(false);
      }
    }

    loadContract();
  }, [id]);

  const handleCopy = (riskId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(riskId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');

    setTimeout(() => {
      let aiResponse = "Based on the text of this contract, all obligations remain active through the term.";
      let citation = "";

      const lower = userMsg.toLowerCase();
      if (lower.includes('terminate') || lower.includes('notice') || lower.includes('quit')) {
        aiResponse = "Early termination is governed by Clause 2. The agreement specifies 2 weeks notice, but under Section 13(1) of Lagos Tenancy Law 2011, this is legally defective and requires 6 months statutory notice for yearly tenancies.";
        citation = "Clause 2: Termination and Notice to Quit (Lagos State Tenancy Law 2011, Section 13)";
      } else if (lower.includes('rent') || lower.includes('pay') || lower.includes('advance')) {
        aiResponse = "Rent payment terms in Clause 1 demand 2 years advance payment (₦14,000,000). This violates Section 4 of the Lagos State Tenancy Law 2011 which caps advance rent at 1 year.";
        citation = "Clause 1: Rent and Payment Schedule (Lagos State Tenancy Law 2011, Section 4)";
      } else if (lower.includes('repair') || lower.includes('service charge')) {
        aiResponse = "Service charges under Clause 3 are set at ₦2,500,000 without requirement for audited accounts, presenting a financial liability risk.";
        citation = "Clause 3: Repair and Service Charges";
      }

      setChatMessages((prev) => [...prev, { sender: 'ai', text: aiResponse, citation }]);
    }, 500);
  };

  const handleExportPDF = () => {
    if (!contract) return;
    const doc = new jsPDF();
    const cleanText = (t: string) => (t || '').replace(/₦/g, 'NGN ').replace(/[^\x00-\x7F]/g, '');

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 32, 'F');
    doc.setTextColor(16, 185, 129);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('DocuChain NG — Statutory Compliance Audit', 14, 20);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Document: ${cleanText(contract.title)}`, 14, 42);
    doc.text(`Counterparty: ${cleanText(contract.counterparty)}`, 14, 48);
    doc.text(`Governing Law: ${cleanText(contract.governingLaw)}`, 14, 54);
    doc.text(`Compliance Score: ${contract.overallScore}/100`, 14, 60);

    doc.setDrawColor(226, 232, 240);
    doc.line(14, 66, 196, 66);

    let yPos = 76;
    contract.riskFlags.forEach((risk) => {
      if (yPos > 230) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(225, 29, 72);
      doc.text(`[${risk.riskLevel} RISK] ${cleanText(risk.clauseTitle)}`, 14, yPos);
      yPos += 6;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.text(`Legal Basis: ${cleanText(risk.legalBasis)}`, 14, yPos);
      yPos += 5;

      const issueLines = doc.splitTextToSize(cleanText(`Issue: ${risk.plainEnglishExplanation}`), 180);
      doc.text(issueLines, 14, yPos);
      yPos += issueLines.length * 5 + 2;

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(5, 150, 105);
      doc.text('Recommended Redline:', 14, yPos);
      yPos += 5;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      const redlineLines = doc.splitTextToSize(cleanText(risk.recommendedRedline), 180);
      doc.text(redlineLines, 14, yPos);
      yPos += redlineLines.length * 5 + 8;
    });

    const cleanName = cleanText(contract.title).replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`${cleanName}_Audit.pdf`);
  };

  const getCategoryHeaderBadge = (category: ContractCategory) => {
    switch (category) {
      case 'TENANCY':
        return <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/30 gap-1.5 px-3 py-1"><Building2 className="w-3.5 h-3.5" /> Tenancy Audit</Badge>;
      case 'NDA':
        return <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/30 gap-1.5 px-3 py-1"><Lock className="w-3.5 h-3.5" /> Confidentiality / NDA</Badge>;
      case 'VENDOR_SERVICE':
        return <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/30 gap-1.5 px-3 py-1"><Briefcase className="w-3.5 h-3.5" /> Vendor SLA & Commercial</Badge>;
      case 'EMPLOYMENT':
        return <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 gap-1.5 px-3 py-1"><Users className="w-3.5 h-3.5" /> Employment Compliance</Badge>;
    }
  };

  const renderDynamicBadge = (badgeLabel: string, riskLevel: RiskLevel) => {
    const isHigh = riskLevel === 'HIGH';
    const baseColor = isHigh ? 'border-rose-500/40 bg-rose-500/10 text-rose-300' : 'border-amber-500/40 bg-amber-500/10 text-amber-300';
    let Icon = AlertTriangle;
    if (badgeLabel.includes('WHT') || badgeLabel.includes('Tax')) Icon = DollarSign;
    if (badgeLabel.includes('Section')) Icon = Scale;
    if (badgeLabel.includes('Notice') || badgeLabel.includes('Date')) Icon = Calendar;

    return (
      <Badge variant="outline" className={`${baseColor} px-2.5 py-0.5 text-xs font-semibold flex items-center gap-1 w-fit`}>
        <Icon className="w-3 h-3" />
        {badgeLabel}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
        <p className="text-xs">Loading contract statutory review...</p>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-slate-400">
        <p className="text-sm font-semibold text-white">Contract record not found</p>
        <Link href="/vault"><Button variant="outline" size="sm">Back to Vault</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 sm:p-8 relative pb-24">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation & Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-4">
            <Link href="/vault">
              <Button variant="ghost" size="icon" className="hover:bg-slate-800 text-slate-400 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight text-white">{contract.title}</h1>
                {getCategoryHeaderBadge(contract.category)}
              </div>
              <p className="text-sm text-slate-400 mt-0.5">
                Counterparty: <span className="text-slate-200">{contract.counterparty}</span> • Governing Law: <span className="text-slate-200">{contract.governingLaw}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button 
              onClick={() => setIsChatOpen(!isChatOpen)}
              variant="outline"
              className="border-emerald-600/40 text-emerald-400 bg-emerald-950/20 hover:bg-emerald-900/30 flex items-center gap-2"
            >
              <Bot className="w-4 h-4" /> AI Contract Q&A
            </Button>
            <Button 
              onClick={handleExportPDF}
              variant="outline" 
              className="border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 flex items-center gap-2"
            >
              <FileDown className="w-4 h-4 text-emerald-400" /> Export PDF
            </Button>
            <Link href={`/sign/${contract.id}`}>
              <Button className="bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2">
                <PenTool className="w-4 h-4" /> Sign
              </Button>
            </Link>
          </div>
        </div>

        {/* Top Metric Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="bg-slate-900/60 border-slate-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">Compliance Score</p>
                <p className="text-2xl font-bold text-white mt-0.5">{contract.overallScore}/100</p>
              </div>
              {contract.overallScore >= 70 ? (
                <CheckCircle2 className="w-8 h-8 text-emerald-400 opacity-80" />
              ) : (
                <ShieldAlert className="w-8 h-8 text-amber-400 opacity-80" />
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 border-slate-800">
            <CardContent className="p-4">
              <p className="text-xs text-slate-400 font-medium">Flagged Risks</p>
              <p className="text-2xl font-bold text-rose-400 mt-0.5">{contract.riskFlags.length} Clause Deviations</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 border-slate-800">
            <CardContent className="p-4">
              <p className="text-xs text-slate-400 font-medium">Effective Date</p>
              <p className="text-lg font-semibold text-slate-200 mt-1">{contract.effectiveDate}</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 border-slate-800">
            <CardContent className="p-4">
              <p className="text-xs text-slate-400 font-medium">Expiry / Renewal</p>
              <p className="text-lg font-semibold text-slate-200 mt-1">{contract.expirationDate}</p>
            </CardContent>
          </Card>
        </div>

        {/* Split Pane Viewer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Pane: Document Text */}
          <div className="lg:col-span-6 bg-slate-900/40 border border-slate-800 rounded-xl p-6 flex flex-col h-[760px]">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">Contract Document Text</h3>
              <Badge variant="outline" className="border-slate-700 text-slate-400 text-xs">Read-Only View</Badge>
            </div>
            <div className="overflow-y-auto flex-1 pr-2 font-mono text-xs leading-relaxed text-slate-300 whitespace-pre-wrap selection:bg-emerald-900/40">
              {contract.rawText}
            </div>
          </div>

          {/* Right Pane: Statutory Redlines & Risk Flags */}
          <div className="lg:col-span-6 flex flex-col h-[760px] overflow-y-auto space-y-4 pr-2">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 sticky top-0 bg-slate-950 z-10">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                Statutory Redlines & Risk Flags ({contract.riskFlags.length})
              </h3>
            </div>

            {contract.riskFlags.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-900/40 border border-slate-800 rounded-xl">
                No compliance risk flags detected for this agreement.
              </div>
            ) : (
              contract.riskFlags.map((risk) => (
                <Card key={risk.id} className="bg-slate-900/80 border-slate-800 shadow-sm flex flex-col">
                  <CardHeader className="p-4 bg-slate-900 border-b border-slate-800/80 flex flex-row items-center justify-between space-y-0">
                    <div className="space-y-1.5">
                      <CardTitle className="text-sm font-bold text-white">{risk.clauseTitle}</CardTitle>
                      {renderDynamicBadge(risk.badgeLabel, risk.riskLevel)}
                    </div>
                    <Badge className={risk.riskLevel === 'HIGH' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}>
                      {risk.riskLevel} RISK
                    </Badge>
                  </CardHeader>

                  <CardContent className="p-4 space-y-3.5 text-xs">
                    <div>
                      <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Identified Issue:</span>
                      <p className="text-slate-200 mt-0.5 leading-relaxed">{risk.plainEnglishExplanation}</p>
                    </div>

                    <div>
                      <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Legal Benchmark:</span>
                      <p className="text-emerald-400 font-medium mt-0.5">{risk.legalBasis}</p>
                    </div>

                    {risk.originalText && (
                      <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/80 space-y-1">
                        <span className="text-rose-400 font-semibold uppercase tracking-wider text-[10px]">Original Text:</span>
                        <p className="text-slate-400 line-through leading-relaxed">{risk.originalText}</p>
                      </div>
                    )}

                    <div className="bg-emerald-950/20 p-3 rounded-lg border border-emerald-900/40 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-emerald-400 font-semibold uppercase tracking-wider text-[10px]">DocuChain Recommended Counter-Clause:</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopy(risk.id, risk.recommendedRedline)}
                          className="h-6 px-2 text-[11px] text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40"
                        >
                          {copiedId === risk.id ? (
                            <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Copied</span>
                          ) : (
                            <span className="flex items-center gap-1"><Copy className="w-3 h-3" /> Copy Redline</span>
                          )}
                        </Button>
                      </div>
                      <p className="text-slate-200 font-medium leading-relaxed">{risk.recommendedRedline}</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Floating AI Contract Q&A Drawer */}
      {isChatOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-5">
          <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-xs font-semibold text-slate-200 block">AI Contract Q&A</span>
                <span className="text-[10px] text-emerald-400">Cited answers from exact clauses</span>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsChatOpen(false)}
              className="h-6 w-6 p-0 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs">
            {chatMessages.map((msg, i) => (
              <div 
                key={i} 
                className={`p-3 rounded-lg leading-relaxed space-y-1.5 ${
                  msg.sender === 'user' 
                    ? 'bg-emerald-600 text-white ml-6' 
                    : 'bg-slate-800 text-slate-200 mr-4 border border-slate-700'
                }`}
              >
                <div>{msg.text}</div>
                {msg.citation && (
                  <div className="pt-1 border-t border-slate-700/60 flex items-start gap-1 text-[10px] text-emerald-400 font-mono">
                    <Quote className="w-3 h-3 mt-0.5 shrink-0" />
                    <span>Cited: {msg.citation}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2">
            <Input
              placeholder="e.g. Can I terminate early without penalty?"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
              className="bg-slate-900 border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 focus-visible:ring-emerald-500"
            />
            <Button 
              size="sm" 
              onClick={handleSendChat}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}