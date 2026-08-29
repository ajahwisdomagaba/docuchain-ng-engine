'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  FolderLock, 
  Building2, 
  FileText, 
  Plus, 
  ShieldCheck, 
  Eye, 
  Download, 
  UploadCloud, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Loader2,
  Sparkles,
  Search,
  ExternalLink,
  Bot
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';
import NotificationBell from '@/components/NotificationBell';

function ClientPortalContent() {
  const searchParams = useSearchParams();
  const clientIdParam = searchParams.get('clientId');

  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<any>(null);
  const [contracts, setContracts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Ingestion Drawer
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [contractTitle, setContractTitle] = useState('');
  const [contractCategory, setContractCategory] = useState('TENANCY');
  const [contractText, setContractText] = useState('');
  const [isAuditing, setIsAuditing] = useState(false);

  const loadClientData = async () => {
    setLoading(true);
    try {
      let clientQuery = supabase.from('workspace_clients').select('*, workspaces(*)');
      if (clientIdParam) {
        clientQuery = clientQuery.eq('id', clientIdParam);
      }
      const { data: cData } = await clientQuery.limit(1);

      if (cData && cData.length > 0) {
        const activeClient = cData[0];
        setClient(activeClient);

        // Fetch client-isolated contracts
        const { data: contractData } = await supabase
          .from('contracts')
          .select('*, risk_flags(*)')
          .eq('client_id', activeClient.id)
          .order('created_at', { ascending: false });

        setContracts(contractData || []);
      }
    } catch (err: any) {
      console.error('Error loading client portal:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientData();
  }, [clientIdParam]);

  const handleIngestContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractText.trim() || !contractTitle.trim() || !client?.id) return;

    setIsAuditing(true);
    try {
      const res = await fetch('http://localhost:5000/api/review/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractText,
          title: contractTitle,
          category: contractCategory,
          clientId: client.id,
          workspaceId: client.workspace_id,
        }),
      });

      if (!res.ok) throw new Error('Audit engine failure');
      await loadClientData();
      setContractTitle('');
      setContractText('');
      setShowUploadModal(false);
      alert('Contract submitted to Law Firm for review & statutory audit!');
    } catch (err: any) {
      alert(`Submission failed: ${err.message}`);
    } finally {
      setIsAuditing(false);
    }
  };

  const filteredContracts = contracts.filter((c) => {
    const matchesCat = selectedCategory === 'ALL' || (c.contract_type || '').toUpperCase() === selectedCategory;
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (c.counterparty || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
        <p className="text-xs">Connecting to Secure Client Vault Portal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 sm:p-10 space-y-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Top Header with Law Firm Branding & Notifications */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FolderLock className="w-5 h-5 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                {client?.workspaces?.firm_name || 'Legal Partner Portal'}
              </span>
              <span className="text-slate-600">•</span>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-0 text-[10px]">
                {client?.client_type || 'CORPORATE'}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {client?.client_name || 'Client Vault Portal'}
            </h1>
            <p className="text-xs text-slate-400">
              Isolated legal repository governed by Nigerian statutory benchmarks.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell workspaceId={client?.workspace_id} />
            <Button
              onClick={() => setShowUploadModal(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs flex items-center gap-1.5 shadow-lg"
            >
              <Plus className="w-4 h-4" /> Submit Contract for Review
            </Button>
          </div>
        </div>

        {/* Client KPI Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-1">
            <span className="text-xs text-slate-400">Total Active Agreements</span>
            <div className="text-2xl font-bold text-white">{contracts.length}</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-1">
            <span className="text-xs text-emerald-400">Statutory Compliance Status</span>
            <div className="text-2xl font-bold text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-5 h-5" /> 100% Benchmarked
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-1">
            <span className="text-xs text-amber-400">Upcoming Notice Triggers (S.13)</span>
            <div className="text-2xl font-bold text-amber-400">1 Active Notice</div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contracts or counterparties..."
              className="pl-9 bg-slate-950 border-slate-700 text-xs text-slate-100"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-56 bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-200"
          >
            <option value="ALL">All Contract Categories</option>
            <option value="TENANCY">Tenancy &amp; Leases</option>
            <option value="COMMERCIAL">Commercial Agreements</option>
            <option value="EMPLOYMENT">Employment &amp; Labour</option>
            <option value="NDA">Non-Disclosure (NDAs)</option>
          </select>
        </div>

        {/* Contracts List */}
        <Card className="bg-slate-900/80 border-slate-800 overflow-hidden">
          <CardContent className="p-0">
            {filteredContracts.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-500 space-y-2">
                <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="font-semibold text-slate-300">No contracts found in this repository</p>
                <p>Click &ldquo;Submit Contract for Review&rdquo; above to ingest your first draft.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Agreement Title</th>
                    <th className="py-3.5 px-4 font-semibold">Category</th>
                    <th className="py-3.5 px-4 font-semibold">Counterparty</th>
                    <th className="py-3.5 px-4 font-semibold">Health Score</th>
                    <th className="py-3.5 px-4 font-semibold">Statutory Status</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredContracts.map((c) => {
                    const flags = c.risk_flags || [];
                    const openFlags = flags.filter((f: any) => f.status !== 'RESOLVED');
                    const score = Math.max(0, 100 - (c.risk_score || 0));

                    return (
                      <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-4 px-4 font-medium text-white">
                          <div className="font-bold text-slate-100">{c.title}</div>
                          <span className="text-[10px] text-slate-500">
                            Updated {new Date(c.created_at).toLocaleDateString('en-GB')}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant="outline" className="border-slate-700 bg-slate-950 text-slate-300 text-[10px]">
                            {c.contract_type || 'COMMERCIAL'}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-slate-300">
                          {c.counterparty || 'Counterparty'}
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-bold text-emerald-400">{score}/100</span>
                        </td>
                        <td className="py-4 px-4">
                          {openFlags.length === 0 ? (
                            <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                              ✓ 0 Open Risks
                            </Badge>
                          ) : (
                            <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px]">
                              {openFlags.length} flags pending
                            </Badge>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/contracts/${c.id}`}>
                              <Button size="sm" variant="outline" className="h-7 text-xs border-slate-700 text-slate-300 flex items-center gap-1">
                                <Eye className="w-3 h-3 text-emerald-400" /> Review Diffs
                              </Button>
                            </Link>
                            <Link href={`/sign/${c.id}`}>
                              <Button size="sm" className="h-7 text-xs bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30">
                                E-Sign
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Submission Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <Card className="bg-slate-900 border-slate-800 w-full max-w-lg shadow-2xl">
            <CardHeader className="p-5 border-b border-slate-800 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" /> Submit Contract for Review
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowUploadModal(false)} className="h-6 w-6 p-0 text-slate-400">
                ✕
              </Button>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Contract Title</label>
                <Input
                  value={contractTitle}
                  onChange={(e) => setContractTitle(e.target.value)}
                  placeholder="e.g. 2-Year Office Lease Agreement"
                  className="bg-slate-950 border-slate-700 text-xs text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Agreement Category</label>
                <select
                  value={contractCategory}
                  onChange={(e) => setContractCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-200"
                >
                  <option value="TENANCY">Tenancy / Lease (Lagos Tenancy Law 2011)</option>
                  <option value="COMMERCIAL">Commercial Vendor Agreement</option>
                  <option value="EMPLOYMENT">Employment Contract (Labour Act)</option>
                  <option value="NDA">Non-Disclosure Agreement (NDA)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Contract Text / Clauses</label>
                <textarea
                  rows={8}
                  value={contractText}
                  onChange={(e) => setContractText(e.target.value)}
                  placeholder="Paste agreement text here for statutory auditing..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs font-mono text-slate-200"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setShowUploadModal(false)} className="text-xs text-slate-400">
                  Cancel
                </Button>
                <Button
                  onClick={handleIngestContract}
                  disabled={isAuditing || !contractText.trim() || !contractTitle.trim()}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs flex items-center gap-1.5"
                >
                  {isAuditing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Submit to Law Firm
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function ClientPortalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
        </div>
      }
    >
      <ClientPortalContent />
    </Suspense>
  );
}