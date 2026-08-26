'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, Loader2, Sparkles, Scale, ArrowRight, ShieldCheck, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

const TIER_WEIGHTS: Record<string, number> = {
  FREE: 0,
  STARTER: 1,
  ENTERPRISE: 2
};

export default function PricingPlanManager() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const [currentTier, setCurrentTier] = useState<string>('FREE');
  const [pendingDowngrade, setPendingDowngrade] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [messageNotice, setMessageNotice] = useState<string | null>(null);

  useEffect(() => {
    async function loadUserSubscription() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
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
      } finally {
        setLoading(false);
      }
    }

    loadUserSubscription();
  }, [user]);

  const handlePlanAction = async (targetTier: 'FREE' | 'STARTER' | 'ENTERPRISE') => {
    if (!user) {
      router.push(`/auth?plan=${targetTier}`);
      return;
    }

    const currentWeight = TIER_WEIGHTS[currentTier] ?? 0;
    const targetWeight = TIER_WEIGHTS[targetTier] ?? 0;

    if (currentWeight === targetWeight) {
      return;
    }

    setActionLoading(targetTier);
    setMessageNotice(null);

    // Instant Upgrade: Launch Paystack Checkout
    if (targetWeight > currentWeight) {
      try {
        const res = await fetch('/api/billing/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            userId: user.id,
            plan: targetTier
          })
        });

        const data = await res.json();
        if (data.authorizationUrl) {
          window.location.href = data.authorizationUrl;
        } else {
          alert(data.error || 'Failed to initialize upgrade checkout');
        }
      } catch (err: any) {
        alert('Upgrade error: ' + err.message);
      } finally {
        setActionLoading(null);
      }
      return;
    }

    // Downgrade: Schedule for end of month
    try {
      const res = await fetch('/api/billing/switch-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          targetTier
        })
      });

      const data = await res.json();
      if (data.action === 'DOWNGRADE_SCHEDULED') {
        setPendingDowngrade({
          tier: targetTier,
          date: data.effectiveDate
        });
        setMessageNotice(data.message);
      }
    } catch (err: any) {
      alert('Downgrade request failed: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 px-6">
      <div className="max-w-5xl mx-auto w-full space-y-8">
        
        <div className="text-center space-y-2">
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-xs">
            Plan & Subscription Settings
          </Badge>
          <h1 className="text-3xl font-bold text-white tracking-tight">Manage Your DocuChain Plan</h1>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Upgrades activate immediately. Plan downgrades remain active until your current monthly billing period concludes.
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

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Free Tier */}
          <div className={`bg-slate-900 border rounded-2xl p-6 flex flex-col justify-between space-y-6 transition-all ${
            currentTier === 'FREE' ? 'border-emerald-500 ring-1 ring-emerald-500/50 bg-slate-900/90' : 'border-slate-800'
          }`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-200">Free / Sandbox</h3>
                {currentTier === 'FREE' && <Badge className="bg-emerald-600 text-white text-[10px]">CURRENT</Badge>}
              </div>
              <div className="text-3xl font-bold text-white">₦0 <span className="text-xs text-slate-500 font-normal">/ forever</span></div>
              <ul className="space-y-2 text-xs text-slate-300 pt-2">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> 3 audits / month</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Statutory redline engine</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Single-contract Q&A</li>
              </ul>
            </div>
            
            <Button
              disabled={currentTier === 'FREE' || actionLoading === 'FREE'}
              onClick={() => handlePlanAction('FREE')}
              variant="outline"
              className="w-full border-slate-700 bg-slate-950 text-slate-300 hover:text-white text-xs"
            >
              {actionLoading === 'FREE' ? <Loader2 className="w-4 h-4 animate-spin" /> : (currentTier === 'FREE' ? 'Active Plan' : 'Downgrade at Cycle End')}
            </Button>
          </div>

          {/* Starter Business */}
          <div className={`bg-slate-900 border-2 rounded-2xl p-6 flex flex-col justify-between space-y-6 relative shadow-xl shadow-emerald-950/40 transition-all ${
            currentTier === 'STARTER' ? 'border-emerald-400 ring-1 ring-emerald-400' : 'border-emerald-500/40'
          }`}>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-emerald-600 text-white text-[10px]">RECOMMENDED FOR SMES</Badge>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-white">Starter Business</h3>
                {currentTier === 'STARTER' && <Badge className="bg-emerald-600 text-white text-[10px]">CURRENT</Badge>}
              </div>
              <div className="text-3xl font-bold text-white">₦15,000 <span className="text-xs text-slate-500 font-normal">/ month</span></div>
              <ul className="space-y-2 text-xs text-slate-300 pt-2">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> 50 active contracts</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Cross-vault RAG search</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> 90/60/30/7-day notice alerts</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Statutory drafter & signatures</li>
              </ul>
            </div>

            <Button
              disabled={currentTier === 'STARTER' || actionLoading === 'STARTER'}
              onClick={() => handlePlanAction('STARTER')}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-950"
            >
              {actionLoading === 'STARTER' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : currentTier === 'STARTER' ? (
                'Active Plan'
              ) : currentTier === 'FREE' ? (
                'Upgrade Immediately'
              ) : (
                'Downgrade at Cycle End'
              )}
            </Button>
          </div>

          {/* Enterprise Tier */}
          <div className={`bg-slate-900 border rounded-2xl p-6 flex flex-col justify-between space-y-6 transition-all ${
            currentTier === 'ENTERPRISE' ? 'border-emerald-500 ring-1 ring-emerald-500/50 bg-slate-900/90' : 'border-slate-800'
          }`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-200">Enterprise</h3>
                {currentTier === 'ENTERPRISE' && <Badge className="bg-emerald-600 text-white text-[10px]">CURRENT</Badge>}
              </div>
              <div className="text-3xl font-bold text-white">₦45,000 <span className="text-xs text-slate-500 font-normal">/ month</span></div>
              <ul className="space-y-2 text-xs text-slate-300 pt-2">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Unlimited contracts</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Telegram Bot vault queries</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Custom statutory rules</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Priority legal support</li>
              </ul>
            </div>

            <Button
              disabled={currentTier === 'ENTERPRISE' || actionLoading === 'ENTERPRISE'}
              onClick={() => handlePlanAction('ENTERPRISE')}
              variant={currentTier === 'ENTERPRISE' ? 'outline' : 'default'}
              className={`w-full text-xs font-semibold ${
                currentTier === 'ENTERPRISE' 
                  ? 'border-slate-700 bg-slate-950 text-slate-300' 
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950'
              }`}
            >
              {actionLoading === 'ENTERPRISE' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : currentTier === 'ENTERPRISE' ? (
                'Active Plan'
              ) : (
                'Upgrade Immediately'
              )}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-800 pt-6">
          <Button variant="ghost" onClick={() => router.push('/vault')} className="text-xs text-slate-400 hover:text-white">
            ← Back to Contract Vault
          </Button>
          <Button variant="ghost" onClick={() => router.push('/dashboard')} className="text-xs text-emerald-400 hover:text-emerald-300">
            Open Dashboard →
          </Button>
        </div>
      </div>
    </div>
  );
}