"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  ArrowLeft, 
  Info, 
  MessageSquare, 
  ShieldAlert, 
  Scale, 
  Copy, 
  Check,
  Download
} from "lucide-react";
import { getContract, getRiskFlagsForContract } from "@/lib/mock-data";
import { PdfViewer } from "@/components/detail/pdf-viewer";
import { MetadataPanel } from "@/components/detail/metadata-panel";
import { ChatDrawer } from "@/components/detail/chat-drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { generateAuditReportPDF } from "@/lib/pdf-export";

export default function ContractDetailPage() {
  const params = useParams();
  const contractId = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';
  
  const contract = getContract(contractId);
  const [activePage, setActivePage] = useState(1);
  const [activeClauseId, setActiveClauseId] = useState<string | undefined>();
  const [tab, setTab] = useState("redlines");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!contract) {
    return (
      <div className="p-8 text-center bg-white border border-slate-200 rounded-xl m-6">
        <p className="text-sm text-slate-500 font-medium">Contract record not found.</p>
        <Link href="/vault" className="text-xs text-emerald-600 font-semibold underline mt-2 inline-block">
          Return to Vault
        </Link>
      </div>
    );
  }

  const risks = getRiskFlagsForContract(contract.id);

  const goToClause = (clauseId: string, page: number) => {
    setActiveClauseId(clauseId);
    setActivePage(page);
    setTimeout(() => {
      document.getElementById(`clause-${clauseId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  };

  const copyClause = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex h-full flex-col bg-slate-50 text-slate-900">
      {/* Top Utility Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 h-14 shrink-0 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <Link 
            href="/vault" 
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-900 truncate">{contract.title}</h1>
              <Badge variant={contract.status === "Active" ? "success" : contract.status === "Expiring" ? "warning" : "secondary"}>
                {contract.status}
              </Badge>
              {risks.length > 0 && (
                <Badge variant="destructive" className="gap-1 bg-rose-50 text-rose-700 border-rose-200">
                  <ShieldAlert className="h-3 w-3" />
                  {risks.length} Redlines Detected
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 truncate">
              {contract.counterparty} {contract.jurisdiction ? `• ${contract.jurisdiction}` : "• Lagos, NG"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
            Lagos Tenancy 2011 Active
          </span>

          <Button
            size="sm"
            onClick={() => generateAuditReportPDF(contract, risks)}
            className="h-8 gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium px-3 rounded-lg cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            Export PDF Audit
          </Button>
        </div>
      </div>

      {/* Main Split-Pane Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_450px] min-h-0">
        {/* Left Pane: Document & PDF Viewer */}
        <div className="border-r border-slate-200 bg-slate-100/50 flex flex-col min-h-0">
          <PdfViewer contract={contract} activePage={activePage} onPageChange={setActivePage} />
        </div>

        {/* Right Pane: Interactive Clause Explorer, Metadata, & Chat */}
        <div className="flex flex-col min-h-0 bg-white">
          <Tabs value={tab} onValueChange={setTab} className="flex flex-col h-full min-h-0">
            <div className="p-2 border-b border-slate-200 bg-slate-50/50 shrink-0">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="redlines" className="gap-1.5 text-xs">
                  <Scale className="h-3.5 w-3.5 text-emerald-600" />
                  Redlines ({risks.length})
                </TabsTrigger>
                <TabsTrigger value="metadata" className="gap-1.5 text-xs">
                  <Info className="h-3.5 w-3.5" /> 
                  Metadata
                </TabsTrigger>
                <TabsTrigger value="chat" className="gap-1.5 text-xs">
                  <MessageSquare className="h-3.5 w-3.5" /> 
                  Q&A Assistant
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Redlines & Counter-Clauses Tab */}
            <TabsContent value="redlines" className="flex-1 min-h-0 m-0">
              <ScrollArea className="h-full px-4 py-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Statutory Compliance Violations
                    </span>
                    <span className="text-[11px] text-slate-400">Click card to jump</span>
                  </div>

                  {risks.length === 0 ? (
                    <div className="p-6 text-center border border-emerald-200 bg-emerald-50/50 rounded-xl space-y-2">
                      <Scale className="h-6 w-6 text-emerald-600 mx-auto" />
                      <p className="text-xs font-bold text-emerald-900">Zero Statutory Breaches Detected</p>
                      <p className="text-[11px] text-emerald-700">This agreement conforms strictly to Lagos Tenancy Law 2011.</p>
                    </div>
                  ) : (
                    risks.map((risk) => {
                      const r = risk as any;
                      const violationTitle = r.category || r.title || r.type || "Section 4 / 13 Violation";
                      const violationDesc = r.description || r.issue || r.explanation || r.reason || "Statutory clause non-compliance detected.";
                      const targetPage = r.page || 1;
                      const counterClause = r.recommendation || r.suggestedAction || r.proposedRedline || "Amend clause to align with Lagos Tenancy Law 2011 standard.";
                      const clauseId = r.clauseId || r.clause_id;
                      const severity = r.severity || "High";

                      return (
                        <div
                          key={risk.id}
                          id={clauseId ? `clause-${clauseId}` : undefined}
                          onClick={() => clauseId && goToClause(clauseId, targetPage)}
                          className={`p-4 rounded-xl border transition-all cursor-pointer space-y-3 ${
                            activeClauseId === clauseId
                              ? "bg-rose-50/40 border-rose-400 ring-1 ring-rose-400"
                              : "bg-white border-rose-200 hover:border-rose-300 shadow-xs"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                {violationTitle}
                              </span>
                              {targetPage && (
                                <span className="text-[10px] text-slate-400 font-mono">Page {targetPage}</span>
                              )}
                            </div>
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                              {severity} Risk
                            </span>
                          </div>

                          <p className="text-xs font-medium text-slate-800 leading-relaxed">
                            {violationDesc}
                          </p>

                          {/* Proposed Counter-Clause Block */}
                          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide">
                                Statutory Redline Counter-Clause
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyClause(counterClause, risk.id);
                                }}
                                className="h-6 px-2 text-[10px] text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100/50"
                              >
                                {copiedId === risk.id ? (
                                  <span className="flex items-center gap-1">
                                    <Check className="h-3 w-3" /> Copied
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1">
                                    <Copy className="h-3 w-3" /> Copy
                                  </span>
                                )}
                              </Button>
                            </div>
                            <p className="text-xs font-mono text-emerald-950 italic leading-relaxed">
                              "{counterClause}"
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Metadata Panel Tab */}
            <TabsContent value="metadata" className="flex-1 min-h-0 m-0">
              <ScrollArea className="h-full px-4 py-4">
                <MetadataPanel contract={contract} onClauseClick={goToClause} activeClauseId={activeClauseId} />
              </ScrollArea>
            </TabsContent>

            {/* Q&A Assistant Drawer Tab */}
            <TabsContent value="chat" className="flex-1 min-h-0 m-0">
              <ChatDrawer contract={contract} onCitationClick={goToClause} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}