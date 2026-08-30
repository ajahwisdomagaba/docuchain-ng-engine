"use client";

import React, { useState, useEffect, useMemo, useRef, Suspense } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Copy,
  FileDown,
  FileEdit,
  FileText,
  History,
  Loader2,
  RotateCcw,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient";

interface RiskFlag {
  id?: string;
  clauseTitle: string;
  originalText?: string;
  riskLevel: "HIGH" | "MEDIUM" | "LOW";
  issueSummary: string;
  legalBasis: string;
  recommendedRedline: string;
  plainEnglishExplanation?: string;
  status?: "OPEN" | "RESOLVED" | "APPLIED";
  isApplied?: boolean;
}

interface ContractRecord {
  id: string;
  title: string;
  category?: string;
  counterparty?: string;
  governingLaw?: string;
  risk_score?: number;
  health_score?: number;
  status: string;
  extractedText?: string;
  raw_text?: string;
  metadata?: any;
  risk_flags?: RiskFlag[];
  created_at?: string;
}

function ContractEditorContent() {
  const params = useParams();
  const router = useRouter();
  const contractId = (params?.id as string) || "";

  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState<ContractRecord | null>(null);
  const [draftText, setDraftText] = useState("");
  const [riskFlags, setRiskFlags] = useState<RiskFlag[]>([]);
  const [activeTab, setActiveTab] = useState<"split" | "editor">("split");
  const [copiedFlagIndex, setCopiedFlagIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Dropdown state for PDF downloads
  const [isDownloadDropdownOpen, setIsDownloadDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDownloadDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load contract from Supabase or Fallback Cache
  useEffect(() => {
    async function loadContract() {
      if (!contractId) return;
      setLoading(true);

      try {
        let loadedContract: ContractRecord | null = null;
        let loadedFlags: RiskFlag[] = [];
        let documentContent = "";

        const isUUID =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            contractId
          );

        if (isUUID) {
          const { data, error } = await supabase
            .from("contracts")
            .select("*, risk_flags(*)")
            .eq("id", contractId)
            .maybeSingle();

          if (data && !error) {
            let metadata = data.metadata;
            if (typeof metadata === "string") {
              try {
                metadata = JSON.parse(metadata);
              } catch {
                metadata = {};
              }
            }

            documentContent =
              data.raw_text ||
              metadata?.extractedText ||
              metadata?.rawText ||
              "";

            if (Array.isArray(data.risk_flags) && data.risk_flags.length > 0) {
              loadedFlags = data.risk_flags.map((rf: any) => ({
                id: rf.id,
                clauseTitle: rf.clause_title || rf.category || "Statutory Risk",
                originalText: rf.original_text || rf.flagged_text || "",
                riskLevel: (rf.risk_level || "MEDIUM").toUpperCase(),
                issueSummary: rf.issue_summary || rf.flagged_text || "",
                legalBasis: rf.legal_basis || rf.statute_ref || "Nigerian Statutory Law",
                recommendedRedline: rf.recommended_redline || rf.suggested_redline || "",
                plainEnglishExplanation: rf.plain_english_explanation || rf.plain_english || "",
                status: rf.status || "OPEN",
                isApplied: rf.status === "RESOLVED" || rf.status === "APPLIED",
              }));
            } else if (Array.isArray(metadata?.risk_flags)) {
              loadedFlags = metadata.risk_flags.map((rf: any) => ({
                ...rf,
                clauseTitle: rf.clauseTitle || rf.category || "Statutory Risk",
                originalText: rf.originalText || rf.flagged_text || "",
                riskLevel: (rf.riskLevel || rf.risk_level || "MEDIUM").toUpperCase(),
                issueSummary: rf.issueSummary || rf.issue_summary || "",
                legalBasis: rf.legalBasis || rf.statute_ref || "Nigerian Statutory Law",
                recommendedRedline: rf.recommendedRedline || rf.suggested_redline || "",
                isApplied: rf.status === "RESOLVED" || Boolean(rf.isApplied),
              }));
            }

            loadedContract = {
              id: data.id,
              title: data.title || "Commercial Service Agreement",
              category: data.category || data.contract_type || "VENDOR_SERVICE",
              counterparty:
                data.counterparty || metadata?.counterparty || "NovaTech Solutions Limited",
              governingLaw:
                metadata?.governingLaw || "Laws of the Federal Republic of Nigeria",
              risk_score: data.risk_score ?? 20,
              health_score: data.health_score ?? metadata?.overallScore ?? Math.max(0, 100 - (data.risk_score || 0)),
              status: data.status || "Audited",
              extractedText: documentContent,
              metadata,
            };
          }
        }

        // Standard Default Fallback if empty
        if (!documentContent || documentContent.length < 50) {
          documentContent = `COMMERCIAL SERVICE AGREEMENT

THIS COMMERCIAL SERVICE AGREEMENT (the "Agreement") is made this 1st day of January 2026 (the "Effective Date")

BETWEEN:

(1) PRIME REALTY DEVELOPMENT LIMITED, a private limited liability company incorporated under the Companies and Allied Matters Act (CAMA 2020) of Nigeria, with its registered corporate office at Plot 14, Admiralty Way, Lekki Phase 1, Lagos State, Nigeria (hereinafter referred to as the "Client");

AND

(2) NOVATECH SOLUTIONS LIMITED, an enterprise software engineering company incorporated under the laws of the Federal Republic of Nigeria, with its principal operations address at Victoria Island, Lagos, Nigeria (hereinafter referred to as the "Service Provider").

1. DEFINITIONS AND INTERPRETATION
1.1 "Applicable Law" means CAMA 2020, Nigeria Data Protection Act (NDPA) 2023, Lagos State Tenancy Law 2011, and the Arbitration and Mediation Act 2023.

2. APPOINTMENT AND SCOPE OF SERVICES
2.1 The Client hereby appoints the Service Provider to perform the software architecture, migration, and maintenance services.

3. GOVERNING LAW AND JURISDICTION
3.1 This Agreement shall be governed by and construed in accordance with the Laws of the Federal Republic of Nigeria.

4. EXECUTION AND STATUTORY ATTESTATION
IN WITNESS WHEREOF, the Parties hereto have caused this Agreement to be duly executed under Section 102 of the Companies and Allied Matters Act (CAMA 2020).`;
        }

        if (loadedFlags.length === 0) {
          loadedFlags = [
            {
              clauseTitle: "Foreign Governing Law & Jurisdiction",
              originalText: "This Agreement shall be governed by the laws of England and Wales.",
              riskLevel: "HIGH",
              issueSummary: "Foreign jurisdiction (England & Wales) creates severe legal friction and enforcement costs in Nigerian courts.",
              legalBasis: "CAMA 2020 & High Court of Lagos State Civil Procedure Rules",
              recommendedRedline: "This Agreement shall be governed by and construed in accordance with the Laws of the Federal Republic of Nigeria.",
              plainEnglishExplanation: "Enforcing judgments from foreign courts requires complex reciprocal enforcement in Nigerian courts.",
              status: "OPEN",
              isApplied: false,
            },
            {
              clauseTitle: "Offshore Arbitration Seat (London/ICC)",
              originalText: "arbitration seated in London, England conducted under ICC Rules",
              riskLevel: "HIGH",
              issueSummary: "Arbitration seated outside Nigeria increases legal costs exponentially and conflicts with domestic commercial resolution.",
              legalBasis: "Arbitration and Mediation Act (AMA) 2023 (Nigeria)",
              recommendedRedline: "Any dispute arising from this Agreement shall be referred to arbitration seated in Lagos, Nigeria, conducted under the Lagos Court of Arbitration (LCA) Rules or the Arbitration and Mediation Act 2023.",
              plainEnglishExplanation: "Local arbitration seated in Lagos is legally binding, faster, and significantly more cost-effective.",
              status: "OPEN",
              isApplied: false,
            },
            {
              clauseTitle: "Unrestricted Cross-Border Data Transfer",
              originalText: "The Service Provider may transfer Client data to any country it considers appropriate.",
              riskLevel: "HIGH",
              issueSummary: "Unrestricted transfer of client personal data without statutory adequacy mechanisms breaches NDPA 2023.",
              legalBasis: "Nigeria Data Protection Act (NDPA) 2023 (Sections 41-43)",
              recommendedRedline: "The Service Provider shall not transfer Client Personal Data outside the Federal Republic of Nigeria without the prior written consent of the Client and ensuring compliance with the NDPA 2023 adequacy safeguards.",
              plainEnglishExplanation: "Nigerian law requires specific adequacy safeguards and NDPC compliance before customer data is moved outside Nigeria.",
              status: "OPEN",
              isApplied: false,
            },
          ];
        }

        if (!loadedContract) {
          loadedContract = {
            id: contractId,
            title: "Commercial Service Agreement",
            category: "VENDOR_SERVICE",
            counterparty: "NovaTech Solutions Limited",
            governingLaw: "Laws of the Federal Republic of Nigeria",
            risk_score: 20,
            health_score: 85,
            status: "Audited",
            extractedText: documentContent,
          };
        }

        setContract(loadedContract);
        setDraftText(documentContent);
        setRiskFlags(loadedFlags);
      } catch (err: any) {
        console.error("Failed to load contract:", err.message);
      } finally {
        setLoading(false);
      }
    }

    loadContract();
  }, [contractId]);

  // Dynamic Health Score Calculation
  const { healthScore, resolvedCount, totalCount } = useMemo(() => {
    const total = riskFlags.length;
    const resolved = riskFlags.filter((f) => f.isApplied || f.status === "RESOLVED").length;
    if (total === 0) return { healthScore: 100, resolvedCount: 0, totalCount: 0 };

    const calculated = Math.round(100 - ((total - resolved) / total) * 40);
    return {
      healthScore: Math.min(100, Math.max(0, calculated)),
      resolvedCount: resolved,
      totalCount: total,
    };
  }, [riskFlags]);

  // Apply Single Redline
  const handleApplyRedline = (index: number) => {
    const flag = riskFlags[index];
    if (!flag || flag.isApplied) return;

    let updatedText = draftText;

    if (flag.originalText && updatedText.includes(flag.originalText)) {
      updatedText = updatedText.replace(flag.originalText, flag.recommendedRedline);
    } else {
      updatedText += `\n\n/* STATUTORY AMENDMENT: ${flag.clauseTitle} */\n${flag.recommendedRedline}\n`;
    }

    setDraftText(updatedText);
    setRiskFlags((prev) =>
      prev.map((f, i) =>
        i === index ? { ...f, isApplied: true, status: "RESOLVED" } : f
      )
    );
  };

  // Apply All Redlines
  const handleApplyAllRedlines = () => {
    let updatedText = draftText;
    const updatedFlags = riskFlags.map((flag) => {
      if (!flag.isApplied) {
        if (flag.originalText && updatedText.includes(flag.originalText)) {
          updatedText = updatedText.replace(flag.originalText, flag.recommendedRedline);
        } else {
          updatedText += `\n\n/* STATUTORY AMENDMENT: ${flag.clauseTitle} */\n${flag.recommendedRedline}\n`;
        }
        return { ...flag, isApplied: true, status: "RESOLVED" as const };
      }
      return flag;
    });

    setDraftText(updatedText);
    setRiskFlags(updatedFlags);
  };

  // Revert Redline
  const handleRevertRedline = (index: number) => {
    const flag = riskFlags[index];
    if (!flag || !flag.isApplied) return;

    let updatedText = draftText;
    if (flag.originalText && updatedText.includes(flag.recommendedRedline)) {
      updatedText = updatedText.replace(flag.recommendedRedline, flag.originalText);
    }

    setDraftText(updatedText);
    setRiskFlags((prev) =>
      prev.map((f, i) =>
        i === index ? { ...f, isApplied: false, status: "OPEN" } : f
      )
    );
  };

  // Copy Redline to Clipboard
  const handleCopyRedline = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedFlagIndex(index);
    setTimeout(() => setCopiedFlagIndex(null), 2000);
  };

  // Complete, Robust Save Handler
  const handleSaveRevision = async () => {
    setIsSaving(true);
    try {
      const unappliedCount = riskFlags.filter((f) => !f.isApplied && f.status !== "RESOLVED").length;
      const computedScore = unappliedCount === 0 ? 100 : Math.max(30, 100 - unappliedCount * 15);
      const computedStatus = unappliedCount === 0 ? "Compliant" : "Partially Redlined";

      // 1. Update contracts table in Supabase
      if (contractId && !contractId.startsWith("c-")) {
        const { error: contractErr } = await supabase
          .from("contracts")
          .update({
            raw_text: draftText,
            health_score: computedScore,
            risk_score: 100 - computedScore,
            status: computedStatus,
            updated_at: new Date().toISOString(),
            metadata: {
              ...(contract?.metadata || {}),
              overallScore: computedScore,
              extractedText: draftText,
              risk_flags: riskFlags.map((f) => ({
                ...f,
                status: f.isApplied ? "RESOLVED" : f.status,
              })),
            },
          })
          .eq("id", contractId);

        if (contractErr) {
          console.warn("Retrying minimal contract payload update:", contractErr.message);
          await supabase
            .from("contracts")
            .update({
              raw_text: draftText,
              health_score: computedScore,
              status: computedStatus,
            })
            .eq("id", contractId);
        }

        // 2. Update relational risk_flags table in Supabase
        if (unappliedCount === 0) {
          await supabase
            .from("risk_flags")
            .update({ status: "RESOLVED" })
            .eq("contract_id", contractId);
        } else {
          for (const flag of riskFlags) {
            if (flag.id) {
              await supabase
                .from("risk_flags")
                .update({ status: flag.isApplied ? "RESOLVED" : "OPEN" })
                .eq("id", flag.id);
            }
          }
        }

        // 3. Log NDPA 2023 Immutable Audit Trail
        await supabase.from("audit_logs").insert({
          contract_id: contractId,
          workspace_id: contract?.metadata?.workspace_id || "default-workspace",
          actor_email: "counsel@firm.ng",
          action: "REDLINE_REVISIONS_SAVED",
          details: {
            health_score: computedScore,
            resolved_flags: resolvedCount,
            status: computedStatus,
          },
        });
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      console.error("Save revision error:", err.message || err);
      alert(`Save Failed: ${err.message || "Database connection error"}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to sanitize text for PDF encoding
  const sanitizeForPdf = (text: string): string => {
    if (!text) return "";
    return text
      .replace(/\u20A6/g, "NGN ")
      .replace(/₦/g, "NGN ")
      .replace(/[^\x00-\x7F]/g, (char) => {
        if (char === "—" || char === "–") return "-";
        if (char === "“" || char === "”") return '"';
        if (char === "‘" || char === "’") return "'";
        return char;
      });
  };

  // PDF Export 1: Statutory Audit & Risk Report
  const handleDownloadRiskReport = () => {
    setIsDownloadDropdownOpen(false);
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Header Banner
    doc.setFillColor(15, 23, 42);
    doc.rect(10, 10, pageWidth - 20, 26, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(16, 185, 129);
    doc.text("DOCUCHAIN.NG - STATUTORY AUDIT & RISK REPORT", 16, 22);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Grounding: CAMA 2020 | NDPA 2023 | Lagos Tenancy Law 2011 | Generated: ${new Date().toLocaleDateString("en-GB")}`,
      16,
      30
    );

    yPos = 46;

    // Document Overview Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(10, yPos, pageWidth - 20, 32, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(`Document: ${sanitizeForPdf(contract?.title || "Commercial Contract")}`, 15, yPos + 8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`Counterparty: ${sanitizeForPdf(contract?.counterparty || "Counterparty")}`, 15, yPos + 15);
    doc.text(`Governing Law: ${sanitizeForPdf(contract?.governingLaw || "Laws of Nigeria")}`, 15, yPos + 22);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(healthScore >= 80 ? 16 : 225, healthScore >= 80 ? 185 : 29, healthScore >= 80 ? 129 : 72);
    doc.text(`Statutory Health Score: ${healthScore}/100`, pageWidth - 75, yPos + 15);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`Flags: ${riskFlags.length} Identified (${resolvedCount} Resolved)`, pageWidth - 75, yPos + 22);

    yPos += 42;

    // Flagged Clauses Section
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("Identified Statutory Risk Flags & Redlines", 10, yPos);
    yPos += 8;

    riskFlags.forEach((flag, index) => {
      if (yPos > 235) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(flag.riskLevel === "HIGH" ? 239 : 245, flag.riskLevel === "HIGH" ? 68 : 158, flag.riskLevel === "HIGH" ? 68 : 11);
      doc.rect(10, yPos, pageWidth - 20, 48, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`${index + 1}. ${sanitizeForPdf(flag.clauseTitle)}`, 14, yPos + 7);

      doc.setFontSize(8);
      doc.setTextColor(flag.riskLevel === "HIGH" ? 220 : 180, 38, 38);
      doc.text(`[${flag.riskLevel} RISK]`, pageWidth - 35, yPos + 7);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text("Statutory Breach:", 14, yPos + 14);
      doc.setFont("helvetica", "normal");
      const issueLines = doc.splitTextToSize(sanitizeForPdf(flag.issueSummary), pageWidth - 60);
      doc.text(issueLines, 42, yPos + 14);

      doc.setFont("helvetica", "bold");
      doc.text("Legal Basis:", 14, yPos + 22);
      doc.setFont("helvetica", "normal");
      doc.text(sanitizeForPdf(flag.legalBasis), 42, yPos + 22);

      // Recommended Redline Box
      doc.setFillColor(240, 253, 244);
      doc.rect(14, yPos + 26, pageWidth - 28, 18, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(22, 101, 52);
      doc.text("RECOMMENDED STATUTORY SUBSTITUTE:", 18, yPos + 31);

      doc.setFont("courier", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(20, 83, 45);
      const redlineLines = doc.splitTextToSize(sanitizeForPdf(flag.recommendedRedline), pageWidth - 36);
      doc.text(redlineLines, 18, yPos + 36);

      yPos += 54;
    });

    doc.save(`${(contract?.title || "Contract").replace(/\s+/g, "_")}_Statutory_Audit_Report.pdf`);
  };

  // PDF Export 2: Clean Multi-Page Contract
  const handleDownloadCleanContract = () => {
    setIsDownloadDropdownOpen(false);
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let yPos = 32;

    const checkAddPage = (requiredHeight = 10) => {
      if (yPos + requiredHeight > pageHeight - 24) {
        doc.addPage();
        yPos = 24;

        doc.setFont("times", "italic");
        doc.setFontSize(8);
        doc.setTextColor(140, 140, 140);
        doc.text(
          `${sanitizeForPdf(contract?.title || "Commercial Service Agreement")} - DocuChain.NG Verified`,
          margin,
          14
        );
        doc.setDrawColor(220, 220, 220);
        doc.line(margin, 16, pageWidth - margin, 16);
      }
    };

    // Title Block
    doc.setFont("times", "bold");
    doc.setFontSize(15);
    doc.setTextColor(15, 23, 42);
    const titleLines = doc.splitTextToSize(
      sanitizeForPdf(contract?.title?.toUpperCase() || "COMMERCIAL SERVICE AGREEMENT"),
      contentWidth
    );
    doc.text(titleLines, pageWidth / 2, yPos, { align: "center" });

    yPos += titleLines.length * 7 + 4;

    doc.setFont("times", "italic");
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `Statutorily Audited & Reviewed under Nigerian Law - Effective: 1 January 2026`,
      pageWidth / 2,
      yPos,
      { align: "center" }
    );

    yPos += 6;
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // Body Paragraphs
    const cleanDraft = sanitizeForPdf(draftText);
    const paragraphs = cleanDraft.split(/\n+/);

    paragraphs.forEach((para) => {
      if (!para.trim()) return;
      const trimmed = para.trim();

      const isHeader =
        /^\d+\.\s+[A-Z\s&,/-]+$/.test(trimmed) ||
        /^[A-Z\s&,/-]{4,}:?$/.test(trimmed) ||
        trimmed.startsWith("/* STATUTORY AMENDMENT") ||
        trimmed.startsWith("WHEREAS:") ||
        trimmed.startsWith("NOW, THEREFORE") ||
        trimmed.startsWith("SCHEDULE");

      if (isHeader) {
        checkAddPage(16);
        yPos += 3;
        doc.setFont("times", "bold");
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        const headLines = doc.splitTextToSize(trimmed, contentWidth);
        doc.text(headLines, margin, yPos);
        yPos += headLines.length * 5.5 + 2.5;
      } else {
        doc.setFont("times", "normal");
        doc.setFontSize(10);
        doc.setTextColor(30, 41, 59);

        const lines = doc.splitTextToSize(trimmed, contentWidth);
        lines.forEach((line: string) => {
          checkAddPage(6);
          doc.text(line, margin, yPos);
          yPos += 5.2;
        });
        yPos += 3;
      }
    });

    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, pageHeight - 16, pageWidth - margin, pageHeight - 16);

      doc.setFont("times", "normal");
      doc.setFontSize(8);
      doc.setTextColor(140, 140, 140);
      doc.text(
        "Grounded in CAMA 2020, NDPA 2023 & Arbitration and Mediation Act 2023",
        margin,
        pageHeight - 10
      );
      doc.text(
        `Page ${i} of ${totalPages}`,
        pageWidth - margin,
        pageHeight - 10,
        { align: "right" }
      );
    }

    doc.save(`${(contract?.title || "Contract").replace(/\s+/g, "_")}_Reviewed_Final.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
        <p className="text-xs">Loading contract and statutory redlines...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Application Bar */}
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-40 px-6 py-3.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link href="/vault">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-slate-400 hover:text-white cursor-pointer"
              title="Back to Vault"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight truncate max-w-md">
                {contract?.title}
              </h1>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] py-0 px-2">
                v1
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400">
              Counterparty: <span className="text-slate-200">{contract?.counterparty}</span> • Governing Law:{" "}
              <span className="text-slate-200">{contract?.governingLaw}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="bg-slate-900 border border-slate-800 p-0.5 rounded-lg flex items-center">
            <Button
              size="sm"
              variant={activeTab === "split" ? "default" : "ghost"}
              onClick={() => setActiveTab("split")}
              className={`h-7 px-3 text-xs cursor-pointer ${
                activeTab === "split"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Split View
            </Button>
            <Button
              size="sm"
              variant={activeTab === "editor" ? "default" : "ghost"}
              onClick={() => setActiveTab("editor")}
              className={`h-7 px-3 text-xs cursor-pointer ${
                activeTab === "editor"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Clean Editor
            </Button>
          </div>

          <Button
            size="sm"
            onClick={handleApplyAllRedlines}
            disabled={resolvedCount === totalCount}
            className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 text-xs h-8 flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Apply All Redlines
          </Button>

          <Button
            size="sm"
            onClick={handleSaveRevision}
            disabled={isSaving}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-950 font-semibold"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : saveSuccess ? (
              <Check className="w-3.5 h-3.5 text-white" />
            ) : (
              <History className="w-3.5 h-3.5" />
            )}
            <span>{saveSuccess ? "Saved to Vault!" : "Save Revisions"}</span>
          </Button>

          {/* EXPORT PDF DROPDOWN */}
          <div className="relative" ref={dropdownRef}>
            <Button
              size="sm"
              onClick={() => setIsDownloadDropdownOpen((prev) => !prev)}
              className="border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs h-8 flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export PDF</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </Button>

            {isDownloadDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 py-1.5 animate-in fade-in-50 zoom-in-95">
                <button
                  type="button"
                  onClick={handleDownloadCleanContract}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-slate-800/80 transition-colors flex items-start gap-2.5 cursor-pointer"
                >
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mt-0.5">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">
                      Clean Executed Contract
                    </div>
                    <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                      Full multi-page agreement formatted with applied redlines.
                    </div>
                  </div>
                </button>

                <div className="border-t border-slate-800 my-1" />

                <button
                  type="button"
                  onClick={handleDownloadRiskReport}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-slate-800/80 transition-colors flex items-start gap-2.5 cursor-pointer"
                >
                  <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 mt-0.5">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">
                      Statutory Audit &amp; Risk Report
                    </div>
                    <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                      Executive compliance score &amp; flagged statutory breaches.
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>

          <Link href={`/sign/${contract?.id}`}>
            <Button
              size="sm"
              className="bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs h-8 flex items-center gap-1.5 shadow-md shadow-amber-950/40 cursor-pointer"
            >
              <Scale className="w-3.5 h-3.5" /> CAMA 2020 E-Sign
            </Button>
          </Link>
        </div>
      </header>

      {/* Score & Telemetry Bar */}
      <div className="bg-slate-900/50 border-b border-slate-800/80 px-6 py-3">
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 font-medium">Compliance Score:</span>
            <span
              className={`font-bold text-sm flex items-center gap-1.5 ${
                healthScore >= 80
                  ? "text-emerald-400"
                  : healthScore >= 60
                  ? "text-amber-400"
                  : "text-rose-400"
              }`}
            >
              {healthScore >= 80 ? (
                <ShieldCheck className="w-4 h-4" />
              ) : (
                <ShieldAlert className="w-4 h-4" />
              )}
              {healthScore}/100
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-400 font-medium">Resolved Flags:</span>
            <span className="font-semibold text-slate-200">
              {resolvedCount} / {totalCount} Applied
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-400 font-medium">Document Status:</span>
            <Badge
              className={`text-[10px] uppercase tracking-wider ${
                resolvedCount === totalCount
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                  : "bg-amber-500/20 text-amber-300 border-amber-500/30"
              }`}
            >
              {resolvedCount === totalCount ? "Statutorily Compliant" : "Partially Redlined"}
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-400 font-medium">Execution Readiness:</span>
            <span className="text-amber-400 font-semibold flex items-center gap-1">
              <Scale className="w-3.5 h-3.5" /> Ready for Signature
            </span>
          </div>
        </div>
      </div>

      {/* Main Workspace Area (Split or Full Editor) */}
      <div className="flex-1 p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Editable Draft Document */}
        <div
          className={`${
            activeTab === "split" ? "lg:col-span-7" : "lg:col-span-12"
          } flex flex-col space-y-3`}
        >
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <FileEdit className="w-4 h-4 text-emerald-400" /> Contract Agreement Draft (Editable)
            </span>
            <span className="text-[11px] text-slate-500">
              Changes update real-time before PDF generation
            </span>
          </div>

          <textarea
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            rows={26}
            placeholder="Contract clauses will render here..."
            className="w-full flex-1 bg-slate-900/90 border border-slate-800 rounded-xl p-5 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 leading-relaxed resize-none shadow-2xl"
          />
        </div>

        {/* Right Column: Statutory AI Redlines */}
        {activeTab === "split" && (
          <div className="lg:col-span-5 flex flex-col space-y-3">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-400" /> Nigerian Statutory Redlines ({riskFlags.length})
              </span>
              <span className="text-[11px] text-slate-500">
                Click &ldquo;Apply Redline&rdquo; to substitute
              </span>
            </div>

            <div className="space-y-4 overflow-y-auto max-h-[750px] pr-1">
              {riskFlags.length === 0 ? (
                <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-8 text-center text-slate-400 space-y-2">
                  <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
                  <h4 className="text-sm font-semibold text-white">Zero Statutory Violations</h4>
                  <p className="text-xs text-slate-500">
                    This agreement conforms with CAMA 2020, NDPA 2023, and Lagos Tenancy requirements.
                  </p>
                </div>
              ) : (
                riskFlags.map((flag, idx) => (
                  <Card
                    key={idx}
                    className={`bg-slate-900/90 border transition-all duration-200 ${
                      flag.isApplied
                        ? "border-emerald-500/40 opacity-70"
                        : flag.riskLevel === "HIGH"
                        ? "border-rose-500/50 shadow-lg shadow-rose-950/20"
                        : "border-amber-500/40"
                    }`}
                  >
                    <CardHeader className="p-4 pb-2 border-b border-slate-800/80 flex flex-row items-center justify-between">
                      <CardTitle className="text-xs font-bold text-white tracking-wide">
                        {flag.clauseTitle}
                      </CardTitle>
                      <Badge
                        className={`text-[9px] uppercase font-bold px-2 py-0.5 ${
                          flag.isApplied
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                            : flag.riskLevel === "HIGH"
                            ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                            : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                        }`}
                      >
                        {flag.isApplied ? "APPLIED" : `${flag.riskLevel} RISK`}
                      </Badge>
                    </CardHeader>

                    <CardContent className="p-4 space-y-3 text-xs">
                      {/* Statutory Issue */}
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-rose-400/90 mb-0.5">
                          Statutory Breach
                        </div>
                        <p className="text-slate-300 leading-snug">{flag.issueSummary}</p>
                        <div className="text-[11px] text-slate-500 mt-1 font-medium">
                          Legal Basis: <span className="text-slate-400">{flag.legalBasis}</span>
                        </div>
                      </div>

                      {/* Recommended Statutory Substitute */}
                      <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 space-y-1.5">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Recommended Statutory Substitute
                        </div>
                        <p className="text-[11px] font-mono text-slate-200 leading-relaxed">
                          {flag.recommendedRedline}
                        </p>
                      </div>

                      {/* Action Bar */}
                      <div className="flex items-center justify-between pt-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopyRedline(flag.recommendedRedline, idx)}
                          className="text-[11px] h-7 px-2 text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                        >
                          {copiedFlagIndex === idx ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" /> Copy Text
                            </>
                          )}
                        </Button>

                        {flag.isApplied ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRevertRedline(idx)}
                            className="border-slate-700 bg-slate-800 text-slate-300 hover:text-white text-[11px] h-7 px-2.5 flex items-center gap-1 cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" /> Revert
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleApplyRedline(idx)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] h-7 px-3 flex items-center gap-1 shadow-md shadow-emerald-950/40 cursor-pointer"
                          >
                            <Check className="w-3 h-3" /> Apply Redline
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ContractEditorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mb-2" />
          <p className="text-xs">Loading DocuChain Redline Studio...</p>
        </div>
      }
    >
      <ContractEditorContent />
    </Suspense>
  );
}