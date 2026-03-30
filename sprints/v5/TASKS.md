# Sprint v5 — Tasks

## Status: In Progress

- [x] Task 1: Add history API endpoint to list user conversations (tenant/user scoped) (P0)
  - Acceptance: API returns conversation summaries sorted by latest activity for current user/tenant.
  - Files: `app/api/history/route.ts`, tenant/history helpers

- [x] Task 2: Build left-side History Window UI and connect to history API (P0)
  - Acceptance: User sees conversation list in left rail and can select an item.
  - Files: `components/chat-shell.tsx`, `app/globals.css`

- [x] Task 3: Load selected conversation into chat panel and restore memory context (P0)
  - Acceptance: Selecting history item hydrates messages and conversation context for continued chat.
  - Files: `components/chat-shell.tsx`, `app/api/chat/route.ts`

- [x] Task 4: Improve memory continuity logic for RAG session recall (P0)
  - Acceptance: Follow-up responses reflect prior turns consistently within active/reopened conversation.
  - Files: `app/api/chat/route.ts`, `lib/usage-log.ts`, memory helpers

- [x] Task 5: Japanese UX support pass (P1)
  - Acceptance: Japanese input/output UX is stable; copy and suggestions handle Japanese naturally.
  - Files: `components/chat-shell.tsx`, `lib/dify-client.ts`

- [x] Task 6: Add Citations ON/OFF display toggle (P1)
  - Acceptance: User can toggle citation cards visibility without disabling grounding backend behavior.
  - Files: `components/chat-shell.tsx`, `app/globals.css`

- [x] Task 6.1: Citation trust UX hardening (P1)
  - Acceptance: Preserve source titles/domains, one-click verified links only, and hide blocked/internal citations by default.
  - Files: `components/chat-shell.tsx`, `lib/dify-client.ts`, `lib/contracts.ts`

- [ ] Task 7: Redesign top menu banner using frontend-design quality standards (P1)
  - Acceptance: Banner is visually upgraded, responsive, and navigation clarity improves.
  - Files: `components/chat-shell.tsx`, `app/globals.css`

- [ ] Task 8: Add tests for history load, memory continuity, citation toggle, and Japanese input flow (P1)
  - Acceptance: E2E/Integration tests validate key v5 flows.
  - Files: `tests/e2e/v5-*.spec.ts`, `tests/screenshots/`

- [ ] Task 8.1: Stabilize history identity/session mapping (P0)
  - Acceptance: History consistently loads for anonymous and logged-in users across new sessions.
  - Files: `components/chat-shell.tsx`, `app/api/history/route.ts`, `app/api/history/[sessionId]/route.ts`

- [ ] Task 8.2: Enforce signed member token for tenant/member-aware policy (P0)
  - Acceptance: Server rejects user/tenant override when signed token is present; tenant scoping is token-driven.
  - Files: `app/api/chat/route.ts`, `app/api/history/route.ts`, `app/api/history/[sessionId]/route.ts`, `lib/member-token.ts`

- [ ] Task 9: Publish v5 walkthrough with demo steps and known gaps (P2)
  - Acceptance: `sprints/v5/WALKTHROUGH.md` created with reproducible run/test checklist.
  - Files: `sprints/v5/WALKTHROUGH.md`
