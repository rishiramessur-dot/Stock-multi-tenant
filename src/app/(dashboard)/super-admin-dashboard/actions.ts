'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import {
  MOCK_CORPORATES,
  MOCK_USERS,
  MOCK_INVENTORY_ITEMS,
  MOCK_TRANSACTIONS,
} from '@/lib/supabase/mock-data';

export async function createTenantAndAdmin(formData: FormData) {
  const companyName = (formData.get('companyName') as string)?.trim();
  const adminEmail = (formData.get('adminEmail') as string)?.trim().toLowerCase();

  if (!companyName || !adminEmail) {
    return { error: 'Company name and Admin email are required.' };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const isLiveSupabase =
    supabaseUrl &&
    serviceRoleKey &&
    !supabaseUrl.includes('placeholder-url') &&
    !serviceRoleKey.includes('placeholder') &&
    serviceRoleKey.length > 20;

  try {
    if (isLiveSupabase) {
      // Live Supabase Admin client with SERVICE_ROLE_KEY to bypass RLS and invite user
      const supabaseAdmin = createClient(supabaseUrl!, serviceRoleKey!, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });

      // Step 1: Create the new Corporate Tenant
      const { data: corporateData, error: corporateError } = await supabaseAdmin
        .from('corporates')
        .insert([{ name: companyName }])
        .select('id')
        .single();

      if (corporateError) {
        throw new Error(`Failed to create tenant: ${corporateError.message}`);
      }

      const newCorporateId = corporateData.id;

      // Step 2: Invite the Admin User via Supabase Auth Admin API
      const { data: inviteData, error: inviteError } =
        await supabaseAdmin.auth.admin.inviteUserByEmail(adminEmail, {
          data: {
            user_role: 'corporate_admin',
            corporate_id: newCorporateId,
          },
        });

      if (inviteError) {
        throw new Error(`Failed to invite user: ${inviteError.message}`);
      }

      const newUserId = inviteData.user.id;

      // Step 3: Link the new Auth User to the Corporate Tenant in profiles table
      const { error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .upsert(
          {
            id: newUserId,
            email: adminEmail,
            role: 'corporate_admin',
            corporate_id: newCorporateId,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );

      if (profileError) {
        throw new Error(`Failed to link profile: ${profileError.message}`);
      }
    } else {
      // Local / Offline Evaluation Mode: Add to in-memory corporate & user directory
      const newCorporateId = crypto.randomUUID();
      const newUserId = crypto.randomUUID();

      MOCK_CORPORATES.unshift({
        id: newCorporateId,
        name: companyName,
        created_at: new Date().toISOString(),
        member_count: 1,
        item_count: 0,
      });

      MOCK_USERS.unshift({
        id: newUserId,
        email: adminEmail,
        name: `${companyName} Administrator`,
        role: 'corporate_admin',
        corporate_id: newCorporateId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    // Refresh the dashboard data
    revalidatePath('/super-admin-dashboard');

    return {
      success: true,
      message: `Tenant "${companyName}" created and invite sent to ${adminEmail}`,
    };
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    console.error('Tenant Creation Error:', errMessage);
    return { error: errMessage };
  }
}

export async function deleteTenant(corporateId: string) {
  if (!corporateId) {
    return { error: 'Corporate ID is required for deletion.' };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const isLiveSupabase =
    supabaseUrl &&
    serviceRoleKey &&
    !supabaseUrl.includes('placeholder-url') &&
    !serviceRoleKey.includes('placeholder') &&
    serviceRoleKey.length > 20;

  try {
    if (isLiveSupabase) {
      // Supabase Admin client with SERVICE_ROLE_KEY to bypass RLS and perform administrative deletion
      const supabaseAdmin = createClient(supabaseUrl!, serviceRoleKey!, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });

      // 1. Find all users assigned to this corporate tenant
      const { data: tenantUsers, error: fetchUsersError } = await supabaseAdmin
        .from('user_profiles')
        .select('id, role')
        .eq('corporate_id', corporateId);

      if (fetchUsersError) {
        console.error('Error querying users for corporate deletion:', fetchUsersError);
      }

      // 2. Delete each non-super-admin user from auth.users
      // (PostgreSQL ON DELETE CASCADE on user_profiles will automatically clean up the profile record)
      if (tenantUsers && tenantUsers.length > 0) {
        for (const user of tenantUsers) {
          if (user.role !== 'super_admin' && user.role !== 'app_admin') {
            const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
            if (deleteUserError) {
              console.warn(`Warning deleting auth user ${user.id}:`, deleteUserError.message);
            }
          }
        }
      }

      // 3. Delete the corporate record from public.corporates
      // (PostgreSQL ON DELETE CASCADE automatically removes inventory_items and inventory_transactions)
      const { error: deleteCorpError } = await supabaseAdmin
        .from('corporates')
        .delete()
        .eq('id', corporateId);

      if (deleteCorpError) {
        throw new Error(`Failed to delete corporate tenant: ${deleteCorpError.message}`);
      }
    } else {
      // Local / Offline Evaluation Mode:
      // Remove corporate
      const corpIndex = MOCK_CORPORATES.findIndex((c) => c.id === corporateId);
      if (corpIndex !== -1) {
        MOCK_CORPORATES.splice(corpIndex, 1);
      }

      // Remove users linked to this tenant
      for (let i = MOCK_USERS.length - 1; i >= 0; i--) {
        if (MOCK_USERS[i].corporate_id === corporateId) {
          MOCK_USERS.splice(i, 1);
        }
      }

      // Remove inventory items linked to this tenant
      for (let i = MOCK_INVENTORY_ITEMS.length - 1; i >= 0; i--) {
        if (MOCK_INVENTORY_ITEMS[i].corporate_id === corporateId) {
          MOCK_INVENTORY_ITEMS.splice(i, 1);
        }
      }

      // Remove transactions linked to this tenant
      for (let i = MOCK_TRANSACTIONS.length - 1; i >= 0; i--) {
        if (MOCK_TRANSACTIONS[i].corporate_id === corporateId) {
          MOCK_TRANSACTIONS.splice(i, 1);
        }
      }
    }

    // Refresh the dashboard data
    revalidatePath('/super-admin-dashboard');

    return {
      success: true,
      message: 'Corporate tenant and all associated data deleted successfully.',
    };
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    console.error('Delete Tenant Error:', errMessage);
    return { error: errMessage };
  }
}

