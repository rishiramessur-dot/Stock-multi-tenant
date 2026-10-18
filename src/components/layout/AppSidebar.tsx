'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Boxes,
  Users,
  ShieldCheck,
  Building,
  ArrowRightLeft,
  Settings,
  Layers,
  Database,
  Lock,
} from 'lucide-react';
import { UserProfile } from '@/lib/types';
import { cn } from '@/lib/utils';

interface AppSidebarProps {
  user: UserProfile;
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const corpId = user.corporate_id;

  // Build role-specific navigation links
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
        label: 'Stock In / Out Logs',
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
    <aside className="hidden lg:flex w-64 flex-col border-r border-slate-200/90 bg-white">
      {/* Brand Logo & Title */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm ring-1 ring-slate-800">
          <Layers className="h-5 w-5 text-indigo-400" />
        </div>
        <div>
          <span className="text-base font-bold tracking-tight text-slate-900">
            PharmaHub
          </span>
          <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
            v2.0
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {user.role === 'super_admin'
            ? 'Root Administration'
            : user.role === 'app_admin'
            ? 'Platform Management'
            : 'Tenant Workspace'}
        </div>

        <nav className="space-y-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href.includes('#') && pathname === item.href.split('#')[0]);

            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 shrink-0',
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                  )}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Tenant Isolation Guarantee Badge */}
        <div className="mt-8 rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-slate-50 p-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-900">
            <Lock className="h-3.5 w-3.5 text-indigo-600" />
            <span>Tenant Isolation Active</span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-indigo-700/80">
            PostgreSQL RLS blocks any query matching rows outside corporate ID.
          </p>
        </div>
      </div>

      {/* Sidebar Footer User Info */}
      <div className="border-t border-slate-100 p-4">
        <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 font-semibold text-xs">
            {user.email.slice(0, 2).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-slate-900 truncate">{user.email}</p>
            <p className="text-[11px] text-slate-500 capitalize">{user.role.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
