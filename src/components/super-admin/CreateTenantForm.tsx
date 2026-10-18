'use client';

import React, { useState, useRef } from 'react';
import { createTenantAndAdmin } from '@/app/super-admin-dashboard/actions';
import { useFormStatus } from 'react-dom';
import { Building2, Mail, UserPlus, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 px-4 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50 transition-all cursor-pointer"
    >
      <UserPlus className="h-4 w-4" />
      {pending ? 'Provisioning Tenant & Sending Invite...' : 'Create Tenant & Invite Admin'}
    </button>
  );
}

export default function CreateTenantForm() {
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const formRef = useRef<HTMLFormElement>(null);

  async function clientAction(formData: FormData) {
    setMessage(null);
    const result = await createTenantAndAdmin(formData);

    if (result.error) {
      setMessage({ type: 'error', text: result.error });
    } else if (result.success) {
      setMessage({ type: 'success', text: result.message || 'Tenant successfully provisioned!' });
      formRef.current?.reset();
    }
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/90 max-w-xl">
      <div className="flex items-center gap-2 mb-1">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          <Sparkles className="h-3 w-3" />
          Tenant Provisioning
        </span>
      </div>

      <h2 className="text-lg font-bold text-slate-900">Provision New Corporate Tenant</h2>
      <p className="text-xs text-slate-500 mb-5">
        Creates a distinct isolated organizational partition and invites its first Corporate Administrator.
      </p>

      <form ref={formRef} action={clientAction} className="space-y-4">
        <div>
          <label
            htmlFor="companyName"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
          >
            Corporate Company Name
          </label>
          <div className="relative">
            <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              id="companyName"
              name="companyName"
              required
              className="w-full pl-10 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
              placeholder="e.g. Global Logistics Ltd"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="adminEmail"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
          >
            Designated Corporate Admin Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="email"
              id="adminEmail"
              name="adminEmail"
              required
              className="w-full pl-10 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
              placeholder="admin@globallogistics.com"
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            An invite email with claims (`user_role: corporate_admin`, `corporate_id`) will be issued.
          </p>
        </div>

        {message && (
          <div
            className={`flex items-start gap-2.5 p-3.5 rounded-xl text-xs font-medium border animate-in fade-in ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold">
                {message.type === 'success' ? 'Provisioning Completed' : 'Action Failed'}
              </p>
              <p className="mt-0.5">{message.text}</p>
            </div>
          </div>
        )}

        <div className="pt-2">
          <SubmitButton />
        </div>
      </form>
    </div>
  );
}
