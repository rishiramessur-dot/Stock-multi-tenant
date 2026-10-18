import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { UserRole } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function getRoleBadgeStyle(role: UserRole): { label: string; badgeClass: string; dotClass: string } {
  switch (role) {
    case 'super_admin':
      return {
        label: 'Super Admin',
        badgeClass: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
        dotClass: 'bg-purple-500',
      };
    case 'app_admin':
      return {
        label: 'App Admin',
        badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
        dotClass: 'bg-indigo-500',
      };
    case 'corporate_admin':
      return {
        label: 'Corporate Admin',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
        dotClass: 'bg-blue-500',
      };
    case 'corporate_supervisor':
      return {
        label: 'Supervisor',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
        dotClass: 'bg-emerald-500',
      };
    case 'corporate_user':
      return {
        label: 'Staff User',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
        dotClass: 'bg-slate-500',
      };
  }
}

export function getTargetDashboardRoute(role: UserRole, corporateId?: string | null): string {
  if (role === 'super_admin') {
    return '/super-admin-dashboard';
  }
  if (role === 'app_admin') {
    return '/app-admin-dashboard';
  }
  if (corporateId) {
    return `/corporate/${corporateId}/dashboard`;
  }
  return '/unauthorized';
}
