import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Boxes, DollarSign, AlertTriangle, Activity } from 'lucide-react';
import { InventoryItem } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface QuickStatsProps {
  items: InventoryItem[];
}

export function QuickStats({ items }: QuickStatsProps) {
  const totalItems = items.length;
  const totalValuation = items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );
  const lowStockItems = items.filter(
    (item) => item.quantity <= item.min_threshold
  ).length;
  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);

  const stats = [
    {
      title: 'Total Catalog SKUs',
      value: totalItems.toString(),
      subtext: `${totalUnits.toLocaleString()} units stored`,
      icon: Boxes,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
    },
    {
      title: 'Gross Inventory Value',
      value: formatCurrency(totalValuation),
      subtext: 'Current book valuation',
      icon: DollarSign,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
    },
    {
      title: 'Low Stock Alerts',
      value: lowStockItems.toString(),
      subtext: lowStockItems > 0 ? 'Requires re-ordering' : 'Optimal inventory levels',
      icon: AlertTriangle,
      iconColor: lowStockItems > 0 ? 'text-amber-600' : 'text-slate-400',
      iconBg: lowStockItems > 0 ? 'bg-amber-50' : 'bg-slate-100',
      highlight: lowStockItems > 0,
    },
    {
      title: 'Tenant Velocity',
      value: '99.4%',
      subtext: 'Pick accuracy rate',
      icon: Activity,
      iconColor: 'text-indigo-600',
      iconBg: 'bg-indigo-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.title}
            className={stat.highlight ? 'border-amber-300 ring-1 ring-amber-200' : ''}
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {stat.title}
                </p>
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.iconBg}`}>
                  <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  {stat.value}
                </div>
                <p className="mt-1 text-xs text-slate-500">{stat.subtext}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
