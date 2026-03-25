import Link from 'next/link';

export default function OnboardingPage() {
  return (
    <main className="auth-home">
      <section className="auth-card">
        <p className="eyebrow">Tenant Setup</p>
        <h1>Onboarding</h1>
        <p>Create or join an organization tenant to enable member-level access and isolated RAG data.</p>

        <form className="onboarding-form">
          <label>
            Organization Name
            <input type="text" placeholder="Kinetikos Team" />
          </label>
          <label>
            Tenant Key
            <input type="text" placeholder="org_kinetikos" />
          </label>
          <label>
            Invite Code (optional)
            <input type="text" placeholder="INVITE-123" />
          </label>
          <button className="auth-btn auth-btn-primary" type="button">
            Create / Join Tenant
          </button>
        </form>

        <p className="auth-note">Next step: bind this form to Supabase Auth + tenant_memberships table via BFF.</p>
        <Link href="/app" className="auth-link">
          Continue to Chat Workspace
        </Link>
      </section>
    </main>
  );
}
