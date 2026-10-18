import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { UserRole } from '@/lib/types';
import { getTargetDashboardRoute } from '@/lib/utils';
import { MOCK_USERS } from './mock-data';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/auth');
  const isApiRoute = pathname.startsWith('/api');
  const isPublicStatic =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.');

  if (isPublicStatic) {
    return supabaseResponse;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isSupabaseConfigured =
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('placeholder-url') &&
    supabaseUrl.startsWith('http');

  let authenticatedUser: {
    id: string;
    email: string;
    role: UserRole;
    corporate_id: string | null;
  } | null = null;

  // 1. Try Supabase Auth if configured
  if (isSupabaseConfigured) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // OPTIMIZATION: Read claims directly from JWT app_metadata! Zero DB queries.
      const appMeta = (user.app_metadata || {}) as Record<string, unknown>;
      const rawRole = appMeta.user_role || appMeta.role;
      const rawCorpId = appMeta.corporate_id !== undefined ? appMeta.corporate_id : null;

      let role: UserRole = 'corporate_user';
      let corporateId: string | null = null;

      if (rawRole) {
        role = rawRole as UserRole;
        corporateId = (rawCorpId as string | null) ?? null;
      } else {
        // Fallback for legacy accounts before sync trigger was applied
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role, corporate_id')
          .eq('id', user.id)
          .single();

        role = (profile?.role || (user.user_metadata?.role as UserRole) || 'corporate_user') as UserRole;
        corporateId = profile?.corporate_id ?? (user.user_metadata?.corporate_id as string | null) ?? null;
      }

      authenticatedUser = {
        id: user.id,
        email: user.email || '',
        role,
        corporate_id: corporateId,
      };
    }
  }

  // 2. Check for local demo session cookie (enables zero-config live preview & testing)
  if (!authenticatedUser) {
    const demoCookie = request.cookies.get('stock_mgmt_session');
    if (demoCookie?.value) {
      try {
        const parsed = JSON.parse(decodeURIComponent(demoCookie.value));
        const found = MOCK_USERS.find((u) => u.email.toLowerCase() === parsed.email?.toLowerCase());
        if (found) {
          authenticatedUser = {
            id: found.id,
            email: found.email,
            role: found.role,
            corporate_id: found.corporate_id,
          };
        }
      } catch {
        // Invalid demo session cookie
      }
    }
  }

  // =========================================================================
  // RBAC Routing & Security Enforcement
  // =========================================================================

  // If user is unauthenticated and attempting to access a protected route
  if (!authenticatedUser) {
    if (!isAuthRoute && pathname !== '/unauthorized' && !isApiRoute) {
      const loginUrl = new URL('/login', request.url);
      if (pathname !== '/') {
        loginUrl.searchParams.set('redirect', pathname);
      }
      return NextResponse.redirect(loginUrl);
    }
    return supabaseResponse;
  }

  // User is authenticated:
  const userRole = authenticatedUser.role;
  const corporateId = authenticatedUser.corporate_id;
  const targetHome = getTargetDashboardRoute(userRole, corporateId);

  // If user visits /login or root /, automatically direct them to their designated workspace
  if (pathname === '/login' || pathname === '/') {
    return NextResponse.redirect(new URL(targetHome, request.url));
  }

  // Aggressive RBAC Checks:
  // 1. Super Admin Dashboard: Only super_admin allowed
  if (pathname.startsWith('/super-admin-dashboard')) {
    if (userRole !== 'super_admin') {
      // Redirect corporate users or app admins to their designated workspace
      return NextResponse.redirect(new URL(targetHome, request.url));
    }
  }

  // 2. App Admin Dashboard: Only app_admin or super_admin allowed
  if (pathname.startsWith('/app-admin-dashboard')) {
    if (userRole !== 'app_admin' && userRole !== 'super_admin') {
      return NextResponse.redirect(new URL(targetHome, request.url));
    }
  }

  // 3. Corporate Routes: /corporate/[corporate_id]/*
  if (pathname.startsWith('/corporate/')) {
    const segments = pathname.split('/').filter(Boolean);
    const targetCorpId = segments[1]; // /corporate/:corporate_id/...

    // Super admin and app admin can inspect any corporate tenant workspace
    if (userRole === 'super_admin' || userRole === 'app_admin') {
      return supabaseResponse;
    }

    // Corporate roles (corporate_admin, corporate_supervisor, corporate_user)
    // CANNOT access other corporates! Cross-tenant access is blocked aggressively.
    if (!corporateId || targetCorpId !== corporateId) {
      // Cross-tenant breach attempt: redirect to user's designated tenant dashboard
      const safeRedirect = corporateId
        ? `/corporate/${corporateId}/dashboard`
        : '/unauthorized';
      return NextResponse.redirect(new URL(safeRedirect, request.url));
    }
  }

  return supabaseResponse;
}
