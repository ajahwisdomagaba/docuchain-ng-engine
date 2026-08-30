'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Scale, 
  Search, 
  Clock, 
  FileEdit, 
  CheckCircle2, 
  ArrowRight, 
  Zap, 
  AlertTriangle,
  Bot,
  PenTool,
  Check,
  Building2,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();

  // Target Tab: 'sme' (default) | 'law-firm'
  const [targetAudience, setTargetAudience] = useState<'sme' | 'law-firm'>('sme');
  // Billing Cycle: 'monthly' | 'annual'
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const smePlans = [
    {
      name: 'Growing Business',
      description: 'Automated contract risk detection for startups and growing enterprises.',
      quota: '50 Contracts / mo • 1 In-House Admin',
      priceMonthly: '₦10,000',
      priceAnnual: '₦100,000',
      popular: false,
      buttonText: 'Select Growing Business',
      tierKey: 'STARTER',
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
      tierKey: 'BUSINESS',
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
      tierKey: 'LEGAL_TEAM',
      features: [
        'Everything in Corporate Team',
        'Template & Precedent Clause Library',
        'Multi-User Team Collaboration',
        'Guest Reviewer & Client Portal Access',
        'Priority Technical Support',
      ],
    },
  ];

  const lawFirmPlans = [
    {
      name: 'Starter Practice',
      description: 'Ideal for solo practitioners and boutique chambers requiring Nigerian statutory compliance.',
      quota: '25 Contracts / mo • 2 Counsel Members',
      priceMonthly: '₦75,000',
      priceAnnual: '₦750,000',
      popular: false,
      buttonText: 'Select Starter Practice',
      tierKey: 'STARTER',
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
      tierKey: 'LAW_FIRM_RESELLER',
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
      tierKey: 'LEGAL_TEAM',
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

  const activePlans = targetAudience === 'sme' ? smePlans : lawFirmPlans;

  const handleSelectPlan = (tier: string) => {
    localStorage.setItem('docuchain_selected_plan', tier);
    if (!user) {
      window.location.href = `/auth?plan=${tier}`;
    } else {
      window.location.href = `/pricing?plan=${tier}`;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Top Navbar */}
      <nav className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white shadow-md shadow-emerald-950">
              D
            </div>
            <span className="font-bold text-lg tracking-tight text-white">
              DocuChain<span className="text-emerald-400">.NG</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-xs font-medium text-slate-300">
            <a href="#problem" className="hover:text-emerald-400 transition-colors">The Problem</a>
            <a href="#features" className="hover:text-emerald-400 transition-colors">Core Intelligence</a>
            <a href="#comparison" className="hover:text-emerald-400 transition-colors">Why DocuChain</a>
            <a href="#pricing" className="hover:text-emerald-400 transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <Link href="/dashboard">
                <Button className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4 py-2 font-semibold">
                  Dashboard <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/auth">
                  <Button variant="ghost" className="text-slate-300 hover:text-white text-xs">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4 shadow-lg shadow-emerald-950 font-semibold">
                    Get Started Free
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-6 max-w-5xl mx-auto text-center space-y-6">
        <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs px-3.5 py-1 inline-flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5" /> Context-Aware Contract Intelligence for Nigerian Businesses
        </Badge>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Never Sign a Contract With <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
            Hidden Legal Traps Again
          </span>
        </h1>

        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Foreign tools don&apos;t know Lagos Tenancy Law, CAMA 2020, or FIRS rules. DocuChain automatically audits, redlines, monitors statutory notice windows, and answers cross-vault queries in seconds.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Button 
            onClick={() => handleSelectPlan('STARTER')}
            size="lg" 
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-8 h-12 shadow-lg shadow-emerald-950 flex items-center gap-2 w-full sm:w-auto"
          >
            Ingest &amp; Audit Free <ArrowRight className="w-4 h-4" />
          </Button>
          <a href="#comparison" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="border-slate-700 bg-slate-900 text-slate-300 hover:text-white h-12 text-sm px-6 w-full">
              See Comparison
            </Button>
          </a>
        </div>

        {/* Live Risk Detection Preview Box */}
        <div className="pt-10">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl text-left space-y-4 max-w-3xl mx-auto backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block animate-pulse"></span>
                <span>Live Statutory Risk Benchmark</span>
              </div>
              <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30 text-xs">Section 4 Rent Cap Violation</Badge>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800/80 font-mono text-xs text-slate-400 line-through">
              &quot;The Tenant shall pay the sum of ₦14,000,000 representing two (2) full years advance rent upon execution of this agreement.&quot;
            </div>
            <div className="bg-emerald-950/30 p-3.5 rounded-lg border border-emerald-900/50 font-medium text-xs text-emerald-300 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
              <div>
                <strong>DocuChain Counter-Clause:</strong> &quot;The Tenant shall pay the sum of ₦7,000,000 representing one (1) year advance rent in accordance with Section 4(1) of Lagos State Tenancy Law 2011.&quot;
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section id="problem" className="py-20 border-t border-slate-800/80 bg-slate-900/20">
        <div className="max-w-6xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">The Reality of Contract Management in Nigeria</h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              Every business signs agreements with suppliers, landlords, and staff. Almost everyone manages them blindly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl space-y-3">
              <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 font-bold">₦</div>
              <h3 className="text-sm font-semibold text-white">Expensive Retainers</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Lawyers charge ₦50,000 to ₦500,000 per document draft, creating a major financial barrier for SMEs.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl space-y-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-white">Statutory Mismatches</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Copy-pasted internet templates cite UK or US jurisdiction and violate mandatory Lagos rent and notice caps.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-white">Inbox Black Holes</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Signed PDFs sit in email threads. Nobody monitors 90/60/30-day statutory notice windows or penalty triggers.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl space-y-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-white">Slow Clause Retrieval</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                When a dispute or audit strikes, teams spend hours manually hunting for indemnities and price escalation terms.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Intelligence Features */}
      <section id="features" className="py-20 max-w-6xl mx-auto px-6 space-y-12">
        <div className="text-center space-y-3">
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-xs">AI-Native Features</Badge>
          <h2 className="text-3xl font-bold text-white">Everything You Need to Protect Your Business</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-3 hover:border-emerald-500/40 transition-colors">
            <Scale className="w-6 h-6 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Statutory Risk Analyser</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Instantly flags illegal advance rent, deficient notice to quit, uncapped indemnities, and WHT gross-up traps with plain-English redlines.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-3 hover:border-emerald-500/40 transition-colors">
            <Search className="w-6 h-6 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Cross-Vault Semantic RAG</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ask natural questions like <em>&quot;Which supplier contracts allow price increases?&quot;</em> and get cited answers directly from exact contract clauses.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-3 hover:border-emerald-500/40 transition-colors">
            <Clock className="w-6 h-6 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Nightly Notice Monitoring</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automated background monitoring scans your obligations for approaching 90, 60, 30, and 7-day statutory determination deadlines.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-3 hover:border-emerald-500/40 transition-colors">
            <FileEdit className="w-6 h-6 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Nigerian Statutory Drafter</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Generate bulletproof Tenancy agreements, CAMA 2020 SLAs, and NDAs that auto-schedule notice periods in your vault.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-3 hover:border-emerald-500/40 transition-colors">
            <PenTool className="w-6 h-6 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Built-in E-Signatures</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Collect legally binding digital signatures from tenants, clients, and staff with full audit trails without paying DocuSign fees.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-3 hover:border-emerald-500/40 transition-colors">
            <Bot className="w-6 h-6 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Telegram Bot Assistant</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Let your finance team ask the bot <em>&quot;When does our generator SLA expire?&quot;</em> directly on Telegram for immediate answers.
            </p>
          </div>
        </div>
      </section>

      {/* Comparison Table Section */}
      <section id="comparison" className="py-20 border-t border-slate-800/80 bg-slate-900/30">
        <div className="max-w-6xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">How DocuChain Compares</h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              Compare DocuChain against traditional legal retainers and foreign contract tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-slate-900/80 border-slate-800">
              <CardHeader className="p-6">
                <CardTitle className="text-base font-semibold text-slate-300">Lawyer Retainers</CardTitle>
                <div className="text-2xl font-bold text-slate-100 mt-2">₦50,000 – ₦500k</div>
                <p className="text-xs text-slate-500">Per individual contract draft</p>
              </CardHeader>
              <CardContent className="px-6 pb-6 text-xs text-slate-400 space-y-3">
                <p className="flex items-center gap-2 text-rose-400"><AlertTriangle className="w-3.5 h-3.5 shrink-0" /> 3–7 day turnaround time</p>
                <p className="flex items-center gap-2 text-rose-400"><AlertTriangle className="w-3.5 h-3.5 shrink-0" /> No automatic expiry reminders</p>
                <p className="flex items-center gap-2 text-rose-400"><AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Static paperwork in filing cabinets</p>
                <p className="flex items-center gap-2 text-rose-400"><AlertTriangle className="w-3.5 h-3.5 shrink-0" /> No instant clause search</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/80 border-slate-800">
              <CardHeader className="p-6">
                <CardTitle className="text-base font-semibold text-slate-300">Foreign Tools (Ironclad)</CardTitle>
                <div className="text-2xl font-bold text-slate-100 mt-2">$500+ / mo</div>
                <p className="text-xs text-slate-500">Billed in volatile USD</p>
              </CardHeader>
              <CardContent className="px-6 pb-6 text-xs text-slate-400 space-y-3">
                <p className="flex items-center gap-2 text-rose-400"><AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Understands US/UK law only</p>
                <p className="flex items-center gap-2 text-rose-400"><AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Misses Lagos rent &amp; notice caps</p>
                <p className="flex items-center gap-2 text-rose-400"><AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Unaware of FIRS WHT regulations</p>
                <p className="flex items-center gap-2 text-rose-400"><AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Expensive enterprise rollout</p>
              </CardContent>
            </Card>

            <Card className="bg-emerald-950/20 border-emerald-500/40 relative shadow-xl shadow-emerald-950/40">
              <div className="absolute -top-3 right-4">
                <Badge className="bg-emerald-600 text-white text-[10px]">BUILT FOR NIGERIA</Badge>
              </div>
              <CardHeader className="p-6">
                <CardTitle className="text-base font-semibold text-emerald-400">DocuChain.NG</CardTitle>
                <div className="text-2xl font-bold text-white mt-2">From ₦10,000 / mo</div>
                <p className="text-xs text-emerald-500">Accessible local pricing</p>
              </CardHeader>
              <CardContent className="px-6 pb-6 text-xs text-slate-200 space-y-3">
                <p className="flex items-center gap-2 text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Lagos Tenancy &amp; CAMA 2020 audits</p>
                <p className="flex items-center gap-2 text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Automated 90/60/30/7-day notice alerts</p>
                <p className="flex items-center gap-2 text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Cross-vault cited clause semantic search</p>
                <p className="flex items-center gap-2 text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Built-in e-signatures &amp; templates</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* DUAL-AUDIENCE PRICING SECTION */}
      <section id="pricing" className="py-24 max-w-7xl mx-auto px-6 space-y-10">
        
        {/* Header Title */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs px-3 py-1 font-semibold rounded-full">
            Transparent Nigerian SaaS Pricing
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            {targetAudience === 'sme'
              ? 'Simple, Compliant Plans for Growing Businesses'
              : 'Institutional Plans for Nigerian Law Practices'
            }
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            {targetAudience === 'sme'
              ? 'Audit vendor SLAs, employment terms, and tenancy agreements against Nigerian statutory requirements.'
              : 'White-label reseller infrastructure, multi-client vaults, team RBAC, and automated CAMA 2020 execution.'
            }
          </p>
        </div>

        {/* Audience Segment Switcher: IN-HOUSE TEAMS & SMES FIRST */}
        <div className="flex justify-center">
          <div className="inline-flex p-1.5 rounded-xl bg-slate-900 border border-slate-800 shadow-inner">
            <button
              type="button"
              onClick={() => setTargetAudience('sme')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                targetAudience === 'sme'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" /> For In-House Teams &amp; SMEs
            </button>
            <button
              type="button"
              onClick={() => setTargetAudience('law-firm')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                targetAudience === 'law-firm'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Scale className="w-4 h-4" /> For Law Firms &amp; Resellers
            </button>
          </div>
        </div>

        {/* Monthly vs Annual Toggle */}
        <div className="flex justify-center items-center gap-2">
          <div className="inline-flex p-1 rounded-full bg-slate-900 border border-slate-800">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('annual')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
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
                  <Button
                    onClick={() => handleSelectPlan(plan.tierKey)}
                    className={`w-full text-xs font-bold h-11 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isPopular
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-950'
                        : 'bg-slate-800 hover:bg-slate-700 text-white'
                    }`}
                  >
                    {plan.buttonText} <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
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
            <Button 
              onClick={() => handleSelectPlan('ONE_TIME_REVIEW')}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold h-10 px-5 shadow-lg shadow-emerald-950 cursor-pointer"
            >
              Order Single Review
            </Button>
          </div>
        </div>

      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 text-center text-xs text-slate-500">
        <p>© 2026 DocuChain.NG — Context-Aware Legal Intelligence for Nigerian Businesses. Lagos, Nigeria.</p>
      </footer>
    </div>
  );
}