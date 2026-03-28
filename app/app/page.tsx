'use client';

import { useEffect, useMemo, useState } from 'react';

import { ChatShell } from '@/components/chat-shell';
import { createBrowserSupabaseClient } from '@/lib/supabase-client';

export default function WorkspacePage() {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error || !data.session) {
        setIsAuthed(false);
        setIsChecking(false);
        window.location.href = '/login';
        return;
      }

      setIsAuthed(true);
      setIsChecking(false);
    }

    checkSession();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  if (isChecking) {
    return <main style={{ padding: 24 }}>Checking authentication…</main>;
  }

  if (!isAuthed) {
    return <main style={{ padding: 24 }}>Redirecting to login…</main>;
  }

  return <ChatShell />;
}
