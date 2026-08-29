'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  Plus, 
  Search, 
  Check, 
  X, 
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';

interface Obligation {
  id: string;
  title: string;
  obligation_type: string;
  statutory_basis: string;
  due_date: string;
  notice_trigger_date: string;
  counterparty: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'COMPLIANT' | 'OVERDUE' | 'DISMISSED';
  notes: string;
  contracts?: {
    id: string;
    title: string;
    contract_type: string;
  };
  workspace_clients?: {
    client_name: string;
  };
}

export default function ObligationsCalendarPage() {
  const { user } = useAuth();
  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // New Obligation Modal State
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('STATUTORY_NOTICE');
  const [newBasis, setNewBasis] = useState('Lagos State Tenancy Law 2011, Section 13(1)(e)');
  const [newDueDate, setNewDueDate] = useState('');
  const [newPriority, setNewPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');
  const [newCounterparty, setNewCounterparty] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const loadObligations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/obligations');
      const data = await res.json();
      if (data.success) {
        setObligations(data.obligations || []);
      }
    } catch (err: any) {
      console.error('Error loading obligations:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadObligations();
  }, [user]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/obligations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (res.ok) {
        setObligations((prev) =>
          prev.map((o) => (o.id === id ? { ...o, status: newStatus as any } : o))
        );
      }
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  const handleCreateObligation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/obligations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          obligationType: newType,
          statutoryBasis: newBasis,
          dueDate: newDueDate,
          priority: newPriority,
          counterparty: newCounterparty,
          notes: newNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setObligations((prev) => [data.obligation, ...prev]);
      setShowModal(false);
      setNewTitle('');
      setNewDueDate('');
      setNewCounterparty('');
      setNewNotes('');
    } catch (err: any) {
      alert(`Failed to save obligation: ${err.message}`);
    }
  };

  // Days remaining calculation helper
  const getDaysRemaining = (dueDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDateStr);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const filteredObligations = useMemo(() => {
    return obligations.filter((item) => {
      const matchesType = filterType === 'ALL' || item.obligation_type === filterType;
      const matchesStatus = filterStatus === 'ALL' || item.status === filterStatus;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        item.title.toLowerCase().includes(q) ||
        (item.counterparty || '').toLowerCase().includes(q) ||
        (item.statutory_basis || '').toLowerCase().includes(q);

      return matchesType && matchesStatus && matchesSearch;
    });
  }, [obligations, filterType, filterStatus, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 space-y-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-emerald-400" />
              <h1 className="text-2xl font-bold tracking-tight text-white">Obligations & Statutory Notices Calendar</h1>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">Statutory Engine</Badge>
            </div>
            <p className="text-slate-400 text-xs mt-1">
              Automated triggers for Lagos Tenancy Law 6-month quit notices (Sec 13), 7-day intention notices, and CAMA 2020 CAC filing windows.
            </p>
          </div>

          <Button 
            onClick={() => setShowModal(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Schedule Statutory Notice
          </Button>
        </div>

        {/* Metric Summary Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
            <span className="text-xs text-slate-400 font-medium block">Total Scheduled</span>
            <div className="text-2xl font-bold text-white mt-1">{obligations.length}</div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
            <span className="text-xs text-rose-400 font-medium block">High Priority Notices</span>
            <div className="text-2xl font-bold text-rose-400 mt-1">
              {obligations.filter((o) => o.priority === 'HIGH' && o.status === 'PENDING').length}
            </div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
            <span className="text-xs text-amber-400 font-medium block">Action Due (&lt; 30 Days)</span>
            <div className="text-2xl font-bold text-amber-400 mt-1">
              {obligations.filter((o) => o.status === 'PENDING' && getDaysRemaining(o.due_date) <= 30 && getDaysRemaining(o.due_date) >= 0).length}
            </div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
            <span className="text-xs text-emerald-400 font-medium block">Complied & Resolved</span>
            <div className="text-2xl font-bold text-emerald-400 mt-1">
              {obligations.filter((o) => o.status === 'COMPLIANT').length}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              placeholder="Search notices or counterparties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-950 border-slate-700 text-xs text-slate-100"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-200"
            >
              <option value="ALL">All Notice Categories</option>
              <option value="STATUTORY_NOTICE">Tenancy Notice to Quit (Sec 13)</option>
              <option value="CAC_ANNUAL_RETURNS">CAC Annual Returns (CAMA 2020)</option>
              <option value="LEASE_RENEWAL">Lease Renewal Window</option>
              <option value="TERMINATION_WINDOW">Contract Termination Window</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-200"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Action</option>
              <option value="COMPLIANT">Complied / Served</option>
              <option value="OVERDUE">Overdue</option>
            </select>
          </div>
        </div>

        {/* Timeline & Obligation Cards */}
        <div className="space-y-4">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
              <p className="text-xs">Computing statutory notice countdowns...</p>
            </div>
          ) : filteredObligations.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-500 bg-slate-900/30 border border-slate-800 rounded-xl space-y-2">
              <CalendarIcon className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="font-semibold text-slate-300">No scheduled statutory notices</p>
              <p>Schedule a new notice above or ingest a Tenancy / Commercial contract to auto-populate deadlines.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredObligations.map((item) => {
                const days = getDaysRemaining(item.due_date);
                const isOverdue = days < 0 && item.status !== 'COMPLIANT';
                const isUrgent = days <= 30 && days >= 0 && item.status === 'PENDING';

                return (
                  <Card key={item.id} className="bg-slate-900/80 border-slate-800 hover:border-slate-700 transition-all">
                    <CardContent className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="space-y-2 max-w-2xl">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge 
                            className={`text-[10px] ${
                              item.priority === 'HIGH' 
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {item.priority} PRIORITY
                          </Badge>
                          <Badge variant="outline" className="border-slate-700 text-slate-400 text-[10px]">
                            {item.obligation_type}
                          </Badge>
                          {item.workspace_clients?.client_name && (
                            <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                              {item.workspace_clients.client_name}
                            </Badge>
                          )}
                        </div>

                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          {item.title}
                        </h3>

                        <div className="text-xs text-slate-400 font-mono">
                          Statutory Citation: <span className="text-slate-200">{item.statutory_basis}</span>
                        </div>

                        {item.notes && (
                          <p className="text-xs text-slate-400 leading-relaxed bg-slate-950 p-2 rounded border border-slate-800">
                            {item.notes}
                          </p>
                        )}
                      </div>

                      {/* Right Timeline & Actions */}
                      <div className="flex flex-col md:items-end gap-3 min-w-[200px] border-t md:border-t-0 border-slate-800 pt-3 md:pt-0 w-full md:w-auto">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span className="text-xs font-mono text-slate-300">Due: {item.due_date}</span>
                        </div>

                        <div className="text-xs font-semibold">
                          {item.status === 'COMPLIANT' ? (
                            <span className="text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Notice Served / Compliant
                            </span>
                          ) : isOverdue ? (
                            <span className="text-rose-400 font-mono">⚠️ OVERDUE ({Math.abs(days)} days ago)</span>
                          ) : isUrgent ? (
                            <span className="text-amber-400 font-mono animate-pulse">⏰ {days} Days Remaining</span>
                          ) : (
                            <span className="text-slate-400 font-mono">{days} Days Remaining</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {item.status !== 'COMPLIANT' ? (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(item.id, 'COMPLIANT')}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-7 px-2.5 flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" /> Mark Served
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateStatus(item.id, 'PENDING')}
                              className="border-slate-700 text-slate-300 text-xs h-7 px-2.5"
                            >
                              Reopen
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Schedule Notice Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <Card className="bg-slate-900 border-slate-800 w-full max-w-lg shadow-2xl">
              <CardHeader className="p-4 border-b border-slate-800 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-emerald-400" /> Schedule Statutory Notice / Obligation
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowModal(false)} className="h-6 w-6 p-0 text-slate-400">
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="p-4">
                <form onSubmit={handleCreateObligation} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Notice / Obligation Title</label>
                    <Input
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g. Serve 6-Month Notice to Quit on Tenant"
                      className="bg-slate-950 border-slate-700 text-xs text-slate-100"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-400 block mb-1">Obligation Category</label>
                      <select
                        value={newType}
                        onChange={(e) => setNewType(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-200"
                      >
                        <option value="STATUTORY_NOTICE">Tenancy Notice to Quit (Sec 13)</option>
                        <option value="CAC_ANNUAL_RETURNS">CAC Annual Returns (CAMA 2020)</option>
                        <option value="LEASE_RENEWAL">Lease Renewal Trigger</option>
                        <option value="TERMINATION_WINDOW">Contract Termination Window</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 block mb-1">Due / Expiration Date</label>
                      <Input
                        type="date"
                        value={newDueDate}
                        onChange={(e) => setNewDueDate(e.target.value)}
                        className="bg-slate-950 border-slate-700 text-xs text-slate-100"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Statutory Basis / Legal Authority</label>
                    <Input
                      value={newBasis}
                      onChange={(e) => setNewBasis(e.target.value)}
                      placeholder="e.g. Lagos State Tenancy Law 2011, Section 13(1)(e)"
                      className="bg-slate-950 border-slate-700 text-xs text-slate-100 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-400 block mb-1">Counterparty Entity</label>
                      <Input
                        value={newCounterparty}
                        onChange={(e) => setNewCounterparty(e.target.value)}
                        placeholder="e.g. Chief Adebayo / Zenith Retail"
                        className="bg-slate-950 border-slate-700 text-xs text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 block mb-1">Priority Level</label>
                      <select
                        value={newPriority}
                        onChange={(e) => setNewPriority(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-200"
                      >
                        <option value="HIGH">High (Statutory Requirement)</option>
                        <option value="MEDIUM">Medium (Commercial Obligation)</option>
                        <option value="LOW">Low (Informational)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Operational Notes / Form TL5 Instructions</label>
                    <textarea
                      rows={2}
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      placeholder="e.g. Notice must be served in writing and expire on or after the anniversary date."
                      className="w-full bg-slate-950 border border-slate-700 rounded-md p-2 text-xs text-slate-200"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" size="sm" onClick={() => setShowModal(false)} className="text-xs text-slate-400">
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs">
                      Schedule Obligation
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

      </div>
    </div>
  );
}