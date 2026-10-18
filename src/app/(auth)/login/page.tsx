'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Layers,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');

  const [email, setEmail] = useState('rishiatwork25@gmail.com');
  const [password, setPassword] = useState('Password123!');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMessage(data.error || 'Failed to authenticate');
        setIsLoading(false);
        return;
      }

      // Route destination enforcement
      const destination = redirectParam || data.redirectUrl || '/';
      window.location.href = destination;
    } catch {
      setErrorMessage('Network connection error. Please try again.');
      setIsLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setErrorMessage(null);
  };

  return (
    <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200/80 sm:px-10">
      {/* Error Banner */}
      {errorMessage && (
        <div className="mb-5 flex items-start gap-3 rounded-xl bg-rose-50 p-3.5 border border-rose-200 text-rose-800 text-xs animate-in fade-in">
          <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <p className="font-semibold">Authentication Notice</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
          >
            Work Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
              placeholder="name@company.com"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
            >
              Password
            </label>
            <span className="text-xs text-indigo-600 hover:text-indigo-700 cursor-pointer">
              Default: Password123!
            </span>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
              placeholder="••••••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            isLoading={isLoading}
            className="w-full py-2.5 text-sm font-semibold shadow-md"
          >
            Sign in to Designated Workspace
            <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        </div>
      </form>

      {/* Quick Credential Switcher */}
      <div className="mt-8 pt-6 border-t border-slate-100">
        <div className="flex items-center gap-1.5 mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          <span>One-Click Role Selectors (Seed Data)</span>
        </div>

        <div className="space-y-2">
          {/* Provisioned Super Admin */}
          <button
            type="button"
            onClick={() => handleQuickFill('rishiatwork25@gmail.com')}
            className="w-full flex items-center justify-between p-2.5 rounded-xl border border-purple-200/80 bg-purple-50/50 hover:bg-purple-100/60 transition-all text-left text-xs cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-purple-600" />
              <div>
                <span className="font-semibold text-purple-950 block">
                  rishiatwork25@gmail.com
                </span>
                <span className="text-[11px] text-purple-700">
                  Super Admin (Global Root Access)
                </span>
              </div>
            </div>
            <Badge variant="purple">Routes to /super-admin-dashboard</Badge>
          </button>

          {/* App Admin */}
          <button
            type="button"
            onClick={() => handleQuickFill('appadmin@stockmanagement.io')}
            className="w-full flex items-center justify-between p-2.5 rounded-xl border border-indigo-200/80 bg-indigo-50/50 hover:bg-indigo-100/60 transition-all text-left text-xs cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-indigo-600" />
              <div>
                <span className="font-semibold text-indigo-950 block">
                  appadmin@stockmanagement.io
                </span>
                <span className="text-[11px] text-indigo-700">
                  App Admin (Platform Operations)
                </span>
              </div>
            </div>
            <Badge variant="indigo">Routes to /app-admin-dashboard</Badge>
          </button>

          {/* Apex Corporate Admin (Tenant 1) */}
          <button
            type="button"
            onClick={() => handleQuickFill('apex.admin@apexlogistics.com')}
            className="w-full flex items-center justify-between p-2.5 rounded-xl border border-blue-200/80 bg-blue-50/50 hover:bg-blue-100/60 transition-all text-left text-xs cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-600" />
              <div>
                <span className="font-semibold text-blue-950 block">
                  apex.admin@apexlogistics.com
                </span>
                <span className="text-[11px] text-blue-700">
                  Corporate Admin (Apex Logistics)
                </span>
              </div>
            </div>
            <Badge variant="default">Routes to Tenant 1</Badge>
          </button>

          {/* Summit Corporate Admin (Tenant 2) */}
          <button
            type="button"
            onClick={() => handleQuickFill('summit.admin@summitind.com')}
            className="w-full flex items-center justify-between p-2.5 rounded-xl border border-amber-200/80 bg-amber-50/50 hover:bg-amber-100/60 transition-all text-left text-xs cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-amber-600" />
              <div>
                <span className="font-semibold text-amber-950 block">
                  summit.admin@summitind.com
                </span>
                <span className="text-[11px] text-amber-700">
                  Corporate Admin (Summit Ind - Tenant 2)
                </span>
              </div>
            </div>
            <Badge variant="warning">Routes to Tenant 2</Badge>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center bg-gradient-to-b from-slate-100 via-slate-50 to-white px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-xl ring-4 ring-indigo-500/10">
            <Layers className="h-7 w-7 text-indigo-400" />
          </div>
        </div>

        <h1 className="mt-6 text-center text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          AeroStock Platform
        </h1>
        <p className="mt-2 text-center text-sm text-slate-500">
          Multi-Tenant Inventory Management with Supabase & Strict RLS
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Suspense fallback={<div className="p-8 text-center text-sm text-slate-400">Loading authentication screen...</div>}>
          <LoginForm />
        </Suspense>

        {/* Security & RLS Isolation Notice */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500 text-center">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Cross-tenant isolation enforced via Supabase PostgreSQL RLS</span>
        </div>
      </div>
    </div>
  );
}
