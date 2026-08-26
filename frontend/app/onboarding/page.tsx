'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Home, Briefcase, Scale, Check, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth, UserRole } from '../../context/AuthContext';

const ROLES: Array<{
  id: UserRole;
  title: string;
  description: string;
  badge: string;
  icon: any;
}> = [
  {
    id: 'LANDLORD',
    title: 'Landlord / Property Manager',
    description: 'Enforce Lagos Tenancy Law 2011 compliance, manage multi-tenant agreements & automated notice periods.',
    badge: 'Real Estate & Tenancy',
    icon: Building2,
  },
  {
    id: 'TENANT',
    title: 'Commercial / Residential Tenant',
    description: 'Audit advance rent demands, dispute deficient notice-to-quit clauses, and verify legal terms before signing.',
    badge: 'Tenant Protection',
    icon: Home,
  },
  {
    id: 'SME_OPERATOR',
    title: 'SME / Business Operator',
    description: 'Safeguard commercial SLAs, mitigate WHT tax gross-up liabilities, and balance indemnification clauses.',
    badge: 'Commercial SLAs & Vendor',
    icon: Briefcase,
  },
  {
    id: 'LEGAL_COUNSEL',
    title: 'Legal Counsel / Solicitor',
    description: 'Accelerate statutory contract review across Lagos Tenancy, CAMA 2020, and the Nigerian Labour Act.',
    badge: 'Full Legal Suite',
    icon: Scale,
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>('SME_OPERATOR');
  const [companyName, setCompanyName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCompleteOnboarding = async () => {
    setSaving(true);

    try {
      let targetUserId = user?.id;
      let targetEmail = user?.email;

      if (!targetUserId || !targetEmail) {
        const { data: authData } = await supabase.auth.getUser();
        targetUserId = authData?.user?.id;
        targetEmail = authData?.user?.email;
      }

      if (!targetUserId) {
        router.push('/auth');
        return;
      }

      // Upsert including email to satisfy NOT NULL constraints
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: targetUserId,
          email: targetEmail || '',
          role: selectedRole,
          company_name: companyName,
          is_onboarded: true,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      await refreshProfile();
      router.push('/vault');
    } catch (err: any) {
      console.error('Onboarding error:', err);
      alert(err.message || 'Failed to complete setup');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 flex items-center justify-center">
      <div className="max-w-3xl w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-white">Select Your DocuChain Role</h1>
          <p className="text-sm text-slate-400">
            Customize the AI review engine and statutory trackers to fit your operational focus.
          </p>
        </div>

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ROLES.map((r) => {
            const Icon = r.icon;
            const isSelected = selectedRole === r.id;
            return (
              <div
                key={r.id}
                onClick={() => setSelectedRole(r.id)}
                className={`p-5 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                  isSelected
                    ? 'bg-emerald-950/30 border-emerald-500 shadow-lg shadow-emerald-950/50'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-lg border ${
                      isSelected ? 'bg-emerald-900/40 border-emerald-500/40 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    {isSelected && (
                      <span className="p-1 rounded-full bg-emerald-500 text-slate-950">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-white">{r.title}</h3>
                  <span className="text-[11px] text-emerald-400 font-medium block mt-0.5">{r.badge}</span>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">{r.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Business Name Field */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl space-y-3">
          <label className="text-xs text-slate-300 font-medium block">
            Business / Practice / Entity Name (Optional)
          </label>
          <input
            placeholder="e.g. Prime Ventures Nigeria Ltd"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleCompleteOnboarding}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 px-6 rounded-md text-sm transition-colors flex items-center gap-2 shadow-lg shadow-emerald-950 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving Setup...
              </>
            ) : (
              <>
                Complete Setup & Enter Vault <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}