'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { 
  FolderArchive, 
  CalendarClock, 
  ShieldAlert, 
  LayoutDashboard, 
  LogOut, 
  Briefcase, 
  Scale, 
  FileEdit, 
  Users, 
  ChevronDown, 
  Layers 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

interface AppShellProps {
  children?: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role');
  const nameParam = searchParams.get('name');
  const { user, profile, signOut: authSignOut } = useAuth();

  const [practiceOpen, setPracticeOpen] = useState(true);
  const [displayName, setDisplayName] = useState<string>('Counsel');
  const [userRole, setUserRole] = useState<string>('ASSOCIATE');
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    async function resolveIdentity() {
      const { data: { session } } = await supabase.auth.getSession();
      const activeUser = session?.user || user;
      const email = activeUser?.email;

      if (email) {
        const { data: member } = await supabase
          .from('workspace_members')
          .select('full_name, role')
          .eq('email', email.toLowerCase().trim())
          .maybeSingle();

        if (member?.full_name) {
          setDisplayName(member.full_name);
        } else if (activeUser?.user_metadata?.full_name) {
          setDisplayName(activeUser.user_metadata.full_name);
        } else {
          setDisplayName(email);
        }

        if (roleParam) {
          setUserRole(roleParam.toUpperCase());
        } else if (member?.role) {
          setUserRole(member.role.toUpperCase());
        } else if (profile?.role) {
          setUserRole(profile.role.toUpperCase());
        }
      } else if (nameParam) {
        const cleanName = nameParam.replace("'s Private Vault", "").replace(" Private Vault", "").trim();
        setDisplayName(cleanName || "David");
        if (roleParam) setUserRole(roleParam.toUpperCase());
      }
    }

    resolveIdentity();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user?.email) {
        const { data: member } = await supabase
          .from('workspace_members')
          .select('full_name, role')
          .eq('email', session.user.email.toLowerCase().trim())
          .maybeSingle();

        setDisplayName(member?.full_name || session.user.user_metadata?.full_name || session.user.email);
        if (member?.role) setUserRole(member.role.toUpperCase());
      } else {
        setDisplayName('Counsel');
        setUserRole('ASSOCIATE');
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [user, profile, roleParam, nameParam, pathname]);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);

    try {
      await supabase.auth.signOut();
      if (authSignOut) {
        try { await authSignOut(); } catch (_) {}
      }
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
      window.location.href = '/auth';
    } catch (err) {
      console.error('Sign out error:', err);
      window.location.href = '/auth';
    } finally {
      setIsSigningOut(false);
    }
  };

  // HIDE SIDEBAR ON PUBLIC MARKETING LANDING (/) AND PUBLIC AUTH/INVITE PAGES
  if (
    pathname === '/' ||
    pathname === '/auth' || 
    pathname === '/onboarding' || 
    pathname === '/pricing' ||
    pathname?.startsWith('/invite')
  ) {
    return <>{children}</>;
  }

  const isPartner = userRole === 'PARTNER' || userRole === 'FIRM_ADMIN' || userRole === 'LEGAL_COUNSEL';

  // Navigation items for inside the authenticated app
  const generalNav = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Contract Vault', href: '/vault', icon: FolderArchive },
    { label: 'Statutory Drafter', href: '/drafter', icon: FileEdit },
    { label: 'Obligations & Notices', href: '/obligations', icon: CalendarClock },
    { label: 'Risk Heatmap', href: '/risk', icon: ShieldAlert },
  ];

  return (
    <div className="flex w-full min-h-screen bg-slate-950 text-slate-100">
      <aside className="w-64 bg-slate-900/95 border-r border-slate-800 flex flex-col justify-between h-screen sticky top-0 shrink-0 z-40">
        <div>
          {/* Brand Header */}
          <div className="p-5 border-b border-slate-800 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <Scale className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="font-bold tracking-tight text-white block text-base leading-none">
                DocuChain <span className="text-emerald-400">NG</span>
              </span>
              <span className="text-[10px] text-slate-400 tracking-wider uppercase mt-1 block font-medium">
                Legal AI Intelligence
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 mt-2">
            {generalNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                </Link>
              );
            })}

            {/* PRACTICE / RESELLER HUB SECTION */}
            <div className="pt-3 mt-3 border-t border-slate-800/70">
              <button
                type="button"
                onClick={() => setPracticeOpen(!practiceOpen)}
                className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Practice Hub</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${practiceOpen ? 'rotate-180' : ''}`} />
              </button>

              {practiceOpen && (
                <div className="space-y-1 mt-1 pl-2">
                  <Link
                    href="/reseller/clients"
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      pathname === '/reseller/clients'
                        ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Briefcase className="w-4 h-4 text-emerald-400" />
                      <span>Client Workspaces</span>
                    </div>
                  </Link>

                  {isPartner && (
                    <Link
                      href="/reseller/team"
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        pathname === '/reseller/team'
                          ? 'bg-purple-600 text-white shadow-sm font-semibold'
                          : 'text-slate-400 hover:text-purple-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Users className="w-4 h-4 text-purple-400" />
                        <span>Team &amp; Vaults</span>
                      </div>
                      <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[9px] px-1 py-0">
                        Admin
                      </Badge>
                    </Link>
                  )}
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-emerald-400">
                <Scale className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-white truncate">
                  {displayName}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                    {userRole}
                  </span>
                  {isPartner && (
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[8px] px-1 py-0">
                      Partner
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/40 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> 
              {isSigningOut ? 'Signing Out...' : 'Sign Out'}
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-y-auto min-h-screen">
        {children}
      </main>
    </div>
  );
}