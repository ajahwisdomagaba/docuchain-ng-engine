'use client';

import React from 'react';
import Link from 'next/link';
import { Lock, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TierFeatureLockProps {
  featureName: string;
  requiredTier: string;
  description: string;
  isUnlocked: boolean;
  children: React.ReactNode;
}

export default function TierFeatureLock({
  featureName,
  requiredTier,
  description,
  isUnlocked,
  children,
}: TierFeatureLockProps) {
  if (isUnlocked) {
    return <>{children}</>;
  }

  // Render a solid lock box instead of a blurred preview for stricter visual gating
  return (
    <div className="border border-slate-800 rounded-2xl p-8 bg-slate-900/60 flex flex-col items-center justify-center text-center space-y-4 h-full min-h-[200px]">
      <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500 shadow-inner">
        <Lock className="w-5 h-5" />
      </div>
      <div className="space-y-1.5 max-w-sm">
        <h3 className="text-sm font-bold text-white flex items-center justify-center gap-1.5">
          <Sparkles className="w-4 h-4 text-emerald-500" /> Unlock {featureName}
        </h3>
        <p className="text-[11px] text-slate-400 leading-relaxed">{description}</p>
      </div>
      <Link href={`/pricing?plan=${requiredTier}`}>
        <Button className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-5 py-2 mt-2 shadow-lg shadow-emerald-950 flex items-center gap-2">
          Upgrade to {requiredTier.replace('_', ' ')} <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </Link>
    </div>
  );
}