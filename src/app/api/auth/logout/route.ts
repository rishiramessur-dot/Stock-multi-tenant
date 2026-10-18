import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  const response = NextResponse.json({ success: true, redirectUrl: '/login' });

  // 1. Clear Supabase auth cookies
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.includes('placeholder-url')) {
    try {
      const supabase = await createClient();
      await supabase.auth.signOut();
    } catch {
      // Ignore if Supabase client errors on signOut
    }
  }

  // 2. Clear application session cookie
  response.cookies.delete('stock_mgmt_session');

  return response;
}
