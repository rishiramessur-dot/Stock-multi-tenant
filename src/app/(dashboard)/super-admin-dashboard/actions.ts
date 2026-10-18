'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { MOCK_CORPORATES, MOCK_USERS } from '@/lib/supabase/mock-data';

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
