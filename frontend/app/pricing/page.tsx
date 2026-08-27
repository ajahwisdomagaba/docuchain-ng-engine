'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, Loader2, Sparkles, Scale, ArrowRight, ShieldCheck, Clock, Mail, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

export default function PricingPlanManager() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const [currentUser, setCurrentUser] = useState<any>(user);
  const [currentTier, setCurrentTier] = useState<string>('FREE');
  const [pendingDowngrade, setPendingDowngrade] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [messageNotice, setMessageNotice] = useState<string | null>(null);

  // Modal for guest One-Time Review email input
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [guestEmail, setGuestEmail] = useState('');
  const [guestEmailLoading, setGuestEmailLoading] = useState(false);

  useEffect(() => {
    async function loadUserSubscription() {
      // Direct session fetch avoids React context mount delay
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const activeUser = authUser || user;
      setCurrentUser(activeUser);

      if (!activeUser) return;

      try {
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', activeUser.id)
          .single();

        if (sub) {
          setCurrentTier(sub.plan_tier || 'FREE');
          if (sub.pending_downgrade_plan) {
            setPendingDowngrade({
              tier: sub.pending_downgrade_plan,
              date: sub.downgrade_effective_date
            });
          }
        }
      } catch (err) {
        console.warn('Subscription fetch fallback');
      }
    }

    loadUserSubscription();
  }, [user]);

  const handlePlanAction = async (targetTier: string, overrideEmail?: string) => {
    const { data: { user: activeUser } } = await supabase.auth.getUser();
    const effectiveUser = activeUser || currentUser;

    // Handle One-Time Review (No account required)
    if (targetTier === 'ONE_TIME_REVIEW') {
      const emailToUse = effectiveUser?.email || overrideEmail;
      if (!emailToUse) {
        setShowGuestModal(true);
        return;
      }

      setActionLoading('ONE_TIME_REVIEW');
      try {
        const res = await fetch('/api/billing/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: emailToUse,
            userId: effectiveUser?.id || 'guest_' + Date.now(),
            plan: 'ONE_TIME_REVIEW',
            isOneTime: true
          })
        });

        const data = await res.json();
        if (data.authorizationUrl) {
          window.location.href = data.authorizationUrl;
        } else {
          alert(data.error || 'Failed to initialize Paystack checkout');
        }
      } catch (err: any) {
        alert('Payment initialization error: ' + err.message);
      } finally {
        setActionLoading(null);
        setGuestEmailLoading(false);
      }
      return;
    }

    // For recurring tiers: Ensure user is logged in
    if (!effectiveUser) {
      localStorage.setItem('docuchain_selected_plan', targetTier);
      router.push(`/auth?plan=${targetTier}`);
      return;
    }

    setActionLoading(targetTier);
    setMessageNotice(null);

    try {
      const res = await fetch('/api/billing/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: effectiveUser.email,
          userId: effectiveUser.id,
          plan: targetTier
        })
      });

      const data = await res.json();
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      } else {
        alert(data.error || 'Failed to initialize Paystack checkout');
      }
    } catch (err: any) {
      alert('Upgrade error: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestEmail) return;
    setGuestEmailLoading(true);
    handlePlanAction('ONE_TIME_REVIEW', guestEmail);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-6">
      <div className="max-w-6xl mx-auto w-full space-y-10">
        
        <div className="text-center space-y-2">
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-xs">
            DocuChain NG Pricing
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Flexible Plans for Every Stage</h1>
          <p className="text-xs text-slate-400 max-w-xl mx-auto">
            From single SME audits to full multi-tenant law firm reseller portals. All subscriptions billed in NGN.
          </p>
        </div>

        {/* Pending Downgrade Notice */}
        {pendingDowngrade && (
          <div className="bg-amber-950/30 border border-amber-500/40 p-4 rounded-xl flex items-start gap-3 text-xs text-amber-300">
            <Clock className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-200">Pending Scheduled Downgrade</p>
              <p className="text-amber-300/80 mt-0.5">
                You are currently on <strong>{currentTier}</strong>. Your plan will switch to <strong>{pendingDowngrade.tier}</strong> on{' '}
                {new Date(pendingDowngrade.date).toLocaleDateString('en-GB')}.
              </p>
            </div>
          </div>
        )}

        {messageNotice && (
          <div className="bg-emerald-950/30 border border-emerald-500/40 p-4 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{messageNotice}</span>
          </div>
        )}

        {/* Core 4 Subscription Tiers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Starter Plan */}
          <div className={`bg-slate-900 border rounded-2xl p-6 flex flex-col justify-between space-y-6 transition-all duration-300 hover:border-emerald-500/60 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-950/40 ${
            currentTier === 'STARTER' ? 'border-emerald-500 ring-1 ring-emerald-500/50' : 'border-slate-800'
          }`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-200">Starter</h3>
                {currentTier === 'STARTER' && <Badge className="bg-emerald-600 text-white text-[10px]">CURRENT</Badge>}
              </div>
              <div className="text-3xl font-bold text-white">₦10,000 <span className="text-xs text-slate-500 font-normal">/ mo</span></div>
              <ul className="space-y-2 text-xs text-slate-300 pt-2">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> 50 active contracts</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Smart extraction</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Centralized vault</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> 90/60/30/7-day alerts</li>
              </ul>
            </div>
            <Button
              disabled={currentTier === 'STARTER' || actionLoading === 'STARTER'}
              onClick={() => handlePlanAction('STARTER')}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-950 transition-colors"
            >
              {actionLoading === 'STARTER' ? <Loader2 className="w-4 h-4 animate-spin" /> : currentTier === 'STARTER' ? 'Active Plan' : 'Select Starter'}
            </Button>
          </div>

          {/* Business Plan (Recommended) */}
          <div className={`bg-slate-900 border-2 rounded-2xl p-6 flex flex-col justify-between space-y-6 relative shadow-xl shadow-emerald-950/50 transition-all duration-300 hover:border-emerald-400 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-900/60 ${
            currentTier === 'BUSINESS' ? 'border-emerald-400' : 'border-emerald-500'
          }`}>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-emerald-600 text-white text-[10px] uppercase font-bold tracking-wider">POPULAR FOR SMES</Badge>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-white">Business</h3>
                {currentTier === 'BUSINESS' && <Badge className="bg-emerald-600 text-white text-[10px]">CURRENT</Badge>}
              </div>
              <div className="text-3xl font-bold text-white">₦30,000 <span className="text-xs text-slate-500 font-normal">/ mo</span></div>
              <ul className="space-y-2 text-xs text-slate-300 pt-2">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> 500 active contracts</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Clause risk scoring</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Cross-vault cited Q&A</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Obligation tracker tasks</li>
              </ul>
            </div>
            <Button
              disabled={currentTier === 'BUSINESS' || actionLoading === 'BUSINESS'}
              onClick={() => handlePlanAction('BUSINESS')}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-950 transition-colors"
            >
              {actionLoading === 'BUSINESS' ? <Loader2 className="w-4 h-4 animate-spin" /> : currentTier === 'BUSINESS' ? 'Active Plan' : 'Select Business'}
            </Button>
          </div>

          {/* Legal Team */}
          <div className={`bg-slate-900 border rounded-2xl p-6 flex flex-col justify-between space-y-6 transition-all duration-300 hover:border-emerald-500/60 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-950/40 ${
            currentTier === 'LEGAL_TEAM' ? 'border-emerald-500 ring-1 ring-emerald-500/50' : 'border-slate-800'
          }`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-200">Legal Team</h3>
                {currentTier === 'LEGAL_TEAM' && <Badge className="bg-emerald-600 text-white text-[10px]">CURRENT</Badge>}
              </div>
              <div className="text-3xl font-bold text-white">₦75,000 <span className="text-xs text-slate-500 font-normal">/ mo</span></div>
              <ul className="space-y-2 text-xs text-slate-300 pt-2">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Unlimited contracts</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Full template library</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Multi-user seat access</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> External client portal</li>
              </ul>
            </div>
            <Button
              disabled={currentTier === 'LEGAL_TEAM' || actionLoading === 'LEGAL_TEAM'}
              onClick={() => handlePlanAction('LEGAL_TEAM')}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-950 transition-colors"
            >
              {actionLoading === 'LEGAL_TEAM' ? <Loader2 className="w-4 h-4 animate-spin" /> : currentTier === 'LEGAL_TEAM' ? 'Active Plan' : 'Select Legal Team'}
            </Button>
          </div>

          {/* Law Firm Reseller */}
          <div className={`bg-slate-900 border rounded-2xl p-6 flex flex-col justify-between space-y-6 transition-all duration-300 hover:border-emerald-500/60 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-950/40 ${
            currentTier === 'LAW_FIRM_RESELLER' ? 'border-emerald-500 ring-1 ring-emerald-500/50' : 'border-slate-800'
          }`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-200">Law Firm Reseller</h3>
                {currentTier === 'LAW_FIRM_RESELLER' && <Badge className="bg-emerald-600 text-white text-[10px]">CURRENT</Badge>}
              </div>
              <div className="text-3xl font-bold text-white">₦150,000 <span className="text-xs text-slate-500 font-normal">/ mo</span></div>
              <ul className="space-y-2 text-xs text-slate-300 pt-2">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> White-label interface</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Manage client vaults</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> AI Draft + Review tool</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Priority WhatsApp line</li>
              </ul>
            </div>
            <Button
              disabled={currentTier === 'LAW_FIRM_RESELLER' || actionLoading === 'LAW_FIRM_RESELLER'}
              onClick={() => handlePlanAction('LAW_FIRM_RESELLER')}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-950 transition-colors"
            >
              {actionLoading === 'LAW_FIRM_RESELLER' ? <Loader2 className="w-4 h-4 animate-spin" /> : currentTier === 'LAW_FIRM_RESELLER' ? 'Active Plan' : 'Select Reseller'}
            </Button>
          </div>
        </div>

        {/* Add-On: One-Time Contract Review Box */}
        <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/40 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-emerald-950/30">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">NO SUBSCRIPTION REQUIRED</Badge>
              <span className="text-xs text-slate-400 font-medium">One-Off Service</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">One-Time Contract Review for SMEs</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Don&apos;t need a monthly subscription? Have a single tenancy lease, vendor SLA, or partnership agreement audited. Our AI extracts structured data, benchmarks Lagos Tenancy / CAMA laws, and outputs a certified redline report.
            </p>
          </div>
          <div className="flex flex-col items-center md:items-end gap-3 shrink-0">
            <div className="text-3xl font-extrabold text-white">₦15,000 <span className="text-xs font-normal text-slate-400">/ contract</span></div>
            <Button
              onClick={() => handlePlanAction('ONE_TIME_REVIEW')}
              disabled={actionLoading === 'ONE_TIME_REVIEW'}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-6 py-2.5 shadow-lg shadow-emerald-950"
            >
              {actionLoading === 'ONE_TIME_REVIEW' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Order Single Review'}
            </Button>
          </div>
        </div>

        {/* Back navigation */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-6">
          <Button variant="ghost" onClick={() => router.push('/vault')} className="text-xs text-slate-400 hover:text-white">
            ← Back to Contract Vault
          </Button>
          <Button variant="ghost" onClick={() => router.push('/dashboard')} className="text-xs text-emerald-400 hover:text-emerald-300">
            Open Dashboard →
          </Button>
        </div>
      </div>

      {/* Guest Email Modal for One-Time Review */}
      {showGuestModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <button 
              onClick={() => setShowGuestModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="space-y-1 text-center">
              <h3 className="text-lg font-bold text-white">One-Time Contract Review</h3>
              <p className="text-xs text-slate-400">No account required. Enter your email to receive your Paystack receipt and audit link.</p>
            </div>
            <form onSubmit={handleGuestSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <Input
                  type="email"
                  required
                  placeholder="your.email@business.ng"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="pl-9 bg-slate-950 border-slate-800 text-xs text-white"
                />
              </div>
              <Button 
                type="submit" 
                disabled={guestEmailLoading} 
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2.5 shadow-lg shadow-emerald-950"
              >
                {guestEmailLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Proceed to Pay ₦15,000'}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}