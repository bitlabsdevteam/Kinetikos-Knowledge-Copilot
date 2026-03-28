import { NextResponse } from 'next/server';

import { createServerSupabaseClient } from '@/lib/supabase-client';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  try {
    const supabase = createServerSupabaseClient();
    await supabase.auth.exchangeCodeForSession(code);
    return NextResponse.redirect(`${origin}/app`);
  } catch {
    return NextResponse.redirect(`${origin}/login?error=oauth_exchange_failed`);
  }
}
