"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Briefcase,
  Building2,
  FolderLock,
  Search,
  BookOpen,
  Palette,
  ExternalLink,
  Loader2,
  FileText,
  ArrowRight,
  Sliders,
  Plus,
  X,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient";

interface ClientVault {
  id: string;
  name: string;
  industry?: string;
  contract_count?: number;
  health_score?: number;
  primary_contact?: string;
}

function ClientsContent() {
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");

  const [userRole, setUserRole] = useState<string>("ASSOCIATE");
  const [activeTab, setActiveTab] = useState<"clients" | "playbooks" | "branding">("clients");
  const [clients, setClients] = useState<ClientVault[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State: Provision Client Vault
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientIndustry, setClientIndustry] = useState("Commercial Practice");
  const [clientContact, setClientContact] = useState("");
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [provisionSuccess, setProvisionSuccess] = useState(false);

  useEffect(() => {
    async function initUserAndClients() {
      setLoading(true);
      try {
        if (roleParam) {
          setUserRole(roleParam.toUpperCase());
        } else {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.email) {
            const { data: member } = await supabase
              .from("workspace_members")
              .select("role")
              .eq("email", session.user.email)
              .maybeSingle();

            if (member?.role) setUserRole(member.role.toUpperCase());
          }
        }

        const { data: clientData, error } = await supabase
          .from("workspace_clients")
          .select("*")
          .order("created_at", { ascending: false });

        if (clientData && !error && clientData.length > 0) {
          setClients(clientData);
        } else {
          setClients([
            {
              id: "b02494d4-1833-4a93-9513-f85ee4ee1d8c",
              name: "Prime Realty Development Ltd",
              industry: "Real Estate & Infrastructure",
              contract_count: 4,
              health_score: 94,
              primary_contact: "legal@primerealty.ng",
            },
            {
              id: "c18394a1-9921-4f11-8832-e85fe1234a91",
              name: "First Bank Commercial Services",
              industry: "Banking & Financial Services",
              contract_count: 8,
              health_score: 88,
              primary_contact: "counsel@firstbank.ng",
            },
          ]);
        }
      } catch (err) {
        console.error("Clients load error:", err);
      } finally {
        setLoading(false);
      }
    }

    initUserAndClients();
  }, [roleParam]);

  const isPartner = userRole === "PARTNER" || userRole === "FIRM_ADMIN" || userRole === "LEGAL_COUNSEL";

  const handleProvisionClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientContact.trim()) return;

    setIsProvisioning(true);
    try {
      const newClient = {
        id: crypto.randomUUID(),
        name: clientName.trim(),
        industry: clientIndustry.trim(),
        primary_contact: clientContact.trim().toLowerCase(),
        health_score: 100,
        contract_count: 0,
      };

      await supabase.from("workspace_clients").insert(newClient);

      setClients((prev) => [newClient, ...prev]);
      setProvisionSuccess(true);
      setTimeout(() => {
        setProvisionSuccess(false);
        setShowProvisionModal(false);
        setClientName("");
        setClientContact("");
      }, 1500);
    } catch (err) {
      console.error("Provisioning error:", err);
    } finally {
      setIsProvisioning(false);
    }
  };

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.industry?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Law Firm Client Repositories
              </span>
              <Badge
                className={`text-[10px] ${
                  isPartner
                    ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                    : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                }`}
              >
                {isPartner ? "Partner Oversight Mode" : "Associate Counsel Workspace"}
              </Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white mt-1">
              Client Repositories &amp; Matters
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {isPartner
                ? "Manage corporate client accounts, matter folders, AI review playbooks, and client portals."
                : "Collaborate on assigned corporate client files, contract reviews, and statutory redlines."}
            </p>
          </div>

          {/* Action: Provision Client Vault (Accessible to all lawyers) */}
          <Button
            onClick={() => setShowProvisionModal(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs flex items-center gap-1.5 h-9 shadow-lg shadow-emerald-950 font-semibold"
          >
            <Plus className="w-3.5 h-3.5" /> Provision Client Vault
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <Button
            variant="ghost"
            onClick={() => setActiveTab("clients")}
            className={`text-xs h-8 ${
              activeTab === "clients"
                ? "bg-slate-900 text-emerald-400 border-b-2 border-emerald-400 rounded-none font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Building2 className="w-3.5 h-3.5 mr-1.5" /> Client Repositories ({clients.length})
          </Button>

          {/* PARTNER EXCLUSIVE TABS */}
          {isPartner && (
            <>
              <Button
                variant="ghost"
                onClick={() => setActiveTab("playbooks")}
                className={`text-xs h-8 ${
                  activeTab === "playbooks"
                    ? "bg-slate-900 text-emerald-400 border-b-2 border-emerald-400 rounded-none font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 mr-1.5" /> AI Review Playbooks (1)
              </Button>
              <Button
                variant="ghost"
                onClick={() => setActiveTab("branding")}
                className={`text-xs h-8 ${
                  activeTab === "branding"
                    ? "bg-slate-900 text-emerald-400 border-b-2 border-emerald-400 rounded-none font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Palette className="w-3.5 h-3.5 mr-1.5" /> White-Label Branding
              </Button>
            </>
          )}
        </div>

        {/* Tab 1: Client Repositories */}
        {activeTab === "clients" && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
              <div className="relative w-full max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <Input
                  placeholder="Search clients by name or industry..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-emerald-500"
                />
              </div>
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                <p className="text-xs">Loading client repositories...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredClients.map((client) => (
                  <Card
                    key={client.id}
                    className="bg-slate-900/60 border-slate-800 hover:border-slate-700 transition-colors"
                  >
                    <CardHeader className="p-5 pb-3 flex flex-row items-start justify-between">
                      <div>
                        <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-emerald-400" />
                          {client.name}
                        </CardTitle>
                        <p className="text-xs text-slate-400 mt-1">{client.industry}</p>
                      </div>
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
                        Health Score: {client.health_score || 95}%
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-5 pt-0 space-y-4">
                      <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/60 pt-3">
                        <span>Contracts: {client.contract_count || 0} active</span>
                        <span>Contact: {client.primary_contact}</span>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2">
                        <Link href={`/portal?clientId=${client.id}`} className="w-full">
                          <Button
                            variant="outline"
                            className="w-full border-slate-700 bg-slate-800 text-xs h-8 text-slate-200 hover:text-white flex items-center justify-center gap-1.5"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-emerald-400" /> Open Portal
                          </Button>
                        </Link>
                        <Link href={`/vault?clientId=${client.id}`} className="w-full">
                          <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 flex items-center justify-center gap-1.5">
                            Matter Vault <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: AI Review Playbooks (Partner Only) */}
        {activeTab === "playbooks" && isPartner && (
          <Card className="bg-slate-900/60 border-slate-800 p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" /> Firm Statutory &amp; AI Review Rules
            </h3>
            <p className="text-xs text-slate-400">
              Configure mandatory statutory checks applied during contract ingestion under CAMA 2020 and Lagos Tenancy Law 2011.
            </p>
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between font-semibold text-slate-200">
                <span>Lagos State Tenancy Law 2011 (Section 4 &amp; 13)</span>
                <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px]">ENFORCED</Badge>
              </div>
              <p className="text-slate-500 text-[11px]">
                Auto-flags advance rent demands exceeding statutory limits and generates Form TL5 notice timelines.
              </p>
            </div>
          </Card>
        )}

        {/* Tab 3: White-Label Branding (Partner Only) */}
        {activeTab === "branding" && isPartner && (
          <Card className="bg-slate-900/60 border-slate-800 p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Palette className="w-4 h-4 text-emerald-400" /> Practice Identity &amp; Portal Subdomain
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Firm Legal Name</label>
                <Input defaultValue="Niyi Osunbijij & Co." className="bg-slate-950 border-slate-700" />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Custom Subdomain</label>
                <Input defaultValue="osunbijij.docuchain.ng" className="bg-slate-950 border-slate-700" />
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Provision Client Vault Modal */}
      {showProvisionModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 animate-in fade-in-50">
          <Card className="bg-slate-900 border-slate-800 w-full max-w-md shadow-2xl">
            <CardHeader className="p-4 border-b border-slate-800 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" /> Provision Client Vault
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowProvisionModal(false)}
                className="h-6 w-6 p-0 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              {provisionSuccess ? (
                <div className="py-6 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <h4 className="text-sm font-bold text-white">Client Vault Provisioned!</h4>
                  <p className="text-xs text-slate-400">
                    The isolated repository and portal link have been created.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleProvisionClient} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">
                      Client / Corporate Name
                    </label>
                    <Input
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="e.g. Zenith Global Ventures Ltd"
                      className="bg-slate-950 border-slate-700 text-xs text-slate-100"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">
                      Practice Area / Industry
                    </label>
                    <Input
                      value={clientIndustry}
                      onChange={(e) => setClientIndustry(e.target.value)}
                      placeholder="e.g. Real Estate & Construction"
                      className="bg-slate-950 border-slate-700 text-xs text-slate-100"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">
                      Primary Client Contact Email
                    </label>
                    <Input
                      type="email"
                      value={clientContact}
                      onChange={(e) => setClientContact(e.target.value)}
                      placeholder="e.g. legal@zenithventures.ng"
                      className="bg-slate-950 border-slate-700 text-xs text-slate-100"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowProvisionModal(false)}
                      className="text-xs text-slate-400"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isProvisioning}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-9 font-semibold"
                    >
                      {isProvisioning ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> Provisioning...
                        </>
                      ) : (
                        "Create Client Vault"
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function ClientsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mb-2" />
          <p className="text-xs">Loading client repositories...</p>
        </div>
      }
    >
      <ClientsContent />
    </Suspense>
  );
}