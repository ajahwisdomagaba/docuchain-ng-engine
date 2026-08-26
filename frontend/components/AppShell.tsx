'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  FolderLock, 
  FileEdit, 
  CalendarCheck, 
  ShieldAlert, 
  Scale, 
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const NAV_ITEMS = [
  { name: 'Contract Vault', href: '/vault', icon: FolderLock },
  { name: 'Statutory Drafter', href: '/drafter', icon: FileEdit },
  { name: 'Obligations & Notices', href: '/obligations', icon: CalendarCheck },
  { name: 'Risk Heatmap', href: '/risk', icon: ShieldAlert },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Hide the shell completely on public/landing/auth pages
  const isPublicPage = pathname === '/' || pathname.startsWith('/auth') || pathname.startsWith('/onboarding');

  if (isPublicPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 flex flex-col justify-between border-r border-slate-800 bg-slate-950 p-3 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="space-y-6">
          {/* Header / Logo + Minimize Toggle Button */}
          <div className="flex items-center justify-between px-1">
            <Link href="/vault" className="flex items-center gap-3 overflow-hidden">
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

            {/* Toggle Minimize/Maximize Icon */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
            </button>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);

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

        {/* Bottom User Area */}
        <div className="border-t border-slate-800 pt-3">
          {user ? (
            <button
              onClick={() => signOut()}
              className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-slate-400 hover:bg-rose-950/30 hover:text-rose-400 transition-colors"
              title={isCollapsed ? 'Sign Out' : undefined}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>Sign Out</span>}
            </button>
          ) : (
            <Link
              href="/auth/login"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-slate-400 hover:bg-slate-900 hover:text-white transition-colors"
              title={isCollapsed ? 'Sign In' : undefined}
            >
              <div className="h-4 w-4 shrink-0 rounded-full bg-slate-800 border border-slate-700" />
              {!isCollapsed && <span>Sign In</span>}
            </Link>
          )}
        </div>
      </aside>

      {/* Main Content Area dynamically adjusts its margin */}
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