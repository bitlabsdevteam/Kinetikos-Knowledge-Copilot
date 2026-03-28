# Sprint v2 — Tasks

## Status: In Progress

- [x] Task 1: Add account action area with visible Logout button for authenticated user (P0)
  - Acceptance: `/app` shows a logout control when session exists.
  - Files: `app/app/page.tsx`, `components/chat-shell.tsx` (if shared header)

- [x] Task 2: Implement functional logout flow with Supabase signOut and redirect to login (P0)
  - Acceptance: Clicking logout signs out user and redirects to `/login`; returning `/app` unauthenticated redirects to `/login`.
  - Files: `app/app/page.tsx` and/or auth helper files

- [x] Task 3: Add “Try to ask” section under assistant response using suggested questions (P1)
  - Acceptance: When `suggestedQuestions` exist, UI displays heading `Try to ask` and clickable prompt chips.
  - Files: `components/chat-shell.tsx`

- [x] Task 4: Ensure fallback suggested prompts are generated when backend returns none (P1)
  - Acceptance: At least 2-3 safe prompts appear for eligible responses when no suggestions provided.
  - Files: `components/chat-shell.tsx` and/or `app/api/chat/route.ts`

- [ ] Task 5: Add Light/Dark theme toggle control in top UI (P1)
  - Acceptance: User can switch theme from UI; visual palette updates immediately.
  - Files: `components/chat-shell.tsx`, `app/globals.css`

- [ ] Task 6: Persist theme preference across reloads (P1)
  - Acceptance: Selected theme remains after refresh via localStorage restoration.
  - Files: `components/chat-shell.tsx`

- [ ] Task 7: Add tests for logout behavior and theme persistence (P2)
  - Acceptance: Test coverage validates logout redirect + theme restore basics.
  - Files: `tests/e2e/` and/or unit tests

- [ ] Task 8: Update v2 walkthrough with commands, demo steps, and known gaps (P2)
  - Acceptance: `sprints/v2/WALKTHROUGH.md` added with reproducible test flow.
  - Files: `sprints/v2/WALKTHROUGH.md`
