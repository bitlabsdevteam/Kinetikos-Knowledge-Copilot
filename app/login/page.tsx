'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { createBrowserSupabaseClient } from '@/lib/supabase-client';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  useEffect(() => {
    const authError = new URLSearchParams(window.location.search).get('error');
    if (!authError) return;

    if (authError === 'oauth_exchange_failed') {
      setError('Google OAuth callback failed. Please retry login.');
      return;
    }

    if (authError === 'missing_code') {
      setError('Missing auth code from provider callback.');
      return;
    }

    setError(authError);
  }, []);

  const handleGoogle = async () => {
    setIsLoading(true);
    setError(null);

    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });

    if (authError) {
      setError(authError.message);
      setIsLoading(false);
    }
  };

  const handleMagicLink = async () => {
    const email = window.prompt('Enter your email for magic link login');
    if (!email) return;

    setIsLoading(true);
    setError(null);

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (otpError) {
      setError(otpError.message);
    } else {
      setError('Magic link sent. Check your inbox.');
    }

    setIsLoading(false);
  };

  return (
    <main className="auth-home">
      <section className="auth-card">
        <p className="eyebrow">Authentication</p>
        <h1>Login</h1>
        <p>Use Supabase Auth for secure access. Google OAuth is the primary sign-in method.</p>

        <div className="auth-actions">
          <button className="auth-btn auth-btn-primary" type="button" onClick={handleGoogle} disabled={isLoading}>
            {isLoading ? 'Redirecting…' : 'Continue with Google'}
          </button>
          <button className="auth-btn auth-btn-ghost" type="button" onClick={handleMagicLink} disabled={isLoading}>
            Send Magic Link
          </button>
        </div>

        {error ? <p className="auth-note">{error}</p> : null}
        <Link href="/onboarding" className="auth-link">
          Next: Onboarding
        </Link>
      </section>
    </main>
  );
}
