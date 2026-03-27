# CVF Architecture Check Guard

**Guard Class:** `PACKAGE_AND_RUNTIME_ALIGNMENT_GUARD`
**Status:** Active structure-review contract before adding a new version, layer, extension, module, or major architectural change to CVF.
**Applies to:** Humans and AI agents proposing a new CVF version, layer, extension, module, structural refactor, or governance surface that changes architecture truth.
**Enforced by:** `docs/CVF_CORE_KNOWLEDGE_BASE.md`, `docs/CVF_ARCHITECTURE_DECISIONS.md`

## Purpose

- stop duplication, overlap, or structural contradiction before implementation begins
- ensure every new addition lands in the right layer and builds on the right prior surface
- protect backward compatibility and architectural coherence as CVF grows

## Rule

Before proposing or implementing a new feature, version, layer, extension, module, or structural refactor in CVF, read `docs/CVF_CORE_KNOWLEDGE_BASE.md` and explicitly state:

1. which layer the proposal belongs to
2. whether it overlaps with any existing version or module
3. which existing parts it builds upon or extends
4. which principles from the Knowledge Base it must not violate

### CVF Extension Rules

These three rules apply to everything added to CVF and take priority over other structural preferences:

| Rule | Meaning |
|---|---|
| `R1` | the current CVF structure is the ground truth unless an ADR plus approval changes it |
| `R2` | additions must interoperate with existing versions instead of silently replacing them |
| `R3` | naming and governance must follow the active CVF standards |

Violation of any of these rules is enough to reject the proposal immediately.

### Trigger Conditions

| Action | Triggers Check? |
|---|:---:|
| proposing a new CVF version | Yes |
| adding a new layer, module, or component | Yes |
| creating a new extension folder under `EXTENSIONS/` | Yes |
| adding a new governance guard or policy | Yes |
| refactoring an existing layer's architecture | Yes |
| adding individual skills to an existing domain | No |
| fixing a bug in existing code | No |
| updating documentation for an existing feature | No |
| adding tests for existing features | No |

### Required Checklist

Before implementation, answer all of these:

1. layer placement
2. principle compliance
3. overlap check against existing versions or modules
4. risk-model compatibility
5. safety-kernel compatibility
6. governance guard coverage
7. compatibility-gate expectations
8. ADR requirement
9. Knowledge Base update requirement

### Mandatory AI-Agent Preamble

When an AI agent is asked to add something new to CVF, it must begin with:

```text
## Architecture Check (CVF_ARCHITECTURE_CHECK_GUARD)

I have read docs/CVF_CORE_KNOWLEDGE_BASE.md.

Layer placement: Layer [N] — [Layer name]
Existing overlap check: [what was compared]
Extends/builds upon: [specific existing version or module]
Principles verified: [which principles apply and how they are respected]
Compat gate: [will or will not need to run check_core_compat.py]
```

If the preamble cannot be provided truthfully, the proposal is invalid.

### Outdated Knowledge Base Rule

If `docs/CVF_CORE_KNOWLEDGE_BASE.md` is outdated:

1. stop
2. update the Knowledge Base first
3. rerun the architecture check against the updated baseline
4. document the discrepancy in `docs/CVF_ARCHITECTURE_DECISIONS.md`

## Enforcement Surface

- the canonical structural baseline is `docs/CVF_CORE_KNOWLEDGE_BASE.md`
- architecture decisions must be recorded in `docs/CVF_ARCHITECTURE_DECISIONS.md`
- reviewer or governance validation must reject proposals that skip the checklist, hide overlap, or rely on an outdated Knowledge Base

## Related Artifacts

- `docs/CVF_CORE_KNOWLEDGE_BASE.md`
- `docs/CVF_ARCHITECTURE_DECISIONS.md`
- `governance/toolkit/05_OPERATION/CVF_ADR_GUARD.md`
- `governance/toolkit/05_OPERATION/CVF_EXTENSION_VERSIONING_GUARD.md`

## Final Clause

If a proposal has not first proven where it fits in CVF, it has not yet earned the right to be implemented.
