import React from 'react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
import { ShieldAlert, ArrowLeft, LogIn, Lock } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { getTargetDashboardRoute } from '@/lib/utils';

export default async function UnauthorizedPage() {
  const currentUser = await getCurrentUser();
  const designatedRoute = currentUser
    ? getTargetDashboardRoute(currentUser.role, currentUser.corporate_id)
    : '/login';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md text-center bg-white p-8 rounded-2xl border border-slate-200/90 shadow-xl space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 border border-rose-200 text-rose-600">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
            <Lock className="h-3 w-3" />
            401 / 403 Access Denied
          </span>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Unauthorized Access
          </h1>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">
            Your current authenticated role or organizational unit does not possess permissions to view this resource. Cross-tenant boundaries and role tier restrictions are strictly enforced.
          </p>
        </div>

        {currentUser && (
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-200/60 text-xs text-left">
            <p className="text-slate-400 font-medium">Current Authenticated Identity:</p>
            <p className="font-semibold text-slate-900 font-mono mt-0.5">{currentUser.email}</p>
            <p className="text-slate-500 capitalize mt-0.5">Role: {currentUser.role.replace('_', ' ')}</p>
            {currentUser.corporate_id && (
              <p className="text-slate-500 font-mono mt-0.5 truncate">Tenant: {currentUser.corporate_id}</p>
            )}
          </div>
        )}

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={designatedRoute}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-medium text-sm hover:bg-slate-800 transition-colors shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Designated Workspace
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors"
          >
            <LogIn className="h-4 w-4" />
            Switch Account
          </Link>
        </div>
      </div>
    </div>
  );
}
