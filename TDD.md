# TDD.md - Kinetikos Knowledge Copilot

## 1. Technical Direction
This MVP should be built for stability, maintainability, and commercial readiness.

## 2. Frontend Stack
### Required
- **TypeScript**
- **Next.js**
- **React**

### Decision
Use **Next.js with TypeScript** as the core frontend framework.

### Why
- stable and widely adopted
- strong ecosystem
- good fit for embedded chat products
- strong support for API routes, app structure, auth integration, and deployment portability
- suitable for future evolution beyond iframe MVP usage

## 3. Backend Stack
### Requirement
Use the most stable, reliable, and widely used web API backend framework.

### Decision
Use **Next.js + Route Handlers / server functions** for MVP application integration, with clear modular service boundaries.

If backend complexity expands beyond MVP scope, the recommended expansion path is:
- **NestJS** for a more structured standalone backend

### Why
For MVP speed and reliability:
- Next.js keeps frontend/backend integration simple
- reduces moving parts early
- works well for auth, chat orchestration, logging, and API integration

For scale-up:
- NestJS is the best structured path if the backend grows into a heavier service platform

## 4. Database
### Required
- **Supabase**

### Decision
Use **Supabase Postgres** as the primary application database.

### Expected uses
- user records
- session metadata
- chat/session references
- usage logging
- source/citation metadata cache if needed
- product analytics support tables

## 5. Authentication
### Required
- **Google Auth login**

### Decision
Use **Google Auth** as the primary user login method.

### Recommended implementation
- **Supabase Auth** with Google provider

### Why
- fast MVP integration
- stable hosted auth
- good fit with Next.js
- clean user/session mapping for premium product usage

## 6. LLM / Embedding Direction
### Embeddings requirement
Choose the best embedding model from GPT / OpenAI.

### Decision
Use **OpenAI text-embedding-3-large** as the default production embedding model.

### Why
- strong retrieval quality
- good semantic performance for complex knowledge retrieval
- strong general-purpose commercial choice
- appropriate when retrieval quality matters more than minimal cost

### Cost-sensitive fallback
If cost pressure becomes significant, evaluate:
- **text-embedding-3-small**

But default recommendation remains:
- **text-embedding-3-large**

## 7. Retrieval / RAG Architecture
### Core retrieval foundation
- Dify-based knowledge ingestion and orchestration
- hybrid retrieval enabled
- metadata-aware retrieval and citation flow
- source chunking tuned for Japanese content and instructional material

### Retrieval principles
- optimize for answer quality, not just retrieval speed
- preserve source traceability
- support synthesis across multiple chunks
- avoid over-reliance on one retrieved passage

## 8. Context Engineering Requirements
This project should be fully optimized from a context engineering perspective.

### Core context engineering rules
1. **Do not flood the LLM with raw retrieved text**
   - retrieve only the best candidate chunks
   - rank aggressively
   - pass only the most decision-relevant content

2. **Use structured context packaging**
   - source title
   - source type
   - source identifier/url
   - compact excerpt
   - relevance reason
   - metadata tags

3. **Prefer multi-stage synthesis over giant prompt stuffing**
   - retrieve
   - rank
   - compress/summarize when needed
   - synthesize final answer

4. **Context should preserve attribution**
   - every answer-worthy claim should be traceable to a source chunk
   - final answer generation should keep citation anchors alive

5. **Optimize chunking for Japanese knowledge content**
   - chunk by semantic/unit boundaries where possible
   - avoid breaking definitions, instructions, or medical/technical explanations awkwardly
   - preserve transcript continuity for video-derived material

6. **Optimize for follow-up turns**
   - retain compact memory summaries instead of replaying full history blindly
   - use selective carry-forward context for 5-10 turns

7. **Minimize wasteful prompt tokens**
   - concise system prompts
   - compact retrieved context blocks
   - no redundant source duplication
   - no unnecessary historical replay

8. **Use grounded refusal logic**
   - if evidence is weak or absent, answer with explicit uncertainty / refusal instead of synthetic hallucination

## 9. Recommended LLM Context Flow
### Proposed pipeline
1. user query
2. query normalization / Japanese intent cleanup
3. hybrid retrieval from Dify knowledge base
4. rerank top evidence set
5. compact context packaging
6. final grounded synthesis prompt
7. answer generation with citation mapping
8. session memory update
9. usage log write

## 10. API / Application Responsibilities
### Next.js app should handle
- UI rendering
- Google login flow
- session management
- iframe embedding logic
- IME-safe input behavior
- API communication layer
- usage logging linkage

### Retrieval / orchestration layer should handle
- knowledge retrieval
- synthesis orchestration
- memory handling
- grounding logic
- citation metadata response

## 11. Engineering Quality Bar
- use TypeScript everywhere practical
- avoid unstable niche framework choices
- prefer boring, proven infrastructure
- preserve future portability
- optimize retrieval quality before flashy UI extras
- design for maintainability and production transition

## 12. Locked Stack Summary
- **Frontend:** Next.js + React + TypeScript
- **Backend/API:** Next.js server layer for MVP, with NestJS as scale-up path
- **Database:** Supabase Postgres
- **Auth:** Google Auth via Supabase Auth
- **Embeddings:** OpenAI `text-embedding-3-large`
- **RAG backbone:** Dify
- **Context engineering focus:** aggressive context optimization, ranking, compact packaging, grounded synthesis
