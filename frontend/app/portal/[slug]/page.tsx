'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  Building2, 
  ShieldCheck, 
  FileText, 
  Scale, 
  Loader2, 
  ArrowRight,
  ExternalLink,
  Lock,
  Mail,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';

interface WorkspaceData {
  id: string;
  firm_name: string;
  slug: string;
  logo_url?: string;
  primary_color: string;
  portal_subheading: string;
  support_email?: string;
}

interface PortalContract {
  id: string;
  title: string;
  contract_type: string;
  counterparty: string;
  risk_score: number;
  created_at: string;
  status: string;
}

export default function ClientPortalPage() {
  const params = useParams();
  const rawSlug = params?.slug as string;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;

  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [contracts, setContracts] = useState<PortalContract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPortalData() {
      if (!slug) return;
      setLoading(true);

      try {
        // 1. Fetch workspace by slug
        const { data: ws, error: wsError } = await supabase
          .from('workspaces')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();

        if (wsError) throw wsError;

        if (ws) {
          setWorkspace(ws);

          // 2. Fetch contracts associated with this workspace
          const { data: docs, error: docsError } = await supabase
            .from('contracts')
            .select('id, title, contract_type, counterparty, risk_score, created_at, status')
            .eq('workspace_id', ws.id)
            .order('created_at', { ascending: false });

          if (docsError) throw docsError;
          setContracts(docs || []);
        } else {
          setWorkspace(null);
        }
      } catch (err: any) {
        console.error('Failed to load client portal:', err.message);
        setWorkspace(null);
      } finally {
        setLoading(false);
      }
    }

    loadPortalData();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
        <p className="text-xs">Connecting to secure client repository...</p>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl mb-3">
          <Building2 className="w-8 h-8 text-slate-500" />
        </div>
        <h1 className="text-lg font-bold text-white">Client Portal Not Found</h1>
        <p className="text-xs max-w-sm mt-1 text-slate-500">
          The legal workspace &ldquo;{slug}&rdquo; is either unconfigured or private. Please contact your legal counsel for access.
        </p>
        <Link href="/" className="mt-4">
          <Button variant="outline" size="sm" className="border-slate-800 text-xs">
            Return Home
          </Button>
        </Link>
      </div>
    );
  }

  const primaryColor = workspace.primary_color || '#10b981';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 sm:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* White-Labeled Law Firm Brand Header */}
        <div 
          className="p-6 sm:p-8 rounded-2xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-2xl transition-all"
          style={{ 
            backgroundColor: `${primaryColor}0d`, 
            borderColor: `${primaryColor}30` 
          }}
        >
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <Building2 className="w-7 h-7" style={{ color: primaryColor }} />
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {workspace.firm_name}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-300">
              {workspace.portal_subheading || 'Official Client Legal Intelligence & Contract Vault'}
            </p>
            {workspace.support_email && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400 pt-1">
                <Mail className="w-3.5 h-3.5" />
                <span>Counsel Contact: <a href={`mailto:${workspace.support_email}`} className="underline hover:text-white">{workspace.support_email}</a></span>
              </div>
            )}
          </div>

          <div className="flex flex-col items-start md:items-end gap-2">
            <Badge 
              variant="outline"
              className="text-xs px-3 py-1 font-semibold flex items-center gap-1.5"
              style={{ color: primaryColor, borderColor: `${primaryColor}50`, backgroundColor: `${primaryColor}15` }}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Statutory Audit Verified
            </Badge>
            <span className="text-[10px] text-slate-500 font-mono">
              Powered by DocuChain NG Intelligence Engine
            </span>
          </div>
        </div>

        {/* Client Documents Grid */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
                Audited Client Agreements & Records ({contracts.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Benchmarked under CAMA 2020, Lagos Tenancy Law 2011, and Nigerian statutory frameworks.
              </p>
            </div>
          </div>

          {contracts.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-500 bg-slate-900/30 border border-slate-800 rounded-xl space-y-2">
              <FileText className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="font-medium text-slate-300">No active contracts published in this vault</p>
              <p>Your legal counsel will publish audited agreements and certificates to your portal as they are executed.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {contracts.map((c) => {
                const score = typeof c.risk_score === 'number' ? Math.max(0, 100 - c.risk_score) : 80;
                const isCompliant = score >= 70;

                return (
                  <Card key={c.id} className="bg-slate-900/60 border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
                    <CardHeader className="p-4 border-b border-slate-800/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="border-slate-700 text-slate-400 text-[10px]">
                          {c.contract_type || 'COMMERCIAL'}
                        </Badge>
                        <Badge className={isCompliant ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px]' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[10px]'}>
                          {isCompliant ? 'Compliant' : 'Flagged Risks'}
                        </Badge>
                      </div>
                      <CardTitle className="text-sm font-bold text-white line-clamp-2">
                        {c.title}
                      </CardTitle>
                      <p className="text-xs text-slate-400 truncate">
                        Counterparty: <span className="text-slate-200">{c.counterparty || 'Entity'}</span>
                      </p>
                    </CardHeader>

                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Statutory Score:</span>
                        <span className={`font-semibold flex items-center gap-1 ${isCompliant ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isCompliant ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                          {score}/100
                        </span>
                      </div>

                      <Link href={`/contracts/${c.id}`} className="block pt-1">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full border-slate-700 hover:bg-slate-800 text-xs flex items-center justify-center gap-1.5"
                          style={{ color: primaryColor }}
                        >
                          View Redlines & Audit <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
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