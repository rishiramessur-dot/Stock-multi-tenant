import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MOCK_USERS } from '@/lib/supabase/mock-data';
import { getTargetDashboardRoute } from '@/lib/utils';
import { UserRole } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const isSupabaseConfigured =
      supabaseUrl &&
      !supabaseUrl.includes('placeholder-url') &&
      supabaseUrl.startsWith('http');

    // 1. Authenticate via Supabase Auth if connected
    if (isSupabaseConfigured) {
      try {
        const supabase = await createClient();
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 401 });
        }

        if (data.user) {
          const appMeta = (data.user.app_metadata || {}) as Record<string, unknown>;
          let role = (appMeta.user_role || appMeta.role) as UserRole | undefined;
          let corporateId = (appMeta.corporate_id !== undefined ? appMeta.corporate_id : null) as string | null;

          if (!role) {
            // Fallback for pre-sync accounts
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('role, corporate_id')
              .eq('id', data.user.id)
              .single();

            role = (profile?.role || data.user.user_metadata?.role || 'corporate_user') as UserRole;
            corporateId = profile?.corporate_id ?? (data.user.user_metadata?.corporate_id as string | null) ?? null;
          }

          const redirectUrl = getTargetDashboardRoute(role, corporateId);
          return NextResponse.json({
            success: true,
            user: {
              id: data.user.id,
              email: data.user.email,
              role,
              corporate_id: corporateId,
            },
            redirectUrl,
          });
        }
      } catch (err: unknown) {
        console.error('Supabase auth error:', err);
        // Fallback to local demo directory if network fails
      }
    }

    // 2. Demo & Provisioned Credentials Handler
    const matchedUser = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === cleanEmail
    );

    if (!matchedUser) {
      return NextResponse.json(
        {
          error:
            'Invalid credentials. For quick testing, click one of the pre-filled demo accounts below.',
        },
        { status: 401 }
      );
    }

    // Super Admin or Demo account authentication
    const redirectUrl = getTargetDashboardRoute(
      matchedUser.role,
      matchedUser.corporate_id
    );

    const response = NextResponse.json({
      success: true,
      user: {
        id: matchedUser.id,
        email: matchedUser.email,
        role: matchedUser.role,
        corporate_id: matchedUser.corporate_id,
        name: matchedUser.name,
      },
      redirectUrl,
    });

    // Set demo session cookie for Next.js Middleware and SSR
    const sessionData = encodeURIComponent(
      JSON.stringify({
        id: matchedUser.id,
        email: matchedUser.email,
        role: matchedUser.role,
        corporate_id: matchedUser.corporate_id,
      })
    );

    response.cookies.set('stock_mgmt_session', sessionData, {
      path: '/',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Authentication failed';
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}
