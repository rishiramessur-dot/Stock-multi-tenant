'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, LogOut, Building2, Bell, Shield, ChevronDown } from 'lucide-react';
import { Corporate, UserProfile } from '@/lib/types';
import { getRoleBadgeStyle } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

interface AppHeaderProps {
  user: UserProfile;
  activeCorporate?: Corporate | null;
  onOpenMobileMenu: () => void;
}

export function AppHeader({ user, activeCorporate, onOpenMobileMenu }: AppHeaderProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const roleStyle = getRoleBadgeStyle(user.role);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      {/* Left: Mobile Menu Toggle & Tenant Identifier */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="inline-flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Tenant Indicator */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white shadow-xs">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-slate-900">
                {activeCorporate?.name || user.corporate?.name || (user.role === 'super_admin' ? 'Global Platform' : 'Central Operations')}
              </span>
              <span className="hidden sm:inline-block text-xs text-slate-400 font-mono">
                {activeCorporate?.id ? `[${activeCorporate.id.slice(0, 8)}...]` : user.corporate_id ? `[${user.corporate_id.slice(0, 8)}...]` : '[ROOT]'}
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              {activeCorporate || user.corporate_id ? 'Isolated Tenant Environment' : 'Tenant Management Engine'}
            </p>
          </div>
        </div>
      </div>

      {/* Right: Role Indicator, Notifications, User Menu */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Tier/Role Badge */}
        <div className="hidden sm:flex items-center">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${roleStyle.badgeClass}`}
          >
            <Shield className="h-3 w-3" />
            {roleStyle.label}
          </span>
        </div>

        {/* Notification Bell */}
        <button
          className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          title="System notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
        </button>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 rounded-lg p-1.5 text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-700 font-medium text-xs">
              {user.email.slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden text-left md:block">
              <div className="text-xs font-semibold text-slate-900 max-w-[140px] truncate">
                {user.email}
              </div>
              <div className="text-[11px] text-slate-500 capitalize">
                {user.role.replace('_', ' ')}
              </div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {showProfileMenu && (
            <div
              className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-lg ring-1 ring-black/5 z-50 animate-in fade-in zoom-in-95 duration-100"
              onMouseLeave={() => setShowProfileMenu(false)}
            >
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs text-slate-500">Signed in as</p>
                <p className="text-xs font-semibold text-slate-900 truncate">{user.email}</p>
                <div className="mt-1">
                  <Badge variant="purple" className="text-[10px]">
                    {user.role}
                  </Badge>
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex w-full items-center gap-2 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  {isLoggingOut ? 'Signing out...' : 'Sign out'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
