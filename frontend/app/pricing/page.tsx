'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Check, ShieldCheck, Zap, Building2, Layers, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

function PricingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightPlan = searchParams.get('plan') || 'PROFESSIONAL';

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const plans = [
    {
      id: 'STARTER',
      name: 'Starter Practice',
      priceMonthly: 75000,
      priceAnnual: 750000,
      contracts: '25 Contracts / mo',
      storage: '5 GB Encrypted Vault',
      users: '2 Counsel Members',
      features: [
        'Lagos Tenancy Law 2011 Redlines',
        'CAMA 2020 Sec 102 E-Sign Stamping',
        'Labour Act Minimum Wage 2024 Audit',
        'Standard PDF Verification Certificates',
      ],
    },
    {
      id: 'PROFESSIONAL',
      name: 'Law Firm Reseller (Pro)',
      priceMonthly: 195000,
      priceAnnual: 1950000,
      popular: true,
      contracts: '150 Contracts / mo',
      storage: '25 GB Encrypted Vault',
      users: '10 Counsel & Partner Seats',
      features: [
        'Everything in Starter',
        'Multi-Client Vault Isolation (/reseller/clients)',
        'White-Label Subdomain Branding (*.docuchain.ng)',
        'Custom AI Playbooks (Mandatory & Forbidden Clauses)',
        'Client Self-Service Portal (/portal)',
        'Tenant-Scoped pgvector Semantic Search',
      ],
    },
    {
      id: 'ENTERPRISE',
      name: 'Institutional Legal OS',
      priceMonthly: 450000,
      priceAnnual: 4500000,
      contracts: 'Unlimited Contracts',
      storage: '100 GB Cloud Storage',
      users: 'Unlimited Seats & Matters',
      features: [
        'Everything in Professional',
        'Dedicated Custom CNAME Domains',
        'Immutable Audit Trail (NDPA 2023 Compliance)',
        'Priority AI Token Allocation',
        'Custom Integration & Webhook Endpoints',
        'Dedicated Legal Engineering SLA',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 space-y-12">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs px-3 py-1">
            Enterprise Tier Plans
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Institutional Pricing for Nigerian Law Practices
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto">
            Segregated client vaults, automated statutory auditing, and white-label reseller infrastructure.
          </p>

          {/* Billing Switcher */}
          <div className="flex items-center justify-center gap-3 pt-4">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`text-xs font-semibold px-4 py-1.5 rounded-full transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('annual')}
              className={`text-xs font-semibold px-4 py-1.5 rounded-full transition-all ${
                billingCycle === 'annual'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              Annual Billing <span className="text-[10px] text-emerald-300 font-normal">(Save 18%)</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => {
            const isHighlight = p.id === highlightPlan || p.popular;
            const price = billingCycle === 'monthly' ? p.priceMonthly : p.priceAnnual;

            return (
              <Card
                key={p.id}
                className={`bg-slate-900/90 border flex flex-col justify-between relative ${
                  isHighlight ? 'border-emerald-500/60 shadow-2xl ring-1 ring-emerald-500/30' : 'border-slate-800'
                }`}
              >
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-emerald-500 text-slate-950 font-bold text-[10px] px-2.5 py-0.5">
                      MOST POPULAR RESELLER
                    </Badge>
                  </div>
                )}
                <CardHeader className="p-6 pb-4 border-b border-slate-800">
                  <CardTitle className="text-base font-bold text-white flex items-center justify-between">
                    <span>{p.name}</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400 mt-1">
                    {p.contracts} • {p.users}
                  </CardDescription>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-white">
                      ₦{price.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400">
                      /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6 flex-1 flex flex-col justify-between text-xs">
                  <ul className="space-y-2.5 text-slate-300">
                    {p.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => router.push(`/auth?plan=${p.id}&redirect=/billing/success?plan=${p.id}`)}
                    className={`w-full text-xs font-semibold h-9 ${
                      isHighlight
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700'
                    }`}
                  >
                    Select {p.name}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mb-2" />
          <p className="text-xs">Loading plans &amp; quotas...</p>
        </div>
      }
    >
      <PricingContent />
    </Suspense>
  );
}