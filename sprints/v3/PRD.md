# Sprint v3 — PRD: Header UX alignment + Tenant Isolation Foundation

## 1) Sprint Overview
Sprint v3 focuses on UI alignment and data isolation foundations. The sprint moves account controls to the top-right, removes unwanted header text, ensures “Try to ask” suggestions are visible and reliable, and starts implementing per-user tenant isolation so user data is not shared.

## 2) Goals
- Move Login/Logout controls to top-right in a consistent header layout.
- Remove “Knowledge Copilot” label from visible page header.
- Ensure “Try to ask” prompt suggestions are clearly visible after answers.
- Begin multi-tenant implementation where each user maps to their own tenant context.
- Enforce tenant-aware reads/writes for chat-related data path.

## 3) User Stories
- As a user, I want account controls in a predictable top-right location.
- As a user, I want clean UI without unnecessary branding text.
- As a user, I want visible suggested follow-up prompts so I can continue quickly.
- As a user, I want my data isolated from other users.
- As a developer, I want tenant context resolved from auth user identity.

## 4) Technical Architecture
- Frontend: Next.js header/nav + chat-shell visual updates
- Auth context: Supabase session user ID as tenant seed
- Tenant mapping: `app_users` + `tenants` + `tenant_memberships`
- Data access: tenant_id enforced at BFF boundary for chat logs/retrieval logs

### Component Diagram (ASCII)
```text
[UI Header]
  |- top-right Login/Logout
  |- no "Knowledge Copilot" label

[ChatShell]
  |- Try to ask prompt chips

[/api/chat BFF]
  |- resolve user -> tenant
  |- enforce tenant_id on writes/reads
  v
[Supabase multi-tenant tables + RLS]
```

### Data Flow
1. Authenticated user enters `/app`.
2. BFF resolves user identity to tenant context (create mapping if first login).
3. Chat requests and logging include tenant_id.
4. Retrieval/logging reads are scoped by tenant_id.

## 5) Out of Scope
- Full organization/workspace invitation flows.
- Cross-tenant admin dashboards.
- Complex billing/quotas UX.

## 6) Dependencies
- Existing multi-tenant migrations already applied.
- Supabase Auth stable user identifier available.
- Chat API path continues to run via BFF only.
