# Sprint v4 — Tasks

## Status: In Progress

- [x] Task 1: Implement durable per-user conversation history writes for all chat turns (P0)
  - Acceptance: Every user/assistant turn is stored with user_id, tenant_id, session_id, timestamp.
  - Files: `app/api/chat/route.ts`, `lib/usage-log.ts`

- [x] Task 2: Verify Supabase history table existence and auto-create fallback `History` table if missing (P0)
  - Acceptance: Startup/runtime check confirms existing table; if absent, create `History` safely and use it.
  - Files: `lib/usage-log.ts`, optional migration/scripts

- [x] Task 3: Fix Japanese IME-safe submission behavior in composer (P0)
  - Acceptance: Enter key does not submit while composing Kanji; submit works normally after composition ends.
  - Files: `components/chat-shell.tsx`

- [x] Task 4: Normalize citation title/label rendering to preserve source fidelity (P1)
  - Acceptance: Citation titles match trusted source metadata and are not auto-translated/rewritten.
  - Files: `lib/dify-client.ts`, `components/chat-shell.tsx`

- [x] Task 5: Make citation links one-click direct and remove empty OG placeholder blocks (P1)
  - Acceptance: Citation card click goes directly to source URL; no dead OG-image placeholder regions.
  - Files: `components/chat-shell.tsx`, `app/globals.css`

- [ ] Task 6: Block hallucinated citation links in answer body and citation payload (P1)
  - Acceptance: Only trusted retriever URLs are rendered; fabricated links are filtered/omitted.
  - Files: `lib/dify-client.ts`, `app/api/chat/route.ts`

- [ ] Task 7: Add backend policy evaluator for member-level permissions/usage limits (P0)
  - Acceptance: Chat API can allow/deny/limit by member_level/permissions input; denial returns explicit error.
  - Files: `lib/access-policy.ts`, `app/api/chat/route.ts`

- [ ] Task 8: Add Craft CMS access-context contract and validation layer (P0)
  - Acceptance: API accepts validated access context from container and applies policy reliably.
  - Files: `lib/contracts.ts`, `app/api/chat/route.ts`, docs

- [ ] Task 9: Add E2E + integration tests for IME safety, citation rendering, and access policy gates (P1)
  - Acceptance: Tests cover IME enter behavior, citation click path, and policy deny/allow paths.
  - Files: `tests/e2e/v4-*.spec.ts`, `tests/screenshots/`

- [ ] Task 10: Publish v4 walkthrough with implementation proof and residual risks (P2)
  - Acceptance: `sprints/v4/WALKTHROUGH.md` includes commands, demo steps, and known limits.
  - Files: `sprints/v4/WALKTHROUGH.md`
