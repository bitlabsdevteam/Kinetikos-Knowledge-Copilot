# Sprint v7 — TASKS

## Status: In Progress

- [x] Task 1: Japanese localization baseline for chat UI (P0)
  - Acceptance: Core UI labels/messages support JA-first localization with EN fallback.
  - Files: `components/chat-shell.tsx`, `app/globals.css`

- [x] Task 2: Input language detection and Dify language steering (P0)
  - Acceptance: Frontend detects user input language and sends desired language to `/api/chat`; backend forwards to Dify `preferred_language`.
  - Files: `components/chat-shell.tsx`, `app/api/chat/route.ts`, `lib/contracts.ts`

- [x] Task 3: Japanese citation/grounding visibility copy improvements (P1)
  - Acceptance: No-citation and hidden-citation states are user-readable in Japanese.
  - Files: `components/chat-shell.tsx`, `app/globals.css`

- [x] Task 4: Playwright validation for language routing + JA UX (P1)
  - Acceptance: E2E test verifies JA input sends JA preference and renders JA-oriented flow.
  - Files: `tests/e2e/v7-language-localization.spec.ts`

- [x] Task 5: v7 walkthrough and verification checklist (P2)
  - Acceptance: `sprints/v7/WALKTHROUGH.md` documents reproducible test path.
  - Files: `sprints/v7/WALKTHROUGH.md`
