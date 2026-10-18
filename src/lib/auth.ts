import { cookies } from 'next/headers';
import { createClient } from './supabase/server';
import { MOCK_CORPORATES, MOCK_INVENTORY_ITEMS, MOCK_TRANSACTIONS, MOCK_USERS } from './supabase/mock-data';
import { Corporate, InventoryItem, InventoryTransaction, UserProfile, UserRole } from './types';

export async function getCurrentUser(): Promise<UserProfile | null> {
  const cookieStore = await cookies();

  // 1. Check live Supabase connection if configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isSupabaseConfigured =
    supabaseUrl &&
    !supabaseUrl.includes('placeholder-url') &&
    supabaseUrl.startsWith('http');

  if (isSupabaseConfigured) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const appMeta = (user.app_metadata || {}) as Record<string, unknown>;
        const rawRole = appMeta.user_role || appMeta.role;
        const rawCorpId = appMeta.corporate_id !== undefined ? appMeta.corporate_id : null;

        if (rawRole) {
          const role = rawRole as UserRole;
          const corporateId = (rawCorpId as string | null) ?? null;

          let corporate = null;
          if (corporateId) {
            const { data: corp } = await supabase
              .from('corporates')
              .select('*')
              .eq('id', corporateId)
              .single();
            corporate = corp || null;
          }

          return {
            id: user.id,
            email: user.email || '',
            role,
            corporate_id: corporateId,
            created_at: user.created_at,
            updated_at: user.updated_at || user.created_at,
            corporate,
          };
        }

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*, corporate:corporates(*)')
          .eq('id', user.id)
          .single();

        if (profile) {
          return {
            id: profile.id,
            email: profile.email,
            role: profile.role as UserRole,
            corporate_id: profile.corporate_id,
            created_at: profile.created_at,
            updated_at: profile.updated_at,
            corporate: profile.corporate || null,
          };
        }

        return {
          id: user.id,
          email: user.email || '',
          role: (user.user_metadata?.role as UserRole) || 'corporate_user',
          corporate_id: (user.user_metadata?.corporate_id as string | null) || null,
          created_at: user.created_at,
          updated_at: user.updated_at || user.created_at,
        };
      }
    } catch {
      // Fall through to mock session if Supabase throws or fails network
    }
  }

  // 2. Check for demo session cookie
  const demoCookie = cookieStore.get('stock_mgmt_session');
  if (demoCookie?.value) {
    try {
      const parsed = JSON.parse(decodeURIComponent(demoCookie.value));
      const user = MOCK_USERS.find((u) => u.email.toLowerCase() === parsed.email?.toLowerCase());
      if (user) {
        const corp = user.corporate_id
          ? MOCK_CORPORATES.find((c) => c.id === user.corporate_id) || null
          : null;
        return {
          ...user,
          corporate: corp,
        };
      }
    } catch {
      // Invalid demo cookie
    }
  }

  return null;
}

/**
 * Fetches tenant-isolated inventory data. Enforces RLS boundaries in application code as well.
 */
export async function getTenantInventory(corporateId: string, currentUser: UserProfile) {
  // Enforce tenant boundary
  const isGlobalAdmin = currentUser.role === 'super_admin' || currentUser.role === 'app_admin';
  if (!isGlobalAdmin && currentUser.corporate_id !== corporateId) {
    throw new Error('403 Forbidden: Cross-tenant data isolation violation.');
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isSupabaseConfigured =
    supabaseUrl &&
    !supabaseUrl.includes('placeholder-url') &&
    supabaseUrl.startsWith('http');

  if (isSupabaseConfigured) {
    try {
      const supabase = await createClient();
      const { data: items } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('corporate_id', corporateId)
        .order('name', { ascending: true });

      const { data: transactions } = await supabase
        .from('inventory_transactions')
        .select('*, item:inventory_items(name, sku)')
        .eq('corporate_id', corporateId)
        .order('created_at', { ascending: false })
        .limit(10);

      const { data: corporate } = await supabase
        .from('corporates')
        .select('*')
        .eq('id', corporateId)
        .single();

      return {
        corporate: corporate as Corporate,
        items: (items || []) as InventoryItem[],
        transactions: (transactions || []).map((t) => ({
          ...t,
          item_name: t.item?.name,
          item_sku: t.item?.sku,
        })) as InventoryTransaction[],
      };
    } catch {
      // Fallback to mock store
    }
  }

  // Mock store query with strict filtering
  const corporate = MOCK_CORPORATES.find((c) => c.id === corporateId) || {
    id: corporateId,
    name: 'Authorized Tenant',
    created_at: new Date().toISOString(),
  };

  const items = MOCK_INVENTORY_ITEMS.filter((i) => i.corporate_id === corporateId);
  const transactions = MOCK_TRANSACTIONS.filter((t) => t.corporate_id === corporateId);

  return {
    corporate,
    items,
    transactions,
  };
}
