'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { PlanTier } from '@/lib/tierPermissions';

const TIERS: PlanTier[] = [
  'FREE',
  'STARTER',
  'BUSINESS',
  'LEGAL_TEAM',
  'LAW_FIRM_RESELLER',
  'ONE_TIME_REVIEW',
];

export default function DevTierSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTier, setCurrentTier] = useState<string>('FREE');
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setUserEmail(user.email || null);
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('plan_tier')
          .eq('user_id', user.id)
          .single();
        if (sub?.plan_tier) setCurrentTier(sub.plan_tier);
      }
    }
    fetchUser();
  }, []);

  if (!userId) return null;

  const handleSwitchTier = async (targetTier: PlanTier) => {
    setLoadingTier(targetTier);
    try {
      const res = await fetch('/api/dev/switch-tier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userEmail,
          targetTier,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to switch plan tier');
      }

      setCurrentTier(targetTier);
      // Hard refresh to reload navigation permissions and dashboard state
      window.location.reload();
    } catch (err: any) {
      alert('Switch tier error: ' + err.message);
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-2xl flex items-center gap-2 border border-amber-400/40"
        >
          <Zap className="w-3.5 h-3.5" /> Dev Switcher: {currentTier}
        </Button>
      ) : (
        <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-4 shadow-2xl space-y-3 w-64 text-xs text-slate-200 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-amber-400 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" /> Dev Plan Switcher
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white text-xs font-bold px-1"
            >
              ✕
            </button>
          </div>

          <p className="text-[11px] text-slate-400">
            Active: <strong className="text-white">{currentTier}</strong>
          </p>

          <div className="grid grid-cols-1 gap-1.5">
            {TIERS.map((tier) => (
              <Button
                key={tier}
                size="sm"
                disabled={loadingTier !== null || currentTier === tier}
                onClick={() => handleSwitchTier(tier)}
                variant={currentTier === tier ? 'default' : 'outline'}
                className={`w-full justify-between text-[11px] h-8 ${
                  currentTier === tier
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'border-slate-800 bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>{tier.replace('_', ' ')}</span>
                {loadingTier === tier && <Loader2 className="w-3 h-3 animate-spin" />}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}