# CVF Positioning — Identity & Definition

> **Created:** Feb 08, 2026 | **Updated:** Feb 25, 2026  
> **Purpose:** Answer the question "What is CVF?" clearly, avoiding confusion

---

## 1. What is CVF?

**CVF (Controlled Vibe Framework)** is a **governance-first control plane** for AI-assisted development.

```
CVF = Rules + Process + Tools
      to control quality when working with AI
```

### Precise Definition

| Aspect | CVF IS | CVF IS NOT |
|--------|--------|------------|
| Type | Governance-first control plane | AI model / AI tool |
| Scope | Process + standards | Code library / SDK |
| Target | Human-supervised AI execution | Pure AI automation |
| Output | Runtime controls, workflow discipline, evidence chain | App / Software product |
| Dependency | Agent-agnostic | Tied to specific AI |

---

## 2. Architecture Layers

CVF has 5 distinct layers (not a monolith):

```
┌─────────────────────────────────────────────────────────┐
│  🛡️ SAFETY UI (Layer 5)    — Non-Coder Safety Dashboard │
│     v1.7.2                  — Read-only risk view         │
│     Risk: 🟢Safe 🟡Attention 🟠Review 🔴Dangerous       │
├─────────────────────────────────────────────────────────┤
│  🌐 PLATFORM (Layer 4)     — Web UI, Agent Chat          │
│     v1.6 Agent Platform    — Production runtime           │
│  🔐 v1.6.1                 — Enterprise Governance Engine │
├─────────────────────────────────────────────────────────┤
│  ⚙️ SAFETY RUNTIME (Layer 3) — Policy Enforcement        │
│     v1.7 Intelligence      — Reasoning gate, Entropy      │
│     v1.7.1 Runtime         — Auth, Audit, DI              │
├─────────────────────────────────────────────────────────┤
│  🛠️ TOOLS (Layer 2)         — Scoring, UAT, Validation   │
│     v1.3, governance/      — Python scripts, CI/CD       │
├─────────────────────────────────────────────────────────┤
│  📖 CORE (Layer 1) ← This IS CVF                        │
│     v1.0, v1.1, v1.2       — Rules + 141 Skills          │
│     → Always needed. Start here.                          │
└─────────────────────────────────────────────────────────┘
```

### Layer 1: Core (Required)
- **Principles:** Outcome > Code, Spec-first, Risk-aware
- **Canonical loop:** INTAKE → DESIGN → BUILD → REVIEW → FREEZE
- **Risk Model:** R0 (Auto) → R1 (Audit) → R2 (Review) → R3 (Manual)
- **Skill Library:** 141 skills across 12 domains

### Layer 2: Tools (Optional)
- `report_spec_metrics.py` — Spec quality scoring
- `score_uat.py` — UAT scoring
- `check_version_sync.py` — Version drift checking
- `inject_spec_scores.py` — Inject scores into governance
- `validate_registry.py` — CI/CD validation

### Layer 3: Safety Runtime (Optional)
- **v1.7 Intelligence** — Reasoning gate, entropy guard, prompt sanitizer
- **v1.7.1 Runtime** — Policy lifecycle engine, auth, DI container, audit trail
- Anomaly detection, system prompt hardening

### Layer 4: Platform (Reference Implementation)
- Web app (Next.js) — governed UI and non-coder control surface
- AI Agent Chat — Gemini, OpenAI, Anthropic
- 34 Agent Tools — multi-agent workflows
- Template Marketplace — community templates

### Layer 5: Safety Dashboard (Non-Coder)
- **v1.7.2** — Real-time risk visualization
- Risk levels: 🟢Safe 🟡Attention 🟠Review 🔴Dangerous
- Read-only interface for managers and stakeholders
- Policy simulation with what-if scenarios

---

## 3. Suitable Use Cases

### ✅ Suitable
| Scenario | How to use CVF |
|----------|----------------|
| Solo dev using AI daily | Layer 1: Skills + Risk awareness |
| Team of 3-5 people | Layer 1 + 2: Skills + governance + scoring |
| Code review with AI | Skill `tech_review/01_code_review.skill.md` |
| Writing specifications | Skill `application_development/05_api_design_spec.skill.md` |
| Evaluating AI output | UAT process + evaluation checklist |
| AI safety for non-coders | Layer 5: Safety Dashboard |
| Enterprise AI governance | Layer 1 + 3 + 4: Full stack governance |

### ❌ Not Suitable
| Scenario | Reason |
|----------|--------|
| Replacing AI models | CVF is not AI, only manages the process |
| Real-time API | CVF is a framework, not a service |
| Customer-facing product | CVF is an internal tool/process |
| Compliance (SOC2, etc.) | Requires dedicated compliance framework |

---

## 4. Comparison with Other Frameworks

| Feature | CVF | DORA | SAFe | Custom Prompts |
|---------|-----|------|------|----------------|
| AI governance | ✅ Core focus | ❌ | ❌ | ❌ |
| Risk-based phases | ✅ R0-R3 | ❌ | ✅ | ❌ |
| Skill library | ✅ 141 skills | ❌ | ❌ | Partial |
| Agent-agnostic | ✅ | N/A | N/A | ❌ Usually locked |
| Quality scoring | ✅ | ✅ Metrics | ✅ Metrics | ❌ |
| AI Safety Runtime | ✅ v1.7.x | ❌ | ❌ | ❌ |
| Lightweight | ✅ | ✅ | ❌ Heavy | ✅ |

## 5. Current Positioning Discipline

Safe current statement:

> CVF is a governance-first control plane with a substantially aligned runtime on the active reference path, while further continuation is explicitly gated by `GC-018`.

Statements to avoid until further roadmap closure:

- full platform parity with larger orchestration ecosystems
- fully unified autonomy across every active CVF channel
- complete replacement of human supervision
- implying that breadth expansion remains open by default after the current wave

---

## 6. Tagline Options

Use one of these taglines when introducing CVF:

1. **"Governance framework for AI-assisted development"** ← Most accurate
2. **"Control quality when working with AI"** ← Simple
3. **"Rules, not code. Process, not product."** ← Clear distinction
4. **"Make AI work YOUR way"** ← Marketing-friendly

---

## 7. Elevator Pitch

> CVF is a governance framework that helps you control AI when developing software.  
> Instead of letting AI run free, CVF provides 141 ready-made skill templates,  
> a risk level system (R0-R3), automated quality scoring, and an AI Safety Runtime.  
> Works with any AI: Copilot, ChatGPT, Claude, Gemini.  
> 5 minutes to get started. Zero dependencies.

---

## 8. Anti-Patterns (Avoid)

| Say | Instead of | Because |
|-----|-----------|---------|
| "CVF platform" | "CVF framework" | CVF is rules, not a platform |
| "CVF v1.6" | "CVF Core + Agent Platform v1.6" | v1.6 is the platform layer, not core |
| "Install CVF" | "Apply CVF" | CVF is not installed, copy skill files |
| "CVF AI" | "CVF governance" | CVF manages AI, it is not AI |

---

*Updated: March 20, 2026*
