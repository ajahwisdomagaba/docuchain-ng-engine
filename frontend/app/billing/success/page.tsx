'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, ArrowRight, ShieldCheck, Loader2, FileSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BillingSuccessPage() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference');
  const type = searchParams.get('type');
  const isOneTime = type === 'one-time';

  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVerifying(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
        {verifying ? (
          <div className="py-8 space-y-3 flex flex-col items-center">
            <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
            <p className="text-sm font-medium text-slate-300">Verifying payment with Paystack...</p>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-950/40">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-white">Payment Successful</h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isOneTime 
                  ? 'Your single contract review credit is active. Upload or paste your contract now to generate your certified audit and redline report.'
                  : 'Your DocuChain subscription is now active. Complete your role setup to access your workspace.'}
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
                {isOneTime ? <FileSearch className="w-4 h-4 shrink-0" /> : <ShieldCheck className="w-4 h-4 shrink-0" />}
                <span>{isOneTime ? 'Single Audit Credit Enabled' : 'Protection Tier Active'}</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                {isOneTime 
                  ? 'Includes statutory risk benchmark (CAMA 2020 / Lagos Tenancy) and counter-clause generator.'
                  : 'Statutory notice alerts and cross-vault indexing are active.'}
              </p>
            </div>

            <Link href={isOneTime ? "/review/studio" : "/onboarding"} className="block">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2.5 flex items-center justify-center gap-2 shadow-lg shadow-emerald-950">
                {isOneTime ? (
                  <>Open Review Studio <ArrowRight className="w-4 h-4" /></>
                ) : (
                  <>Select Your Role & Open Workspace <ArrowRight className="w-4 h-4" /></>
                )}
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}