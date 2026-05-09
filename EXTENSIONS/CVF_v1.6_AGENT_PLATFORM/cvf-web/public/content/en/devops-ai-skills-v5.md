# Tutorial: DevOps & AI Integration Skills (AGT-030 → AGT-033)

**Time:** 25 minutes  
**Level:** Intermediate → Advanced  
**Prerequisites:** [Agent Platform set up](agent-platform.md), [App Development Skills v1.6.4 (AGT-025–029)](app-dev-skills-v4.md)  
**What you'll learn:** How to use 4 new skills completing the full development lifecycle — cloud deployment, code review methodology, MCP server building, and AI multimodal processing

---

## Overview

CVF v1.6.5 expands from **29 to 33 agent tools** — completing end-to-end development coverage from design through deployment and AI integration. These 4 skills fill the final gaps:

| Skill | What It Does | Risk | When to Use |
|-------|-------------|------|-------------|
| 🚀 **AGT-030: Cloud Deployment Strategist** | Platform selection, Docker, K8s, GitOps | R2 | When deploying apps to cloud infrastructure |
| ✅ **AGT-031: Code Review & Verification Gate** | Review methodology, evidence-before-claims | R1 | When reviewing code or claiming completion |
| 🔧 **AGT-032: MCP Server Builder** | Build MCP servers (Python/TypeScript) | R2 | When creating tool integrations for LLMs |
| 🎨 **AGT-033: AI Multimodal Processor** | Audio/image/video/document processing | R2 | When working with multimedia content via AI |

---

## Updated Risk Distribution (33 Skills)

```
R0 (5 skills) ─── R1 (11 skills) ─── R2 (13 skills) ─── R3 (4 skills)
Safe/Auto         Low/Auto           Medium/Supervised    High/Manual
```

---

## Skill 1: Cloud Deployment Strategist (AGT-030)

### What It Does
Completes the development lifecycle by covering **deployment and infrastructure** — from choosing the right platform to GitOps workflows and CI/CD pipeline integration.

### Platform Selection Decision Tree
```
Need sub-50ms global latency? ──Yes──→ Cloudflare Workers (Edge)
         │No
Stateless HTTP service? ──Yes──→ Cloud Run (Serverless containers)
         │No
Need container orchestration? ──Yes──→ Kubernetes (GKE/EKS/AKS)
         │No
Static site + API? ──Yes──→ Cloudflare Pages + Workers
         │No
Simple containerized app? ──Yes──→ Docker Compose (VPS/VM)
```

### Key Patterns
- **Multi-stage Dockerfile**: Builder stage (dependencies + build) → Runtime stage (slim image, non-root user)
- **K8s Deployment Strategies**: Rolling Update (default), Blue-Green (zero downtime), Canary (gradual validation)
- **GitOps**: ArgoCD for large teams, Flux for simple single-cluster setups
- **CI/CD Pipeline**: 6 gates from lint → test → build → scan → push → deploy

### Chat Prompt Examples
```
"Choose the best deployment platform for my Next.js SaaS app with 10K users"
"Create a multi-stage Dockerfile for my Node.js API with security best practices"
"Set up GitOps with ArgoCD for dev/staging/prod environments"
"Design a CI/CD pipeline with quality gates that integrates with AGT-026 testing"
```

---

## Skill 2: Code Review & Verification Gate (AGT-031)

### What It Does
Enforces **technical rigor over social performance** in code reviews. Three practices: receiving feedback correctly, requesting structured reviews, and verification gates requiring evidence before any completion claims.

### The Iron Law
> **NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE**

### Three Practices
| Practice | Protocol | Key Rule |
|----------|----------|----------|
| **Receiving Feedback** | READ → UNDERSTAND → VERIFY → EVALUATE → RESPOND → IMPLEMENT | No performative agreement ("Great point!") |
| **Requesting Review** | Structured template with SHA context | Review after EACH task |
| **Verification Gate** | IDENTIFY → RUN → READ → VERIFY → CLAIM | Fresh evidence only (<5 min) |

### Forbidden vs Correct Patterns
| ❌ Never Say | ✅ Say Instead |
|-------------|---------------|
| "You're absolutely right!" | "I understand the concern. Let me verify..." |
| "Tests should pass" | [run tests] "Tests pass: 1111/1111, output attached" |
| "I think it's done" | [run build + tests] "Build succeeds, all tests pass. Evidence: ..." |

### Chat Prompt Examples
```
"Review my latest changes — here's the diff since commit abc123"
"Apply verification gates before I claim this feature is complete"
"Help me YAGNI-check this suggested refactoring — is the problem real?"
"Set up a code review checklist for this PR with severity classification"
```

---

## Skill 3: MCP Server Builder (AGT-032)

### What It Does
Structured 4-phase methodology for building **production-quality MCP servers**. Focuses on agent-centric design — tools that enable workflows, not just API wrappers.

### Agent-Centric Design Principles
| ❌ API-Centric | ✅ Agent-Centric |
|---------------|-----------------|
| Wrap every endpoint as a tool | Design workflow-oriented tools |
| Return raw JSON dumps | Concise, human-readable summaries |
| Technical IDs only | Human-readable names (+ IDs) |
| "Error occurred" | "Rate limited — retry after 30s" |

### 4-Phase Workflow
```
Phase 1: Research & Plan → Phase 2: Implement → Phase 3: Review → Phase 4: Evaluate
Protocol docs, API study    Python/TypeScript     Quality checklist    10 eval questions
Tool design templates       Shared infrastructure  Build verification   Agent testing
I/O schema planning         Tool annotations       Type safety audit    XML eval file
```

### Chat Prompt Examples
```
"Build an MCP server in Python (FastMCP) for the GitHub API"
"Design agent-centric tools for a project management service"
"Create 10 evaluation questions to test my MCP server quality"
"Review my MCP server against the quality checklist"
```

---

## Skill 4: AI Multimodal Processor (AGT-033)

### What It Does
Process **audio, images, video, and documents** through multimodal AI APIs. Provides model selection, cost optimization, and implementation patterns for each modality.

### Capability Matrix
| Task | Audio | Image | Video | Document |
|------|:-----:|:-----:|:-----:|:--------:|
| Transcription | ✅ | — | ✅ | — |
| Summarization | ✅ | ✅ | ✅ | ✅ |
| Q&A | ✅ | ✅ | ✅ | ✅ |
| Object Detection | — | ✅ | ✅ | — |
| Text Extraction | — | ✅ | — | ✅ |
| Generation | TTS | — | — | ✅ |

### Model Selection
```
Need highest accuracy? ──→ gemini-2.5-pro ($3/1M tokens)
Budget-sensitive? ──→ gemini-2.5-flash-lite ($0.50/1M tokens)
Image generation? ──→ gemini-2.5-flash-image
Standard tasks ──→ gemini-2.5-flash ($1/1M tokens, best balance)
```

### Cost Optimization Tips
- Use File API for files >20MB (avoids repeated upload)
- Compress media before upload
- Process specific segments, not entire long videos
- Use `concise` format by default
- Cache responses for repeated queries

### Chat Prompt Examples
```
"Transcribe this 2-hour podcast with timestamps and speaker IDs"
"Extract all tables from this 50-page PDF as structured JSON"
"Analyze this product demo video scene by scene with key moments"
"Generate a dashboard UI mockup image from this description"
```

---

## Complete Development Lifecycle

With v1.6.5, CVF now covers the **entire app development lifecycle**:

```
Design Phase:
  AGT-025 (API Architecture) → AGT-028 (Database Schema) → AGT-029 (Frontend Components)
       │
Security Phase:
  AGT-027 (Security & Auth Guard)
       │
Implementation Phase:
  AGT-032 (MCP Server Builder) → AGT-033 (AI Multimodal Processor)
       │
Quality Phase:
  AGT-026 (Full-Stack Testing) → AGT-031 (Code Review & Verification Gate)
       │
Deployment Phase:
  AGT-030 (Cloud Deployment Strategist)
```

---

## What's Next?

- Explore the full `.gov.md` specifications in [Agent Skills Registry](../../../governance/skill-library/registry/agent-skills/INDEX.md)
- Combine design skills (AGT-025→029) with deployment (AGT-030) for end-to-end workflows
- Use [AGT-019 Skill Progressive Loader](using-new-skills-v2.md) to load only what you need
