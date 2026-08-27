'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard,
  FolderLock, 
  FileEdit, 
  CalendarCheck, 
  ShieldAlert, 
  Building2,
  Scale, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  Sparkles,
  Lock
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { PLAN_PERMISSIONS, PlanTier, PlanLimits } from '@/lib/tierPermissions';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(user);
  const [currentTier, setCurrentTier] = useState<PlanTier>('FREE');

  useEffect(() => {
    async function fetchUserAndTier() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const activeUser = authUser || user;
      setCurrentUser(activeUser);

      if (activeUser) {
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('plan_tier')
          .eq('user_id', activeUser.id)
          .eq('status', 'ACTIVE')
          .single();
        if (sub?.plan_tier) {
          setCurrentTier(sub.plan_tier as PlanTier);
        }
      }
    }
    fetchUserAndTier();
  }, [user]);

  const permissions: PlanLimits = PLAN_PERMISSIONS[currentTier] || PLAN_PERMISSIONS.FREE;

  const NAV_ITEMS = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, isLocked: false },
    { name: 'Contract Vault', href: '/vault', icon: FolderLock, isLocked: !permissions.hasVault },
    { name: 'Statutory Drafter', href: '/drafter', icon: FileEdit, isLocked: !permissions.hasTemplateLibrary },
    { name: 'Obligations & Notices', href: '/obligations', icon: CalendarCheck, isLocked: !permissions.hasNoticeAlerts },
    { name: 'Risk Heatmap', href: '/risk', icon: ShieldAlert, isLocked: !permissions.hasRiskScoring },
    { name: 'Client Workspaces', href: '/reseller/clients', icon: Building2, isLocked: !permissions.hasClientVaultManager },
  ];

  const isPublicPage = 
    pathname === '/' || 
    pathname.startsWith('/auth') || 
    pathname.startsWith('/pricing') || 
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/billing') ||
    pathname.startsWith('/review/studio');

  if (isPublicPage) {
    return <>{children}</>;
  }

  const handleSignOut = async () => {
    if (signOut) {
      await signOut();
    } else {
      await supabase.auth.signOut();
    }
    window.location.href = '/';
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <aside 
        className={`fixed inset-y-0 left-0 z-40 flex flex-col justify-between border-r border-slate-800 bg-slate-950 p-3 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950">
                <Scale className="h-4 w-4" />
              </div>
              {!isCollapsed && (
                <div className="whitespace-nowrap transition-opacity duration-200">
                  <div className="text-xs font-bold text-white tracking-tight">
                    DocuChain <span className="text-emerald-400">NG</span>
                  </div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">
                    Legal AI Intelligence
                  </div>
                </div>
              )}
            </Link>

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
            </button>
          </div>

          <nav className="space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);

              if (item.isLocked) {
                return (
                  <div
                    key={item.name}
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium text-slate-600 bg-slate-950/50 cursor-not-allowed select-none"
                    title={isCollapsed ? `${item.name} (Upgrade Required)` : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 shrink-0 opacity-40" />
                      {!isCollapsed && <span className="whitespace-nowrap">{item.name}</span>}
                    </div>
                    {!isCollapsed && <Lock className="h-3 w-3 text-slate-700" />}
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-950'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                  }`}
                  title={isCollapsed ? item.name : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!isCollapsed && (
                    <span className="whitespace-nowrap transition-opacity duration-200">
                      {item.name}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-slate-800 pt-3 space-y-2">
          <Link
            href="/pricing"
            className="flex items-center gap-3 rounded-lg px-2.5 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-950/30 transition-colors"
          >
            <Sparkles className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span className="truncate font-semibold">Manage Plan / Upgrade</span>}
          </Link>

          {currentUser ? (
            <div className="space-y-1">
              {!isCollapsed && (
                <div className="px-2.5 py-1 text-[11px] text-slate-400 truncate flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                  <span className="truncate">{currentUser.email}</span>
                </div>
              )}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-400 hover:bg-rose-950/30 hover:text-rose-400 transition-colors"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                {!isCollapsed && <span>Sign Out</span>}
              </button>
            </div>
          ) : (
            <Link
              href="/auth"
              className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-400 hover:bg-slate-900 hover:text-white transition-colors"
            >
              <UserIcon className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>Sign In</span>}
            </Link>
          )}
        </div>
      </aside>

      <main 
        className={`flex-1 transition-all duration-300 ease-in-out min-w-0 ${
          isCollapsed ? 'pl-16' : 'pl-64'
        }`}
      >
        {children}
      </main>
    </div>
  );
}