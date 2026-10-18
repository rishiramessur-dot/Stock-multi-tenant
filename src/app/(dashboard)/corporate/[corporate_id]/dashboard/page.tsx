import React from 'react';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
import { getCurrentUser, getTenantInventory } from '@/lib/auth';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { QuickStats } from '@/components/inventory/QuickStats';
import { InventoryTable } from '@/components/inventory/InventoryTable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Building2,
  Lock,
  ArrowRightLeft,
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface PageProps {
  params: Promise<{
    corporate_id: string;
  }>;
}

export default async function CorporateDashboardPage({ params }: PageProps) {
  const { corporate_id } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/login');
  }

  // Cross-tenant boundary check:
  // Super admin and app admin can inspect, but corporate users CANNOT access other corporates!
  const isGlobalAdmin =
    currentUser.role === 'super_admin' || currentUser.role === 'app_admin';

  if (!isGlobalAdmin && currentUser.corporate_id !== corporate_id) {
    // Cross-tenant breach attempt: forcefully redirect back to their own workspace
    if (currentUser.corporate_id) {
      redirect(`/corporate/${currentUser.corporate_id}/dashboard`);
    } else {
      redirect('/unauthorized');
    }
  }

  // Retrieve isolated tenant inventory and recent transactions
  const { corporate, items, transactions } = await getTenantInventory(
    corporate_id,
    currentUser
  );

  const lowStockItems = items.filter((i) => i.quantity <= i.min_threshold);

  return (
    <DashboardShell user={currentUser} activeCorporate={corporate}>
      <div className="space-y-8 pb-12">
        {/* Tenant Header Banner */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200/80 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                <Building2 className="h-3.5 w-3.5 text-blue-600" />
                Active Tenant Workspace
              </span>
              <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                ID: {corporate.id}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {corporate.name}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Isolated inventory partition enforced at database layer via Supabase Row-Level Security.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl bg-slate-900 text-white px-3.5 py-2 text-xs font-medium shadow-xs">
              <Lock className="h-3.5 w-3.5 text-indigo-400" />
              <span>RLS Tenant Key:</span>
              <span className="font-mono text-indigo-300">
                {corporate.id.slice(0, 8)}...
              </span>
            </div>
          </div>
        </div>

        {/* Low Stock Warning Banner */}
        {lowStockItems.length > 0 && (
          <div className="rounded-xl border border-amber-300 bg-amber-50/70 p-4 shadow-2xs animate-in fade-in">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-bold text-amber-900">
                  Low Stock Alert ({lowStockItems.length} {lowStockItems.length === 1 ? 'item' : 'items'} requiring attention)
                </h4>
                <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                  The following items have dipped to or below their re-order threshold:
                  <strong className="ml-1 font-semibold">
                    {lowStockItems.map((i) => `${i.name} (${i.quantity} left)`).join(', ')}
                  </strong>
                  . Please create a Stock IN replenishment order.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats KPI Cards */}
        <QuickStats items={items} />

        {/* Inventory Catalog with Mobile-First Table and Stock Adjustment */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">
                Tenant Inventory Catalog
              </h2>
              <p className="text-xs text-slate-500">
                Live SKUs filtered strictly by your corporate tenant ID.
              </p>
            </div>
          </div>

          <InventoryTable
            initialItems={items}
            userRole={currentUser.role}
            corporateId={corporate_id}
          />
        </div>

        {/* Recent Stock Transactions Log */}
        <div>
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRightLeft className="h-4 w-4 text-slate-500" />
                  Recent Stock In / Out Activity Log
                </CardTitle>
                <CardDescription>
                  Immutable transaction trail of receipts, dispatches, and inventory cycle adjustments.
                </CardDescription>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Table: public.inventory_transactions
              </span>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {transactions.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No transaction events recorded yet for this tenant.
                  </div>
                ) : (
                  transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-lg mt-0.5 ${
                            tx.type === 'IN'
                              ? 'bg-emerald-50 text-emerald-600'
                              : tx.type === 'OUT'
                              ? 'bg-rose-50 text-rose-600'
                              : 'bg-indigo-50 text-indigo-600'
                          }`}
                        >
                          {tx.type === 'IN' ? (
                            <ArrowUpRight className="h-4 w-4" />
                          ) : tx.type === 'OUT' ? (
                            <ArrowDownRight className="h-4 w-4" />
                          ) : (
                            <ArrowRightLeft className="h-4 w-4" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-slate-900">
                              {tx.item_name || 'Inventory SKU'}
                            </span>
                            {tx.item_sku && (
                              <span className="text-[11px] font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded font-medium">
                                {tx.item_sku}
                              </span>
                            )}
                            <Badge
                              variant={
                                tx.type === 'IN'
                                  ? 'success'
                                  : tx.type === 'OUT'
                                  ? 'danger'
                                  : 'indigo'
                              }
                            >
                              {tx.type === 'IN'
                                ? `+${tx.quantity} Recv`
                                : tx.type === 'OUT'
                                ? `-${tx.quantity} Disp`
                                : `Adj: ${tx.quantity}`}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5">
                            {tx.notes || 'Routine stock operation'}
                          </p>
                        </div>
                      </div>

                      <div className="text-left sm:text-right shrink-0">
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{formatDate(tx.created_at)}</span>
                        </div>
                        {tx.performer_email && (
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                            by {tx.performer_email}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
