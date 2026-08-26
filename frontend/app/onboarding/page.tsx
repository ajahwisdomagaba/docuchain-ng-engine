'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Briefcase, 
  Home, 
  Scale, 
  Calculator, 
  ArrowRight, 
  CheckCircle2, 
  Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

const ROLES = [
  {
    id: 'SME_FOUNDER',
    title: 'SME Founder / Business Owner',
    description: 'Managing supplier contracts, vendor agreements, and contractor NDAs without an in-house legal team.',
    icon: Briefcase,
    defaultRoute: '/vault'
  },
  {
    id: 'LANDLORD_PROPERTY_MANAGER',
    title: 'Landlord / Property Manager',
    description: 'Handling tenancy leases, Lagos Tenancy Law 2011 rent caps, service charge reconciliations, and notice-to-quit timelines.',
    icon: Home,
    defaultRoute: '/drafter'
  },
  {
    id: 'LEGAL_COUNSEL',
    title: 'Legal Counsel / Law Firm',
    description: 'Reviewing statutory compliance, CAMA 2020 indemnities, and redlining agreements for corporate clients.',
    icon: Scale,
    defaultRoute: '/vault'
  },
  {
    id: 'FINANCE_OPERATIONS',
    title: 'Finance & Operations Manager',
    description: 'Tracking payment milestones, withholding tax (WHT) gross-up triggers, and SLA auto-renewals.',
    icon: Calculator,
    defaultRoute: '/obligations'
  }
];

export default function OnboardingRolePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedRole, setSelectedRole] = useState<string>('SME_FOUNDER');
  const [saving, setSaving] = useState(false);

  const handleCompleteOnboarding = async () => {
    setSaving(true);
    try {
      if (user?.id) {
        await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            role: selectedRole,
            onboarding_completed: true,
            updated_at: new Date().toISOString()
          });
      }

      const targetRole = ROLES.find(r => r.id === selectedRole);
      router.push(targetRole?.defaultRoute || '/vault');
    } catch (err: any) {
      console.error('Failed to save role:', err.message);
      router.push('/vault');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 px-6">
      <div className="max-w-3xl mx-auto w-full space-y-8">
        
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-3 text-xs text-slate-400 font-medium">
          <span className="text-slate-500">1. Account Created</span>
          <span>→</span>
          <span className="text-slate-500">2. Plan Selected</span>
          <span>→</span>
          <span className="text-emerald-400 font-semibold">3. Workspace Role</span>
        </div>

        <div className="text-center space-y-2">
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-xs">
            Step 3 of 3
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            How will you be using DocuChain?
          </h1>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            We tailor your statutory monitoring rules and document templates to your business role.
          </p>
        </div>

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ROLES.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;

            return (
              <div
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`p-5 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col justify-between space-y-4 ${
                  isSelected
                    ? 'bg-emerald-950/30 border-emerald-500 ring-1 ring-emerald-500/50 shadow-lg shadow-emerald-950/40'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{role.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{role.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Complete Setup Button */}
        <div className="pt-4 flex justify-end">
          <Button
            onClick={handleCompleteOnboarding}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-6 py-2.5 shadow-lg shadow-emerald-950 flex items-center gap-2"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Configuring Workspace...
              </span>
            ) : (
              <>
                Enter DocuChain Workspace <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}