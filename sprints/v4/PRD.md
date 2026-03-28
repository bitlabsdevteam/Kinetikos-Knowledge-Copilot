# Sprint v4 — PRD: Durable Conversation History + Japanese IME Safety + Citation Trust + Access Policy Hooks

## 1) Sprint Overview
Sprint v4 hardens chat reliability and governance for production use: durable user conversation history, explicit Supabase history table verification/creation, Japanese IME-safe input behavior, citation UX/grounding quality fixes, and backend-enforced usage/access policy hooks compatible with Craft CMS membership logic.

## 2) Goals
- Persist complete per-user conversation history in Supabase.
- Verify history table existence; auto-provision `History` table if missing.
- Ensure Japanese IME typing never submits prematurely during composition.
- Improve citation UX and prevent hallucinated/invented links.
- Add policy hook layer to tailor usage/access by member level and permissions from Craft-side signals.

## 3) User Stories
- As a user, I want my conversations saved so I can continue context over time.
- As a Japanese user, I want IME composition to be safe and not accidentally submit.
- As a user, I want citations with original source titles and direct one-click links.
- As a product owner, I want usage/access rules enforced by backend policy using member-level metadata.
- As an integrator, I want Craft CMS to pass trusted access metadata to the RAG backend.

## 4) Technical Architecture
- Persistence: Supabase `customer_conversation_history` and optional fallback `History` table.
- Chat API: enforce per-user + tenant history writes/reads through BFF.
- IME safety: composition-aware key handling (`event.nativeEvent.isComposing` + keyCode 229 guard).
- Citation pipeline: deterministic citation metadata from trusted retriever resources only.
- Access policy: request metadata contract from Craft CMS -> policy evaluator in BFF -> allow/limit/deny.

### Component Diagram (ASCII)
```text
[Craft CMS Container]
   |- signed/validated member metadata
   v
[Next.js BFF /api/chat]
   |- policy evaluator (member_level, quotas, permissions)
   |- tenant + user resolver
   |- conversation history writer
   |- citation normalizer (trusted-only links/titles)
   v
[Dify + Supabase]
```

### Data Flow
1. User request enters BFF with member/access context.
2. BFF validates policy and resolves tenant/user context.
3. Chat request executed; response citations normalized from trusted metadata.
4. User+assistant turn appended to history table.
5. UI renders IME-safe composer and clean citation cards/links.

## 5) Out of Scope
- Full Craft plugin development.
- Advanced OCR/OG image scraping for citations.
- Full BI analytics dashboards.

## 6) Dependencies
- Supabase service role and schema access.
- Dify retriever metadata availability.
- Craft CMS ability to pass signed/validated user access context.
