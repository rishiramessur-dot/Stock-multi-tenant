'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from './AppHeader';
import { MobileNav } from './MobileNav';
import { Corporate, UserProfile } from '@/lib/types';

interface DashboardShellProps {
  user: UserProfile;
  activeCorporate?: Corporate | null;
  children: React.ReactNode;
}

export function DashboardShell({
  user,
  activeCorporate,
  children,
}: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);
  const router = useRouter();

  // Quick switch role utility for interactive evaluation
  const handleQuickSwitch = async (email: string) => {
    setSwitchingRole(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'Password123!' }),
      });
      const data = await res.json();
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    } catch (err) {
      console.error(err);
      setSwitchingRole(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-50">
      {/* 1. Horizontal Top Navigation Bar spanning screen width */}
      <AppHeader
        user={user}
        activeCorporate={activeCorporate}
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
        onQuickSwitch={handleQuickSwitch}
        switchingRole={switchingRole}
      />

      {/* 2. Collapsible Mobile/Tablet Drawer (for viewports < lg) */}
      <MobileNav
        user={user}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* 3. Quick Role Simulator Ribbon (Convenience testing tool) */}
      <div className="bg-slate-900 text-slate-200 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-white">Active Session:</span>
          <span className="text-slate-300 font-mono">{user.email}</span>
          <span className="bg-slate-800 text-indigo-300 px-2 py-0.5 rounded border border-slate-700 font-semibold uppercase text-[10px]">
            {user.role}
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <span className="text-slate-400 text-[11px] hidden md:inline">Quick Test Role:</span>
          <button
            onClick={() => handleQuickSwitch('rishiatwork25@gmail.com')}
            disabled={switchingRole || user.email === 'rishiatwork25@gmail.com'}
            className="px-2 py-1 bg-purple-900/60 hover:bg-purple-800 text-purple-200 rounded border border-purple-700/50 disabled:opacity-40 transition-colors cursor-pointer"
          >
            Super Admin
          </button>
          <button
            onClick={() => handleQuickSwitch('appadmin@stockmanagement.io')}
            disabled={switchingRole || user.email === 'appadmin@stockmanagement.io'}
            className="px-2 py-1 bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 rounded border border-indigo-700/50 disabled:opacity-40 transition-colors cursor-pointer"
          >
            App Admin
          </button>
          <button
            onClick={() => handleQuickSwitch('apex.admin@apexlogistics.com')}
            disabled={switchingRole || user.email === 'apex.admin@apexlogistics.com'}
            className="px-2 py-1 bg-blue-900/60 hover:bg-blue-800 text-blue-200 rounded border border-blue-700/50 disabled:opacity-40 transition-colors cursor-pointer"
          >
            Apex Admin (T1)
          </button>
          <button
            onClick={() => handleQuickSwitch('apex.supervisor@apexlogistics.com')}
            disabled={switchingRole || user.email === 'apex.supervisor@apexlogistics.com'}
            className="px-2 py-1 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 rounded border border-emerald-700/50 disabled:opacity-40 transition-colors cursor-pointer"
          >
            Supervisor (T1)
          </button>
          <button
            onClick={() => handleQuickSwitch('summit.admin@summitind.com')}
            disabled={switchingRole || user.email === 'summit.admin@summitind.com'}
            className="px-2 py-1 bg-amber-900/60 hover:bg-amber-800 text-amber-200 rounded border border-amber-700/50 disabled:opacity-40 transition-colors cursor-pointer"
          >
            Summit Admin (T2)
          </button>
        </div>
      </div>

      {/* 4. Main Workspace Area: Sits directly beneath horizontal top navigation */}
      <main className="flex-1 w-full p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
