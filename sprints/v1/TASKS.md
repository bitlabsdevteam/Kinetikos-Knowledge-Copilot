# Sprint v1 — Tasks

## Status: In Progress

- [x] Task 1: Create auth foundation routes and shared Supabase client helpers (P0)
  - Acceptance: `app/login`, `app/auth/callback`, and shared auth helper compile cleanly.
  - Files: `app/login/page.tsx`, `app/auth/callback/route.ts`, `lib/supabase-client.ts`

- [x] Task 2: Wire Google login action and callback exchange (P0)
  - Acceptance: Clicking Google login redirects and returns to app callback without runtime errors.
  - Files: `app/login/page.tsx`, `app/auth/callback/route.ts`

- [x] Task 3: Protect chat workspace route by session check (P0)
  - Acceptance: Unauthenticated access to `/app` redirects to `/login`; authenticated user can access `/app`.
  - Files: `middleware.ts` or route guard file, `app/app/page.tsx`

- [x] Task 4: Persist and reuse Dify conversation_id per active session (P0)
  - Acceptance: Second message in same session includes prior context and no reset behavior.
  - Files: `components/chat-shell.tsx`, `app/api/chat/route.ts`

- [ ] Task 5: Add explicit “New Session” control to clear conversation state (P1)
  - Acceptance: Clicking control resets active conversation and starts fresh context.
  - Files: `components/chat-shell.tsx`

- [ ] Task 6: Add Dify conversation cleanup endpoint for session close/reset (P1)
  - Acceptance: Endpoint calls Dify delete conversation API successfully when id provided.
  - Files: `app/api/chat/end-session/route.ts`, optional helper in `lib/dify-client.ts`

- [ ] Task 7: Polish RAG output formatting (paragraphs, bullets, citation block) (P1)
  - Acceptance: Responses render structured text without clunky placeholders; citations remain deterministic.
  - Files: `components/chat-shell.tsx`, `lib/dify-client.ts`

- [ ] Task 8: Add API/backend debug visibility for env and backend mode (P1)
  - Acceptance: Response clearly shows backend mode and actionable error when env missing.
  - Files: `app/api/chat/route.ts`, `components/chat-shell.tsx`

- [ ] Task 9: Add minimal E2E checks for login redirect + chat submit path (P2)
  - Acceptance: Basic Playwright flow validates route guard and first chat call path.
  - Files: `tests/e2e/auth-chat.spec.ts`, `playwright.config.ts` (if needed)

- [ ] Task 10: Update sprint walkthrough with run/test and known gaps (P2)
  - Acceptance: `sprints/v1/WALKTHROUGH.md` created with reproducible steps and remaining risks.
  - Files: `sprints/v1/WALKTHROUGH.md`
