# Sprint v1 Walkthrough

## 1) Sprint Summary
Sprint v1 established working auth/session foundations and core Dify session-memory flow for the chat experience. It also improved output readability and added minimum E2E coverage for auth gating.

## 2) What Was Implemented (mapped to tasks)
- **Task 1**: Auth foundation scaffolding
  - Added Supabase client helper and callback route.
- **Task 2**: Google login + callback wiring
  - Login page now initiates OAuth and handles callback error states.
- **Task 3**: Protected `/app`
  - `/app` checks Supabase session and redirects unauthenticated users to `/login`.
- **Task 4**: Dify active-session memory continuity
  - Client persists and reuses `difyConversationId` across turns.
- **Task 5**: New Session UX
  - Added explicit “New Session” control that clears active context.
- **Task 6**: Dify cleanup endpoint
  - Added `/api/chat/end-session` and Dify delete conversation integration.
- **Task 7**: RAG output polish
  - Improved response formatting for paragraphs/bullets and clearer source section.
- **Task 8**: Debug visibility
  - UI now surfaces backend mode and actionable backend errors.
- **Task 9**: Minimal E2E tests
  - Playwright tests validate unauth redirect and login CTA visibility.

## 3) Architecture / Flow Notes
```text
User -> /login -> Supabase OAuth -> /auth/callback -> /app

/app ChatShell:
  message -> /api/chat -> Dify /chat-messages
  response <- answer + conversation_id
  conversation_id persisted in client state

New Session:
  ChatShell -> /api/chat/end-session -> Dify DELETE /conversations/:id
  local chat state reset
```

## 4) How to Run Locally
```bash
npm install
npm run dev
```
Open: `http://localhost:3000`

## 5) How to Test
### Build validation
```bash
npm run build
```

### E2E validation
```bash
npx playwright install chromium
npx playwright test tests/e2e/auth-chat.spec.ts
```

## 6) Demo Steps
1. Open `/login`.
2. Confirm “Continue with Google” is visible.
3. Visit `/app` without a session; verify redirect to `/login`.
4. After login, send first chat message.
5. Send second follow-up; verify contextual continuity (same conversation).
6. Click **New Session**.
7. Send a new message and verify fresh context behavior.
8. Toggle internet search and observe status + backend indicator.

## 7) Known Issues / Deferred Items
- `/app` auth gate currently uses client-side session check (not middleware/server-cookie hardened yet).
- OAuth callback/session persistence should be hardened with SSR cookie helpers for stronger protection.
- Task list includes no deep retrieval-quality eval metrics yet (nDCG/MRR/faithfulness).
- Internet-search path remains opt-in and should be regression-tested across more prompts.

## 8) Next Sprint Recommendations
1. Harden auth with server-side session enforcement and middleware.
2. Add tenant membership authorization before chat calls.
3. Add retrieval logging dashboards and answer-faithfulness evaluation set.
4. Expand E2E coverage for full login callback + chat memory continuity.
