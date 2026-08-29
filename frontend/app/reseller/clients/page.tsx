'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  Building2, 
  Plus, 
  FolderLock, 
  Sparkles, 
  ExternalLink, 
  ShieldCheck, 
  Trash2, 
  Edit3, 
  Palette, 
  FileText, 
  Settings, 
  Loader2, 
  Check, 
  X,
  Users,
  Scale
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

function ResellerClientsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const workspaceIdParam = searchParams.get('workspaceId');

  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [playbooks, setPlaybooks] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'clients' | 'playbooks' | 'branding'>('clients');

  // New Client Modal State
  const [showClientModal, setShowClientModal] = useState(false);
  const [creatingClient, setCreatingClient] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientType, setClientType] = useState('CORPORATE');
  const [contactEmail, setContactEmail] = useState('');

  // Branding Customization State
  const [savingBranding, setSavingBranding] = useState(false);
  const [firmName, setFirmName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#10b981');
  const [portalSubheading, setPortalSubheading] = useState('');
  const [supportEmail, setSupportEmail] = useState('');

  // Playbook Modal State
  const [showPlaybookModal, setShowPlaybookModal] = useState(false);
  const [creatingPlaybook, setCreatingPlaybook] = useState(false);
  const [playbookName, setPlaybookName] = useState('');
  const [playbookCategory, setPlaybookCategory] = useState('TENANCY');
  const [mandatoryClauses, setMandatoryClauses] = useState('');
  const [forbiddenTerms, setForbiddenTerms] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Workspace (scoped by workspaceIdParam if present)
      let wsQuery = supabase.from('workspaces').select('*');
      if (workspaceIdParam) {
        wsQuery = wsQuery.eq('id', workspaceIdParam);
      }
      const { data: wsData } = await wsQuery.limit(1);

      if (wsData && wsData.length > 0) {
        const activeWs = wsData[0];
        setWorkspace(activeWs);
        setFirmName(activeWs.firm_name || '');
        setPrimaryColor(activeWs.primary_color || '#10b981');
        setPortalSubheading(activeWs.portal_subheading || 'Nigerian Statutory Legal Intelligence & Contract Vault');
        setSupportEmail(activeWs.support_email || '');

        // 2. Fetch Client Vaults for this Workspace
        const { data: clientData } = await supabase
          .from('workspace_clients')
          .select('*, contracts(count)')
          .eq('workspace_id', activeWs.id)
          .order('created_at', { ascending: false });
        setClients(clientData || []);

        // 3. Fetch AI Playbooks for this Workspace
        const { data: pbData } = await supabase
          .from('ai_playbooks')
          .select('*')
          .eq('workspace_id', activeWs.id)
          .order('created_at', { ascending: false });
        setPlaybooks(pbData || []);
      }
    } catch (err: any) {
      console.error('Error loading reseller data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [workspaceIdParam, user]);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !workspace?.id) return;

    setCreatingClient(true);
    try {
      const { data, error } = await supabase
        .from('workspace_clients')
        .insert({
          workspace_id: workspace.id,
          client_name: clientName.trim(),
          client_type: clientType,
          contact_email: contactEmail.trim() || undefined,
        })
        .select()
        .single();

      if (error) throw error;
      setClients([data, ...clients]);
      setClientName('');
      setContactEmail('');
      setShowClientModal(false);
      alert(`Client Vault "${clientName}" provisioned successfully!`);
    } catch (err: any) {
      alert(`Failed to create client vault: ${err.message}`);
    } finally {
      setCreatingClient(false);
    }
  };

  const handleSaveBranding = async () => {
    if (!workspace?.id) return;
    setSavingBranding(true);
    try {
      const { error } = await supabase
        .from('workspaces')
        .update({
          firm_name: firmName,
          primary_color: primaryColor,
          portal_subheading: portalSubheading,
          support_email: supportEmail,
        })
        .eq('id', workspace.id);

      if (error) throw error;
      alert('White-label branding settings updated successfully!');
    } catch (err: any) {
      alert(`Failed to save branding: ${err.message}`);
    } finally {
      setSavingBranding(false);
    }
  };

  const handleCreatePlaybook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playbookName.trim() || !workspace?.id) return;

    setCreatingPlaybook(true);
    try {
      const mandatoryArr = mandatoryClauses
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      const forbiddenArr = forbiddenTerms
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const { data, error } = await supabase
        .from('ai_playbooks')
        .insert({
          workspace_id: workspace.id,
          playbook_name: playbookName.trim(),
          category: playbookCategory,
          mandatory_clauses: mandatoryArr,
          forbidden_terms: forbiddenArr,
          custom_instructions: customInstructions.trim() || undefined,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      setPlaybooks([data, ...playbooks]);
      setPlaybookName('');
      setMandatoryClauses('');
      setForbiddenTerms('');
      setCustomInstructions('');
      setShowPlaybookModal(false);
      alert('AI Review Playbook configured and active.');
    } catch (err: any) {
      alert(`Failed to create playbook: ${err.message}`);
    } finally {
      setCreatingPlaybook(false);
    }
  };

  const handleDeleteClient = async (id: string, name: string) => {
    if (!confirm(`Delete Client Vault for "${name}"? All isolated contracts will be deleted.`)) return;
    try {
      const { error } = await supabase.from('workspace_clients').delete().eq('id', id);
      if (error) throw error;
      setClients(clients.filter((c) => c.id !== id));
    } catch (err: any) {
      alert(`Failed to delete client: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
        <p className="text-xs">Loading Law Firm Reseller Workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 space-y-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Workspace Hub Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <span
                className="w-4 h-4 rounded-full border border-slate-700"
                style={{ backgroundColor: primaryColor }}
              />
              <h1 className="text-2xl font-bold tracking-tight text-white">
                {workspace?.firm_name || 'Law Firm Reseller Command Center'}
              </h1>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
                {workspace?.subdomain ? `${workspace.subdomain}.docuchain.ng` : 'Multi-Tenant Hub'}
              </Badge>
            </div>
            <p className="text-slate-400 text-xs mt-1">
              Segregated client repositories, automated AI review playbooks, and white-label statutory portal controls.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/reseller/team">
              <Button variant="outline" size="sm" className="border-slate-700 bg-slate-900 text-xs text-slate-300 hover:text-white flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-400" /> Firm Team &amp; RBAC
              </Button>
            </Link>
            <Button
              onClick={() => setShowClientModal(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Provision Client Vault
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-slate-800 pb-3">
          <Button
            size="sm"
            variant={activeTab === 'clients' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('clients')}
            className={`text-xs ${activeTab === 'clients' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <FolderLock className="w-3.5 h-3.5 mr-1.5" /> Segregated Client Vaults ({clients.length})
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'playbooks' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('playbooks')}
            className={`text-xs ${activeTab === 'playbooks' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <Scale className="w-3.5 h-3.5 mr-1.5" /> AI Review Playbooks ({playbooks.length})
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'branding' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('branding')}
            className={`text-xs ${activeTab === 'branding' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <Palette className="w-3.5 h-3.5 mr-1.5" /> White-Label Branding
          </Button>
        </div>

        {/* TAB 1: CLIENT VAULTS DIRECTORY */}
        {activeTab === 'clients' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {clients.map((c) => (
                <Card key={c.id} className="bg-slate-900/80 border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
                  <CardHeader className="p-5 pb-3 border-b border-slate-800/80">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                        {c.client_type || 'CORPORATE'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClient(c.id, c.client_name)}
                        className="h-6 w-6 p-0 text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <CardTitle className="text-base font-bold text-white mt-2 truncate">
                      {c.client_name}
                    </CardTitle>
                    <p className="text-xs text-slate-400 truncate">{c.contact_email || 'No contact email'}</p>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Stored Agreements:</span>
                      <span className="font-semibold text-slate-200">
                        {c.contracts?.[0]?.count || 0} contracts
                      </span>
                    </div>

                    <Link href={`/vault?clientId=${c.id}`} className="block">
                      <Button
                        size="sm"
                        className="w-full bg-slate-950 hover:bg-slate-800 border border-slate-700 text-emerald-400 text-xs flex items-center justify-center gap-1.5"
                      >
                        <FolderLock className="w-3.5 h-3.5" /> Open Isolated Vault
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: AI REVIEW PLAYBOOKS */}
        {activeTab === 'playbooks' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Statutory Playbook Rules</h2>
                <p className="text-xs text-slate-400">Rules injected dynamically into AI review prompts during contract ingestion.</p>
              </div>
              <Button
                onClick={() => setShowPlaybookModal(true)}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Create Review Playbook
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {playbooks.map((pb) => (
                <Card key={pb.id} className="bg-slate-900/80 border-slate-800 space-y-3 p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-bold text-white">{pb.playbook_name}</h3>
                      <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] mt-1">
                        Category: {pb.category}
                      </Badge>
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px]">ACTIVE</Badge>
                  </div>

                  {pb.mandatory_clauses && pb.mandatory_clauses.length > 0 && (
                    <div className="text-xs space-y-1">
                      <span className="text-[10px] font-semibold text-emerald-400 uppercase">Mandatory Terms:</span>
                      <ul className="list-disc list-inside text-slate-300 space-y-0.5">
                        {pb.mandatory_clauses.map((c: string, i: number) => (
                          <li key={i} className="truncate">{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {pb.forbidden_terms && pb.forbidden_terms.length > 0 && (
                    <div className="text-xs space-y-1">
                      <span className="text-[10px] font-semibold text-rose-400 uppercase">Forbidden / High-Risk Phrases:</span>
                      <ul className="list-disc list-inside text-slate-300 space-y-0.5">
                        {pb.forbidden_terms.map((t: string, i: number) => (
                          <li key={i} className="truncate">{t}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: WHITE-LABEL BRANDING */}
        {activeTab === 'branding' && (
          <Card className="bg-slate-900/80 border-slate-800 max-w-2xl">
            <CardHeader className="p-5 border-b border-slate-800">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <Palette className="w-4 h-4 text-emerald-400" /> White-Label Brand Customization
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Law Firm / Brand Name</label>
                <Input
                  value={firmName}
                  onChange={(e) => setFirmName(e.target.value)}
                  className="bg-slate-950 border-slate-700 text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Portal Primary Accent Color</label>
                <div className="flex items-center gap-3">
                  <Input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-9 w-16 bg-slate-950 border-slate-700 p-1 cursor-pointer"
                  />
                  <span className="font-mono text-xs text-slate-400">{primaryColor}</span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Custom Portal Subheading</label>
                <Input
                  value={portalSubheading}
                  onChange={(e) => setPortalSubheading(e.target.value)}
                  className="bg-slate-950 border-slate-700 text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Support Email</label>
                <Input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  placeholder="legal@adelowolaw.ng"
                  className="bg-slate-950 border-slate-700 text-xs text-slate-100"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  onClick={handleSaveBranding}
                  disabled={savingBranding}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs flex items-center gap-1.5"
                >
                  {savingBranding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Save Branding Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      </div>

      {/* Provision Client Vault Modal */}
      {showClientModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <Card className="bg-slate-900 border-slate-800 w-full max-w-md shadow-2xl">
            <CardHeader className="p-5 border-b border-slate-800 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <FolderLock className="w-4 h-4 text-emerald-400" /> Provision Segregated Client Vault
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowClientModal(false)} className="h-6 w-6 p-0 text-slate-400">
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Client Entity Name</label>
                <Input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. First Bank Commercial Ltd"
                  className="bg-slate-950 border-slate-700 text-xs text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Client Category</label>
                <select
                  value={clientType}
                  onChange={(e) => setClientType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-200"
                >
                  <option value="CORPORATE">Corporate Enterprise</option>
                  <option value="REAL_ESTATE">Real Estate &amp; Property</option>
                  <option value="FINTECH">Fintech / Financial Services</option>
                  <option value="SME">SME / Commercial Client</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Primary Contact Email</label>
                <Input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="legal.counsel@firstbank.ng"
                  className="bg-slate-950 border-slate-700 text-xs text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button variant="ghost" size="sm" onClick={() => setShowClientModal(false)} className="text-xs text-slate-400">
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleCreateClient}
                  disabled={creatingClient || !clientName.trim()}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs flex items-center gap-1.5"
                >
                  {creatingClient ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Provision Vault
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Provision AI Playbook Modal */}
      {showPlaybookModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <Card className="bg-slate-900 border-slate-800 w-full max-w-lg shadow-2xl">
            <CardHeader className="p-5 border-b border-slate-800 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-400" /> Create Review Playbook
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowPlaybookModal(false)} className="h-6 w-6 p-0 text-slate-400">
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Playbook Name</label>
                <Input
                  value={playbookName}
                  onChange={(e) => setPlaybookName(e.target.value)}
                  placeholder="e.g. Lagos Commercial Lease Policy"
                  className="bg-slate-950 border-slate-700 text-xs text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Category Scope</label>
                <select
                  value={playbookCategory}
                  onChange={(e) => setPlaybookCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-200"
                >
                  <option value="TENANCY">Tenancy &amp; Lease</option>
                  <option value="COMMERCIAL">Commercial SLAs &amp; Vendors</option>
                  <option value="EMPLOYMENT">Employment &amp; Labour</option>
                  <option value="NDA">Non-Disclosure (NDA)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Mandatory Clauses (One per line)</label>
                <textarea
                  rows={3}
                  value={mandatoryClauses}
                  onChange={(e) => setMandatoryClauses(e.target.value)}
                  placeholder="Section 13 Lagos Tenancy 6-Month Notice&#10;Arbitration and Mediation Act 2023 Venue"
                  className="w-full bg-slate-950 border border-slate-700 rounded-md p-2 text-xs font-mono text-slate-200"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Forbidden / Prohibited Terms (One per line)</label>
                <textarea
                  rows={3}
                  value={forbiddenTerms}
                  onChange={(e) => setForbiddenTerms(e.target.value)}
                  placeholder="Demand for 2-year advance rent&#10;Arbitration and Conciliation Act 1988"
                  className="w-full bg-slate-950 border border-slate-700 rounded-md p-2 text-xs font-mono text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button variant="ghost" size="sm" onClick={() => setShowPlaybookModal(false)} className="text-xs text-slate-400">
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleCreatePlaybook}
                  disabled={creatingPlaybook || !playbookName.trim()}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs flex items-center gap-1.5"
                >
                  {creatingPlaybook ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Save Playbook
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function ResellerClientsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
        </div>
      }
    >
      <ResellerClientsContent />
    </Suspense>
  );
}