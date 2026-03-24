# PRD.md - Kinetikos Knowledge Copilot

## 1. Product Name
**Kinetikos Knowledge Copilot**

## 2. Product Vision
Build a Japanese-first AI knowledge copilot that can synthesize answers across a large Kinetikos content base and deliver a premium, branded, trustworthy chat + voice experience for users.

## 3. Product Objective
The product should:
- answer user questions using only approved Kinetikos knowledge sources
- synthesize across multiple pieces of content instead of relying on a single article
- speak in a supportive, professional founder-aligned Japanese tone
- provide a premium UI suitable for embedded product use
- support conversational continuity and future commercialization

## 4. Business Goal
Launch a commercially credible AI product that:
- improves member access to Kinetikos knowledge
- increases value of premium content experience
- creates a scalable foundation for future product expansion
- preserves user trust through grounded answers and traceable citations

## 5. Product Phases

### Phase 1 — Proof of Concept
Goal:
- prove the AI can retrieve and synthesize across a large knowledge base
- prove the assistant can answer in the founder’s intended style without hallucinating unsupported claims
- prove the assistant can return voice responses in founder/wife-aligned voice style

Focus areas:
- knowledge ingestion
- retrieval quality
- synthesis quality
- grounding behavior
- voice/style alignment

### Phase 2 — MVP
Goal:
- deliver a launchable, branded, Japanese-friendly premium chat interface with memory and usage tracking

Focus areas:
- Next.js embedded UI
- IME-safe Japanese chat UX
- branded citations
- conversational memory
- user-linked usage logging
- voice input/output layer on top of existing agentic RAG
- future portability

## 6. Primary Users
### Primary users
- Kinetikos members consuming educational and guidance content
- Japanese-speaking users expecting a high-quality branded chat experience

### Business-side stakeholders
- Kinetikos founder / operators
- product and content owners maintaining the knowledge base

## 7. Core User Problem
Users have access to a large body of Kinetikos content, but the content is spread across multiple formats and long documents. Finding the right answer quickly is difficult, especially when the best response depends on synthesizing information across multiple knowledge sources.

## 8. Product Thesis
The MVP should not be a generic chatbot.
It should be a grounded knowledge copilot that:
- retrieves from trusted Kinetikos materials
- synthesizes across relevant sources
- answers in high-quality Japanese
- cites the source of its answers
- admits uncertainty when the answer is not supported by the knowledge base

## 9. Knowledge Sources in Scope
The system must support ingestion and use of:
- base membership articles (Word files, around 3,000 Japanese characters each)
- base membership short video transcripts (SRT)
- video product long video transcripts (various text/doc formats, non-SRT)
- course manuals (40–60 page PDFs)

## 10. Core Product Requirements

### R1. Knowledge ingestion
The system must ingest, clean, and process multiple content types through the RAG layer.

### R2. Retrieval quality
The system must support **hybrid search** so Japanese technical/medical terminology is retrieved accurately.

### R3. Answer synthesis
The system must merge information from multiple retrieved chunks into a single cohesive answer when needed.

### R4. Grounded answering
The system must follow a strict grounded-answer policy:
- if the answer is not supported by the provided context, the AI must say it does not know
- it must not hallucinate from general world knowledge when evidence is missing

### R5. Founder-style tone
The system must use reference materials as a style guide so the response tone feels supportive, professional, and aligned with the founder voice.

### R6. Japanese-first chat UI
The MVP must provide a clean, branded, Japanese-friendly chat experience built in Next.js.

### R7. IME-safe input behavior
The chat input must correctly handle Japanese IME composition.
The Enter key must not submit the message while composition is active.

### R8. Branded citations
The UI must display clean, clickable citations linked to the original content source.

### R9. Conversational memory
The assistant must retain useful context across roughly 5–10 turns so users can ask follow-up questions naturally.

### R10. Usage logging
The system must link chat usage to a user identifier from day one so query history can be tracked per user.

### R11. Future portability
The system should be built in a way that can be moved to owned infrastructure later if needed.

### R12. Voice agent enhancement (additive, no regression)
Voice must be added as an input/output layer without removing current text agentic RAG features.

### R13. Voice input
The UI must support microphone capture and speech-to-text transcription. Transcribed text must be passed into the same existing chat request path.

### R14. Voice output
Assistant answer text must be converted to speech by TTS using a configurable voice profile aligned with founder/wife tone.

### R15. Voice grounding parity
Voice output must never bypass grounding. If the text response abstains ("I don't know"), voice must read the same abstention response exactly.

### R16. Voice usage logging
Voice conversations must be logged to Supabase with user_id/session_id, keeping the same observability standards as text chat.

## 11. User Journey
1. user opens the Kinetikos page
2. embedded chat loads inside the branded interface
3. host page provides user identity context
4. user asks a question in Japanese
5. system retrieves relevant knowledge from the knowledge base
6. system synthesizes across multiple relevant sources
7. assistant answers in grounded founder-style Japanese
8. citations are shown clearly in the UI
9. user asks follow-up questions within the same session
10. system preserves short-term context and logs usage per user

## 12. MVP Scope
### In scope
- headless architecture: Dify as orchestration engine, custom Next.js as product UI
- Dify-based knowledge ingestion and retrieval
- hybrid search
- multi-source synthesis
- strict grounded answering
- founder-style response guidance
- Next.js embedded chat app (no dependency on Dify widget UX)
- IME-safe Japanese input handling
- clickable branded citations using canonical source metadata only
- conversational memory
- user-linked usage logging
- Craft CMS user identity handoff and entitlement-aware usage control
- tenant-tagged knowledge and retrieval filtering foundations

### Out of scope for MVP
- broad autonomous agent behavior beyond grounded RAG scope
- generic non-grounded chat features
- replacing Craft CMS
- large multi-product admin platform
- full enterprise multi-tenant admin console

## 13. Success Criteria
### Product success
- users can get useful grounded answers from the knowledge base
- answer quality feels premium and coherent in Japanese
- citations help users trust and verify responses
- follow-up conversations feel natural

### Business success
- the product is strong enough to launch as a premium AI feature
- usage can be tracked per user
- the architecture can support later scaling and migration

## 14. Key Risks
- weak retrieval on Japanese domain terminology
- hallucinated answers when context is missing
- poor synthesis across multiple sources
- broken Japanese IME UX
- low trust if citations are unclear
- over-scoping the MVP into a broad platform too early

## 15. Risk Controls
- use hybrid retrieval
- enforce strict grounded-answer rules
- keep citation metadata throughout the pipeline
- test IME behavior explicitly
- keep the MVP narrow and premium rather than broad and generic

## 16. Root-Cause Analysis and Architectural Decision

### Root-cause summary
- Widget-based black-box UI creates Japanese IME UX regressions.
- Citation rendering in managed UI creates trust failures (title drift, link indirection, awkward blocks).
- Access-control logic is disconnected from Craft CMS due to iframe/session isolation.
- Multi-tenant roadmap is blocked without strict tenant metadata isolation and server-side routing controls.

### Architectural decision
Adopt an API-first headless architecture:
- Keep Dify as orchestration/retrieval brain.
- Own 100% of frontend UX in Next.js.
- Own citation rendering rules in app layer.
- Own user tier enforcement and usage policy in backend.
- Enforce tenant_id-based logical isolation in retrieval and logging paths.

## 17. Workload Estimate from Source Document
- **Phase 1 (POC):** roughly 25–45 hours
- **Phase 2 (MVP):** roughly 50–70 hours
- **Total:** roughly 75–115 hours

## 18. Immediate Next Deliverables
- `TDD.md`
- `SYSTEM_ARCHITECTURE.md`
- `MVP_FEATURE_PRIORITY.md`
- `IMPLEMENTATION_PLAN.md`
- initial application/repo scaffold
