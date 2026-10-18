import React from 'react';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
import { getCurrentUser, getTenantInventory } from '@/lib/auth';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { InventoryTable } from '@/components/inventory/InventoryTable';
import { QuickStats } from '@/components/inventory/QuickStats';
import { Boxes } from 'lucide-react';

interface PageProps {
  params: Promise<{
    corporate_id: string;
  }>;
}

export default async function CorporateInventoryPage({ params }: PageProps) {
  const { corporate_id } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/login');
  }

  const isGlobalAdmin =
    currentUser.role === 'super_admin' || currentUser.role === 'app_admin';

  if (!isGlobalAdmin && currentUser.corporate_id !== corporate_id) {
    redirect(currentUser.corporate_id ? `/corporate/${currentUser.corporate_id}/dashboard` : '/unauthorized');
  }

  const { corporate, items } = await getTenantInventory(corporate_id, currentUser);

  return (
    <DashboardShell user={currentUser} activeCorporate={corporate}>
      <div className="space-y-6 pb-12">
        <div className="border-b border-slate-200/80 pb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <Boxes className="h-3.5 w-3.5" />
              {corporate.name}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Inventory & Stock Catalog
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your tenant&apos;s product catalog, monitor re-order thresholds, and execute adjustments.
          </p>
        </div>

        <QuickStats items={items} />

        <InventoryTable
          initialItems={items}
          userRole={currentUser.role}
          corporateId={corporate_id}
        />
      </div>
    </DashboardShell>
  );
}
