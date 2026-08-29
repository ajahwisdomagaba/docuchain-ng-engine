'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  ShieldAlert, 
  Flame, 
  Building2, 
  AlertTriangle, 
  Scale, 
  CheckCircle2, 
  TrendingUp, 
  Search, 
  Filter, 
  FileText, 
  Loader2,
  ExternalLink,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

export default function RiskHeatmapPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    async function loadPortfolioData() {
      setLoading(true);
      try {
        // 1. Fetch contracts with nested risk flags and client info
        const { data: contractData, error } = await supabase
          .from('contracts')
          .select('*, risk_flags(*), workspace_clients(id, client_name, client_type)')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setContracts(contractData || []);

        // 2. Fetch clients
        const { data: clientData } = await supabase
          .from('workspace_clients')
          .select('id, client_name, client_type')
          .order('client_name');
        setClients(clientData || []);
      } catch (err: any) {
        console.error('Error loading risk portfolio:', err.message);
      } finally {
        setLoading(false);
      }
    }

    loadPortfolioData();
  }, [user]);

  // Scoped Filtering
  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      const matchesClient = selectedClientId === 'ALL' || c.client_id === selectedClientId;
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        c.title.toLowerCase().includes(q) ||
        (c.counterparty || '').toLowerCase().includes(q) ||
        (c.contract_type || '').toLowerCase().includes(q);
      return matchesClient && matchesSearch;
    });
  }, [contracts, selectedClientId, searchQuery]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    let highRiskCount = 0;
    let totalRiskFlags = 0;
    const categoryBreakdown: Record<string, number> = {};
    const counterpartyRisks: Record<string, { count: number; totalRiskScore: number }> = {};
    const statuteBreakdown = {
      lagosTenancy: 0,
      labourWage: 0,
      cama2020: 0,
      ndpa2023: 0,
      arbitration2023: 0
    };

    filteredContracts.forEach((c) => {
      const riskScore = c.risk_score || 0;
      if (riskScore >= 40) highRiskCount++;

      const flags = c.risk_flags || [];
      totalRiskFlags += flags.length;

      // Category breakdown
      const type = c.contract_type || 'COMMERCIAL';
      categoryBreakdown[type] = (categoryBreakdown[type] || 0) + 1;

      // Counterparty risk mapping
      const cp = c.counterparty || 'Unknown Entity';
      if (!counterpartyRisks[cp]) counterpartyRisks[cp] = { count: 0, totalRiskScore: 0 };
      counterpartyRisks[cp].count += 1;
      counterpartyRisks[cp].totalRiskScore += riskScore;

      // Statutory violations analysis
      flags.forEach((f: any) => {
        const text = `${f.clause_title || ''} ${f.legal_basis || ''} ${f.issue_summary || ''}`.toLowerCase();
        if (text.includes('tenancy') || text.includes('rent') || text.includes('notice to quit')) statuteBreakdown.lagosTenancy++;
        if (text.includes('labour') || text.includes('minimum wage') || text.includes('salary')) statuteBreakdown.labourWage++;
        if (text.includes('cama') || text.includes('section 102') || text.includes('seal')) statuteBreakdown.cama2020++;
        if (text.includes('ndpa') || text.includes('privacy') || text.includes('data protection')) statuteBreakdown.ndpa2023++;
        if (text.includes('arbitration') || text.includes('1988')) statuteBreakdown.arbitration2023++;
      });
    });

    const sortedCounterparties = Object.entries(counterpartyRisks)
      .map(([name, data]) => ({
        name,
        contractsCount: data.count,
        avgRiskScore: Math.round(data.totalRiskScore / data.count)
      }))
      .sort((a, b) => b.avgRiskScore - a.avgRiskScore)
      .slice(0, 5);

    return {
      highRiskCount,
      totalRiskFlags,
      categoryBreakdown,
      statuteBreakdown,
      sortedCounterparties
    };
  }, [filteredContracts]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 space-y-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <Flame className="w-6 h-6 text-rose-500" />
              <h1 className="text-2xl font-bold tracking-tight text-white">Portfolio Risk Heatmap</h1>
              <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/30 text-xs">Statutory Exposure</Badge>
            </div>
            <p className="text-slate-400 text-xs mt-1">
              Multi-tenant statutory risk distribution, recurring non-compliance clauses, and counterparty exposure index.
            </p>
          </div>

          {/* Client Filter Selector */}
          <div className="flex items-center gap-3">
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-slate-200"
            >
              <option value="ALL">All Client Vaults (Global Portfolio)</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.client_name} ({client.client_type})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Metric Summary Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
            <span className="text-xs text-slate-400 font-medium block">Total Audited Agreements</span>
            <div className="text-2xl font-bold text-white mt-1">{filteredContracts.length}</div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
            <span className="text-xs text-rose-400 font-medium block">High Exposure Contracts</span>
            <div className="text-2xl font-bold text-rose-400 mt-1">{metrics.highRiskCount}</div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
            <span className="text-xs text-amber-400 font-medium block">Total Flagged Clauses</span>
            <div className="text-2xl font-bold text-amber-400 mt-1">{metrics.totalRiskFlags}</div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
            <span className="text-xs text-emerald-400 font-medium block">Average Portfolio Health</span>
            <div className="text-2xl font-bold text-emerald-400 mt-1">
              {filteredContracts.length > 0 
                ? `${Math.round(100 - (filteredContracts.reduce((acc, c) => acc + (c.risk_score || 0), 0) / filteredContracts.length))}/100` 
                : '100/100'}
            </div>
          </div>
        </div>

        {/* Statutory Violation Heat Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Statutory Matrix */}
          <Card className="lg:col-span-7 bg-slate-900/80 border-slate-800">
            <CardHeader className="p-5 border-b border-slate-800">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-400" /> Nigerian Statutory Non-Compliance Frequency
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {/* Lagos Tenancy */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">Lagos State Tenancy Law 2011 (Sec 4 Advance Rent / Sec 13 Notice)</span>
                  <span className="text-rose-400 font-bold">{metrics.statuteBreakdown.lagosTenancy} Violations</span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className="bg-rose-500 h-full rounded-full transition-all" 
                    style={{ width: `${Math.min(100, (metrics.statuteBreakdown.lagosTenancy / Math.max(1, metrics.totalRiskFlags)) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Labour Act & Minimum Wage */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">National Minimum Wage Act 2024 & Labour Act (₦70k Baseline)</span>
                  <span className="text-amber-400 font-bold">{metrics.statuteBreakdown.labourWage} Violations</span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className="bg-amber-500 h-full rounded-full transition-all" 
                    style={{ width: `${Math.min(100, (metrics.statuteBreakdown.labourWage / Math.max(1, metrics.totalRiskFlags)) * 100)}%` }}
                  />
                </div>
              </div>

              {/* CAMA 2020 */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">CAMA 2020 (Section 102 Corporate Execution & Seals)</span>
                  <span className="text-blue-400 font-bold">{metrics.statuteBreakdown.cama2020} Violations</span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className="bg-blue-500 h-full rounded-full transition-all" 
                    style={{ width: `${Math.min(100, (metrics.statuteBreakdown.cama2020 / Math.max(1, metrics.totalRiskFlags)) * 100)}%` }}
                  />
                </div>
              </div>

              {/* NDPA 2023 */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">Nigeria Data Protection Act (NDPA) 2023</span>
                  <span className="text-emerald-400 font-bold">{metrics.statuteBreakdown.ndpa2023} Violations</span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all" 
                    style={{ width: `${Math.min(100, (metrics.statuteBreakdown.ndpa2023 / Math.max(1, metrics.totalRiskFlags)) * 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Counterparty Risk Leaderboard */}
          <Card className="lg:col-span-5 bg-slate-900/80 border-slate-800">
            <CardHeader className="p-5 border-b border-slate-800">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-rose-400" /> High-Risk Counterparties
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Entity</th>
                    <th className="py-3 px-4">Contracts</th>
                    <th className="py-3 px-4">Avg Risk Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {metrics.sortedCounterparties.map((cp, i) => (
                    <tr key={i} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-semibold text-white truncate max-w-[150px]">{cp.name}</td>
                      <td className="py-3 px-4 text-slate-400">{cp.contractsCount} docs</td>
                      <td className="py-3 px-4">
                        <Badge className={cp.avgRiskScore >= 40 ? 'bg-rose-500/20 text-rose-400 text-[10px]' : 'bg-amber-500/20 text-amber-400 text-[10px]'}>
                          {cp.avgRiskScore}% Risk Exposure
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* High Risk Document Grid */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
              High-Risk Document Inventory ({filteredContracts.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContracts.map((c) => {
              const riskScore = c.risk_score || 0;
              const isHighRisk = riskScore >= 40;

              return (
                <Card key={c.id} className="bg-slate-900/80 border-slate-800 hover:border-slate-700 flex flex-col justify-between">
                  <CardHeader className="p-4 pb-2 border-b border-slate-800/60">
                    <div className="flex items-center justify-between">
                      <Badge className={isHighRisk ? 'bg-rose-500/20 text-rose-400 text-[10px]' : 'bg-emerald-500/20 text-emerald-400 text-[10px]'}>
                        {isHighRisk ? 'HIGH RISK' : 'LOW RISK'}
                      </Badge>
                      <span className="text-xs font-bold text-white">Score: {100 - riskScore}/100</span>
                    </div>
                    <CardTitle className="text-sm font-bold text-white mt-2 truncate">{c.title}</CardTitle>
                    <p className="text-xs text-slate-400 truncate">Counterparty: {c.counterparty || 'Entity'}</p>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Flagged Clauses:</span>
                      <span className="font-semibold text-rose-400">{c.risk_flags?.length || 0} Violations</span>
                    </div>
                    <Link href={`/contracts/${c.id}`} className="block pt-2">
                      <Button variant="outline" size="sm" className="w-full border-slate-700 hover:bg-slate-800 text-slate-200 text-xs flex items-center justify-center gap-1.5">
                        <ExternalLink className="w-3.5 h-3.5 text-emerald-400" /> Open Interactive Redline Editor
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}