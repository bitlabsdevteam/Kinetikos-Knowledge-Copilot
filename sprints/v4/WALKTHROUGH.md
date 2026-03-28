# Sprint v4 Walkthrough

## 1) Sprint Summary
Sprint v4 implemented production hardening for memory persistence, Japanese IME input safety, citation trust/UX, and backend access policy controls. It also introduced a fallback Supabase `History` table path and Craft-style access context validation.

## 2) What Was Implemented (mapped to tasks)
- **Task 1**: Durable per-user conversation history metadata persisted per chat turn.
- **Task 2**: Added fallback `History` table migration + runtime candidate fallback writes.
- **Task 3**: IME-safe Enter handling (composition + keyCode guards).
- **Task 4**: Citation title fidelity from trusted retriever metadata.
- **Task 5**: Direct one-click citation links, non-link cards downgraded to non-clickable style.
- **Task 6**: Sanitized hallucinated markdown links in answer body.
- **Task 7**: Added backend access policy evaluator (member level/permissions/usage limits).
- **Task 8**: Added typed `accessContext` contract + strict validation path.
- **Task 9**: Added E2E/integration tests for IME safety, citation linking, and policy deny behavior.

## 3) Architecture / Flow Notes
```text
Client request
  -> /api/chat (BFF)
    -> validate accessContext (contract guard)
    -> evaluateAccessPolicy (allow/deny/limit)
    -> resolve tenant context
    -> call Dify
    -> sanitize answer links against trusted citation URLs
    -> write tenant-scoped conversation history metadata
```

## 4) How to Run Locally
```bash
npm install
npm run dev
```
Open: `http://localhost:3000`

## 5) How to Test
### Build
```bash
npm run build
```

### v4 policy + chat tests
```bash
npx playwright test tests/e2e/v4-chat-policy.spec.ts
```
Expected: `3 passed`

## 6) Demo Steps
1. Open `/app?dev_auth_bypass=1`.
2. Start typing with IME and press Enter during composition — message should **not** submit.
3. Finish composition and press Enter — message should submit.
4. Trigger response with citations and verify direct link behavior.
5. Confirm hallucinated markdown links are stripped unless URL matches trusted citation URLs.
6. Send request with denied access context and verify `policy_denied` response.

## 7) Known Issues / Residual Risks
- Citation direct URLs depend on retriever metadata quality (`source_url/url/link`). Missing URLs still show disabled cards.
- Craft CMS signature verification is contract-ready but cryptographic signature verification is not yet fully implemented.
- `History` fallback table requires migration application in target environments.

## 8) Next Sprint Recommendations
1. Add cryptographic verification for Craft-provided access context signatures.
2. Add tenant-level quota counters tied to durable usage telemetry.
3. Add richer citation UX with optional preview metadata retrieval (without broken placeholders).
4. Add policy analytics and alerting for deny spikes.
