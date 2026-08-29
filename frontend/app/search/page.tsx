'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Sparkles, 
  FileText, 
  ArrowRight, 
  Building2, 
  Scale, 
  Loader2,
  SlidersHorizontal,
  FolderLock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';

export default function SemanticSearchPage() {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('ALL');

  useEffect(() => {
    async function loadClients() {
      const { data } = await supabase.from('workspace_clients').select('id, client_name, client_type');
      setClients(data || []);
    }
    loadClients();
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          clientId: selectedClientId === 'ALL' ? undefined : selectedClientId,
          matchThreshold: 0.25,
          matchCount: 12,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResults(data.results || []);
    } catch (err: any) {
      alert(`Search failed: ${err.message}`);
    } finally {
      setSearching(false);
    }
  };

  const sampleQueries = [
    '6-month notice to quit under Lagos Tenancy Law 2011',
    'Unilateral service charge or maintenance fees',
    'Withholding tax deductions and gross-up indemnity',
    'Perpetual non-compete restraint of trade',
    'Immediate termination without prior notice',
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 space-y-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="border-b border-slate-800 pb-6 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-emerald-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Semantic Cross-Vault RAG Search</h1>
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">pgvector Engine</Badge>
          </div>
          <p className="text-slate-400 text-xs">
            Query precedent clauses, statutory deviations, and contractual provisions across all client repositories using high-dimensional vector similarity.
          </p>
        </div>

        {/* Search Bar & Client Scope Filter */}
        <form onSubmit={handleSearch} className="space-y-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 shadow-xl">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask or search: e.g. 'Find clauses with 2-year advance rent or 2-week notice in Lagos leases'..."
                className="pl-10 h-11 bg-slate-950 border-slate-700 text-sm text-slate-100 placeholder:text-slate-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="h-11 bg-slate-950 border border-slate-700 rounded-md px-3 text-xs text-slate-200"
              >
                <option value="ALL">All Client Repositories</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.client_name} ({c.client_type})
                  </option>
                ))}
              </select>

              <Button
                type="submit"
                disabled={searching || !query.trim()}
                className="h-11 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2"
              >
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Vector Search
              </Button>
            </div>
          </div>

          {/* Quick Query Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] text-slate-500 font-medium">Try searching:</span>
            {sampleQueries.map((sq, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setQuery(sq)}
                className="text-[11px] bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white px-2.5 py-1 rounded-full transition-all"
              >
                {sq}
              </button>
            ))}
          </div>
        </form>

        {/* Search Results */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Matched Contract Clauses ({results.length})
            </h2>
          </div>

          {searching ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
              <p className="text-xs">Running cosine similarity query across embedded vectors...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-500 bg-slate-900/30 border border-slate-800 rounded-xl space-y-2">
              <Search className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="font-semibold text-slate-300">No vector matches found</p>
              <p>Type a semantic search query above to query clauses across your multi-client vaults.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {results.map((item, idx) => {
                const matchPct = Math.round((item.similarity || 0.5) * 100);

                return (
                  <Card key={idx} className="bg-slate-900/80 border-slate-800 hover:border-slate-700 transition-all">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px]">
                            {matchPct}% Vector Match
                          </Badge>
                          <span className="text-xs font-bold text-white">{item.clause_title || `Clause ${item.chunk_index + 1}`}</span>
                          <span className="text-xs text-slate-500">•</span>
                          <span className="text-xs text-slate-300 font-medium">{item.contract?.title}</span>
                        </div>

                        <Link href={`/contracts/${item.contract_id}`}>
                          <Button size="sm" variant="ghost" className="text-emerald-400 hover:text-emerald-300 text-xs h-7 px-2">
                            Open in Redline Editor <ArrowRight className="w-3.5 h-3.5 ml-1" />
                          </Button>
                        </Link>
                      </div>

                      <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800/80 font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                        {item.chunk_text}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Counterparty: {item.contract?.counterparty || 'Entity'}</span>
                        <span>Category: {item.contract?.contract_type || 'COMMERCIAL'}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}