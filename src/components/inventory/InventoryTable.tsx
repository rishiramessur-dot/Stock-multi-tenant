'use client';

import React, { useState } from 'react';
import { InventoryItem, UserRole } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Search, Filter, SlidersHorizontal, AlertCircle, ArrowUpDown } from 'lucide-react';
import { StockAdjustmentModal } from './StockAdjustmentModal';

interface InventoryTableProps {
  initialItems: InventoryItem[];
  userRole: UserRole;
  corporateId: string;
}

export function InventoryTable({
  initialItems,
  userRole,
  corporateId,
}: InventoryTableProps) {
  const [items, setItems] = useState<InventoryItem[]>(initialItems);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeItemForAdjust, setActiveItemForAdjust] = useState<InventoryItem | null>(null);

  const categories = ['ALL', ...Array.from(new Set(items.map((i) => i.category)))];

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat =
      selectedCategory === 'ALL' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const canAdjustStock =
    userRole === 'super_admin' ||
    userRole === 'app_admin' ||
    userRole === 'corporate_admin' ||
    userRole === 'corporate_supervisor';

  const handleStockAdjustSuccess = (updatedItem: InventoryItem) => {
    setItems((prev) =>
      prev.map((i) => (i.id === updatedItem.id ? updatedItem : i))
    );
  };

  return (
    <div className="space-y-4">
      {/* Search and Category Filter Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by SKU or item name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all shadow-2xs"
          />
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="h-3.5 w-3.5 text-slate-400 mr-1 hidden sm:block" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Card View (< md) */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-sm">
            No items matched your search criteria.
          </div>
        ) : (
          filteredItems.map((item) => {
            const isLowStock = item.quantity <= item.min_threshold;
            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {item.sku}
                    </span>
                    <h4 className="font-semibold text-slate-900 text-base mt-1.5">
                      {item.name}
                    </h4>
                    <span className="text-xs text-slate-500 font-medium">{item.category}</span>
                  </div>
                  <Badge variant={isLowStock ? 'danger' : 'success'} dot>
                    {isLowStock ? 'Low Stock' : 'Optimal'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div>
                    <p className="text-slate-400">Stock on Hand</p>
                    <p className="text-sm font-bold text-slate-900">
                      {item.quantity.toLocaleString()} units
                    </p>
                    <p className="text-[10px] text-slate-400">Threshold: {item.min_threshold}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Unit Price / Value</p>
                    <p className="text-sm font-bold text-slate-900">
                      {formatCurrency(item.unit_price)}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium">
                      Total: {formatCurrency(item.quantity * item.unit_price)}
                    </p>
                  </div>
                </div>

                {canAdjustStock && (
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-center"
                      onClick={() => setActiveItemForAdjust(item)}
                    >
                      <SlidersHorizontal className="h-3.5 w-3.5 mr-1" />
                      Adjust Stock
                    </Button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Responsive Table (>= md) */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">SKU & Item Details</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Stock Level</th>
                <th className="px-6 py-3.5">Unit Price</th>
                <th className="px-6 py-3.5">Total Valuation</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 text-sm">
                    No inventory records match your criteria.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isLowStock = item.quantity <= item.min_threshold;
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 text-sm">
                            {item.name}
                          </span>
                          <span className="font-mono text-xs text-indigo-600 font-medium mt-0.5">
                            {item.sku}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">
                            {item.quantity.toLocaleString()}
                          </span>
                          <Badge variant={isLowStock ? 'danger' : 'success'} dot>
                            {isLowStock ? 'Low Stock' : 'In Stock'}
                          </Badge>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          Min threshold: {item.min_threshold}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {formatCurrency(item.quantity * item.unit_price)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {canAdjustStock ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveItemForAdjust(item)}
                          >
                            <SlidersHorizontal className="h-3.5 w-3.5 mr-1" />
                            Adjust
                          </Button>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Read-only</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {activeItemForAdjust && (
        <StockAdjustmentModal
          item={activeItemForAdjust}
          isOpen={!!activeItemForAdjust}
          onClose={() => setActiveItemForAdjust(null)}
          onSuccess={handleStockAdjustSuccess}
        />
      )}
    </div>
  );
}
