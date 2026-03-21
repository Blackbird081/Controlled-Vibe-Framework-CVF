# CVF v1.7.3 — Runtime Adapter Hub

> This source module now participates in the approved `B* Merge 3` wrapper surface:
> canonical wrapper: `EXTENSIONS/CVF_MODEL_GATEWAY/`
> execution class: `wrapper/re-export merge`

> **This extension is part of the [Controlled Vibe Framework (CVF)](../../README.md).**
> CVF gốc (v1.0–v1.7.2) là chuẩn tuyệt đối. Extension này bổ sung runtime adapter abstraction.

---

## Relationship to CVF

| Layer | What | Status |
|-------|------|--------|
| v1.7 | Controlled Intelligence | ✅ STABLE |
| v1.7.1 | Safety Runtime (Policy Engine, Auth, DI) | ✅ STABLE |
| v1.7.2 | Safety Dashboard (Non-Coder UI) | ✅ STABLE |
| **v1.7.3** | **Runtime Adapter Hub** ← This extension | 🆕 NEW |

CVF v1.7.3 adds:

- **Universal runtime adapter contracts** — CVF can sit above any AI runtime
- **5 adapter implementations** — OpenClaw, PicoClaw, ZeroClaw, Nano, Release Evidence
- **Explainability layer** — Human-readable action explanations (EN/VI)
- **Natural language policy parser** — Write policies in plain language
- **JSON-driven risk models** — Configurable risk matrices

---

## Architecture

```
User (Non-coder)
        ↓
LLM (via LLMAdapter contract)
        ↓
CVF Safety Runtime (v1.7.1)
        ↓
Runtime Adapter Hub (v1.7.3)  ← This extension
  ├── OpenClaw Adapter (filesystem + shell + http)
  ├── PicoClaw Adapter (filesystem only)
  ├── ZeroClaw Adapter (http only)
  └── Nano Adapter (sandboxed delegation)
        ↓
System / Tools
```

CVF v1.7.3 does **NOT** replace v1.7.1. It provides the adapter layer below it.

---

## Quick Start

```bash
cd EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB
npm install
npm test        # Run tests
npm run typecheck  # Type check
```

---

## Module Overview

| Module | Purpose | Files |
|--------|---------|-------|
| `contracts/` | Universal adapter interfaces | 5 interfaces + barrel |
| `adapters/` | Runtime implementations | 5 adapters + shared base |
| `explainability/` | Human-readable explanations (EN/VI) | 1 |
| `policy/` | NLP policy parser | 1 |
| `risk_models/` | JSON risk configuration | 4 JSON files |

---

## Design Principles

1. **Contract-first** — All adapters implement `RuntimeAdapter` interface
2. **Runtime-agnostic** — Swap backends without changing CVF core
3. **Non-coder-centric** — Explainability in natural language
4. **Safe defaults** — No direct execution without CVF policy check
5. **CVF gốc > Extension** — This is supplementary, never core

---

## Strategic Background

For the full competitive analysis and strategic positioning rationale, see:
[CVF_HYPERVISOR_STRATEGY.md](../../docs/reference/CVF_HYPERVISOR_STRATEGY.md)

---

*Created: February 28, 2026 | CVF v1.7.3*
