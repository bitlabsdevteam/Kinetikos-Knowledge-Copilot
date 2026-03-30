# PRD.md — Sprint v6 (Kinetikos Knowledge Copilot)

## 1) Sprint Goal
Stabilize production reliability and make tenant-aware grounded chat verifiably correct in real deployment conditions.

## 2) Why v6
v5 completed core UX and policy hardening, but v6 is needed to close deployment/runtime gaps:
- eliminate remaining “no content”/backend warning confusion in production
- verify tenant/member policy behavior under real tokens
- strengthen observability + failure diagnostics
- ensure history/memory continuity works consistently across environments

## 3) Scope (In)

### V6-R1 Production Chat Reliability
- Ensure `/api/chat` always returns actionable response states.
- Standardize warning surfaces for Dify runtime/config errors.
- Prevent silent failure paths in UI.

### V6-R2 Tenant/Member Enforcement E2E
- Validate signed member token flow end-to-end.
- Guarantee tenant isolation in retrieval/history APIs.
- Enforce member-level permission + usage policy consistently.

### V6-R3 History + Memory Continuity Hardening
- Validate reopen flow across anonymous and authenticated users.
- Ensure `difyConversationId` continuity survives practical session patterns.

### V6-R4 Retrieval + Citation Trust Validation
- Ensure links are retrieval-backed only.
- Verify blocked/internal citation display policy by environment setting.
- Add acceptance checks for citation domain/title fidelity.

### V6-R5 Operational Observability
- Add structured backend status signals for support/debug.
- Improve error categorization (config, policy, provider runtime, network).
- Document troubleshooting path for production incidents.

## 4) Out of Scope
- New product vertical features outside reliability/quality
- Major architecture migration (e.g., full NestJS split)
- Non-essential UI redesign beyond reliability clarity

## 5) Users / Stakeholders
- End users: Japanese-speaking Kinetikos members
- Operators: David/product team
- Engineering: Kaito dev workflow + deployment operators

## 6) Success Criteria
- `/api/chat` production failure rate materially reduced; fallback paths clearly surfaced.
- Tenant override attempts blocked with deterministic policy outcomes.
- History reopen works reliably in live environment.
- Citation trust checks pass (no hallucinated links shown).
- Runbook exists for diagnosing live incidents quickly.

## 7) Risks
- Environment drift between preview/prod
- Dify model/workflow misconfiguration
- Token issuance/verification mismatch from host system
- Supabase connectivity or table naming drift

## 8) Risk Controls
- Explicit env parity checklist for both Vercel targets
- Token contract test vectors
- API-level integration tests for policy + history
- Structured warning payload contract + UI handling

## 9) Deliverables
- `sprints/v6/PRD.md` (this doc)
- `sprints/v6/TASKS.md`
- `sprints/v6/WALKTHROUGH.md`
- targeted tests for token enforcement/history/citation trust

## 10) Definition of Done
- v6 tasks complete with build + tests passing
- deployment verification performed on target environment
- known gaps documented with concrete follow-ups
