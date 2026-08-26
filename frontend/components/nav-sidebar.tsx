'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  FolderArchive, 
  CalendarClock, 
  ShieldAlert, 
  LayoutDashboard, 
  LogOut, 
  Building2,
  Briefcase,
  Scale,
  Home,
  UserCheck,
  FileEdit
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavSidebarProps {
  children?: React.ReactNode;
}

export default function NavSidebar({ children }: NavSidebarProps) {
  const pathname = usePathname();
  const { user, profile, signOut } = useAuth();

  // Hide sidebar completely on authentication and onboarding routes
  if (pathname === '/auth' || pathname === '/onboarding') {
    return <>{children}</>;
  }

const navItems = [
  { label: 'Executive Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Contract Vault', href: '/vault', icon: FolderArchive },
  { label: 'Statutory Drafter', href: '/drafter', icon: FileEdit },
  { label: 'Obligations & Notices', href: '/obligations', icon: CalendarClock },
  { label: 'Risk Heatmap', href: '/risk', icon: ShieldAlert },
];

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'LANDLORD':
        return Building2;
      case 'TENANT':
        return Home;
      case 'SME_OPERATOR':
        return Briefcase;
      case 'LEGAL_COUNSEL':
        return Scale;
      default:
        return UserCheck;
    }
  };

  const RoleIcon = getRoleIcon(profile?.role);

  return (
    <div className="flex w-full min-h-screen">
      {/* Sticky Left Navigation Sidebar */}
      <aside className="w-64 bg-slate-900/95 border-r border-slate-800 flex flex-col justify-between h-screen sticky top-0 shrink-0 z-40">
        <div>
          {/* Brand Header */}
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
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
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-950 font-semibold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Session Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-emerald-400">
                  <RoleIcon className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-white truncate">
                    {profile?.full_name || user.email?.split('@')[0]}
                  </p>
                  <span className="text-[10px] text-emerald-400 font-medium block uppercase tracking-wider">
                    {profile?.role?.replace('_', ' ') || 'Verified User'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => signOut()}
                className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/auth"
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
            >
              Sign In / Register
            </Link>
          )}
        </div>
      </aside>

      {/* Main App Page Content */}
      <main className="flex-1 min-w-0 overflow-y-auto min-h-screen">
        {children}
      </main>
    </div>
  );
}