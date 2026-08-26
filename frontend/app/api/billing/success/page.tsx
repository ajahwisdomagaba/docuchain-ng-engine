'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BillingSuccessPage() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference');
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    // Artificial small delay for webhook sync
    const timer = setTimeout(() => {
      setVerifying(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
        {verifying ? (
          <div className="py-8 space-y-3 flex flex-col items-center">
            <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
            <p className="text-sm font-medium text-slate-300">Finalizing your subscription with Paystack...</p>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-950/40">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-white">Payment Successful</h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your DocuChain subscription is now active. Your vault limits, semantic RAG search, and statutory monitoring are upgraded.
              </p>
              {reference && (
                <div className="pt-2">
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                    Ref: {reference}
                  </span>
                </div>
              )}
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-left space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-medium">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Active Protection Tier Enabled</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Statutory notice alerts and cross-vault indexing are running automatically.
              </p>
            </div>

            <Link href="/vault" className="block">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2.5 flex items-center justify-center gap-2 shadow-lg shadow-emerald-950">
                Go to Contract Vault <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}