'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu,
  LogOut,
  Layers,
  ChevronDown,
  LayoutDashboard,
  Building,
  Users,
  Lock,
  Boxes,
  ArrowRightLeft,
  ShieldCheck,
  Database,
  Building2,
} from 'lucide-react';
import { Corporate, UserProfile } from '@/lib/types';
import { getRoleBadgeStyle, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

interface AppHeaderProps {
  user: UserProfile;
  activeCorporate?: Corporate | null;
  onOpenMobileMenu: () => void;
  onQuickSwitch?: (email: string) => void;
  switchingRole?: boolean;
}

export function AppHeader({
  user,
  activeCorporate,
  onOpenMobileMenu,
  onQuickSwitch,
  switchingRole,
}: AppHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const roleStyle = getRoleBadgeStyle(user.role);
  const corpId = user.corporate_id;

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

  // Horizontal Navigation Links based on role
  const getNavLinks = () => {
    if (user.role === 'super_admin') {
      return [
        {
          label: 'Platform Overview',
          href: '/super-admin-dashboard',
          icon: LayoutDashboard,
        },
        {
          label: 'Tenant Corporates',
          href: '/super-admin-dashboard#tenants',
          icon: Building,
        },
        {
          label: 'Global User Directory',
          href: '/super-admin-dashboard#users',
          icon: Users,
        },
        {
          label: 'RLS & Data Isolation',
          href: '/super-admin-dashboard#rls',
          icon: Lock,
        },
      ];
    }

    if (user.role === 'app_admin') {
      return [
        {
          label: 'Operations Center',
          href: '/app-admin-dashboard',
          icon: LayoutDashboard,
        },
        {
          label: 'Tenant Diagnostics',
          href: '/app-admin-dashboard#health',
          icon: Database,
        },
        {
          label: 'System Audit Logs',
          href: '/app-admin-dashboard#audits',
          icon: ShieldCheck,
        },
      ];
    }

    // Corporate roles
    return [
      {
        label: 'Tenant Dashboard',
        href: `/corporate/${corpId}/dashboard`,
        icon: LayoutDashboard,
      },
      {
        label: 'Inventory Catalog',
        href: `/corporate/${corpId}/inventory`,
        icon: Boxes,
      },
      {
        label: 'Stock Transactions',
        href: `/corporate/${corpId}/inventory#transactions`,
        icon: ArrowRightLeft,
      },
      {
        label: 'Tenant Members',
        href: `/corporate/${corpId}/team`,
        icon: Users,
      },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-md shadow-2xs">
      <div className="mx-auto flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* ========================================================= */}
        {/* 1. TOP LEFT: Logo + "PharmaHub" + "v2.0" Badge            */}
        {/* ========================================================= */}
        <div className="flex items-center gap-6">
          {/* Mobile hamburger toggle (visible on small screens) */}
          <button
            onClick={onOpenMobileMenu}
            className="inline-flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 lg:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Brand Logo & Name */}
          <Link
            href={
              user.role === 'super_admin'
                ? '/super-admin-dashboard'
                : user.role === 'app_admin'
                ? '/app-admin-dashboard'
                : `/corporate/${corpId}/dashboard`
            }
            className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs ring-1 ring-slate-800">
              <Layers className="h-5 w-5 text-indigo-400" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold tracking-tight text-slate-900">
                PharmaHub
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-200/70 px-1.5 py-0.5 rounded">
                v2.0
              </span>
            </div>
          </Link>

          {/* ========================================================= */}
          {/* 2. HORIZONTAL NAVIGATION LINKS (Immediately next to logo)  */}
          {/* ========================================================= */}
          <nav className="hidden lg:flex items-center gap-1 ml-2">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isHashLink = item.href.includes('#');
              const baseHref = item.href.split('#')[0];
              const isActive = isHashLink ? pathname === baseHref : pathname === item.href;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-150 whitespace-nowrap',
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-3.5 w-3.5 shrink-0',
                      isActive ? 'text-white' : 'text-slate-400'
                    )}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* ========================================================= */}
        {/* 3. FAR RIGHT: Active Session Information & Avatar Icon    */}
        {/* ========================================================= */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Active Session Text */}
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200/80 px-3 py-1.5 text-xs">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-500 hidden sm:inline">Active Session:</span>
              <span className="font-semibold text-slate-900 font-mono text-[11px] sm:text-xs truncate max-w-[140px] sm:max-w-[200px] md:max-w-none">
                {user.email}
              </span>
            </div>
            <span
              className={`hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${roleStyle.badgeClass}`}
            >
              {roleStyle.label}
            </span>
          </div>

          {/* User Profile Avatar Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-1.5 rounded-xl p-1 text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
              aria-label="User profile options"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white font-bold text-xs shadow-xs ring-1 ring-slate-800">
                {user.email.slice(0, 2).toUpperCase()}
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {showProfileMenu && (
              <div
                className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white py-2 shadow-xl ring-1 ring-black/5 z-50 animate-in fade-in zoom-in-95 duration-100"
                onMouseLeave={() => setShowProfileMenu(false)}
              >
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                    Signed in as
                  </p>
                  <p className="text-xs font-bold text-slate-900 truncate mt-0.5">
                    {user.email}
                  </p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <Badge variant="purple" className="text-[10px]">
                      {user.role}
                    </Badge>
                    {activeCorporate && (
                      <span className="text-[10px] text-slate-500 font-medium truncate">
                        • {activeCorporate.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Role Switcher shortcut inside menu */}
                {onQuickSwitch && (
                  <div className="p-2 border-b border-slate-100 bg-slate-50/60">
                    <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Switch Active Role
                    </p>
                    <div className="grid grid-cols-1 gap-1 text-[11px]">
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          onQuickSwitch('rishiatwork25@gmail.com');
                        }}
                        disabled={switchingRole || user.email === 'rishiatwork25@gmail.com'}
                        className="text-left px-2 py-1 rounded-md text-purple-700 hover:bg-purple-50 disabled:opacity-40 font-medium transition-colors"
                      >
                        • Super Admin (rishiatwork25@gmail.com)
                      </button>
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          onQuickSwitch('appadmin@stockmanagement.io');
                        }}
                        disabled={switchingRole || user.email === 'appadmin@stockmanagement.io'}
                        className="text-left px-2 py-1 rounded-md text-indigo-700 hover:bg-indigo-50 disabled:opacity-40 font-medium transition-colors"
                      >
                        • App Admin (appadmin@stockmanagement.io)
                      </button>
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          onQuickSwitch('apex.admin@apexlogistics.com');
                        }}
                        disabled={switchingRole || user.email === 'apex.admin@apexlogistics.com'}
                        className="text-left px-2 py-1 rounded-md text-blue-700 hover:bg-blue-50 disabled:opacity-40 font-medium transition-colors"
                      >
                        • Apex Admin (apex.admin@apexlogistics.com)
                      </button>
                    </div>
                  </div>
                )}

                <div className="py-1">
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex w-full items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    {isLoggingOut ? 'Signing out...' : 'Sign out'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
