'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  Search, 
  Filter, 
  Upload, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Building2, 
  Briefcase, 
  Lock, 
  Users, 
  X, 
  UploadCloud, 
  Send, 
  Bot, 
  Sparkles, 
  FileEdit, 
  Loader2, 
  RotateCcw, 
  Trash2, 
  Copy, 
  Check, 
  ArrowRight, 
  Scale, 
  FileDown,
  Layers,
  Eye
} from 'lucide-react';
import jsPDF from 'jspdf';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

export type ContractCategory = 'ALL' | 'TENANCY' | 'NDA' | 'VENDOR_SERVICE' | 'EMPLOYMENT';

interface AuditRiskFlag {
  clauseTitle: string;
  originalText: string;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  issueSummary: string;
  legalBasis: string;
  recommendedRedline: string;
  plainEnglishExplanation: string;
}

interface AuditResultData {
  contractCategory: string;
  overallScore: number;
  governingLaw: string;
  parties: {
    disclosingOrClient?: string;
    receivingOrVendor?: string;
  };
  keyDates?: {
    effectiveDate?: string;
    expirationDate?: string;
  };
  riskFlags: AuditRiskFlag[];
  executiveSummary: string;
}

interface ContractItem {
  id: string;
  title: string;
  category: 'TENANCY' | 'NDA' | 'VENDOR_SERVICE' | 'EMPLOYMENT';
  counterparty: string;
  overallScore: number;
  riskCount: number;
  status: 'Audited' | 'Pending Review' | 'Flagged';
  lastUpdated: string;
}

const SAMPLE_CONTRACTS: Record<string, { title: string; text: string }> = {
  TENANCY: {
    title: 'Residential Tenancy Agreement - Lekki Phase 1',
    text: `TENANCY AGREEMENT
This Tenancy Agreement is made this 1st day of September 2026 BETWEEN Chief Adebayo Adeleke of Plot 12, Admiralty Way, Lekki Phase 1, Lagos ("Landlord") AND Mr. Chukwuma Obi ("Tenant").

1. DEMISE AND RENT
The Landlord lets and the Tenant takes the 3-Bedroom Apartment for a term of one (1) year commencing September 1, 2026.
The Tenant shall pay the sum of ₦14,000,000 representing two (2) full years advance rent upon execution of this agreement.

2. TERMINATION & STATUTORY NOTICES
If either party intends to determine the tenancy at the expiration of the term, the Landlord shall give only two (2) weeks written notice to quit, notwithstanding any statutory provisions of the Lagos State Tenancy Law 2011.

3. MAINTENANCE & SERVICE CHARGE
The Tenant agrees to pay an un-audited service charge of ₦2,500,000 annually, subject to unilateral review by the Landlord at any time.`
  },
  NDA: {
    title: 'Mutual Non-Disclosure & Proprietary Rights Agreement',
    text: `NON-DISCLOSURE AGREEMENT (NDA)
This Agreement is entered into between Innovate Tech Nigeria Ltd ("Disclosing Party") and Apex Growth Partners ("Receiving Party").

1. CONFIDENTIALITY PERIOD
The obligations of confidentiality under this Agreement shall endure indefinitely and perpetually from the Effective Date, surviving any dissolution of either party.

2. RESTRAINT OF TRADE & NON-COMPETE
The Receiving Party agrees that for a period of five (5) years following termination, it shall not engage, invest in, or provide any consulting services to any entity in West Africa operating in the software sector.

3. GOVERNING LAW AND DISPUTE RESOLUTION
This Agreement shall be governed exclusively by the laws of the State of New York, USA, and all arbitration proceedings shall take place in London, UK, with costs borne solely by the Receiving Party.`
  },
  VENDOR_SERVICE: {
    title: 'Master IT Support & Cloud Maintenance SLA',
    text: `SERVICE LEVEL AGREEMENT (SLA)
This Service Level Agreement is made between CloudCore Nigeria Ltd ("Vendor") and Prime Retail Ltd ("Client").

1. PAYMENT TERMS & TAX GROSS-UP
Invoices are payable within 14 days of receipt. All fees quoted are net of statutory taxes. If the Client makes any Withholding Tax (WHT) deductions at source as required under Nigerian tax laws, the Client must immediately reimburse and gross-up the Vendor for the deducted amount.

2. LIMITATION OF LIABILITY & INDEMNIFICATION
The Client agrees to indemnify, defend, and hold harmless the Vendor against all third-party claims, liabilities, and damages with zero monetary ceiling. The Vendor's aggregate liability under all circumstances shall be limited to ₦10,000.

3. UNILATERAL TERMINATION
The Vendor reserves the right to terminate this SLA immediately without cause or prior notice.`
  },
  EMPLOYMENT: {
    title: 'Executive Employment Contract & Restrictive Covenants',
    text: `EMPLOYMENT CONTRACT
This Contract of Employment is made between Apex Dynamics Nigeria Ltd ("Employer") and Jane Doe ("Employee").

1. PROBATION AND TERMINATION
The Employee shall undergo a probation period of twelve (12) months. During or after probation, the Employer may terminate employment instantly without notice and without providing reasons.

2. ANNUAL LEAVE & STATUTORY ENTITLEMENTS
The Employee is entitled to five (5) calendar days of paid annual leave per year of continuous service. Overtime shall not be compensated in accordance with company internal policy.

3. POST-TERMINATION NON-COMPETE
Upon cessation of employment for any reason, the Employee shall not work for any technology company in Nigeria for a period of three (3) years.`
  }
};

const INITIAL_CONTRACTS: ContractItem[] = [
  {
    id: 'c-001',
    title: 'Commercial Lease Agreement - Lekki Phase 1',
    category: 'TENANCY',
    counterparty: 'Oakwood Properties Ltd',
    overallScore: 68,
    riskCount: 2,
    status: 'Flagged',
    lastUpdated: '2026-08-20',
  },
  {
    id: 'c-002',
    title: 'Mutual Non-Disclosure Agreement',
    category: 'NDA',
    counterparty: 'Apex Fintech Solutions',
    overallScore: 92,
    riskCount: 0,
    status: 'Audited',
    lastUpdated: '2026-08-18',
  },
  {
    id: 'c-003',
    title: 'Cloud Infrastructure & Maintenance SLA',
    category: 'VENDOR_SERVICE',
    counterparty: 'CloudCore Systems Nigeria',
    overallScore: 54,
    riskCount: 4,
    status: 'Flagged',
    lastUpdated: '2026-08-15',
  },
  {
    id: 'c-004',
    title: 'Senior Software Engineer Employment Offer',
    category: 'EMPLOYMENT',
    counterparty: 'TechCorp Africa',
    overallScore: 88,
    riskCount: 1,
    status: 'Audited',
    lastUpdated: '2026-08-12',
  },
];

export default function VaultPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [contracts, setContracts] = useState<ContractItem[]>(INITIAL_CONTRACTS);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ContractCategory>('ALL');
  
  // Single Ingestion Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [ingestTab, setIngestTab] = useState<'upload' | 'manual'>('manual');
  const [manualCategory, setManualCategory] = useState<string>('TENANCY');
  const [manualTitle, setManualTitle] = useState(SAMPLE_CONTRACTS.TENANCY.title);
  const [manualText, setManualText] = useState(SAMPLE_CONTRACTS.TENANCY.text);
  const [isAuditing, setIsAuditing] = useState(false);

  // Batch Upload States
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [isBatchUploading, setIsBatchUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  // Active Audit Result Modal State
  const [auditResult, setAuditResult] = useState<AuditResultData | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Contract Q&A Assistant State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string }>>([
    {
      sender: 'ai',
      text: 'Hello! I am your Nigerian Legal & Contract Intelligence Assistant. Ask me anything about Lagos Tenancy Law 2011, CAMA 2020 provisions, or specific clauses in your vault.'
    }
  ]);

  const loadContracts = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const mappedItems: ContractItem[] = data.map((item: any) => {
          let cat: 'TENANCY' | 'NDA' | 'VENDOR_SERVICE' | 'EMPLOYMENT' = 'VENDOR_SERVICE';
          const typeStr = (item.contract_type || item.category || '').toUpperCase();
          if (typeStr.includes('TENANCY') || typeStr.includes('LEASE')) cat = 'TENANCY';
          else if (typeStr.includes('NDA') || typeStr.includes('CONFIDENTIAL')) cat = 'NDA';
          else if (typeStr.includes('EMPLOYMENT') || typeStr.includes('LABOUR')) cat = 'EMPLOYMENT';

          let metadata = item.metadata;
          if (typeof metadata === 'string') {
            try { metadata = JSON.parse(metadata); } catch { metadata = {}; }
          }

          const riskCnt = Array.isArray(metadata?.risk_flags) 
            ? metadata.risk_flags.length 
            : (item.risk_score > 30 ? 2 : 0);

          return {
            id: item.id,
            title: item.title || 'Untitled Contract',
            category: cat,
            counterparty: item.counterparty || metadata?.counterparty || 'Counterparty Entity',
            overallScore: item.risk_score ? Math.max(0, 100 - item.risk_score) : 75,
            riskCount: riskCnt,
            status: (item.status === 'FLAGGED' || item.status === 'Flagged' || riskCnt > 0) ? 'Flagged' : 'Audited',
            lastUpdated: new Date(item.created_at || Date.now()).toLocaleDateString('en-GB'),
          };
        });
        setContracts(mappedItems);
      } else {
        setContracts(INITIAL_CONTRACTS);
      }
    } catch (err: any) {
      console.warn('Supabase contracts query fallback triggered:', err.message);
      setContracts(INITIAL_CONTRACTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContracts();
  }, [user]);

  const sanitizePdfText = (text: string) => {
    if (!text) return '';
    return text
      .replace(/₦/g, 'NGN ')
      .replace(/[^\x00-\x7F]/g, '');
  };

  const handleCategoryChange = (categoryKey: string) => {
    setManualCategory(categoryKey);
    const sample = SAMPLE_CONTRACTS[categoryKey];
    if (sample) {
      setManualTitle(sample.title);
      setManualText(sample.text);
    }
    setAuditResult(null);
  };

  const handleResetSample = () => {
    const sample = SAMPLE_CONTRACTS[manualCategory];
    if (sample) {
      setManualTitle(sample.title);
      setManualText(sample.text);
    }
    setAuditResult(null);
  };

  const handleCopyRedline = (index: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleExportPDF = () => {
    if (!auditResult) return;

    const doc = new jsPDF();

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 32, 'F');
    doc.setTextColor(16, 185, 129);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('DocuChain NG — Statutory Audit Certificate', 14, 20);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Document: ${sanitizePdfText(manualTitle || 'Audited Agreement')}`, 14, 42);
    doc.text(`Governing Law: ${sanitizePdfText(auditResult.governingLaw)}`, 14, 48);
    doc.text(`Compliance Score: ${auditResult.overallScore}/100`, 14, 54);
    doc.text(`Audit Date: ${new Date().toLocaleDateString('en-GB')}`, 14, 60);

    doc.setDrawColor(226, 232, 240);
    doc.line(14, 66, 196, 66);

    let yPos = 76;
    auditResult.riskFlags.forEach((risk) => {
      if (yPos > 230) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(225, 29, 72);
      doc.text(`[${risk.riskLevel} RISK] ${sanitizePdfText(risk.clauseTitle)}`, 14, yPos);
      yPos += 6;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.text(`Legal Basis: ${sanitizePdfText(risk.legalBasis)}`, 14, yPos);
      yPos += 5;

      const issueText = sanitizePdfText(`Identified Issue: ${risk.plainEnglishExplanation}`);
      const issueLines = doc.splitTextToSize(issueText, 180);
      doc.text(issueLines, 14, yPos);
      yPos += issueLines.length * 5 + 2;

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(5, 150, 105);
      doc.text('DocuChain Recommended Redline:', 14, yPos);
      yPos += 5;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      const redlineText = sanitizePdfText(risk.recommendedRedline);
      const redlineLines = doc.splitTextToSize(redlineText, 180);
      doc.text(redlineLines, 14, yPos);
      yPos += redlineLines.length * 5 + 8;
    });

    const cleanName = sanitizePdfText(manualTitle).replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`${cleanName}_Audit_Report.pdf`);
  };

  const handleDeleteContract = async (id: string) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this contract from your vault?');
    if (!confirmDelete) return;

    setContracts((prev) => prev.filter((contract) => contract.id !== id));

    if (!id.startsWith('c-')) {
      try {
        const { error } = await supabase.from('contracts').delete().eq('id', id);
        if (error) throw error;
      } catch (err: any) {
        console.error('Failed to delete contract from database:', err.message);
      }
    }
  };

  // Real Multi-file Binary Ingestion via Backend (Port 5000)
  const handleBatchUpload = async () => {
    if (batchFiles.length === 0) return;
    setIsBatchUploading(true);
    setUploadProgress(`Auditing ${batchFiles.length} contracts via Nigerian legal intelligence engine...`);

    try {
      const formData = new FormData();
      batchFiles.forEach((file) => {
        formData.append('files', file);
      });

      const res = await fetch('http://localhost:5000/api/review/batch-audit', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error(`Batch upload failed with status ${res.status}`);
      const data = await res.json();

      await loadContracts();
      setBatchFiles([]);
      setShowUploadModal(false);

      if (data.results?.[0]?.dbRecord?.id) {
        router.push(`/contracts/${data.results[0].dbRecord.id}`);
      }
    } catch (error: any) {
      console.error('Batch upload error:', error.message || error);
      alert('Batch audit failed. Please ensure the backend server is running on port 5000.');
    } finally {
      setIsBatchUploading(false);
      setUploadProgress('');
    }
  };

  // Real Manual Audit Ingestion via Backend (Port 5000)
  const handleManualAudit = async () => {
    if (!manualText.trim() || !manualTitle.trim()) {
      alert("Please ensure both Contract Title and Agreement Text are provided.");
      return;
    }
    
    setIsAuditing(true);

    try {
      const res = await fetch('http://localhost:5000/api/review/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractText: manualText,
          title: manualTitle,
          category: manualCategory,
        }),
      });

      if (!res.ok) {
        throw new Error(`Statutory audit failed with status ${res.status}`);
      }

      const data = await res.json();

      if (data.dbRecord?.id) {
        setShowUploadModal(false);
        router.push(`/contracts/${data.dbRecord.id}`);
      } else {
        await loadContracts();
        setShowUploadModal(false);
      }
    } catch (err: any) {
      console.error('Audit execution error:', err.message || err);
      alert('Failed to audit document. Please ensure your backend is running on port 5000.');
    } finally {
      setIsAuditing(false);
    }
  };

  const filteredContracts = useMemo(() => {
    return contracts.filter((contract) => {
      const matchesCategory = selectedCategory === 'ALL' || contract.category === selectedCategory;
      const titleStr = (contract.title || '').toLowerCase();
      const counterpartyStr = (contract.counterparty || '').toLowerCase();
      const query = (searchQuery || '').toLowerCase();

      const matchesSearch = titleStr.includes(query) || counterpartyStr.includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [contracts, selectedCategory, searchQuery]);

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');

    let aiResponse = "Under standard Nigerian Contract Law and CAMA 2020 provisions, clauses must demonstrate mutual consideration and fair commercial terms.";
    
    if (userMsg.toLowerCase().includes('rent') || userMsg.toLowerCase().includes('tenancy')) {
      aiResponse = "Under Section 4 of Lagos State Tenancy Law 2011, it is unlawful to demand or receive rent exceeding 1 year for a yearly tenancy. Section 13 mandates a minimum 6-month notice to quit.";
    } else if (userMsg.toLowerCase().includes('wage') || userMsg.toLowerCase().includes('salary')) {
      aiResponse = "The National Minimum Wage Act mandates a statutory baseline of NGN 70,000 per month across Nigeria. Any contractual agreement below this threshold is illegal and unenforceable.";
    } else if (userMsg.toLowerCase().includes('nda') || userMsg.toLowerCase().includes('confidential')) {
      aiResponse = "Nigerian courts view perpetual NDAs with skepticism. Standard commercial practice is 2-3 years unless it involves proprietary trade secrets.";
    }

    setChatMessages((prev) => [...prev, { sender: 'ai', text: aiResponse }]);
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'TENANCY':
        return (
          <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10 flex items-center gap-1">
            <Building2 className="w-3 h-3" /> Tenancy
          </Badge>
        );
      case 'NDA':
        return (
          <Badge variant="outline" className="border-purple-500/30 text-purple-400 bg-purple-500/10 flex items-center gap-1">
            <Lock className="w-3 h-3" /> NDA
          </Badge>
        );
      case 'VENDOR_SERVICE':
        return (
          <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10 flex items-center gap-1">
            <Briefcase className="w-3 h-3" /> Vendor / SLA
          </Badge>
        );
      case 'EMPLOYMENT':
        return (
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 flex items-center gap-1">
            <Users className="w-3 h-3" /> Employment
          </Badge>
        );
      default:
        return null;
    }
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) {
      return (
        <span className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4" /> {score}/100
        </span>
      );
    }
    if (score >= 60) {
      return (
        <span className="flex items-center gap-1.5 text-amber-400 text-sm font-medium">
          <AlertTriangle className="w-4 h-4" /> {score}/100
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 text-rose-400 text-sm font-medium">
        <ShieldAlert className="w-4 h-4" /> {score}/100
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 relative">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Contract Vault</h1>
            <p className="text-slate-400 text-sm mt-1">
              Centralized repository for Nigerian tenancy, commercial SLAs, NDAs, and employment agreements.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => setIsChatOpen(!isChatOpen)}
              variant="outline"
              className="border-emerald-600/40 text-emerald-400 bg-emerald-950/20 hover:bg-emerald-900/30 flex items-center gap-2"
            >
              <Bot className="w-4 h-4" /> Legal AI Assistant
            </Button>
            <Button 
              onClick={() => {
                setAuditResult(null);
                setShowUploadModal(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 shadow-lg shadow-emerald-950"
            >
              <Upload className="w-4 h-4" /> Ingest & Audit Contract
            </Button>
          </div>
        </div>

        {/* Ingestion & Audit Modal */}
        {showUploadModal && (
          <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-6 transition-all space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-semibold text-slate-100">
                  Ingest Contract for AI Audit
                </h2>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setShowUploadModal(false);
                  setBatchFiles([]);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant={ingestTab === 'manual' ? 'default' : 'outline'}
                onClick={() => setIngestTab('manual')}
                className={ingestTab === 'manual' ? 'bg-emerald-600 text-white' : 'border-slate-700 text-slate-300'}
              >
                <FileEdit className="w-4 h-4 mr-1.5" /> Type or Paste Text
              </Button>
              <Button
                size="sm"
                variant={ingestTab === 'upload' ? 'default' : 'outline'}
                onClick={() => setIngestTab('upload')}
                className={ingestTab === 'upload' ? 'bg-emerald-600 text-white' : 'border-slate-700 text-slate-300'}
              >
                <Layers className="w-4 h-4 mr-1.5" /> Batch File Ingestion (.pdf, .docx, .txt)
              </Button>
            </div>

            {ingestTab === 'manual' ? (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1 font-medium">Contract Title</label>
                    <Input
                      placeholder="e.g. 2-Year Office Lease Agreement"
                      value={manualTitle}
                      onChange={(e) => setManualTitle(e.target.value)}
                      className="bg-slate-950 border-slate-700 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1 font-medium">Category (Auto-loads sample text)</label>
                    <select
                      value={manualCategory}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="TENANCY">Tenancy Agreement (Lagos Tenancy Law 2011)</option>
                      <option value="NDA">Non-Disclosure Agreement (NDA)</option>
                      <option value="VENDOR_SERVICE">Vendor Service Level Agreement (SLA)</option>
                      <option value="EMPLOYMENT">Employment Agreement (Labour Act)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs text-slate-400 font-medium">Contract Agreement Text</label>
                    <button 
                      type="button"
                      onClick={handleResetSample}
                      className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
                    >
                      <RotateCcw className="w-3 h-3" /> Reload category sample
                    </button>
                  </div>
                  <textarea
                    rows={9}
                    placeholder="Paste the agreement clauses or type full contract terms here for statutory auditing..."
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs font-mono text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 leading-relaxed"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    variant="ghost"
                    onClick={() => setShowUploadModal(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleManualAudit}
                    disabled={isAuditing || !manualText.trim() || !manualTitle.trim()}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 shadow-lg shadow-emerald-950"
                  >
                    {isAuditing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Auditing Against Nigerian Law...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" /> Run Statutory Audit
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files) {
                      setBatchFiles(Array.from(e.dataTransfer.files));
                    }
                  }}
                  className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-xl p-8 text-center transition-colors bg-slate-950/40 relative cursor-pointer"
                >
                  <input 
                    type="file" 
                    multiple 
                    accept=".pdf,.docx,.txt" 
                    onChange={(e) => {
                      if (e.target.files) setBatchFiles(Array.from(e.target.files));
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-200">
                    Drag & drop files here (.pdf, .docx, .txt), or click to browse
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Direct binary parsing via Mammoth & ContractParser with full statutory grounding
                  </p>
                </div>

                {batchFiles.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-400">Selected Files ({batchFiles.length}):</span>
                    <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                      {batchFiles.map((file, i) => (
                        <div key={i} className="flex items-center justify-between bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs">
                          <span className="text-slate-200 font-medium truncate max-w-[280px]">{file.name}</span>
                          <span className="text-slate-500">{(file.size / 1024).toFixed(1)} KB</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {uploadProgress && (
                  <p className="text-xs text-emerald-400 font-medium animate-pulse">{uploadProgress}</p>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setBatchFiles([]);
                      setShowUploadModal(false);
                    }}
                    className="text-slate-400 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleBatchUpload}
                    disabled={isBatchUploading || batchFiles.length === 0}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 shadow-lg shadow-emerald-950"
                  >
                    {isBatchUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Ingesting & Auditing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" /> Ingest & Save All ({batchFiles.length})
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filters & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              placeholder="Search contracts or counterparties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
            
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value as ContractCategory)}
              className="w-full sm:w-56 bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">All Categories</option>
              <option value="TENANCY">Tenancy Agreements</option>
              <option value="NDA">Non-Disclosure (NDAs)</option>
              <option value="VENDOR_SERVICE">Vendor & Service SLAs</option>
              <option value="EMPLOYMENT">Employment Contracts</option>
            </select>
          </div>
        </div>

        {/* Contract Repository Table */}
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/30">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
              <p className="text-xs text-slate-400">Loading vault documents from Supabase...</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-4 px-6">Contract Document</th>
                  <th className="py-4 px-6">Domain / Category</th>
                  <th className="py-4 px-6">Counterparty</th>
                  <th className="py-4 px-6">Compliance Score</th>
                  <th className="py-4 px-6">Flagged Risks</th>
                  <th className="py-4 px-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredContracts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 space-y-2">
                      <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="text-sm font-medium text-slate-400">No contracts found in vault</p>
                      <p className="text-xs text-slate-600">Click &ldquo;Ingest & Audit Contract&rdquo; above to audit and store your first contract.</p>
                    </td>
                  </tr>
                ) : (
                  filteredContracts.map((contract) => (
                    <tr key={contract.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-6 font-medium text-slate-100">
                        <Link 
                          href={`/contracts/${contract.id}`} 
                          className="flex items-center gap-3 group hover:text-emerald-400 transition-colors"
                        >
                          <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 group-hover:border-emerald-500/50 transition-colors">
                            <FileText className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-100 group-hover:text-emerald-400 transition-colors">{contract.title}</div>
                            <div className="text-xs text-slate-500">Updated {contract.lastUpdated}</div>
                          </div>
                        </Link>
                      </td>
                      <td className="py-4 px-6">
                        {getCategoryBadge(contract.category)}
                      </td>
                      <td className="py-4 px-6 text-slate-300">
                        {contract.counterparty}
                      </td>
                      <td className="py-4 px-6">
                        {getScoreBadge(contract.overallScore)}
                      </td>
                      <td className="py-4 px-6">
                        {contract.riskCount > 0 ? (
                          <span className="text-rose-400 font-medium">
                            {contract.riskCount} statutory {contract.riskCount === 1 ? 'flag' : 'flags'}
                          </span>
                        ) : (
                          <span className="text-slate-500">Clean</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Link href={`/contracts/${contract.id}`}>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5 text-emerald-400" /> Review
                            </Button>
                          </Link>
                          <Link href={`/sign/${contract.id}`}>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-emerald-400 text-xs flex items-center gap-1"
                            >
                              Sign
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteContract(contract.id)}
                            className="text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 p-2"
                            title="Delete Contract"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Floating Contract Q&A Assistant Drawer */}
      {isChatOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[480px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-5">
          <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-slate-200">DocuChain Legal Assistant</span>
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
              placeholder="Ask about clauses, notice periods..."
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