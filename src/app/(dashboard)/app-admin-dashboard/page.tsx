import React from 'react';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
import { getCurrentUser } from '@/lib/auth';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Activity,
  Cpu,
  Server,
  Zap,
  CheckCircle2,
  Clock,
  HardDrive,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { MOCK_CORPORATES } from '@/lib/supabase/mock-data';

export default async function AppAdminDashboardPage() {
  const currentUser = await getCurrentUser();

  // Enforce App Admin restriction (app_admin or super_admin allowed)
  if (!currentUser || (currentUser.role !== 'app_admin' && currentUser.role !== 'super_admin')) {
    redirect(currentUser?.corporate_id ? `/corporate/${currentUser.corporate_id}/dashboard` : '/unauthorized');
  }

  return (
    <DashboardShell user={currentUser}>
      <div className="space-y-8 pb-12">
        {/* Page Header */}
        <div className="border-b border-slate-200/80 pb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
              <Server className="h-3.5 w-3.5 text-indigo-600" />
              Application Infrastructure & Operations
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            App Admin Operations Center
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time platform telemetry, database connection pool statistics, and tenant SLA health.
          </p>
        </div>

        {/* Telemetry Metrics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Supabase API Latency
                </p>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Zap className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  18ms
                </div>
                <p className="mt-1 text-xs text-emerald-600 font-medium">99.98% SLA target met</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Active DB Pool
                </p>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <HardDrive className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  14 / 60
                </div>
                <p className="mt-1 text-xs text-slate-500">Connections nominal</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  RLS Security Filter Hits
                </p>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <ShieldCheck className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  128.4k
                </div>
                <p className="mt-1 text-xs text-indigo-600 font-medium">100% tenant queries parsed</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  System Uptime
                </p>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                  <Clock className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  99.99%
                </div>
                <p className="mt-1 text-xs text-slate-500">Last 30 rolling days</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tenant SLA & Storage Diagnostics */}
        <div id="health">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Tenant Storage & Isolation Diagnostics</CardTitle>
                <CardDescription>
                  Tracking tenant storage quotas, query latency, and database integrity.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5">Corporate Tenant</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5">RLS Query Overhead</th>
                      <th className="px-6 py-3.5">Database Rows</th>
                      <th className="px-6 py-3.5">Storage Utilization</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {MOCK_CORPORATES.map((corp) => (
                      <tr key={corp.id} className="hover:bg-slate-50/60">
                        <td className="px-6 py-4">
                          <span className="font-semibold text-slate-900">{corp.name}</span>
                          <p className="font-mono text-xs text-slate-400 mt-0.5">{corp.id}</p>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="success" dot>
                            Healthy
                          </Badge>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-700">
                          &lt; 1.2ms
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-medium">
                          {(corp.item_count || 10) * 14} records
                        </td>
                        <td className="px-6 py-4">
                          <div className="w-36 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div className="bg-indigo-600 h-2 rounded-full w-1/4" />
                          </div>
                          <span className="text-[11px] text-slate-400 mt-1 block">4.2 MB / 10 GB</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security & Audit Events */}
        <div id="audits">
          <Card>
            <CardHeader>
              <CardTitle>Recent Application Audit Stream</CardTitle>
              <CardDescription>
                System logs capturing authentication attempts, session tokens, and route protection triggers.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 text-xs">
                <div className="p-4 flex items-center justify-between hover:bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <div>
                      <p className="font-semibold text-slate-900">
                        Super Admin Session Issued (rishiatwork25@gmail.com)
                      </p>
                      <p className="text-slate-500 font-mono">
                        Route granted: /super-admin-dashboard • Token signed via Supabase Auth
                      </p>
                    </div>
                  </div>
                  <span className="text-slate-400">Just now</span>
                </div>

                <div className="p-4 flex items-center justify-between hover:bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-4 w-4 text-indigo-500" />
                    <div>
                      <p className="font-semibold text-slate-900">
                        Cross-Tenant Boundary Check Executed
                      </p>
                      <p className="text-slate-500 font-mono">
                        Filter passed: public.get_auth_corporate_id() == target corporate_id
                      </p>
                    </div>
                  </div>
                  <span className="text-slate-400">4m ago</span>
                </div>

                <div className="p-4 flex items-center justify-between hover:bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <div>
                      <p className="font-semibold text-slate-900">
                        Database Trigger on_auth_user_created Verified
                      </p>
                      <p className="text-slate-500 font-mono">
                        PostgreSQL Trigger: auth.users -&gt; public.user_profiles synced
                      </p>
                    </div>
                  </div>
                  <span className="text-slate-400">12m ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
