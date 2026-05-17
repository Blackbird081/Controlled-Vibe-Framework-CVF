# CVF v2.0 — Creative Mode Specification (Authoritative)

> **Status:** AUTHORITATIVE — supersedes v1.7.1 Creative Control layer docs (ADR-010)
> **Layer:** 4/5

---

## Three Modes

### SAFE Mode
- **Use when:** Non-coder wants maximum safety, no surprises
- **Risk budget:** R0–R1 only (score 0–5)
- **Mutation limits:** max 2 files, max 50 lines per execution
- **Scope:** Single domain, single responsibility
- **Confirmation:** Always required before any file change
- **Auto-rejected at:** Any action scoring R2+ or cross-domain

### BALANCED Mode (Default)
- **Use when:** Normal development work
- **Risk budget:** R0–R2 (score 0–10)
- **Mutation limits:** max 5 files, max 150 lines per execution
- **Scope:** Cross-domain allowed
- **Confirmation:** Required only for R2 actions
- **Auto-rejected at:** Any action scoring R3+

### CREATIVE Mode
- **Use when:** Experimental work, prototyping, AI-driven exploration
- **Risk budget:** R0–R3 (score 0–15)
- **Mutation limits:** max 10 files, max 300 lines per execution
- **Scope:** Broad — multiple domains, architecture changes allowed
- **Confirmation:** Required for R3 actions
- **Auto-rejected at:** Any action scoring R3+ (16+) — no exceptions

---

## Mode-Kernel Mapping

| User selects | Kernel receives |
|-------------|----------------|
| SAFE | mutationBudget={files:2, lines:50}, riskCeiling=R1, confirmAll=true |
| BALANCED | mutationBudget={files:5, lines:150}, riskCeiling=R2, confirmR2=true |
| CREATIVE | mutationBudget={files:10, lines:300}, riskCeiling=R3, confirmR3=true |

The kernel treats these as **hard limits**, not guidelines.

---

## Stability Index Override

Regardless of mode selected, if:
- `stabilityIndex < 70` → Force SAFE mode
- `stabilityIndex < 50` → Disable CREATIVE mode entirely

The user can see the stability index in the Safety Dashboard (v1.7.2) but cannot override kernel enforcement.
