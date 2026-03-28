'use client';

import { useEffect } from 'react';

import { createBrowserSupabaseClient } from '@/lib/supabase-client';

export default function AuthCallbackPage() {
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    const completeOAuth = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');

        if (code) {
          await supabase.auth.exchangeCodeForSession(code);
        }

        const { data } = await supabase.auth.getSession();

        if (data.session) {
          window.location.replace('/app');
          return;
        }

        window.location.replace('/login?error=oauth_callback_failed');
      } catch {
        window.location.replace('/login?error=oauth_callback_failed');
      }
    };

    void completeOAuth();
  }, []);

  return (
    <main className="auth-home">
      <section className="auth-card">
        <p className="eyebrow">Authentication</p>
        <h1>Completing sign in…</h1>
        <p>Please wait while we complete your secure login.</p>
      </section>
    </main>
  );
}
