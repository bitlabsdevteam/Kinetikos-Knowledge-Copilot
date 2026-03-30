'use client';

import { useEffect, useState } from 'react';

import { ChatShell } from '@/components/chat-shell';
import { createBrowserSupabaseClient } from '@/lib/supabase-client';

export default function WorkspacePage() {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      const params = new URLSearchParams(window.location.search);
      const bypass =
        process.env.NODE_ENV !== 'production' && (params.get('dev_auth_bypass') === '1' || params.get('dev_auth_bypass') === 'true');

      if (bypass) {
        setIsAuthed(true);
        setIsAdmin(true);
        setIsChecking(false);
        return;
      }

      const supabase = createBrowserSupabaseClient();
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error || !data.session) {
        setIsAuthed(false);
        setIsChecking(false);
        window.location.href = '/login';
        return;
      }

      const user = data.session.user;
      const role = (user.app_metadata?.role ?? user.user_metadata?.role ?? '').toString().toLowerCase();
      const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '')
        .split(',')
        .map((v) => v.trim().toLowerCase())
        .filter(Boolean);
      const isEmailAdmin = Boolean(user.email && adminEmails.includes(user.email.toLowerCase()));

      setIsAuthed(true);
      setIsAdmin(role === 'admin' || isEmailAdmin);
      setIsChecking(false);
    }

    void checkSession();

    return () => {
      mounted = false;
    };
  }, []);

  if (isChecking) {
    return <main style={{ padding: 24 }}>Checking authentication…</main>;
  }

  const handleLogout = async () => {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    setIsAuthed(false);
    window.location.href = '/login';
  };

  if (!isAuthed) {
    return <main style={{ padding: 24 }}>Redirecting to login…</main>;
  }

  return <ChatShell showLogout onLogout={handleLogout} isAdmin={isAdmin} />;
}
