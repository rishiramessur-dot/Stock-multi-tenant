import React from 'react';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
import { getCurrentUser } from '@/lib/auth';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Users, Shield, UserPlus, Building2 } from 'lucide-react';
import { MOCK_CORPORATES, MOCK_USERS } from '@/lib/supabase/mock-data';
import { getRoleBadgeStyle } from '@/lib/utils';

interface PageProps {
  params: Promise<{
    corporate_id: string;
  }>;
}

export default async function CorporateTeamPage({ params }: PageProps) {
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

  const corporate = MOCK_CORPORATES.find((c) => c.id === corporate_id) || {
    id: corporate_id,
    name: 'Authorized Tenant',
    created_at: new Date().toISOString(),
  };

  // Strictly filter members for this corporate
  const teamMembers = MOCK_USERS.filter((u) => u.corporate_id === corporate_id);

  return (
    <DashboardShell user={currentUser} activeCorporate={corporate}>
      <div className="space-y-6 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                <Building2 className="h-3.5 w-3.5" />
                {corporate.name}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Tenant Team & Access Directory
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Authorized users with partitioned role permissions for this organizational unit.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Assigned Corporate Staff</CardTitle>
              <CardDescription>
                Filtered by corporate_id: {corporate.id}. Other tenant members are inaccessible.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Member Name</th>
                    <th className="px-6 py-3.5">Email Address</th>
                    <th className="px-6 py-3.5">Assigned Role Tier</th>
                    <th className="px-6 py-3.5">Permissions Scope</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teamMembers.map((member) => {
                    const style = getRoleBadgeStyle(member.role);
                    return (
                      <tr key={member.id} className="hover:bg-slate-50/60">
                        <td className="px-6 py-4 font-semibold text-slate-900">
                          {member.name}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-600">
                          {member.email}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style.badgeClass}`}
                          >
                            <Shield className="h-3 w-3" />
                            {style.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {member.role === 'corporate_admin'
                            ? 'Full Tenant Control & Member Admin'
                            : member.role === 'corporate_supervisor'
                            ? 'Stock In/Out & Catalog Adjustments'
                            : 'Standard Stock In/Out & Read Catalog'}
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
    </DashboardShell>
  );
}
