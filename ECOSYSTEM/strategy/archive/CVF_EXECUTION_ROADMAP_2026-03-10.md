# CVF Execution Roadmap — From 5/10 to 9/10

> **Based on:** CVF Independent Assessment 2026-03-10
> **Goal:** Complete CVF as a production-ready governance + execution platform
> **Timeline:** 6 sprints (12 weeks)
> **Approach:** Each sprint delivers a shippable increment

---

## Sprint 0: Foundation Fix (Week 1)

> **Goal:** Fix deployment, clean up, establish working dev environment.

### S0.1 — Fix Netlify Deployment

- [ ] Fix root `netlify.toml` to point to correct build path
- [ ] Options:
  - (A) Deploy CVF_v1.6 Web UI: base = `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web`
  - (B) Create new landing page at root with links to docs + web UI
- [ ] Verify `vibcode.netlify.app` shows correct content after merge

### S0.2 — Merge cvf-next to main

- [ ] Create PR from `cvf-next` to `main`
- [ ] Review diff (716 files, 89K+ insertions)
- [ ] Merge and verify Netlify auto-deploy

### S0.3 — Setup .env with Gemini API Key

- [ ] Create `.env.local` in `CVF_v1.6_AGENT_PLATFORM/cvf-web/`
- [ ] Add `NEXT_PUBLIC_GEMINI_API_KEY=<key>`
- [ ] Verify Agent Chat works with real Gemini API
- [ ] Test: send a message in Agent Chat, get real AI response

### S0.4 — Verify Web UI Runs Locally

- [ ] `npm install && npm run dev` in cvf-web
- [ ] Fix any build errors
- [ ] Screenshot baseline of current state

**Deliverable:** Working Web UI on localhost + Netlify with Gemini AI connected.
**Score impact:** 4/10 → 5/10 (Pipeline)

---

## Sprint 1: MCP HTTP Bridge (Week 2-3)

> **Goal:** Connect MCP Server guard engine to Web UI via HTTP API.

### S1.1 — MCP HTTP Server Wrapper

- [ ] Add HTTP transport to MCP Server (alongside existing stdio)
- [ ] Expose REST endpoints:

```
POST /api/guards/evaluate     → Full guard pipeline
POST /api/guards/phase-gate   → Phase gate check
POST /api/guards/risk-gate    → Risk gate check
POST /api/guards/advance      → Phase advancement
GET  /api/guards/audit-log    → Audit trail
GET  /api/guards/health       → Health check
```

- [ ] Tests: HTTP endpoint tests (target: 20 new tests)
- [ ] Docker-optional: can run as plain Node process

### S1.2 — Web UI Guard Client

- [ ] Replace client-side governance logic in `enforcement.ts` with HTTP calls to MCP HTTP Bridge
- [ ] Fallback: if bridge unreachable, use existing client-side logic
- [ ] GovernanceBar shows real-time guard status from bridge

### S1.3 — Unified State

- [ ] Single source of truth for:
  - Current phase (DISCOVERY/DESIGN/BUILD/REVIEW)
  - Risk level (R0-R3)
  - Audit log entries
  - Guard decisions
- [ ] State persisted via JSON file adapter (already in MCP Server)

**Deliverable:** Web UI calls MCP guard engine via HTTP. Single governance runtime.
**Score impact:** 5/10 → 7/10 (Pipeline)
**Tests:** +20 new tests

---

## Sprint 2: Agent Execution Runtime (Week 4-6)

> **Goal:** Build the execution loop that makes CVF's core value real.
> **This is the most critical sprint.**

### S2.1 — Execution Loop Core

- [ ] Build `AgentExecutionRuntime` class:

```typescript
class AgentExecutionRuntime {
  // 1. Parse user intent (via Vibe Translator)
  async parseIntent(userInput: string): Promise<ParsedVibe>

  // 2. Plan actions (via AI provider)
  async planActions(intent: ParsedVibe): Promise<ActionPlan>

  // 3. Check guards BEFORE execution
  async preCheck(action: Action): Promise<GuardDecision>

  // 4. Execute action (via AI provider)
  async execute(action: Action): Promise<ExecutionResult>

  // 5. Validate output AFTER execution
  async postCheck(result: ExecutionResult): Promise<ValidationResult>

  // 6. Log everything
  async audit(action: Action, result: ExecutionResult): Promise<void>
}
```

- [ ] Integration with existing Vibe Translator (M4)
- [ ] Integration with existing Guard Engine (M1)
- [ ] Integration with existing Session Memory (M5)

### S2.2 — Gemini Provider Integration

- [ ] Connect `AgentExecutionRuntime` to Gemini API
- [ ] System prompt includes CVF governance rules
- [ ] Streaming support for real-time progress
- [ ] Token budget tracking per session

### S2.3 — HITL (Human-in-the-Loop) Checkpoints

- [ ] When guard returns ESCALATE → pause execution, notify user
- [ ] When guard returns BLOCK → stop execution, explain why
- [ ] User can APPROVE/REJECT/MODIFY at any checkpoint
- [ ] Push notification via WebSocket or SSE

### S2.4 — E2E Pipeline Test

- [ ] Test: User input → Parse → Plan → Guard Check → Execute → Validate → Output
- [ ] Test: Guard BLOCK stops execution
- [ ] Test: Guard ESCALATE pauses for user approval
- [ ] Test: Session memory preserves context across turns

**Deliverable:** Working agent execution loop with governance enforcement.
**Score impact:** 3/10 → 7/10 (Core value)
**Tests:** +40 new tests

---

## Sprint 3: Golden Screens UI (Week 7-8)

> **Goal:** Implement 5 Golden Screens from M7 contracts in Web UI.

### S3.1 — Screen 1: The Vibe Box

- [ ] Single text input + voice button
- [ ] Phase-aware suggested prompts
- [ ] Recent vibes history
- [ ] Replaces current template-first workflow
- [ ] Non-coder friendly: "Tell me what you want to build..."

### S3.2 — Screen 2: Intention Map

- [ ] Mindmap visualization of parsed intent
- [ ] Shows: goals, constraints, steps, guardrails, risks
- [ ] User confirms or modifies before execution
- [ ] Auto-generated from Vibe Translator output

### S3.3 — Screen 3: Live Operation Dashboard

- [ ] Real-time progress bar
- [ ] Token budget meter
- [ ] Current phase indicator
- [ ] Pause/Resume/Cancel buttons
- [ ] Agent action log (human-readable)

### S3.4 — Screen 4: Human-in-the-Loop

- [ ] Alert cards for ESCALATE/BLOCK events
- [ ] Approve/Reject/Modify buttons
- [ ] Risk explanation in non-coder language
- [ ] Sound/visual notification

### S3.5 — Screen 5: Audit Ledger

- [ ] Daily summary in human language
- [ ] Timeline view of all actions
- [ ] Filter by phase, risk level, decision
- [ ] Export to PDF/Markdown

**Deliverable:** Complete non-coder UI experience.
**Score impact:** 5/10 → 8/10 (Non-coder experience)
**Tests:** +30 new UI tests

---

## Sprint 4: Production Hardening (Week 9-10)

> **Goal:** Make CVF production-ready for real users.

### S4.1 — API Key Management

- [ ] Built-in Gemini free tier (no API key needed for basic usage)
- [ ] Server-side proxy for API calls (hide key from client)
- [ ] Usage quota per session (free tier: 100 requests/day)
- [ ] Settings page: bring-your-own-key for power users

### S4.2 — CI/CD Pipeline

- [ ] GitHub Actions:
  - On PR: run all tests (MCP Server + Web UI)
  - On merge to main: auto-deploy to Netlify
  - On tag: create GitHub Release
- [ ] Branch protection rules for main

### S4.3 — Error Handling & Resilience

- [ ] Graceful fallback when AI provider is down
- [ ] Retry logic with exponential backoff
- [ ] Offline mode: governance checks work without AI
- [ ] Error messages in non-coder language

### S4.4 — Performance

- [ ] Lazy loading for Web UI components
- [ ] MCP Server response time < 100ms for guard checks
- [ ] LCP < 2.5s on mobile

**Deliverable:** Production-grade deployment with CI/CD.
**Score impact:** 2/10 → 7/10 (Production Ready)
**Tests:** +20 new tests

---

## Sprint 5: Repository Simplification & Documentation (Week 11-12)

> **Goal:** Clean up, document, and prepare for community.

### S5.1 — Repository Restructure

```
EXTENSIONS/
├── cvf-web/              ← Web UI (from v1.6, upgraded)
├── cvf-mcp-server/       ← MCP Server (from ECO v2.5)
├── cvf-eco/              ← ECO extensions (12 modules)
├── cvf-execution-runtime/ ← NEW: Agent execution loop
└── legacy/               ← Archive v1.1.1 through v2.0
```

### S5.2 — Documentation Update

- [ ] Update README with new architecture
- [ ] Quick Start: 3 commands to run full system
- [ ] Video demo or GIF walkthrough
- [ ] API reference for MCP HTTP Bridge

### S5.3 — CVF_CORE_KNOWLEDGE_BASE Update

- [ ] Add Agent Execution Runtime section
- [ ] Add Golden Screens architecture
- [ ] Update MCP Server section with HTTP bridge
- [ ] Update scoring: target 8-9/10

**Deliverable:** Clean repo, clear docs, community-ready.

---

## Summary Timeline

```
Week 1:      Sprint 0 — Foundation Fix
Week 2-3:    Sprint 1 — MCP HTTP Bridge
Week 4-6:    Sprint 2 — Agent Execution Runtime  ← CRITICAL
Week 7-8:    Sprint 3 — Golden Screens UI
Week 9-10:   Sprint 4 — Production Hardening
Week 11-12:  Sprint 5 — Cleanup & Documentation
```

## Score Projection

| Area | Current | After S0 | After S1 | After S2 | After S3 | After S4 | After S5 |
|------|---------|----------|----------|----------|----------|----------|----------|
| Pipeline | 4 | 5 | 7 | 7 | 7 | 8 | 9 |
| Non-coder UX | 5 | 5 | 5 | 6 | 8 | 9 | 9 |
| Core Value | 3 | 3 | 4 | 7 | 8 | 9 | 9 |
| Production | 2 | 4 | 4 | 5 | 5 | 7 | 8 |
| Docs/Tests | 9 | 9 | 9 | 9 | 9 | 9 | 10 |
| Architecture | 8 | 8 | 9 | 9 | 9 | 9 | 10 |
| **Average** | **5.0** | **5.7** | **6.3** | **7.2** | **7.7** | **8.5** | **9.2** |

---

## User Requirements & Support Needed

See: CVF_USER_REQUIREMENTS_2026-03-10.md

---

*This roadmap is a living document. Update after each sprint completion.*
