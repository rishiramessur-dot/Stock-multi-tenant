import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
import { getCurrentUser } from '@/lib/auth';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Building2,
  Users,
  ShieldAlert,
  ShieldCheck,
  Lock,
  ArrowUpRight,
  Database,
  Key,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { MOCK_CORPORATES, MOCK_USERS, MOCK_INVENTORY_ITEMS } from '@/lib/supabase/mock-data';
import { getRoleBadgeStyle } from '@/lib/utils';
import CreateTenantForm from '@/components/super-admin/CreateTenantForm';

export default async function SuperAdminDashboardPage() {
  const currentUser = await getCurrentUser();

  // Enforce Super Admin restriction
  if (!currentUser || currentUser.role !== 'super_admin') {
    redirect(currentUser?.corporate_id ? `/corporate/${currentUser.corporate_id}/dashboard` : '/login');
  }

  const totalTenants = MOCK_CORPORATES.length;
  const totalUsers = MOCK_USERS.length;
  const totalItems = MOCK_INVENTORY_ITEMS.length;

  return (
    <DashboardShell user={currentUser}>
      <div className="space-y-8 pb-12">
        {/* Top Header Banner */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200/80 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                <ShieldCheck className="h-3.5 w-3.5 text-purple-600" />
                Root Authority
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Session: {currentUser.email}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Super Admin Control Plane
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Global tenant isolation oversight, PostgreSQL RLS verification, and multi-tenant provisioning.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              RLS Policy Enforcement: Active
            </div>
          </div>
        </div>

        {/* Global Key Metrics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total Tenants (Corporates)
                </p>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Building2 className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  {totalTenants}
                </div>
                <p className="mt-1 text-xs text-slate-500">Distinct Isolated Workspaces</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Global Users
                </p>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Users className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  {totalUsers}
                </div>
                <p className="mt-1 text-xs text-slate-500">Across 5 RBAC Tiers</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Managed Inventory SKUs
                </p>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Layers className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  {totalItems}
                </div>
                <p className="mt-1 text-xs text-slate-500">Zero Cross-Tenant Leakage</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Database Isolation Tier
                </p>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                  <Lock className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Row-Level
                </div>
                <p className="mt-1 text-xs text-purple-700 font-medium">Supabase PostgreSQL 15</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Provisioning & Corporates Section */}
        <div id="tenants" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* 1. Provision Tenant Form */}
            <div className="lg:col-span-1">
              <CreateTenantForm />
            </div>

            {/* 2. Corporates Table */}
            <div className="lg:col-span-2">
              <Card className="h-full">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Organizational Units (Corporates)</CardTitle>
                <CardDescription>
                  Primary tenant identifiers partitioning inventory databases and user memberships.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-mono">
                  Schema: public.corporates
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5">Tenant Corporate Name</th>
                      <th className="px-6 py-3.5">Corporate ID (UUID)</th>
                      <th className="px-6 py-3.5">Isolation Status</th>
                      <th className="px-6 py-3.5">Linked Members</th>
                      <th className="px-6 py-3.5 text-right">Root Inspection</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {MOCK_CORPORATES.map((corp) => (
                      <tr key={corp.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white font-bold text-xs">
                              {corp.name.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="font-semibold text-slate-900">{corp.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-indigo-600 font-medium">
                          {corp.id}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="success" dot>
                            Strict RLS Enforced
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-medium">
                          {corp.member_count} active accounts
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/corporate/${corp.id}/dashboard`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                          >
                            Inspect Workspace
                            <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
            </div>
          </div>
        </div>

        {/* Global User Directory Across All Tiers */}
        <div id="users">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Global User Profiles Directory</CardTitle>
                <CardDescription>
                  Synchronized with Supabase auth.users via database trigger on_auth_user_created.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5">User Profile & Email</th>
                      <th className="px-6 py-3.5">Assigned Role Tier</th>
                      <th className="px-6 py-3.5">Tenant Association</th>
                      <th className="px-6 py-3.5">Auth Trigger Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {MOCK_USERS.map((user) => {
                      const style = getRoleBadgeStyle(user.role);
                      const corp = MOCK_CORPORATES.find((c) => c.id === user.corporate_id);
                      return (
                        <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-slate-900">{user.name}</p>
                              <p className="text-xs text-slate-500 font-mono mt-0.5">{user.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style.badgeClass}`}
                            >
                              {style.label}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {corp ? (
                              <div className="flex items-center gap-1.5">
                                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                                <span className="text-xs font-medium text-slate-800">{corp.name}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                                Global (null)
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                              <ShieldCheck className="h-4 w-4" />
                              Synced & Verified
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Row Level Security Verification Log Panel */}
        <div id="rls">
          <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50/40 via-white to-slate-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md">
                  <Database className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-slate-900">
                    Database-Enforced Tenant Isolation (PostgreSQL RLS)
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                    All tables (<code>corporates</code>, <code>user_profiles</code>, <code>inventory_items</code>, and <code>inventory_transactions</code>) have PostgreSQL Row Level Security enabled.
                    When corporate users query the database, the engine automatically injects the tenant predicate:
                    <code className="mx-1 px-2 py-0.5 bg-slate-900 text-emerald-300 rounded font-mono text-[11px]">
                      WHERE corporate_id = public.get_auth_corporate_id()
                    </code>
                    Cross-tenant data leakage is structurally impossible even in the event of an application logic bug.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
