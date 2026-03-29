# Sprint v5 — PRD: History UI + Memory Quality + Japanese UX + Citation Toggle + Premium Top Banner

## 1) Sprint Overview
Sprint v5 closes v4 UX gaps by shipping a visible conversation history window, fixing memory continuity so RAG remembers prior turns reliably, improving Japanese language UX and response support, adding citations ON/OFF controls, and redesigning the top banner with higher visual quality.

## 2) Goals
- Deliver a usable left-side History Window for each user’s saved conversations.
- Improve memory continuity across ongoing sessions and reopened conversations.
- Ensure Japanese input/output UX is smooth and reliable.
- Add user-facing citation visibility toggle (ON/OFF) without compromising grounding pipeline.
- Ship a polished top menu banner redesign (frontend design quality uplift).

## 3) User Stories
- As a user, I want to see my past chats in a history panel and reopen them quickly.
- As a user, I want the assistant to remember conversation context naturally.
- As a Japanese user, I want accurate, smooth Japanese support in prompts and answers.
- As a user, I want to toggle citation display on/off depending on readability needs.
- As a user, I want a premium, clear top banner that improves navigation and trust.

## 4) Technical Architecture
- History UI: left rail list + conversation loader APIs
- Memory continuity: stable conversation/session identifiers + persisted history retrieval on load
- Japanese support: IME-safe composer + language-sensitive suggestions/copy + no broken formatting
- Citation toggle: frontend render switch (keep backend grounding intact)
- Banner redesign: modular header component + responsive layout polish

### Component Diagram (ASCII)
```text
[Top Banner v2 Design]
     |
[Chat Layout]
  |- Left: History Window (conversation list)
  |- Right: Chat + Citation Toggle + Composer
     |
[/api/chat + /api/history endpoints]
  |- tenant/user scoped history read/write
  |- memory continuity with conversation_id/session mapping
```

### Data Flow
1. User opens app -> history list fetched for tenant/user.
2. User selects previous conversation -> messages loaded and bound to active memory context.
3. New message sent -> memory context + history write updated.
4. Citation toggle changes display only (not retrieval logic).

## 5) Out of Scope
- Full multi-device real-time sync conflict resolution.
- Advanced conversation summarization/compression pipeline.
- Deep multilingual localization framework beyond Japanese-first scope.

## 6) Dependencies
- Existing history storage path in Supabase.
- Working tenant/user resolver in API.
- UI redesign execution may use frontend-design workflow for high-quality component implementation.
