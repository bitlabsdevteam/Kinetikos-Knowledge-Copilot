# Sprint v2 — PRD: Account UX + Suggested Prompts + Theme Mode

## 1) Sprint Overview
Sprint v2 improves post-login usability and trust by adding clear account controls (logout visibility and working sign-out), improving answer follow-up utility with “Try to ask” suggested prompts, and adding user-selectable light/dark theme mode.

## 2) Goals
- Logged-in users always see a visible logout control.
- Logout works reliably and returns user to login state.
- Chat result area shows suggested follow-up prompts under “Try to ask”.
- Users can switch between light and dark theme and preference persists.
- Core behavior is validated via build + targeted tests.

## 3) User Stories
- As a logged-in user, I want a clear logout button so I can end my session securely.
- As a user, I want logout to actually invalidate my session so protected pages are no longer accessible.
- As a user, I want suggested next prompts so I can continue conversation faster.
- As a user, I want light/dark mode so I can use the app comfortably in different environments.

## 4) Technical Architecture
- Frontend: Next.js App Router + existing chat shell
- Auth: Supabase Auth session methods (`signOut`, session check)
- RAG response UI: existing `suggestedQuestions` rendering in chat message cards
- Theme: CSS variables + `data-theme` (or class) on document root + localStorage persistence

### Component Diagram (ASCII)
```text
[User]
  | login/logout/theme toggle/chat
  v
[Next.js UI]
  |- Top banner/account controls
  |- ChatShell message renderer
  |- Theme controller (persisted)
  v
[Supabase Auth]   [Dify Chat API]
```

### Data Flow
1. User logs in -> session present -> UI displays logout button.
2. User clicks logout -> `supabase.auth.signOut()` -> redirect/login state.
3. Chat response includes suggested questions -> UI renders under “Try to ask”.
4. User toggles theme -> root theme updated + saved in localStorage -> restored on reload.

## 5) Out of Scope
- Multi-device synchronized theme preferences (server-side profile sync).
- Advanced personalization ranking of suggestions.
- Full design system refactor.

## 6) Dependencies
- Supabase Auth configured and reachable.
- Existing chat response supports `suggestedQuestions` array.
- CSS token structure can support dual theme variables.
