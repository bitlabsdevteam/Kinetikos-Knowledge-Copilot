# Kinetikos Knowledge Copilot

A Japanese-first RAG application MVP for Kinetikos.

## Overview

Kinetikos Knowledge Copilot is a grounded AI assistant designed to synthesize answers across a large Japanese knowledge base and deliver them through a premium, Japanese-friendly chat experience.

The product is designed to support:
- large-scale knowledge ingestion
- high-quality retrieval and synthesis
- founder-style Japanese tone guidance
- strict grounded answering behavior
- clean source-linked citations
- conversational memory
- usage tracking by user identity
- future portability beyond the initial hosted stack

## Product Goals

The MVP aims to prove two things:

1. The system can reliably retrieve and synthesize answers from a large Kinetikos content base.
2. The user experience can feel premium, branded, Japanese-native, and commercially deployable.

## Core MVP Scope

### Phase 1 — Proof of Concept
Focus on the intelligence layer:
- ingest and organize the Kinetikos knowledge base
- configure hybrid retrieval for Japanese content
- synthesize across multiple relevant sources
- enforce grounded response behavior
- shape the assistant tone using founder reference content

### Phase 2 — Premium MVP Interface
Focus on product delivery:
- Next.js standalone chat application
- embeddable iframe-friendly architecture
- IME-safe Japanese chat input behavior
- clickable branded citations
- conversational memory across multiple turns
- postMessage-based user identity handoff for usage logging
- future-portable frontend and metadata design

## Proposed Architecture

### Retrieval / orchestration
- **Dify Cloud** for knowledge ingestion, retrieval workflows, and conversation orchestration
- **Hybrid Search** (vector + keyword) for Japanese technical and domain-sensitive retrieval
- knowledge metadata tagging for future multi-tenant readiness

### Frontend
- **Next.js** standalone chat frontend
- designed for embedding inside Craft CMS via iframe
- Japanese UX quality treated as a core requirement, not a polish item

### Model behavior
- grounded synthesis across retrieved chunks
- strict “I don’t know” behavior when evidence is missing
- response tone shaped by approved founder reference materials

## Functional Requirements

### Knowledge ingestion
The system should support ingestion and processing of:
- article/member content
- short-video transcripts
- long-video transcripts
- course manuals and long-form PDFs

### Retrieval and synthesis
The system should:
- retrieve the most relevant chunks using hybrid retrieval
- synthesize across multiple sources when needed
- avoid over-reliance on a single retrieved snippet
- produce cohesive Japanese responses with traceability

### Citations
The system should:
- surface clean, clickable citations
- use metadata from retrieval responses
- link users back to the original source content cleanly

### Conversational memory
The system should:
- retain context across roughly 5–10 turns in a session
- support follow-up questions naturally
- avoid losing the thread in multi-turn interactions

### Usage logging
The system should:
- accept a user identifier from the host page
- pass that identifier into the RAG backend / Dify layer
- preserve per-user query history from day one

Current scaffold status:
- iframe host can pass `{ type: 'kinetikos:set-user', userId, displayName? }` via `postMessage`
- chat requests forward `userId` to the API layer
- the API appends local JSONL usage records to `data/usage-log.jsonl` as a temporary MVP logging bridge

### Japanese UX requirements
The system must:
- support IME composition correctly
- prevent Enter from prematurely submitting while composition is active
- feel natural for Japanese-language usage

## Non-Goals

The MVP is not trying to be:
- a generic chatbot unrelated to the knowledge base
- an autonomous agent that answers without grounding
- a full CMS replacement
- a broad enterprise platform on day one

## Engineering Principles

- grounding over fluency
- retrieval quality over generic cleverness
- human trust over aggressive automation
- Japanese UX quality as a first-class requirement
- modularity and future portability
- practical MVP focus over overbuilt scope

## Initial Deliverables

The first wave of project deliverables should include:
- `PRD.md`
- `TDD.md`
- `SYSTEM_ARCHITECTURE.md`
- `MVP_FEATURE_PRIORITY.md`
- implementation plan for Phase 1 and Phase 2

## Repository Intent

This repository will hold:
- product requirements
- technical design documents
- architecture decisions
- implementation code
- frontend work
- integration logic
- MVP progress artifacts

## Current Status

This repository now includes a grounded mock chat thin slice, IME-safe composer behavior, and an initial user-linking / usage-logging scaffold for embedded deployment.

Example host handoff:

```ts
iframe.contentWindow?.postMessage(
  {
    type: 'kinetikos:set-user',
    userId: 'member-123',
    displayName: 'David',
  },
  '*',
);
```

The immediate next step is to translate the concept into:
- build-ready docs
- architecture
- implementation sequence
- real product code

## Builder

Primary builder for this project:
- **Kaito** — RAG product builder focused on Japanese-first AI application delivery
