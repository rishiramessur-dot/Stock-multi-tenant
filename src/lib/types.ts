export type UserRole =
  | 'super_admin'
  | 'app_admin'
  | 'corporate_admin'
  | 'corporate_supervisor'
  | 'corporate_user';

export interface Corporate {
  id: string;
  name: string;
  created_at: string;
  member_count?: number;
  item_count?: number;
}

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  corporate_id: string | null;
  created_at: string;
  updated_at: string;
  corporate?: Corporate | null;
}

export interface InventoryItem {
  id: string;
  corporate_id: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  unit_price: number;
  min_threshold: number;
  created_at: string;
  updated_at: string;
}

export type TransactionType = 'IN' | 'OUT' | 'ADJUSTMENT';

export interface InventoryTransaction {
  id: string;
  corporate_id: string;
  item_id: string;
  type: TransactionType;
  quantity: number;
  notes?: string | null;
  performed_by?: string | null;
  performer_email?: string | null;
  created_at: string;
  item_name?: string;
  item_sku?: string;
}

export interface DashboardStats {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  recentTransactionsCount: number;
}
