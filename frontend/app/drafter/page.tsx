'use client';

import React, { useState } from 'react';

const TEMPLATES = [
  { id: 'lagos_lease', title: 'Residential Tenancy / Lease', subtitle: 'Lagos & State Tenancy Laws' },
  { id: 'cama_sla', title: 'Commercial Service Level Agreement (SLA)', subtitle: 'CAMA 2020 & WHT Compliance' },
  { id: 'commercial_nda', title: 'Commercial Non-Disclosure Agreement (NDA)', subtitle: 'Nigerian Trade & Confidentiality' },
  { id: 'employment', title: 'Employment Contract', subtitle: 'Nigerian Labour Act (Cap L1 LFN 2004)' },
  { id: 'custom', title: 'Custom / Other Contract Type', subtitle: 'Define your own bespoke contract terms' },
];

export default function StatutoryDrafterPage() {
  const [selectedTemplate, setSelectedTemplate] = useState('lagos_lease');
  const [customContractType, setCustomContractType] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [partyA, setPartyA] = useState('');
  const [partyB, setPartyB] = useState('');
  const [consideration, setConsideration] = useState('');
  const [jurisdiction, setJurisdiction] = useState('Lagos State, Federal Republic of Nigeria');
  const [generatedDraft, setGeneratedDraft] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/drafter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateType: selectedTemplate === 'custom' ? customContractType : selectedTemplate,
          isCustom: selectedTemplate === 'custom',
          customInstructions,
          partyA,
          partyB,
          consideration,
          jurisdiction,
        }),
      });

      const data = await res.json();
      if (data?.draft) {
        setGeneratedDraft(data.draft);
      }
    } catch (err) {
      console.error('Draft generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          📄 Statutory Contract Drafter
        </h1>
        <p className="text-sm text-gray-400">
          Draft bespoke agreements benchmarked across Nigerian statutory frameworks.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Form Controls */}
        <div className="space-y-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
            Select Contract Category
          </label>
          <div className="space-y-2">
            {TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => setSelectedTemplate(tpl.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedTemplate === tpl.id
                    ? 'border-emerald-500 bg-emerald-950/20 text-white'
                    : 'border-gray-800 bg-gray-900/50 text-gray-300 hover:border-gray-700'
                }`}
              >
                <div className="font-medium text-sm">{tpl.title}</div>
                <div className="text-xs text-gray-500">{tpl.subtitle}</div>
              </button>
            ))}
          </div>

          {/* Conditional Custom Inputs */}
          {selectedTemplate === 'custom' && (
            <div className="space-y-3 p-4 rounded-lg border border-emerald-500/30 bg-gray-900/80">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Custom Contract Title / Nature of Agreement
                </label>
                <input
                  type="text"
                  placeholder="e.g., Software Escrow Agreement, Haulage Logistics Contract, Music Royalty Split"
                  value={customContractType}
                  onChange={(e) => setCustomContractType(e.target.value)}
                  className="w-full bg-black/50 border border-gray-700 rounded-md px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Custom Scope, Clauses & Mandatory Terms
                </label>
                <textarea
                  rows={4}
                  placeholder="Specify key deliverables, payment milestones, default conditions, NDPA data clauses, or termination triggers..."
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  className="w-full bg-black/50 border border-gray-700 rounded-md px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                />
              </div>
            </div>
          )}

          {/* Standard Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">First Party (Discloser / Landlord / Client)</label>
              <input
                type="text"
                placeholder="e.g. Adebayo Adeleke Ltd"
                value={partyA}
                onChange={(e) => setPartyA(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-md px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Second Party (Recipient / Tenant / Vendor)</label>
              <input
                type="text"
                placeholder="e.g. Chukwuma Obi"
                value={partyB}
                onChange={(e) => setPartyB(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-md px-3 py-2 text-sm text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Consideration / Amount (NGN)</label>
              <input
                type="text"
                placeholder="e.g. 5,000,000"
                value={consideration}
                onChange={(e) => setConsideration(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-md px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Jurisdiction / Location</label>
              <input
                type="text"
                placeholder="e.g. Lagos State, Nigeria"
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-md px-3 py-2 text-sm text-white"
              />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 rounded-lg transition-all"
          >
            {loading ? 'Generating Statutory Draft...' : '✨ Generate Compliant Draft'}
          </button>
        </div>

        {/* Right Column: Output */}
        <div className="space-y-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
            Generated Statutory Draft
          </label>
          <textarea
            readOnly
            rows={20}
            value={generatedDraft}
            placeholder="Click 'Generate Compliant Draft' to preview the structured agreement here..."
            className="w-full bg-gray-950 border border-gray-800 rounded-lg p-4 font-mono text-xs text-gray-200 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}