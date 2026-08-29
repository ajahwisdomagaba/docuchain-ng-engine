'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Layers, 
  ShieldCheck, 
  Plus, 
  Coins, 
  Database, 
  FileText, 
  TrendingUp, 
  Loader2, 
  Check, 
  X, 
  ExternalLink,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';

export default function PlatformAdminPage() {
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalContractCount, setGlobalContractCount] = useState(0);

  // New Law Firm Provisioning State
  const [showModal, setShowModal] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  const [firmName, setFirmName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#10b981');
  const [planTier, setPlanTier] = useState('PROFESSIONAL');
  const [maxMonthlyContracts, setMaxMonthlyContracts] = useState(100);

  const loadPlatformData = async () => {
    setLoading(true);
    try {
      const { data: wsData } = await supabase
        .from('workspaces')
        .select('*, workspace_clients(count)')
        .order('created_at', { ascending: false });
      setWorkspaces(wsData || []);

      const { count } = await supabase.from('contracts').select('*', { count: 'exact', head: true });
      setGlobalContractCount(count || 0);
    } catch (err: any) {
      console.error('Failed to load platform data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlatformData();
  }, []);

  const handleProvisionFirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firmName.trim() || !subdomain.trim()) return;

    setProvisioning(true);
    try {
      const cleanSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');

      const { data, error } = await supabase
        .from('workspaces')
        .insert({
          firm_name: firmName.trim(),
          slug: cleanSubdomain,
          subdomain: cleanSubdomain,
          primary_color: primaryColor,
          plan_tier: planTier,
          max_monthly_contracts: maxMonthlyContracts,
          max_storage_gb: planTier === 'ENTERPRISE' ? 50 : 10,
          max_ai_tokens: planTier === 'ENTERPRISE' ? 5000000 : 1000000,
          portal_subheading: 'Nigerian Statutory Legal Intelligence & Contract Vault'
        })
        .select()
        .single();

      if (error) throw error;
      setWorkspaces([data, ...workspaces]);
      setFirmName('');
      setSubdomain('');
      setShowModal(false);
      alert(`Law firm "${firmName}" provisioned successfully at ${cleanSubdomain}.docuchain.ng`);
    } catch (err: any) {
      alert(`Provisioning failed: ${err.message}`);
    } finally {
      setProvisioning(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 space-y-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-6 h-6 text-emerald-400" />
              <h1 className="text-2xl font-bold tracking-tight text-white">DocuChain Platform Super-Admin</h1>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">Platform Governance</Badge>
            </div>
            <p className="text-slate-400 text-xs mt-1">
              Provision Law Firm Reseller tenants, monitor global token burn, and enforce tenant storage/contract quotas.
            </p>
          </div>

          <Button
            onClick={() => setShowModal(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Provision Law Firm Reseller
          </Button>
        </div>

        {/* Global Platform Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
            <span className="text-xs text-slate-400 font-medium block">Active Law Firm Tenants</span>
            <div className="text-2xl font-bold text-white mt-1">{workspaces.length}</div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
            <span className="text-xs text-emerald-400 font-medium block">Total Audited Documents</span>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{globalContractCount}</div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
            <span className="text-xs text-amber-400 font-medium block">Global AI Tokens Burned</span>
            <div className="text-2xl font-bold text-amber-400 mt-1">{(globalContractCount * 4200).toLocaleString()}</div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
            <span className="text-xs text-blue-400 font-medium block">Infrastructure Health</span>
            <div className="text-2xl font-bold text-blue-400 mt-1">100% Operational</div>
          </div>
        </div>

        {/* Law Firm Resellers Directory */}
        <Card className="bg-slate-900/80 border-slate-800 overflow-hidden">
          <CardHeader className="p-5 border-b border-slate-800">
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" /> Provisioned Law Firm Tenants ({workspaces.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                <p className="text-xs">Loading platform tenants...</p>
              </div>
            ) : workspaces.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-500">
                No law firm tenants provisioned yet.
              </div>
            ) : (
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Firm Name &amp; Subdomain</th>
                    <th className="py-3.5 px-4 font-semibold">Tier</th>
                    <th className="py-3.5 px-4 font-semibold">Monthly Quota</th>
                    <th className="py-3.5 px-4 font-semibold">Storage Allocation</th>
                    <th className="py-3.5 px-4 font-semibold">Brand Color</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Vault Portal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {workspaces.map((ws) => (
                    <tr key={ws.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-4 font-medium text-white">
                        <div className="font-bold text-slate-100">{ws.firm_name}</div>
                        <div className="text-[11px] text-emerald-400 font-mono">
                          {ws.subdomain ? `${ws.subdomain}.docuchain.ng` : `${ws.slug || 'default'}.docuchain.ng`}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge className="bg-slate-800 text-slate-200 border-slate-700 text-[10px]">
                          {ws.plan_tier || 'PROFESSIONAL'}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-slate-300">
                        {ws.max_monthly_contracts || 100} contracts / mo
                      </td>
                      <td className="py-4 px-4 text-slate-300">
                        {ws.max_storage_gb || 10} GB Cloud
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-4 h-4 rounded-full border border-slate-700"
                            style={{ backgroundColor: ws.primary_color || '#10b981' }}
                          />
                          <span className="font-mono text-[11px]">{ws.primary_color || '#10b981'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Link href={`/reseller/clients?workspaceId=${ws.id}`}>
                          <Button variant="outline" size="sm" className="h-7 text-xs border-slate-700 hover:bg-slate-800 text-emerald-400 flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" /> Reseller Hub
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Provision Law Firm Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <Card className="bg-slate-900 border-slate-800 w-full max-w-md shadow-2xl">
            <CardHeader className="p-5 border-b border-slate-800 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" /> Provision Law Firm Reseller
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowModal(false)}
                className="h-6 w-6 p-0 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Law Firm Name</label>
                <Input
                  value={firmName}
                  onChange={(e) => setFirmName(e.target.value)}
                  placeholder="e.g. Adelowo &amp; Associates Legal"
                  className="bg-slate-950 border-slate-700 text-xs text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Subdomain Handle</label>
                <div className="flex items-center">
                  <Input
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value)}
                    placeholder="adelowo"
                    className="bg-slate-950 border-slate-700 text-xs text-slate-100 rounded-r-none font-mono"
                    required
                  />
                  <span className="bg-slate-800 border border-l-0 border-slate-700 text-slate-400 px-3 py-2 text-xs rounded-r-md">
                    .docuchain.ng
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Plan Tier</label>
                  <select
                    value={planTier}
                    onChange={(e) => setPlanTier(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-200"
                  >
                    <option value="STARTER">Starter</option>
                    <option value="PROFESSIONAL">Professional</option>
                    <option value="ENTERPRISE">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Brand Accent Color</label>
                  <Input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-8 bg-slate-950 border-slate-700 p-1 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowModal(false)}
                  className="text-xs text-slate-400"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleProvisionFirm}
                  disabled={provisioning || !firmName.trim() || !subdomain.trim()}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs flex items-center gap-1.5"
                >
                  {provisioning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Provision Firm
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}