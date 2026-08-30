'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  CalendarClock, 
  AlertTriangle, 
  CheckCircle2, 
  FileEdit, 
  Loader2, 
  Scale, 
  ExternalLink 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';

export default function ObligationsPage() {
  const [obligations, setObligations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchObligations() {
      const { data, error } = await supabase
        .from('statutory_obligations')
        .select('*, contracts(title)')
        .order('days_remaining', { ascending: true });

      if (data) setObligations(data);
      setLoading(false);
    }

    fetchObligations();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                Statutory Tracking
              </span>
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px]">
                Lagos Tenancy Law S.13 Active
              </Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white mt-1">
              Statutory Obligations &amp; Determination Notices
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Automated statutory countdowns for Form TL5 Notices to Quit, CAMA filing expiries, and contractual renewal boundaries.
            </p>
          </div>
        </div>

        {/* Obligations Table */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
            <p className="text-xs">Scanning active lease boundaries and statutory notices...</p>
          </div>
        ) : (
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 uppercase text-[11px] text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-5">Statute &amp; Notice</th>
                  <th className="py-3.5 px-5">Contract Document</th>
                  <th className="py-3.5 px-5">Days Remaining</th>
                  <th className="py-3.5 px-5">Statutory Action</th>
                  <th className="py-3.5 px-5 text-right">Quick Drafter</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {obligations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      No impending statutory determination boundaries detected.
                    </td>
                  </tr>
                ) : (
                  obligations.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-5">
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> {item.notice_type}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{item.statute_ref}</div>
                      </td>
                      <td className="py-4 px-5 text-slate-200">
                        {item.contracts?.title || 'Tenancy Agreement'}
                      </td>
                      <td className="py-4 px-5">
                        <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs">
                          {item.days_remaining} Days Remaining
                        </Badge>
                      </td>
                      <td className="py-4 px-5 text-slate-300 max-w-sm">
                        {item.action_required}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <Link href={`/drafter?type=FORM_TL5&contractId=${item.contract_id}`}>
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] h-7">
                            <FileEdit className="w-3 h-3 mr-1" /> Draft Form TL5
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}