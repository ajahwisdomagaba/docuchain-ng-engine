'use client';

import React, { useEffect, useState } from 'react';
import { 
  CalendarClock, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  DollarSign, 
  BellRing, 
  Loader2,
  CheckCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';

interface ObligationRecord {
  id: string;
  contract_id: string;
  title: string;
  description: string | null;
  due_date: string;
  amount_ngn: number | null;
  obligation_type: 'PAYMENT' | 'NOTICE' | 'RENEWAL' | 'COMPLIANCE';
  status: 'PENDING' | 'COMPLETED' | 'OVERDUE';
  assigned_to: string | null;
  contracts?: {
    title: string;
    counterparty: string;
  };
}

const INITIAL_OBLIGATIONS: ObligationRecord[] = [
  {
    id: 'ob-1',
    contract_id: 'c-001',
    title: 'Serve Statutory 6-Month Notice to Quit Reminder',
    description: 'Lagos Tenancy Law 2011 Section 13 notice window prior to yearly lease expiration.',
    due_date: '2026-11-01',
    amount_ngn: null,
    obligation_type: 'NOTICE',
    status: 'PENDING',
    assigned_to: 'Property Manager',
    contracts: {
      title: 'Commercial Lease Agreement - Lekki Phase 1',
      counterparty: 'Oakwood Properties Ltd'
    }
  },
  {
    id: 'ob-2',
    contract_id: 'c-003',
    title: 'Q3 Cloud Infrastructure Support SLA Settlement',
    description: 'Quarterly retainer fee disbursement net of 5% statutory WHT remittance.',
    due_date: '2026-09-30',
    amount_ngn: 1850000,
    obligation_type: 'PAYMENT',
    status: 'PENDING',
    assigned_to: 'Finance Lead',
    contracts: {
      title: 'Cloud Infrastructure & Maintenance SLA',
      counterparty: 'CloudCore Systems Nigeria'
    }
  },
  {
    id: 'ob-3',
    contract_id: 'c-002',
    title: 'Proprietary IP Return & Non-Disclosure Review',
    description: 'Verification of trade secret protections and return of confidential technical specs.',
    due_date: '2026-10-15',
    amount_ngn: null,
    obligation_type: 'RENEWAL',
    status: 'COMPLETED',
    assigned_to: 'Legal Counsel',
    contracts: {
      title: 'Mutual Non-Disclosure Agreement',
      counterparty: 'Apex Fintech Solutions'
    }
  }
];

export default function ObligationsPage() {
  const { user } = useAuth();
  const [obligations, setObligations] = useState<ObligationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchObligations() {
      setLoading(true);

      try {
        let currentUserId = user?.id;
        if (!currentUserId) {
          const { data: authData } = await supabase.auth.getUser();
          currentUserId = authData?.user?.id;
        }

        if (!currentUserId) {
          setObligations(INITIAL_OBLIGATIONS);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('obligations')
          .select(`
            *,
            contracts:contract_id (
              title,
              counterparty
            )
          `)
          .order('due_date', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          setObligations(data);
        } else {
          setObligations(INITIAL_OBLIGATIONS);
        }
      } catch (err: any) {
        console.warn('Using initial obligations fallback due to query issue:', err.message);
        setObligations(INITIAL_OBLIGATIONS);
      } finally {
        setLoading(false);
      }
    }

    fetchObligations();
  }, [user]);

  const toggleStatus = async (item: ObligationRecord) => {
    const nextStatus = item.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    setUpdatingId(item.id);

    // Optimistically update UI state
    setObligations((prev) =>
      prev.map((o) => (o.id === item.id ? { ...o, status: nextStatus } : o))
    );

    // Persist to database if it is not a dummy record ID
    if (!item.id.startsWith('ob-')) {
      try {
        const { error } = await supabase
          .from('obligations')
          .update({ status: nextStatus, updated_at: new Date().toISOString() })
          .eq('id', item.id);

        if (error) throw error;
      } catch (err: any) {
        console.error('Failed to update obligation status in database:', err.message);
      }
    }

    setUpdatingId(null);
  };

  const formatCurrency = (val?: number | null) => {
    if (!val) return null;
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'PAYMENT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Payment</span>;
      case 'NOTICE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">Statutory Notice</span>;
      case 'RENEWAL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">Renewal / Review</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">{type}</span>;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <CalendarClock className="w-6 h-6 text-emerald-400" />
          Obligations & Statutory Notices
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Automated statutory notice periods (Lagos Tenancy 6-Month notices, CAMA returns, SLA payment milestones).
        </p>
      </div>

      {/* Obligations List */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
            <p className="text-xs text-slate-400">Loading statutory obligations & deadlines...</p>
          </div>
        ) : obligations.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <BellRing className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-300">No active obligations recorded</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              When you upload and audit agreements in DocuChain NG, AI automatically extracts payment milestones and notice periods here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Obligation Details</th>
                  <th className="py-3 px-4">Parent Contract</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Value (NGN)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
                {obligations.map((item) => (
                  <tr 
                    key={item.id} 
                    className={`hover:bg-slate-800/30 transition-colors ${
                      item.status === 'COMPLETED' ? 'opacity-60' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => toggleStatus(item)}
                        disabled={updatingId === item.id}
                        className="cursor-pointer text-slate-400 hover:text-emerald-400 transition-colors"
                        title="Toggle completion"
                      >
                        {updatingId === item.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                        ) : item.status === 'COMPLETED' ? (
                          <CheckCircle className="w-5 h-5 text-emerald-400 fill-emerald-500/20" />
                        ) : (
                          <Clock className="w-5 h-5 text-slate-500 hover:text-emerald-400" />
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className={`font-semibold ${item.status === 'COMPLETED' ? 'line-through text-slate-400' : 'text-white'}`}>
                        {item.title}
                      </p>
                      {item.description && (
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{item.description}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-200 block truncate max-w-xs">
                        {item.contracts?.title || 'Standalone Obligation'}
                      </span>
                      {item.contracts?.counterparty && (
                        <span className="text-[10px] text-slate-500 block">
                          w/ {item.contracts.counterparty}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300">
                      {new Date(item.due_date).toLocaleDateString('en-GB')}
                    </td>
                    <td className="py-3.5 px-4">{getTypeBadge(item.obligation_type)}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-medium text-emerald-400">
                      {formatCurrency(item.amount_ngn) || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}