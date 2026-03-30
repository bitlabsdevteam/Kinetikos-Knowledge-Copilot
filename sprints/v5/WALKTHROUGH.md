# Sprint v5 Walkthrough

## Scope
This walkthrough validates v5 improvements for:
- history load/reopen
- memory continuity
- Japanese IME-safe send behavior
- citation visibility/trust UX
- tenant/member-aware request enforcement (signed token path)

## Prerequisites
- `.env` configured for app runtime
- `npm install`
- optional: Dify + Supabase credentials for full backend path

## Run
```bash
npm run dev
```
Open: `http://localhost:3000/app?dev_auth_bypass=1`

---

## Demo Steps

### 1) IME-safe Japanese input
1. Focus message textarea.
2. Start Japanese composition (IME).
3. Press Enter while composing.
4. Confirm message is **not** submitted.
5. Submit with **Ctrl/Cmd + Enter** after composition ends.

Expected:
- No accidental submit during composition.
- Explicit keyboard send gesture required.

### 2) History list + reopen
1. Ensure history records exist for the current user.
2. Confirm left history panel renders previous sessions.
3. Click a history item.

Expected:
- chat hydrates previous user/assistant turns.
- session context + dify conversation id restore for continuity.

### 3) Citation trust UX
1. Send a query that returns citations.
2. Verify citation cards show original title + domain.
3. Click a citable citation.

Expected:
- one-click direct source navigation.
- no model-invented link rendering.

### 4) Citation visibility controls
1. Toggle **Show citations** OFF.
2. Toggle **Show blocked/internal citations** ON.

Expected:
- OFF hides citation block entirely.
- blocked/internal sources remain hidden by default unless explicitly enabled.

### 5) Multi-tenant/member token enforcement
1. Send request with signed member token in Authorization header.
2. Attempt mismatched `userId` or `tenantId` override in body/query.

Expected:
- server rejects override attempts with 403.
- effective tenant/user follows token claims.

---

## Automated Checks
```bash
npm run build
npx playwright test tests/e2e/v4-chat-policy.spec.ts tests/e2e/v5-core-flows.spec.ts
```

## Known Gaps
- Full production validation depends on real Dify workflow/model config and Supabase tenant data.
- Signed token validation uses shared secret (`CRAFT_MEMBER_TOKEN_SECRET`) and expects HS256-style compact token (`header.payload.signature`).
