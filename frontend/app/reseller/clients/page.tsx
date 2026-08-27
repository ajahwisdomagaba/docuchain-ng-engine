'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Users, 
  Plus, 
  ExternalLink, 
  FolderLock, 
  Sparkles, 
  Settings, 
  Search, 
  ShieldCheck, 
  Copy, 
  Check, 
  Loader2, 
  ArrowUpRight, 
  Phone,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import TierFeatureLock from '@/components/TierFeatureLock';
import { PLAN_PERMISSIONS, PlanTier, PlanLimits } from '@/lib/tierPermissions';

export default function ResellerClientManagerPage() {
  const { user } = useAuth();
  const [currentTier, setCurrentTier] = useState<PlanTier>('FREE');
  const [loading, setLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [whiteLabel, setWhiteLabel] = useState<any>(null);

  // Modals state
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Form states
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [companyRc, setCompanyRc] = useState('');
  const [industry, setIndustry] = useState('Real Estate & Commercial Lease');
  const [savingClient, setSavingClient] = useState(false);

  // White label form
  const [firmName, setFirmName] = useState('');
  const [brandColor, setBrandColor] = useState('#059669');
  const [whatsapp, setWhatsapp] = useState('');
  const [savingBrand, setSavingBrand] = useState(false);

  const permissions: PlanLimits = PLAN_PERMISSIONS[currentTier] || PLAN_PERMISSIONS.FREE;

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const activeUser = authUser || user;

        if (!activeUser) {
          setLoading(false);
          return;
        }

        // Fetch user plan
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('plan_tier')
          .eq('user_id', activeUser.id)
          .eq('status', 'ACTIVE')
          .single();

        if (sub?.plan_tier) {
          setCurrentTier(sub.plan_tier as PlanTier);
        }

        // Fetch client workspaces and white-label branding
        const res = await fetch(`/api/reseller/clients?userId=${activeUser.id}`);
        const data = await res.json();

        if (data.workspaces) setWorkspaces(data.workspaces);
        if (data.whiteLabel) {
          setWhiteLabel(data.whiteLabel);
          setFirmName(data.whiteLabel.firm_name || '');
          setBrandColor(data.whiteLabel.brand_primary_color || '#059669');
          setWhatsapp(data.whiteLabel.support_whatsapp || '');
        }
      } catch (err) {
        console.warn('Failed to load reseller client data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName) return;

    setSavingClient(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const activeUser = authUser || user;

      const res = await fetch('/api/reseller/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firmUserId: activeUser?.id,
          clientName,
          clientEmail,
          companyRcNumber: companyRc,
          industry,
        }),
      });

      const data = await res.json();
      if (data.success && data.client) {
        setWorkspaces([data.client, ...workspaces]);
        setShowNewClientModal(false);
        setClientName('');
        setClientEmail('');
        setCompanyRc('');
      } else {
        alert(data.error || 'Failed to create client workspace');
      }
    } catch (err: any) {
      alert('Error creating workspace: ' + err.message);
    } finally {
      setSavingClient(false);
    }
  };

  const handleSaveWhiteLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBrand(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const activeUser = authUser || user;

      const res = await fetch('/api/reseller/white-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firmUserId: activeUser?.id,
          firmName,
          brandPrimaryColor: brandColor,
          supportWhatsapp: whatsapp,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setWhiteLabel(data.settings);
        setShowSettingsModal(false);
      } else {
        alert(data.error || 'Failed to update branding settings');
      }
    } catch (err: any) {
      alert('Error updating branding: ' + err.message);
    } finally {
      setSavingBrand(false);
    }
  };

  const copyPortalLink = (slug: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${origin}/portal/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 text-slate-100">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Law Firm Client Workspace Manager</h1>
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">
              Reseller Tier
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Create segregated client vaults, configure custom law firm branding, and issue white-labeled audit portals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowSettingsModal(true)}
            className="border-slate-700 bg-slate-900 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-1.5"
          >
            <Settings className="w-3.5 h-3.5 text-emerald-400" /> White-Label Settings
          </Button>
          <Button
            onClick={() => setShowNewClientModal(true)}
            disabled={!permissions.hasClientVaultManager}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-950"
          >
            <Plus className="w-4 h-4" /> Add Client Workspace
          </Button>
        </div>
      </div>

      {/* Gating Check using TierFeatureLock */}
      <TierFeatureLock
        featureName="Law Firm Reseller Client Manager"
        requiredTier="LAW_FIRM_RESELLER"
        description="Segregate multiple client vaults under your law firm practice, brand counterparty portals, and provide certified statutory reports."
        isUnlocked={permissions.hasClientVaultManager}
      >
        {/* Active Firm Identity Widget */}
        <div className="bg-gradient-to-r from-emerald-950/30 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-lg text-lg"
              style={{ backgroundColor: whiteLabel?.brand_primary_color || '#059669' }}
            >
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{whiteLabel?.firm_name || 'Your Law Practice (Default)'}</h2>
              <p className="text-xs text-slate-400">
                White-label theme: <span className="font-mono text-emerald-400">{whiteLabel?.brand_primary_color || '#059669'}</span> • WhatsApp Line: {whiteLabel?.support_whatsapp || 'Not Configured'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6">
            <div>
              <span className="text-[11px] text-slate-500">Active Workspaces</span>
              <div className="text-xl font-bold text-white">{workspaces.length}</div>
            </div>
            <div>
              <span className="text-[11px] text-slate-500">Managed Contracts</span>
              <div className="text-xl font-bold text-emerald-400">
                {workspaces.reduce((acc, ws) => acc + (ws.contracts?.length || 0), 0)}
              </div>
            </div>
          </div>
        </div>

        {/* Client Workspaces List */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" /> Managed Client Accounts
          </h3>

          {workspaces.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
              <FolderLock className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-white">No Client Workspaces Added Yet</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Add your corporate clients, property developers, or startup accounts to maintain isolated contract vaults.
                </p>
              </div>
              <Button 
                onClick={() => setShowNewClientModal(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Create First Client Workspace
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workspaces.map((client) => {
                const contractCount = client.contracts?.length || 0;
                return (
                  <Card key={client.id} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
                    <CardHeader className="p-5 pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-sm font-bold text-white truncate max-w-[200px]">
                            {client.client_name}
                          </CardTitle>
                          <p className="text-[11px] text-slate-400">{client.industry}</p>
                        </div>
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                          {client.status}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="p-5 pt-0 space-y-4">
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1 text-xs">
                        <div className="flex items-center justify-between text-slate-400">
                          <span>RC Number:</span>
                          <span className="font-mono text-slate-200">{client.company_rc_number || 'N/A'}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-400">
                          <span>Vault Contracts:</span>
                          <span className="font-semibold text-emerald-400">{contractCount} docs</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-400">
                          <span>Client Email:</span>
                          <span className="text-slate-200 truncate max-w-[140px]">{client.client_email || 'None'}</span>
                        </div>
                      </div>

                      <div className="space-y-2 pt-1">
                        <Button
                          variant="outline"
                          onClick={() => copyPortalLink(client.portal_access_slug)}
                          className="w-full border-slate-800 bg-slate-950 hover:bg-slate-800 text-xs text-slate-300 flex items-center justify-center gap-1.5 h-8"
                        >
                          {copiedSlug === client.portal_access_slug ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied Portal Link
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-400" /> Copy Client Access Portal
                            </>
                          )}
                        </Button>
                        <Link href={`/vault?client=${client.id}`} className="block">
                          <Button className="w-full bg-emerald-600/20 border border-emerald-500/30 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 h-8">
                            <FolderLock className="w-3.5 h-3.5" /> Open Client Vault
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </TierFeatureLock>

      {/* Modal 1: Create New Client Workspace */}
      {showNewClientModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" /> New Client Workspace
              </h3>
              <button onClick={() => setShowNewClientModal(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Client / Company Name *</label>
                <Input
                  required
                  placeholder="e.g. Landmark Properties Nigeria Ltd"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Primary Contact Email</label>
                <Input
                  type="email"
                  placeholder="legal@landmark.ng"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">CAMA RC Number</label>
                  <Input
                    placeholder="RC-1294829"
                    value={companyRc}
                    onChange={(e) => setCompanyRc(e.target.value)}
                    className="bg-slate-950 border-slate-800 text-white font-mono text-[11px]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Sector / Industry</label>
                  <Input
                    placeholder="Real Estate / Fintech"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="bg-slate-950 border-slate-800 text-white text-[11px]"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={savingClient}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2.5 mt-2 shadow-lg shadow-emerald-950 flex items-center justify-center gap-2"
              >
                {savingClient ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Isolated Client Workspace'}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: White Label Settings */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-emerald-400" /> White-Label Portal Customization
              </h3>
              <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>

            <form onSubmit={handleSaveWhiteLabel} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Law Firm Display Name</label>
                <Input
                  required
                  placeholder="e.g. Aluko & Oyebode Legal Partners"
                  value={firmName}
                  onChange={(e) => setFirmName(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Primary Brand Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="w-9 h-9 rounded-lg bg-transparent border border-slate-800 cursor-pointer"
                  />
                  <Input
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="bg-slate-950 border-slate-800 text-white font-mono text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Priority WhatsApp Helpline</label>
                <Input
                  placeholder="+234 803 000 0000"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white"
                />
              </div>

              <Button
                type="submit"
                disabled={savingBrand}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2.5 mt-2 shadow-lg shadow-emerald-950 flex items-center justify-center gap-2"
              >
                {savingBrand ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Firm Branding'}
              </Button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}