'use client';

import React, { useState } from 'react';
import { InventoryItem, TransactionType } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { X, ArrowDownRight, ArrowUpRight, SlidersHorizontal, Check } from 'lucide-react';

interface StockAdjustmentModalProps {
  item: InventoryItem;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedItem: InventoryItem, type: TransactionType, qty: number, notes: string) => void;
}

export function StockAdjustmentModal({
  item,
  isOpen,
  onClose,
  onSuccess,
}: StockAdjustmentModalProps) {
  const [adjustmentType, setAdjustmentType] = useState<TransactionType>('IN');
  const [quantity, setQuantity] = useState<number>(10);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) {
      setError('Quantity must be greater than zero.');
      return;
    }

    if (adjustmentType === 'OUT' && quantity > item.quantity) {
      setError(`Cannot dispatch ${quantity} units; only ${item.quantity} units are in stock.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Calculate new quantity
    let newQuantity = item.quantity;
    if (adjustmentType === 'IN') {
      newQuantity += quantity;
    } else if (adjustmentType === 'OUT') {
      newQuantity -= quantity;
    } else if (adjustmentType === 'ADJUSTMENT') {
      newQuantity = quantity;
    }

    const updatedItem: InventoryItem = {
      ...item,
      quantity: newQuantity,
      updated_at: new Date().toISOString(),
    };

    setTimeout(() => {
      setIsSubmitting(false);
      onSuccess(updatedItem, adjustmentType, quantity, notes);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 p-6 z-10 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Adjust Inventory Stock</h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              SKU: {item.sku} • {item.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Current Stock Banner */}
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3.5 border border-slate-200/60">
            <div>
              <p className="text-xs text-slate-500 font-medium">Current Stock On Hand</p>
              <p className="text-xl font-bold text-slate-900">{item.quantity} units</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Re-order Threshold</p>
              <p className="text-sm font-semibold text-slate-700">{item.min_threshold} units</p>
            </div>
          </div>

          {/* Action Type Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
              Transaction Action
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAdjustmentType('IN')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all ${
                  adjustmentType === 'IN'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-800 ring-1 ring-emerald-500'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ArrowUpRight className="h-4 w-4 text-emerald-600 mb-1" />
                Stock IN (Receive)
              </button>

              <button
                type="button"
                onClick={() => setAdjustmentType('OUT')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all ${
                  adjustmentType === 'OUT'
                    ? 'border-rose-600 bg-rose-50/70 text-rose-800 ring-1 ring-rose-500'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ArrowDownRight className="h-4 w-4 text-rose-600 mb-1" />
                Stock OUT (Dispatch)
              </button>

              <button
                type="button"
                onClick={() => setAdjustmentType('ADJUSTMENT')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all ${
                  adjustmentType === 'ADJUSTMENT'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-800 ring-1 ring-indigo-500'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <SlidersHorizontal className="h-4 w-4 text-indigo-600 mb-1" />
                Audit / Override
              </button>
            </div>
          </div>

          {/* Quantity Input */}
          <div>
            <Input
              type="number"
              label={
                adjustmentType === 'ADJUSTMENT'
                  ? 'Set New Exact Stock Quantity'
                  : 'Units to Process'
              }
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              min={1}
              required
            />
          </div>

          {/* Reason / Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Audit Notes & Reference
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. PO-84920 receipt, damaged packaging disposal, cycle count adjustment"
              rows={2}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 placeholder:text-slate-400"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200 font-medium">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Commit Adjustment
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
