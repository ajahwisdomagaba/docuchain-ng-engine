'use client';

import React from 'react';
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
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();

  const handleSelectPlan = (tier: 'FREE' | 'STARTER' | 'ENTERPRISE') => {
    localStorage.setItem('docuchain_selected_plan', tier);
    if (!user) {
      window.location.href = `/auth?plan=${tier}`;
    } else {
      window.location.href = `/pricing?plan=${tier}`;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Navigation */}
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
              <Link href="/vault">
                <Button className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4 py-2">
                  Open Vault <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
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
                  <Button className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4 shadow-lg shadow-emerald-950">
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
          US tools like Ironclad don&apos;t know Lagos Tenancy Law, CAMA 2020, or FIRS tax rules. DocuChain automatically audits, redlines, monitors statutory notice windows, and answers cross-vault queries in seconds.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Button 
            onClick={() => handleSelectPlan('FREE')}
            size="lg" 
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-8 h-12 shadow-lg shadow-emerald-950 flex items-center gap-2 w-full sm:w-auto"
          >
            Ingest & Audit Free <ArrowRight className="w-4 h-4" />
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

      {/* Core Intelligence Architecture */}
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
                <p className="flex items-center gap-2 text-rose-400"><AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Misses Lagos rent & notice caps</p>
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
                <div className="text-2xl font-bold text-white mt-2">From ₦15,000 / mo</div>
                <p className="text-xs text-emerald-500">Accessible local pricing</p>
              </CardHeader>
              <CardContent className="px-6 pb-6 text-xs text-slate-200 space-y-3">
                <p className="flex items-center gap-2 text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Lagos Tenancy & CAMA 2020 audits</p>
                <p className="flex items-center gap-2 text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Automated 90/60/30/7-day notice alerts</p>
                <p className="flex items-center gap-2 text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Cross-vault cited clause semantic search</p>
                <p className="flex items-center gap-2 text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Built-in e-signatures & templates</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section with Hover Glow */}
      <section id="pricing" className="py-24 max-w-6xl mx-auto px-6 space-y-12">
        <div className="text-center space-y-3">
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-xs">Transparent NGN Pricing</Badge>
          <h2 className="text-3xl font-bold text-white">Simple Plans for Every Growing Business</h2>
          <p className="text-xs text-slate-400">Start free with sample audits. Upgrade when you need full vault monitoring.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Free Tier */}
          <div className="group bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-6 transition-all duration-300 hover:border-emerald-500/60 hover:shadow-xl hover:shadow-emerald-950/40 hover:-translate-y-1">
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-slate-200 group-hover:text-emerald-300 transition-colors">Free / Sandbox</h3>
              <div className="text-3xl font-bold text-white">₦0 <span className="text-xs text-slate-500 font-normal">/ forever</span></div>
              <p className="text-xs text-slate-400">For testing individual contract audits.</p>
              <ul className="space-y-2.5 text-xs text-slate-300 pt-2">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> 3 contract audits per month</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Statutory redline suggestions</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Single-document cited Q&A assistant</li>
              </ul>
            </div>
            <Button 
              onClick={() => handleSelectPlan('FREE')}
              variant="outline" 
              className="w-full border-slate-700 bg-slate-900/60 text-slate-200 group-hover:border-emerald-500/50 group-hover:text-white group-hover:bg-emerald-950/30 text-xs transition-colors"
            >
              Start Free
            </Button>
          </div>

          {/* Starter Plan */}
          <div className="group bg-slate-900 border-2 border-emerald-500 rounded-2xl p-6 flex flex-col justify-between space-y-6 relative shadow-xl shadow-emerald-950/50 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-900/60 hover:-translate-y-1 hover:border-emerald-400">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-emerald-600 text-white text-[10px] tracking-wider uppercase font-semibold">RECOMMENDED FOR SMES</Badge>
            </div>
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-white group-hover:text-emerald-300 transition-colors">Starter Business</h3>
              <div className="text-3xl font-bold text-white">₦15,000 <span className="text-xs text-slate-500 font-normal">/ month</span></div>
              <p className="text-xs text-slate-400">For growing Nigerian businesses, landlords, and founders.</p>
              <ul className="space-y-2.5 text-xs text-slate-300 pt-2">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Up to 50 active contracts in vault</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Full Cross-Vault RAG Clause Search</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> 90/60/30/7-day notice alert monitoring</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Unlimited statutory drafting & e-signatures</li>
              </ul>
            </div>
            <Button 
              onClick={() => handleSelectPlan('STARTER')}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-950 transition-colors"
            >
              Get Started
            </Button>
          </div>

          {/* Business Pro */}
          <div className="group bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-6 transition-all duration-300 hover:border-emerald-500/60 hover:shadow-xl hover:shadow-emerald-950/40 hover:-translate-y-1">
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-slate-200 group-hover:text-emerald-300 transition-colors">Enterprise / Legal</h3>
              <div className="text-3xl font-bold text-white">₦45,000 <span className="text-xs text-slate-500 font-normal">/ month</span></div>
              <p className="text-xs text-slate-400">For property management firms and corporate teams.</p>
              <ul className="space-y-2.5 text-xs text-slate-300 pt-2">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Unlimited contracts & batch OCR parsing</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Telegram Bot direct team query access</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Custom statutory benchmark rules</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Priority WhatsApp & phone support</li>
              </ul>
            </div>
            <Button 
              onClick={() => handleSelectPlan('ENTERPRISE')}
              variant="outline" 
              className="w-full border-slate-700 bg-slate-900/60 text-slate-200 group-hover:border-emerald-500/50 group-hover:text-white group-hover:bg-emerald-950/30 text-xs transition-colors"
            >
              Upgrade to Enterprise
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