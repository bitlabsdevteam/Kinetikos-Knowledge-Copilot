# Sprint v1 — PRD: Session Memory + Login E2E + RAG Output Polish

## 1) Sprint Overview
This sprint delivers a working end-to-end authentication flow and stable session memory for the Dify-backed RAG chat. It also improves answer rendering so responses are cleaner, more readable, and trustworthy for daily use.

## 2) Goals
- Users can log in with Supabase Auth (Google) and access protected chat routes.
- Chat sessions retain memory correctly via Dify `conversation_id` for the same active session.
- Session reset/close behavior is explicit and reliable.
- RAG output rendering is cleaner (structured, readable, citation-safe).
- Core flow is testable end-to-end in Preview deployment.

## 3) User Stories
- As a developer, I want login and callback flow to work end-to-end, so that I can validate auth-gated RAG quickly.
- As a user, I want the chatbot to remember prior turns in my current session, so that follow-up questions are context-aware.
- As a user, I want clean and readable responses with clear citations, so that I can trust and consume answers quickly.

## 4) Technical Architecture
- **Frontend**: Next.js App Router (existing)
- **Backend/BFF**: Next.js route handlers (`/api/chat`, auth routes)
- **Auth**: Supabase Auth + Google OAuth
- **RAG**: Dify API (`/chat-messages`) via BFF only
- **Storage/Telemetry**: Supabase tables (existing + tenant-ready schema)

### Component Diagram (ASCII)

```text
[Browser UI]
   |  login / callback / chat
   v
[Next.js App + BFF]
   |-- Supabase Auth (session)
   |-- /api/chat (Dify-only)
   |-- session->conversation_id map
   v
[Dify API /chat-messages]
   |
   v
[Knowledge + memory context]

[Supabase]
   |- user/membership/session logs
   |- conversation history logs
```

### Data Flow
1. User logs in via Google -> Supabase session established.
2. User sends first chat message -> BFF calls Dify without `conversation_id`.
3. Dify returns `conversation_id` -> UI/BFF persists for active session.
4. Subsequent messages send same `conversation_id` -> Dify memory continuity.
5. On session close/reset, conversation id is cleared (and optionally deleted via Dify conversation API).

## 5) Out of Scope
- Full enterprise RBAC policy matrix beyond current member-level checks.
- Long-term cross-session personalization memory.
- Voice input/output implementation.
- Production SSO beyond Google OAuth.

## 6) Dependencies
- Dify app is published and API key is valid.
- Vercel env has DIFY and Supabase auth keys in active scope.
- Supabase Google provider and callback URLs are configured.
