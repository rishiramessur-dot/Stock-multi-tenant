'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2, Check, X } from 'lucide-react';
import { deleteTenant } from '@/app/super-admin-dashboard/actions';

interface DeleteTenantButtonProps {
  corporateId: string;
  corporateName: string;
}

export function DeleteTenantButton({ corporateId, corporateName }: DeleteTenantButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const executeDelete = async () => {
    setIsDeleting(true);
    setShowConfirm(false);
    try {
      const result = await deleteTenant(corporateId);
      if (result?.error) {
        alert(`Failed to delete tenant: ${result.error}`);
      } else {
        router.refresh();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      alert(`Error: ${message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleInitialClick = () => {
    try {
      if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
        const confirmed = window.confirm(
          `Are you sure you want to delete "${corporateName}" and all associated data? This action cannot be undone.`
        );
        if (confirmed) {
          executeDelete();
          return;
        }
      }
    } catch {
      // ignore
    }
    // If confirm was cancelled or auto-dismissed, provide inline confirmation fallback
    setShowConfirm(true);
  };

  if (showConfirm) {
    return (
      <div className="inline-flex items-center gap-1.5 bg-rose-50 border border-rose-300 rounded-lg px-2 py-1 shadow-xs animate-in fade-in duration-150">
        <span className="text-[11px] font-semibold text-rose-800">
          Delete?
        </span>
        <button
          type="button"
          onClick={executeDelete}
          disabled={isDeleting}
          className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded transition-colors cursor-pointer"
          title="Confirm permanent deletion"
        >
          {isDeleting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Check className="h-3 w-3" />
          )}
          <span>Confirm</span>
        </button>
        <button
          type="button"
          onClick={() => setShowConfirm(false)}
          disabled={isDeleting}
          className="p-1 text-slate-400 hover:text-slate-600 hover:bg-rose-100 rounded transition-colors cursor-pointer"
          title="Cancel"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleInitialClick}
      disabled={isDeleting}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 hover:text-rose-700 active:bg-rose-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
      title={`Delete ${corporateName}`}
      aria-label={`Delete tenant ${corporateName}`}
    >
      {isDeleting ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-600" />
          <span>Deleting...</span>
        </>
      ) : (
        <>
          <Trash2 className="h-3.5 w-3.5 text-rose-500" />
          <span>Delete</span>
        </>
      )}
    </button>
  );
}

export default DeleteTenantButton;
