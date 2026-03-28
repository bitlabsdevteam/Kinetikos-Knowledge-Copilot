# Sprint v3 — Tasks

## Status: In Progress

- [x] Task 1: Move account controls to top-right and standardize header alignment (P0)
  - Acceptance: Login/Logout controls are consistently rendered at top-right in both guest and authenticated states.
  - Files: `components/chat-shell.tsx`, `app/globals.css`

- [ ] Task 2: Remove “Knowledge Copilot” label from page header (P0)
  - Acceptance: Header no longer displays “Knowledge Copilot” text while preserving layout quality.
  - Files: `components/chat-shell.tsx`

- [ ] Task 3: Ensure “Try to ask” section is always visible for assistant responses (P0)
  - Acceptance: Assistant messages show “Try to ask” chips from backend suggestions or fallback generation.
  - Files: `components/chat-shell.tsx`

- [ ] Task 4: Add tenant context resolver (user -> tenant_id) in server logic (P0)
  - Acceptance: Auth user deterministically resolves to one tenant_id; first-time users are provisioned safely.
  - Files: `lib/tenant-context.ts`, `app/api/chat/route.ts`

- [ ] Task 5: Enforce tenant_id propagation in chat usage logs and retrieval logs writes (P0)
  - Acceptance: New chat-related writes include tenant_id and reject missing tenant context.
  - Files: `lib/usage-log.ts`, `app/api/chat/route.ts`, related data helpers

- [ ] Task 6: Guard tenant-scoped reads/writes to prevent cross-tenant leakage (P0)
  - Acceptance: API path does not allow reading/writing another tenant’s data by crafted client input.
  - Files: `app/api/chat/route.ts`, tenant utility modules

- [ ] Task 7: Add E2E checks for header controls placement + Try to ask visibility (P1)
  - Acceptance: Playwright confirms top-right account controls and visible Try to ask chips after response.
  - Files: `tests/e2e/v3-ui-tenant-shell.spec.ts`, `tests/screenshots/`

- [ ] Task 8: Add integration test for tenant resolver and tenant_id enforcement (P1)
  - Acceptance: Tests verify tenant context creation/resolution and enforcement behavior.
  - Files: `tests/` (unit/integration), tenant helper files

- [ ] Task 9: Update v3 walkthrough with runbook, tenant model notes, and residual risks (P2)
  - Acceptance: `sprints/v3/WALKTHROUGH.md` documents implementation and validation steps.
  - Files: `sprints/v3/WALKTHROUGH.md`
