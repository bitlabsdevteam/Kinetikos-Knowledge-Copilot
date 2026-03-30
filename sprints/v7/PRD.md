# PRD.md — Sprint v7 (Japanese-First RAG Reliability)

## 1) Sprint Goal
Ship a production-grade Japanese-first RAG experience with deterministic citation behavior, clear grounding transparency, and operator-ready diagnostics.

## 2) Why v7
v6 improved citation diagnostics and admin gating. v7 focuses on making Japanese user experience, retrieval quality, and citation trust fully release-ready.

## 3) Product Objectives
- Guarantee Japanese-localized UX and Japanese answer output consistency.
- Improve retrieval precision for Japanese PDF-heavy knowledge bases.
- Make citation appearance predictable and explainable.
- Reduce ambiguity in production incident diagnosis.

## 4) Scope (In)

### V7-R1 Japanese Localization End-to-End
- Japanese-first UI strings (labels/errors/status/citation messages).
- Japanese response enforcement policy in generation path.
- Language fallback rules to prevent mixed-language outputs.

### V7-R2 Japanese Retrieval Quality Hardening
- Japanese-aware ingestion/chunking strategy for PDFs.
- Hybrid retrieval + rerank tuning for Japanese terminology.
- Metadata filter support (`tenant_id`, `lang=ja`, `source_type`).

### V7-R3 Grounding & Citation Transparency
- Per-answer status: grounded / partial / ungrounded.
- Explicit reason hints (no retrieval hit / internal-only sources / provider warning).
- Deterministic rendering from verified retrieval metadata only.

### V7-R4 Tenant/Policy Observability
- Structured policy outcomes for tenant/user scope checks.
- Clear separation of policy errors vs provider/runtime/config failures.

### V7-R5 Release Readiness
- Expand E2E coverage for Japanese input flow + citation states + policy checks.
- Publish v7 walkthrough + troubleshooting checklist.

## 5) Out of Scope
- Major backend replatforming.
- New product vertical features unrelated to trust/reliability.

## 6) Users
- Japanese end users consuming Japanese knowledge content.
- Admin/operators monitoring retrieval/citation behavior.

## 7) Success Criteria
- Japanese output consistency in production flows.
- Reduced “no citation / unclear reason” user confusion.
- Stable tenant-aware policy outcomes.
- Passing v7 build + targeted E2E suite.

## 8) Risks
- Dify citation metadata variability by app mode/path.
- Retrieval threshold settings too strict for Japanese queries.
- Env parity drift between preview and production.

## 9) Risk Controls
- Contract tests for `metadata.retriever_resources` handling.
- Japanese retrieval eval set for threshold tuning.
- Deployment parity checklist for required envs/settings.

## 10) Deliverables
- `sprints/v7/PRD.md` (this doc)
- `sprints/v7/TASKS.md`
- `sprints/v7/WALKTHROUGH.md`
- v7 E2E tests for JP flow + citation visibility + policy behavior

## 11) Definition of Done
- v7 tasks completed with build + targeted tests passing.
- Japanese localization and answer-language controls validated.
- Operator runbook available and reproducible.
