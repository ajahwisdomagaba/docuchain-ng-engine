'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Check, 
  Scale, 
  Building2, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function PricingSection() {
  // Target Tab: 'law-firm' | 'sme'
  const [targetAudience, setTargetAudience] = useState<'law-firm' | 'sme'>('law-firm');
  // Billing Cycle: 'monthly' | 'annual'
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  // Pricing Data Matrix
  const lawFirmPlans = [
    {
      name: 'Starter Practice',
      description: 'Ideal for solo practitioners and boutique chambers requiring Nigerian statutory compliance.',
      quota: '25 Contracts / mo • 2 Counsel Members',
      priceMonthly: '₦75,000',
      priceAnnual: '₦750,000',
      popular: false,
      buttonText: 'Select Starter Practice',
      features: [
        'Lagos Tenancy Law 2011 S.4 & S.13 Redlines',
        'CAMA 2020 Sec 102 Digital E-Sign Stamping',
        'Labour Act & 2024 Min. Wage (₦70k) Compliance',
        'Downloadable Stamped Verification Certificates',
        'Client-Isolated Contract Repositories',
      ],
    },
    {
      name: 'Law Firm Reseller (Pro)',
      description: 'Full white-label operating system to monetize AI legal reviews directly to your corporate clients.',
      quota: '150 Contracts / mo • 10 Counsel & Partner Seats',
      priceMonthly: '₦195,000',
      priceAnnual: '₦1,950,000',
      popular: true,
      popularLabel: 'MOST POPULAR RESELLER',
      buttonText: 'Select Law Firm Reseller (Pro)',
      features: [
        'Everything in Starter Practice',
        'White-Label Subdomain Branding (*.docuchain.ng)',
        'Multi-Client Vault Isolation (/reseller/clients)',
        'Custom AI Playbooks (Mandatory & Forbidden Clauses)',
        'Client Self-Service Portal (/portal)',
        'Tenant-Scoped pgvector Semantic Search',
        'Granular Team RBAC (Partner / Associate / Paralegal)',
      ],
    },
    {
      name: 'Institutional Legal OS',
      description: 'For multi-partner firms and enterprise chambers with custom governance and high-volume workloads.',
      quota: 'Unlimited Contracts • Unlimited Seats & Matters',
      priceMonthly: '₦450,000',
      priceAnnual: '₦4,500,000',
      popular: false,
      buttonText: 'Select Institutional Legal OS',
      features: [
        'Everything in Reseller Pro',
        'Dedicated Custom CNAME Domains (e.g. legal.firm.com)',
        'Immutable Audit Trail (NDPA 2023 DPO Compliance)',
        'Priority AI Token & Ingestion Throughput',
        'Custom Ingestion Webhooks & API Access',
        'Dedicated Legal Engineering SLA & Migration',
      ],
    },
  ];

  const smePlans = [
    {
      name: 'Growing Business',
      description: 'Automated contract risk detection for startups and growing enterprises.',
      quota: '50 Contracts / mo • 1 In-House Admin',
      priceMonthly: '₦10,000',
      priceAnnual: '₦100,000',
      popular: false,
      buttonText: 'Select Growing Business',
      features: [
        'Smart Contract Clause Extraction',
        'Lagos Tenancy & Labour Risk Scoring',
        'Centralized Document Vault',
        'Basic Expiry & Renewal Alerts',
      ],
    },
    {
      name: 'Corporate Team',
      description: 'Comprehensive legal risk control and clause negotiation intelligence.',
      quota: '500 Contracts / mo • 5 In-House Members',
      priceMonthly: '₦30,000',
      priceAnnual: '₦300,000',
      popular: true,
      popularLabel: 'MOST POPULAR',
      buttonText: 'Select Corporate Team',
      features: [
        'Everything in Growing Business',
        'Full Clause Risk Scoring & Heatmaps',
        'Cross-Vault Semantic Search',
        'Statutory Obligations & Notice Tracker',
        'Export Redlined DOCX & Summaries',
      ],
    },
    {
      name: 'Corporate Counsel',
      description: 'For corporate legal departments handling heavy vendor and procurement workflows.',
      quota: 'Unlimited Contracts • Unlimited In-House Access',
      priceMonthly: '₦75,000',
      priceAnnual: '₦750,000',
      popular: false,
      buttonText: 'Select Corporate Counsel',
      features: [
        'Everything in Corporate Team',
        'Template & Precedent Clause Library',
        'Multi-User Team Collaboration',
        'Guest Reviewer & Client Portal Access',
        'Priority Technical Support',
      ],
    },
  ];

  const activePlans = targetAudience === 'law-firm' ? lawFirmPlans : smePlans;

  return (
    <section className="w-full py-16 px-4 bg-slate-950 text-slate-100 flex flex-col items-center">
      <div className="max-w-7xl w-full space-y-10">
        
        {/* Header Title */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs px-3 py-1 font-semibold rounded-full">
            Transparent Nigerian SaaS Pricing
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            {targetAudience === 'law-firm' 
              ? 'Institutional Plans for Nigerian Law Practices'
              : 'Simple, Compliant Plans for Growing Businesses'
            }
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            {targetAudience === 'law-firm'
              ? 'White-label reseller infrastructure, multi-client vaults, team RBAC, and automated CAMA 2020 execution.'
              : 'Audit vendor SLAs, employment terms, and tenancy agreements against Nigerian statutory requirements.'
            }
          </p>
        </div>

        {/* Audience Segment Switcher */}
        <div className="flex justify-center">
          <div className="inline-flex p-1.5 rounded-xl bg-slate-900 border border-slate-800 shadow-inner">
            <button
              onClick={() => setTargetAudience('law-firm')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all ${
                targetAudience === 'law-firm'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Scale className="w-4 h-4" /> For Law Firms &amp; Resellers
            </button>
            <button
              onClick={() => setTargetAudience('sme')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all ${
                targetAudience === 'sme'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" /> For In-House Teams &amp; SMEs
            </button>
          </div>
        </div>

        {/* Monthly vs Annual Toggle */}
        <div className="flex justify-center items-center gap-2">
          <div className="inline-flex p-1 rounded-full bg-slate-900 border border-slate-800">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                billingCycle === 'annual'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Annual Billing</span>
              <span className="text-[10px] text-emerald-400 font-bold">(Save ~18%)</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {activePlans.map((plan, idx) => {
            const isPopular = plan.popular;
            const price = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceAnnual;
            const period = billingCycle === 'monthly' ? '/mo' : '/yr';

            return (
              <div
                key={idx}
                className={`relative flex flex-col justify-between rounded-2xl p-7 bg-slate-900/70 border transition-all ${
                  isPopular
                    ? 'border-emerald-500/60 shadow-2xl shadow-emerald-950/40 ring-1 ring-emerald-500/30'
                    : 'border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 bg-emerald-500 text-slate-950 text-[10px] font-extrabold uppercase tracking-wider rounded-full shadow-md">
                      {plan.popularLabel || 'MOST POPULAR'}
                    </span>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 min-h-[34px] leading-relaxed">
                      {plan.description}
                    </p>
                  </div>

                  <div className="text-xs font-semibold text-emerald-400">
                    {plan.quota}
                  </div>

                  <div className="pt-2 border-t border-slate-800/80">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-white tracking-tight">
                        {price}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">{period}</span>
                    </div>
                  </div>

                  <ul className="space-y-3 pt-4 border-t border-slate-800/60 text-xs text-slate-300">
                    {plan.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-8 mt-auto">
                  <Link href={`/auth?plan=${encodeURIComponent(plan.name)}`}>
                    <Button
                      className={`w-full text-xs font-bold h-11 transition-all flex items-center justify-center gap-1.5 ${
                        isPopular
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-950'
                          : 'bg-slate-800 hover:bg-slate-700 text-white'
                      }`}
                    >
                      {plan.buttonText} <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* One-Time Contract Review Banner */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold">
              <Sparkles className="w-3 h-3" /> NO SUBSCRIPTION REQUIRED • One-Off Service
            </div>
            <h3 className="text-xl font-bold text-white">
              One-Time Statutory Contract Review for SMEs
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Don&apos;t need a monthly subscription? Have a single tenancy lease, vendor SLA, or employment contract audited against Nigerian statutory law.
            </p>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end gap-3 shrink-0">
            <div className="text-right">
              <span className="text-3xl font-extrabold text-white">₦15,000</span>
              <span className="text-xs text-slate-400 block">/ single contract review</span>
            </div>
            <Link href="/auth?flow=single_review">
              <Button className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold h-10 px-5 shadow-lg shadow-emerald-950">
                Order Single Review
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}