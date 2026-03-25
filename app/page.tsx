import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="auth-home">
      <section className="auth-card">
        <p className="eyebrow">Kinetikos</p>
        <h1>Knowledge Copilot</h1>
        <p>Secure sign-in and tenant onboarding are required before accessing the RAG workspace.</p>

        <div className="auth-actions">
          <Link href="/login" className="auth-btn auth-btn-primary">
            Login
          </Link>
          <Link href="/onboarding" className="auth-btn auth-btn-ghost">
            Start Onboarding
          </Link>
          <Link href="/app" className="auth-btn auth-btn-secondary">
            Enter Chat Workspace
          </Link>
        </div>
      </section>
    </main>
  );
}
