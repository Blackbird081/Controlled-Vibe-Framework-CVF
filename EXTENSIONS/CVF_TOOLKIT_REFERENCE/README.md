# CVF Toolkit – Reference Implementation

> **⚠️ ĐÂY LÀ REFERENCE IMPLEMENTATION — KHÔNG PHẢI PRODUCTION RUNTIME**

**Version**: 1.0.1  
**Status**: Reference Example — Controlled Extension of CVF  
**Type**: 📘 Ứng dụng mở rộng có kiểm soát (Controlled Extension)  
**Scope**: Ví dụ minh họa Governance Enforcement Engine  
**Last Updated**: 2026-02-17  
**Parent Framework**: [CVF v1.0–v1.6](../../README.md)  

---

## ⚡ Quan Hệ Với Hệ Thống CVF

```
CVF Core (v1.0/v1.1) ──── FROZEN, không thay đổi
    ↓ extends
CVF Extensions (v1.2–v1.6) ──── Production extensions
    ↓ includes
CVF Web Platform (v1.6/cvf-web) ──── Production runtime (1068 tests, 95.6% coverage)
    
    ┌──────────────────────────────────────────┐
    │  📘 CVF TOOLKIT REFERENCE                │  ← Bạn đang ở đây
    │  Ví dụ minh họa governance enforcement   │
    │  engine cho developers xây dựng project  │
    │  mới dựa trên CVF principles             │
    └──────────────────────────────────────────┘
```

**Toolkit này KHÔNG phải là core runtime của CVF.** Nó là ví dụ minh họa cách triển khai governance enforcement engine bằng TypeScript, giúp developers hiểu cách:

- Map CVF governance concepts vào TypeScript types
- Tách governance logic khỏi domain logic
- Implement risk classification (R1–R4)
- Implement phase control tuần tự (P0–P6)
- Abstract multi-provider AI (OpenAI, Claude, Gemini)
- Implement change control lifecycle + freeze protocol
- Build UAT & certification pipeline

> **Lưu ý:** Production runtime thật của CVF nằm tại `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/`. Toolkit này là tài liệu tham khảo kèm code minh họa.

---

## 2. Quick Start

```bash
# Install dependencies
npm install

# Type check (verify all modules compile)
npm run lint

# Run unit & integration tests
npm test

# Run tests with coverage
npm run test:coverage

# Build production output
npm run build
```

**Requirements**: Node.js >= 18, TypeScript >= 5.3

---

## 3. Project Structure

```
CVF-TOOLKIT/
│
├── tsconfig.json                        # TypeScript config
├── package.json                         # Dependencies & scripts
├── jest.config.js                       # Test configuration
├── CHANGELOG.md                         # Version history
├── REVIEW_BASELINE.md                   # Independent review & recommendations
│
├── 00_CANONICAL_REFERENCE/              # CVF version lock
│   ├── cvf_version.lock.md
│   └── cvf.version.validator.ts         # Runtime version check
│
├── 01_CORE_MAPPING/                     # Governance specifications
│   ├── governance.mapping.md            # 7 pillars
│   ├── risk.phase.mapping.md            # R1-R4 × P0-P6 matrix
│   ├── skill.schema.mapping.md          # Canonical skill contract
│   ├── change.control.mapping.md        # Full change lifecycle
│   ├── agent.lifecycle.mapping.md       # Multi-agent rules
│   ├── mapping.index.md                 # Concept → file cross-reference
│   └── glossary.md                      # Terminology
│
├── 02_TOOLKIT_CORE/                     # Enforcement engine (TypeScript)
│   ├── interfaces.ts                    # All shared types
│   ├── errors.ts                        # CVF_ERR_001–012
│   ├── cvf.config.ts                    # Centralized configuration
│   ├── audit.logger.ts                  # Non-bypassable audit
│   ├── audit.sanitizer.ts              # PII/secret redaction
│   ├── skill.registry.ts               # Skill definitions
│   ├── operator.policy.ts              # Role hierarchy
│   ├── risk.classifier.ts              # Risk computation
│   ├── phase.controller.ts             # P0-P6 state machine
│   ├── change.controller.ts            # Change lifecycle
│   ├── governance.guard.ts             # Central enforcement
│   ├── dependency.map.md               # Module dependency graph
│   ├── error.reference.md              # Error troubleshooting
│   └── *.spec.md                        # Specs for each module
│
├── 03_ADAPTER_LAYER/                    # External bridges
│   ├── cvf.skill.adapter.ts
│   ├── cvf.governance.adapter.ts
│   ├── cvf.change.adapter.ts
│   ├── cvf.agent.adapter.ts
│   ├── cvf.audit.adapter.ts
│   └── adapter.factory.ts              # Central adapter registry
│
├── 04_EXTENSION_LAYER/                  # Domain plugins
│   ├── _extension.template/             # Scaffolding for new extensions
│   ├── financial.extension/             # Finance: risk, skills, validation
│   └── dexter.integration/             # Dexter AI bridge
│
├── 05_UAT_AND_CERTIFICATION/           # Quality gates
├── 06_VERSIONING_AND_FREEZE/           # Version & freeze protocol
│   └── freeze.protocol.ts              # Runtime freeze engine
│
├── 07_AI_PROVIDER_ABSTRACTION/         # Model-agnostic AI
│   ├── provider.interface.ts
│   ├── provider.registry.ts            # Model approval + health + fallback
│   ├── provider.security.spec.md
│   ├── openai.provider.ts
│   ├── claude.provider.ts
│   ├── gemini.provider.ts
│   └── model.approval.list.md
│
├── 08_DOCUMENTATION/                   # Guides & references
│   ├── architecture.overview.md        # Mermaid diagrams
│   ├── api.reference.md                # Function signatures
│   ├── onboarding.guide.md             # New developer guide
│   ├── sequence.diagrams.md            # Governance flows
│   └── decisions.md                    # Architectural Decision Records
│
└── __tests__/                          # Test suite
    ├── risk.classifier.test.ts
    ├── phase.controller.test.ts
    ├── change.controller.test.ts
    ├── governance.guard.test.ts
    └── integration/
        └── governance.flow.test.ts
```

---

## 4. Risk Levels

| Level | Name | Requires | Example |
|-------|------|----------|---------|
| **R1** | Low | — | Data retrieval, read-only queries |
| **R2** | Moderate | UAT | Analysis, computation, reports |
| **R3** | High | UAT + Approval + Freeze | Decision support, recommendations |
| **R4** | Critical | UAT + Multi-Approval + Freeze | Automated trading, autonomous actions |

---

## 5. Phase Model (P0–P6)

```
P0_DESIGN → P1_BUILD → P2_INTERNAL_VALIDATION → P3_UAT → P4_APPROVED → P5_PRODUCTION → P6_FROZEN
```

- Chỉ cho phép chuyển tuần tự (không skip)
- R3/R4 phải freeze trước production
- Rollback về P0 chỉ có ADMIN

---

## 6. Operator Roles

| Role | Level | Max Self-Approve |
|------|-------|-----------------|
| ANALYST | 1 | R1 |
| REVIEWER | 2 | R2 |
| APPROVER | 3 | R3 |
| ADMIN | 4 | R4 (cần 2+ approvers) |

---

## 7. Error Codes

| Code | Meaning |
|------|---------|
| CVF_ERR_001 | Governance violation (multi-reason) |
| CVF_ERR_002 | Phase transition violation |
| CVF_ERR_003 | Risk level exceeded |
| CVF_ERR_004 | Operator permission violation |
| CVF_ERR_005 | Change control violation |
| CVF_ERR_006 | Freeze protocol violation |
| CVF_ERR_007 | Environment restriction |
| CVF_ERR_008 | Skill not found / inactive |
| CVF_ERR_009 | Security bypass attempt |
| CVF_ERR_010 | Input validation failure |
| CVF_ERR_011 | AI provider failure |
| CVF_ERR_012 | Certification error |

Chi tiết: xem `02_TOOLKIT_CORE/error.reference.md`

---

## 8. Creating Extensions

Copy `04_EXTENSION_LAYER/_extension.template/` → `{domain}.extension/`

Mỗi extension cần 3 files:
- `{domain}.risk.profile.ts` — Map domain risk → R1–R4
- `{domain}.skill.pack.ts` — Register skills
- `{domain}.validation.rules.ts` — Output validation

**Rules**: Không import từ extension khác. Không modify `02_TOOLKIT_CORE`.

---

## 9. AI Providers

3 providers tích hợp sẵn: **OpenAI**, **Claude**, **Gemini**

Provider Registry (`provider.registry.ts`) cung cấp:
- ✅ Model approval validation (chỉ cho phép models trong approved list)
- ✅ Health check per provider
- ✅ Fallback strategy (primary → secondary)
- ✅ Usage tracking (tokens, latency)

---

## 10. Design Principles

1. **Governance-first** — Governance precedes execution, always
2. **Domain isolation** — Extensions cannot modify core
3. **Deterministic execution** — Same input → same decision
4. **Version locked core** — CVF core immutable per version
5. **Extend without mutation** — Add, never change
6. **Freeze before deploy** — R3/R4 must freeze before production
7. **Audit everything** — Every decision must be traceable
8. **Risk never downgrades** — Escalation only
9. **Sequential phases** — No phase skipping
10. **Provider agnostic** — Business logic independent of AI model

---

## 11. Documentation Map

| Document | Purpose |
|----------|---------|
| `architecture.overview.md` | Visual architecture (Mermaid diagrams) |
| `api.reference.md` | All function signatures + error codes |
| `onboarding.guide.md` | Setup & first tasks for new developers |
| `sequence.diagrams.md` | Governance flow diagrams |
| `decisions.md` | Architectural Decision Records (ADR) |
| `dependency.map.md` | Module dependency graph |
| `mapping.index.md` | Spec → implementation cross-reference |
| `glossary.md` | 23 CVF terms defined |
| `REVIEW_BASELINE.md` | Independent review & roadmap |
| `CHANGELOG.md` | Version history |

---

## 12. Vị Trí Trong Hệ Sinh Thái CVF

| Component | Role | Status |
|-----------|------|--------|
| **CVF Core (v1.0/v1.1)** | Governance principles, phases A–D, specifications | ✅ FROZEN |
| **CVF Extensions (v1.2–v1.6)** | Capability, toolkit, usage, UX, agent platform | ✅ Production |
| **CVF Web (v1.6/cvf-web)** | Production web platform, 1068 tests | ✅ Production |
| **📘 CVF Toolkit Reference** | **Ví dụ minh họa governance engine** | 📘 Reference |
| **📘 CVF Starter Template Reference** | **Ví dụ minh họa project template** | 📘 Reference |

### Khi Nào Dùng Toolkit Reference?

- ✅ Muốn hiểu cách map CVF concepts vào TypeScript code
- ✅ Muốn tham khảo architecture cho project AI mới
- ✅ Muốn học governance enforcement patterns
- ✅ Muốn xem ví dụ risk/phase/skill/change control

### Khi Nào KHÔNG Dùng?

- ❌ Muốn PRODUCTION runtime → dùng `CVF_v1.6_AGENT_PLATFORM/cvf-web/`
- ❌ Muốn SDK cho skill contracts → dùng `CVF_v1.3_IMPLEMENTATION_TOOLKIT/typescript-sdk/`
- ❌ Muốn governance specifications → dùng `v1.0/`, `v1.1/`, `governance/`

### Lưu Ý Về Type System

Toolkit reference sử dụng type system riêng (R1–R4, P0–P6) khác với:
- CVF Core (Phases A–D, Risk R0–R3)
- cvf-web (Phases INTAKE/DESIGN/BUILD/REVIEW/FREEZE, Risk R0–R4)
- v1.3 SDK (snake_case, R0–R4)

Đây là **thiết kế có chủ đích** — mỗi implementation minh họa một cách tiếp cận khác nhau. Khi xây dựng project mới, hãy chọn type system phù hợp nhất với use case.

---

## 13. Long-Term Vision

CVF Toolkit cho phép:
- Một tổ chức xây dựng **nhiều AI system**
- Dùng chung **governance language**
- Giảm rủi ro **compliance drift**
- Giữ **consistency** giữa các team
- Scale từ 1 project → N projects mà governance không thay đổi
