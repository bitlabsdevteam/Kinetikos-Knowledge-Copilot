import Link from 'next/link';

export default function LoginPage() {
  return (
    <main className="auth-home">
      <section className="auth-card">
        <p className="eyebrow">Authentication</p>
        <h1>Login</h1>
        <p>Use Supabase Auth for secure access. Google OAuth is the primary sign-in method.</p>

        <div className="auth-actions">
          <button className="auth-btn auth-btn-primary" type="button">
            Continue with Google
          </button>
          <button className="auth-btn auth-btn-ghost" type="button">
            Send Magic Link
          </button>
        </div>

        <p className="auth-note">Implementation wiring to Supabase Auth callbacks is next in backend/auth phase.</p>
        <Link href="/onboarding" className="auth-link">
          Next: Onboarding
        </Link>
      </section>
    </main>
  );
}
