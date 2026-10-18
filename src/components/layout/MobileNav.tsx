'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  X,
  LayoutDashboard,
  Boxes,
  Users,
  ShieldCheck,
  Building,
  ArrowRightLeft,
  Layers,
  Lock,
} from 'lucide-react';
import { UserProfile } from '@/lib/types';
import { cn } from '@/lib/utils';

interface MobileNavProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ user, isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const corpId = user.corporate_id;

  if (!isOpen) return null;

  const getNavLinks = () => {
    if (user.role === 'super_admin') {
      return [
        { label: 'Platform Overview', href: '/super-admin-dashboard', icon: LayoutDashboard },
        { label: 'Tenant Corporates', href: '/super-admin-dashboard#tenants', icon: Building },
        { label: 'User Directory', href: '/super-admin-dashboard#users', icon: Users },
        { label: 'RLS & Data Isolation', href: '/super-admin-dashboard#rls', icon: Lock },
      ];
    }
    if (user.role === 'app_admin') {
      return [
        { label: 'Operations Center', href: '/app-admin-dashboard', icon: LayoutDashboard },
        { label: 'Tenant Diagnostics', href: '/app-admin-dashboard#health', icon: ShieldCheck },
        { label: 'Audit Logs', href: '/app-admin-dashboard#audits', icon: ShieldCheck },
      ];
    }
    return [
      { label: 'Tenant Dashboard', href: `/corporate/${corpId}/dashboard`, icon: LayoutDashboard },
      { label: 'Inventory Items', href: `/corporate/${corpId}/inventory`, icon: Boxes },
      { label: 'Stock Transactions', href: `/corporate/${corpId}/inventory#transactions`, icon: ArrowRightLeft },
      { label: 'Team Members', href: `/corporate/${corpId}/team`, icon: Users },
    ];
  };

  const links = getNavLinks();

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 left-0 flex w-full max-w-xs flex-col bg-white shadow-2xl animate-in slide-in-from-left duration-200">
        {/* Drawer Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white shadow-xs">
              <Layers className="h-4 w-4 text-indigo-400" />
            </div>
            <span className="text-base font-bold text-slate-900">AeroStock</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Navigation Menu
          </p>
          <nav className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-900">
              <Lock className="h-3.5 w-3.5 text-indigo-600" />
              <span>Strict RLS Active</span>
            </div>
            <p className="mt-1 text-[11px] text-indigo-700/80">
              Your session is locked to tenant context: {user.corporate?.name || 'Global'}
            </p>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="border-t border-slate-100 p-4">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-900 truncate">{user.email}</p>
            <p className="text-[11px] text-slate-500 capitalize">{user.role.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
