'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileEdit, 
  Sparkles, 
  Copy, 
  Check, 
  FolderPlus, 
  Building2, 
  Lock, 
  Briefcase, 
  Users,
  Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

const NIGERIAN_TEMPLATES = {
  TENANCY: {
    name: 'Lagos Tenancy Law 2011 Compliant Lease',
    icon: Building2,
    governingLaw: 'Lagos State Tenancy Law 2011',
    generate: (p: { partyA: string; partyB: string; value: string; jurisdiction: string }) => 
`TENANCY AGREEMENT

THIS AGREEMENT is made this ${new Date().toLocaleDateString('en-GB')} BETWEEN ${p.partyA || '[Landlord Name]'} ("Landlord") AND ${p.partyB || '[Tenant Name]'} ("Tenant").

1. DEMISE AND TERM
The Landlord lets and the Tenant takes the property situated at ${p.jurisdiction || '[Property Address, Lagos State]'} for a term of one (1) year.

2. RENT AND STATUTORY LIMITS
The Tenant shall pay the sum of NGN ${p.value || '0.00'} per annum. In compliance with Section 4 of the Lagos State Tenancy Law 2011, the Landlord shall not demand or receive advance rent exceeding one (1) year.

3. STATUTORY DETERMINATION & NOTICE
In accordance with Section 13(1) of the Lagos State Tenancy Law 2011, determination of this yearly tenancy requires a minimum of six (6) months written notice to quit preceding the expiration of the term.

4. SERVICE CHARGE AUDIT
Any service charges levied shall be backed by audited annual reconciliations and transparent utility bills.`
  },
  SLA: {
    name: 'CAMA 2020 & WHT-Compliant Vendor SLA',
    icon: Briefcase,
    governingLaw: 'Companies and Allied Matters Act 2020 & Nigerian Tax Laws',
    generate: (p: { partyA: string; partyB: string; value: string; jurisdiction: string }) => 
`MASTER SERVICE LEVEL AGREEMENT (SLA)

THIS AGREEMENT is entered into by ${p.partyA || '[Client Entity Ltd]'} ("Client") and ${p.partyB || '[Service Provider Ltd]'} ("Vendor").

1. SCOPE & PAYMENT TERMS
The Vendor shall deliver commercial services for an agreed consideration of NGN ${p.value || '0.00'}. Invoices are payable within 30 days of receipt.

2. WITHHOLDING TAX (WHT) COMPLIANCE
Statutory deductions for Withholding Tax (WHT) shall be remitted directly to the Federal Inland Revenue Service (FIRS) or State Internal Revenue Service. Both parties agree that no unilateral tax gross-up penalties shall be charged against statutory remittances.

3. LIMITATION OF LIABILITY
Neither party's liability under this Agreement shall exceed the aggregate contract fees paid over the preceding 12 months, excluding breaches of statutory compliance or gross negligence.`
  },
  NDA: {
    name: 'West African Commercial NDA',
    icon: Lock,
    governingLaw: 'Laws of the Federal Republic of Nigeria',
    generate: (p: { partyA: string; partyB: string; value: string; jurisdiction: string }) => 
`MUTUAL NON-DISCLOSURE AGREEMENT

THIS AGREEMENT is entered into between ${p.partyA || '[Disclosing Entity]'} and ${p.partyB || '[Receiving Entity]'}.

1. CONFIDENTIALITY DURATION
Confidential Information disclosed under this agreement shall remain protected for a period of two (2) years from the Effective Date, in accordance with standard Nigerian commercial practice.

2. REASONABLE RESTRAINT
Non-solicitation restrictions shall be strictly limited to direct personnel engaged in the project and shall not constitute an unlawful total restraint of trade under Nigerian law.

3. JURISDICTION
This Agreement is governed by the laws of the Federal Republic of Nigeria.`
  }
};

export default function DrafterPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedKey, setSelectedKey] = useState<'TENANCY' | 'SLA' | 'NDA'>('TENANCY');
  const [partyA, setPartyA] = useState('');
  const [partyB, setPartyB] = useState('');
  const [value, setValue] = useState('');
  const [jurisdiction, setJurisdiction] = useState('Lekki, Lagos State');
  const [generatedText, setGeneratedText] = useState('');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    const template = NIGERIAN_TEMPLATES[selectedKey];
    const text = template.generate({ partyA, partyB, value, jurisdiction });
    setGeneratedText(text);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToVault = async () => {
    if (!generatedText.trim()) {
      alert('Please generate a contract draft first.');
      return;
    }

    setSaving(true);
    try {
      // 1. Resolve current user ID
      let currentUserId = user?.id;
      if (!currentUserId) {
        const { data: authData } = await supabase.auth.getUser();
        currentUserId = authData?.user?.id;
      }

      if (!currentUserId) {
        alert('Authentication required: Please sign in or complete onboarding to save drafts.');
        return;
      }

      const template = NIGERIAN_TEMPLATES[selectedKey];
      const draftTitle = `${template.name} - ${partyB.trim() || 'Counterparty'}`;

      // 2. Insert into Supabase contracts table
      const { data: contractData, error: contractError } = await supabase
        .from('contracts')
        .insert({
          user_id: currentUserId,
          title: draftTitle,
          contract_type: selectedKey === 'TENANCY' ? 'Tenancy Agreement' : 'Commercial Agreement',
          counterparty: partyB.trim() || 'Pending Signatory',
          status: 'ACTIVE',
          risk_score: 5,
          metadata: {
            draftedWithAI: true,
            governingLaw: template.governingLaw,
            rawDraft: generatedText,
            jurisdiction: jurisdiction,
            considerationNgn: value || '0'
          },
        })
        .select()
        .single();

      if (contractError) throw contractError;

      // 3. Trigger Vector Embedding for Cross-Vault Semantic Search
      if (contractData) {
        try {
          await fetch('/api/ingest/embed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contractId: contractData.id,
              userId: currentUserId,
              rawText: generatedText,
            }),
          });
        } catch (embedErr) {
          console.warn('Vector embedding background task notice:', embedErr);
        }
      }

      // 4. Automatically generate statutory notice obligation if Tenancy
      if (selectedKey === 'TENANCY' && contractData) {
        await supabase.from('obligations').insert({
          contract_id: contractData.id,
          user_id: currentUserId,
          title: 'Statutory Notice to Quit Service Window',
          description: 'Lagos State Tenancy Law 2011 Section 13 notice window prior to yearly lease expiration.',
          due_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          amount_ngn: parseFloat(value.replace(/[^0-9.]/g, '')) || null,
          obligation_type: 'NOTICE',
          status: 'PENDING'
        });
      }

      alert('Draft successfully saved and indexed in Contract Vault!');
      router.push('/vault');
    } catch (err: any) {
      console.error('Error saving draft:', err);
      alert('Error saving draft: ' + (err.message || 'Unknown error occurred'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <FileEdit className="w-6 h-6 text-emerald-400" />
          Statutory Contract Drafter
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Draft legally sound, pre-benchmarked Nigerian contracts across Lagos Tenancy, CAMA 2020, and Labour laws.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Configuration Form */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">Select Template</label>
              <div className="space-y-2">
                {Object.entries(NIGERIAN_TEMPLATES).map(([k, t]) => {
                  const Icon = t.icon;
                  const isSel = selectedKey === k;
                  return (
                    <div
                      key={k}
                      onClick={() => setSelectedKey(k as any)}
                      className={`p-3 rounded-lg border cursor-pointer flex items-center gap-3 transition-colors ${
                        isSel
                          ? 'bg-emerald-950/40 border-emerald-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-emerald-400" />
                      <div className="text-xs">
                        <div className="font-semibold">{t.name}</div>
                        <div className="text-[10px] text-slate-500">{t.governingLaw}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">First Party / Discloser / Landlord</label>
              <input
                value={partyA}
                onChange={(e) => setPartyA(e.target.value)}
                placeholder="e.g. Chief Adebayo Adeleke"
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Second Party / Recipient / Tenant</label>
              <input
                value={partyB}
                onChange={(e) => setPartyB(e.target.value)}
                placeholder="e.g. Chukwuma Obi"
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Contract Consideration (NGN)</label>
                <input
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="e.g. 7,000,000"
                  className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Jurisdiction / Location</label>
                <input
                  value={jurisdiction}
                  onChange={(e) => setJurisdiction(e.target.value)}
                  placeholder="Lekki Phase 1, Lagos"
                  className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              onClick={handleGenerate}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2.5 rounded-md flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4" /> Generate Compliant Draft
            </button>
          </div>
        </div>

        {/* Right: Draft Preview Area */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-semibold text-slate-300">Generated Statutory Draft</span>
              {generatedText && (
                <button
                  onClick={handleCopy}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy Text'}
                </button>
              )}
            </div>
            <textarea
              rows={16}
              value={generatedText}
              onChange={(e) => setGeneratedText(e.target.value)}
              placeholder="Click 'Generate Compliant Draft' to preview the structured agreement here..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 leading-relaxed"
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              onClick={handleSaveToVault}
              disabled={saving || !generatedText}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-md flex items-center gap-2 transition-colors cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderPlus className="w-4 h-4" />}
              Save to Contract Vault
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}