# B* Merge 1 Audit — CVF_POLICY_ENGINE
> **Date:** 2026-03-21
> **Status:** AUDIT COMPLETE — Awaiting user approval before execution
> **Merge Target:** `CVF_v1.6.1_GOVERNANCE_ENGINE` + `CVF_ECO_v1.1_NL_POLICY` → `CVF_POLICY_ENGINE`
> **Auditor:** AI Assistant (directed by project owner)

---

## 1. Module Profiles

### CVF_v1.6.1_GOVERNANCE_ENGINE (Python)

| Attribute | Value |
|---|---|
| Language | Python 3.11 |
| Location | `EXTENSIONS/CVF_v1.6.1_GOVERNANCE_ENGINE/ai_governance_core/` |
| Entry point | `core_orchestrator.py` (245 lines — 8-step DI pipeline) |
| Subdirectories | 28 (policy_dsl, enforcement_layer, approval_layer, ledger_layer, identity_layer, etc.) |
| Tests | 143 (pytest, across 11 test files) |
| API | FastAPI REST (evaluate, approve, ledger, risk-convert) |
| Assessment score | 8.2/10 |
| Package manager | `pip` (`requirements.txt`) |

**Core capabilities:**
- Policy-as-Code DSL (`RULE/WHEN/THEN`) — `policy_dsl/`
- Decision Matrix + Action Router — `enforcement_layer/`
- Multi-level Approval Workflow — `approval_layer/`
- Immutable SHA256 Hash-Chain Ledger — `ledger_layer/`
- RBAC + CVF Role Mapper — `identity_layer/`
- Brand Drift Detection — `brand_control_layer/`
- CI/CD Gate — `ci/`
- CVF Adapters (Risk R0-R4, Quality, Enforcement) — `adapters/`

**Import pattern:** All 28 subdirs use **intra-package relative imports**:
```python
from policy_layer.base_policy import BasePolicyEngine
from enforcement_layer.decision_matrix import DecisionMatrix
from ledger_layer.immutable_ledger import ImmutableLedger
```

### CVF_ECO_v1.1_NL_POLICY (TypeScript)

| Attribute | Value |
|---|---|
| Language | TypeScript 5.4 |
| Location | `EXTENSIONS/CVF_ECO_v1.1_NL_POLICY/` |
| Package name | `@cvf/nl-policy` |
| Source files | 5 (~750 lines total) |
| Tests | 4 (vitest) |
| Package manager | `npm` (`package.json`) |

**Source files:**
| File | Lines | Purpose |
|------|-------|---------|
| `types.ts` | 81 | PolicyDocument, PolicyRule, PolicyConflict, PolicyTemplate types |
| `policy.compiler.ts` | 200 | NL "vibe" text → PolicyRule[] (keyword detection + constraint extraction) |
| `policy.store.ts` | 150 | In-memory CRUD + versioning + conflict detection |
| `policy.serializer.ts` | 78 | PolicyDocument ↔ JSON serialization (with schema validation) |
| `template.engine.ts` | 241 | 4 built-in templates (finance, privacy, code quality, budget) with parameter substitution |

---

## 2. Consumer Analysis

### Who imports CVF_v1.6.1_GOVERNANCE_ENGINE?

| Consumer | File | Type |
|----------|------|------|
| `CVF_v1.6_AGENT_PLATFORM` | `cvf-web/src/types/governance-engine.ts` (202 lines) | TypeScript API type stubs matching FastAPI response shapes |
| (internal) | `ci/pre_commit_hook.py` | Self-reference for git hook setup |

**Total external consumers: 1** (type stubs only, no runtime import)

### Who imports CVF_ECO_v1.1_NL_POLICY?

| Consumer | File | Type |
|----------|------|------|
| (none) | — | — |

**Total external consumers: 0**

---

## 3. Overlap Analysis

### What overlaps?

| Aspect | Governance Engine (Python) | NL Policy (TypeScript) | Overlap? |
|--------|---|---|---|
| Policy creation | DSL: `RULE/WHEN/THEN` syntax | NL: keyword detection from free text | ❌ Different paradigms |
| Policy storage | Immutable ledger (SHA256 hash-chain) | In-memory `Map<string, PolicyDocument>` | ❌ Different purposes |
| Policy types | Python dataclasses | TypeScript interfaces | ❌ Different languages |
| Enforcement | Decision Matrix → Action Router → Approval | N/A (authoring only) | ❌ No overlap |
| Serialization | JSON report builder | PolicyDocument ↔ JSON | ❌ Different schemas |
| Templates | N/A | 4 built-in governance templates | ❌ No equivalence |

### Conclusion: **Zero technical overlap.** The Phase 0 classification as "MERGE" was based on **conceptual ownership overlap** (both are "policy" subsystems) — not on code duplication.

---

## 4. Risk Assessment of Physical Move

### Python module risks:

| Risk | Severity | Detail |
|------|----------|--------|
| Break 143 tests | 🔴 HIGH | All tests use relative imports from `ai_governance_core/` root |
| Break 28 subdirectories | 🔴 HIGH | Every `from module_name.x import y` assumes current package root |
| Break CI pipeline | 🟡 MEDIUM | `main_ci.py`, `ci/github_action.yml`, `ci/pre_commit_hook.py` reference paths |
| Break FastAPI server | 🟡 MEDIUM | `api/server.py` imports from relative paths |
| Break consumer | 🟡 MEDIUM | `governance-engine.ts` type stubs reference path in comments |

### TypeScript module risks:

| Risk | Severity | Detail |
|------|----------|--------|
| Break tests | 🟢 LOW | 4 tests use local relative imports — easy to update |
| Break consumers | 🟢 NONE | Zero external consumers |

---

## 5. Recommendation

### ✅ Best approach: **Coordination Package**

Create `CVF_POLICY_ENGINE` as a thin coordination layer:

```
EXTENSIONS/CVF_POLICY_ENGINE/
  README.md           # Unified docs explaining both halves
  package.json        # TypeScript barrel for NL Policy re-exports
  src/index.ts        # Re-exports from CVF_ECO_v1.1_NL_POLICY
  tsconfig.json
```

**Original modules stay in place** with added "Part of CVF_POLICY_ENGINE" banners.

### Why this is optimal:

1. **Zero breaking changes** — neither Python nor TypeScript imports affected
2. **Git history fully preserved** — no file moves
3. **Rollback is trivial** — delete `CVF_POLICY_ENGINE/` directory
4. **Ownership overlap formally closed** — unified README clarifies relationship
5. **TypeScript barrel** provides single import point for future consumers
6. **Python stability** — 143 tests continue passing without any changes

### Why NOT physical move:

1. Would break **143 Python tests** requiring mass refactoring of relative imports
2. Would break **28 subdirectories** of intra-package imports
3. Gain is purely cosmetic — no functional benefit
4. Violates Roadmap Core Principle #2: "Extension lineage is preserved unless evidence proves consolidation is better"
5. The evidence shows consolidation is **not better** for a multi-language module pair

---

## 6. Implementation Plan (if approved)

### Files to create:
1. `EXTENSIONS/CVF_POLICY_ENGINE/README.md` — unified documentation
2. `EXTENSIONS/CVF_POLICY_ENGINE/package.json` — TypeScript barrel package
3. `EXTENSIONS/CVF_POLICY_ENGINE/src/index.ts` — re-exports from NL Policy
4. `EXTENSIONS/CVF_POLICY_ENGINE/tsconfig.json` — TypeScript config

### Files to modify:
5. `EXTENSIONS/CVF_v1.6.1_GOVERNANCE_ENGINE/ai_governance_core/README.md` — add coordination banner
6. `EXTENSIONS/CVF_ECO_v1.1_NL_POLICY/README.md` — add coordination banner

### Verification:
- Original Python tests: `cd CVF_v1.6.1_GOVERNANCE_ENGINE/ai_governance_core && python -m pytest tests/ -v`
- Original TypeScript tests: `cd CVF_ECO_v1.1_NL_POLICY && npm run test`
- New package TypeScript check: `cd CVF_POLICY_ENGINE && npx tsc --noEmit`
