'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, ArrowRight, ShieldCheck, Building2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function BillingSuccessContent() {
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan') || 'PROFESSIONAL';
  const reference = searchParams.get('reference') || `DC-TX-${Math.floor(100000 + Math.random() * 900000)}`;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-100">
      <Card className="bg-slate-900 border-slate-800 max-w-md w-full text-center shadow-2xl">
        <CardHeader className="pb-2 pt-6">
          <div className="mx-auto p-3 bg-emerald-500/10 rounded-full border border-emerald-500/20 w-fit mb-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <CardTitle className="text-xl font-bold text-white">Subscription Confirmed</CardTitle>
          <p className="text-xs text-slate-400 mt-1">
            Your law firm reseller tier has been provisioned and allocated.
          </p>
        </CardHeader>
        <CardContent className="space-y-5 p-6 text-xs text-slate-300">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-left space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Active Tier:</span>
              <span className="font-bold text-emerald-400">{plan} RESELLER</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Payment Reference:</span>
              <span className="font-mono text-slate-200">{reference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Status:</span>
              <span className="text-emerald-400 font-semibold">Active &amp; Verified</span>
            </div>
          </div>

          <div className="space-y-2">
            <Link href="/reseller/clients" className="block">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs flex items-center justify-center gap-2">
                <span>Enter Reseller Command Center</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
            <Link href="/vault" className="block">
              <Button variant="outline" className="w-full border-slate-700 bg-slate-950 text-slate-300 text-xs">
                Go to Contract Vault
              </Button>
            </Link>
          </div>

          <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 pt-2">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            <span>NDPA 2023 &amp; CAMA 2020 Statutory Vault Guarantee</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BillingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mb-2" />
          <p className="text-xs">Verifying subscription...</p>
        </div>
      }
    >
      <BillingSuccessContent />
    </Suspense>
  );
}