# Sprint v3 Walkthrough

## 1) Sprint Summary
Sprint v3 focused on UI alignment and tenant-isolation foundations. Header controls were aligned to top-right, legacy header labeling was removed, “Try to ask” visibility was made consistent, and tenant context resolution/enforcement was introduced to reduce cross-tenant leakage risk.

## 2) What Was Implemented (mapped to tasks)
- **Task 1**: Top-right account control alignment via header/nav styling.
- **Task 2**: Removed “Knowledge Copilot” label from page header.
- **Task 3**: Always render “Try to ask” for assistant messages with fallback prompts.
- **Task 4**: Added tenant resolver (`user -> tenant_id`) with first-time provisioning path.
- **Task 5**: Enforced authenticated tenant-scoped chat and tenant propagation in logs/inputs.
- **Task 6**: Blocked crafted tenant override attempts (`403` guard).
- **Task 7**: Added E2E checks for top-right controls and Try to ask visibility.
- **Task 8**: Added resolver integration tests and env-safe tenant resolver config.

## 3) Architecture / Flow Notes
```text
Client -> /api/chat
  -> requires userId (tenant-scoped auth gate)
  -> resolveTenantContext(externalUserId)
      -> app_users lookup/upsert
      -> tenant_memberships lookup
      -> tenants + membership provision if missing
  -> reject client tenant override mismatch (403)
  -> send tenant_id in Dify inputs and usage logging
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

### E2E/UI tests
```bash
npx playwright test tests/e2e/v3-ui-tenant-shell.spec.ts
```

### Tenant resolver integration tests
```bash
npx playwright test tests/e2e/v3-tenant-context.spec.ts
```

## 6) Demo Steps
1. Open app and verify login/logout controls appear in top-right header zone.
2. Confirm “Knowledge Copilot” text is removed from header.
3. Send a prompt and verify “Try to ask” appears under assistant response.
4. Validate fallback suggestions still show when backend returns none.
5. Attempt tenant override payload (dev tooling) and verify API returns `403`.
6. Confirm authenticated tenant-scoped chat returns/uses resolved tenant context.

## 7) Known Issues / Deferred Items
- Tenant context currently depends on `userId` passed to BFF from host context; direct server-session derivation remains a recommended hardening step.
- Multi-tenant quotas/feature flags are schema-ready but not fully enforced in runtime policy layer yet.
- Tenant provisioning display naming is minimal and may need product naming rules.

## 8) Next Sprint Recommendations
1. Bind tenant resolution to verified Supabase server session instead of client-provided user ID.
2. Enforce tenant-aware retrieval filters throughout all retrieval/data paths.
3. Add tenant-aware observability dashboards for usage/retrieval anomalies.
4. Add migration-safe backfill script for existing users into tenant memberships.
