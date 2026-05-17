# CVF Surface Scan Continuity Guard

**Control ID:** `GC-041`
**Guard Class:** `CONTINUITY_AND_DECISION`
**Status:** Active mandatory continuity rule for tranche-opening scan inheritance and current surface-state truth.
**Applies to:** humans and AI agents opening a fresh quality assessment, selecting the next tranche, or updating the canonical scan state for governed worklines.
**Enforced by:** `governance/compat/check_surface_scan_registry.py`, `governance/compat/CVF_SURFACE_SCAN_REGISTRY.json`

## Purpose

- stop future agents from re-scanning the same repo surfaces because prior scan truth only lived in prose
- keep tranche-opening decisions tied to one machine-readable continuity surface instead of scattered handoff notes
- preserve the difference between `already scanned`, `closed`, `not yet scanned`, and `closed-by-default`

## Rule

Before opening a fresh tranche or claiming a surface is the next open candidate:

1. consult `governance/compat/CVF_SURFACE_SCAN_REGISTRY.json`
2. inherit the last canonical scan state from that registry instead of re-scanning by default
3. update the same registry when scan posture materially changes
4. keep `AGENT_HANDOFF.md` and `docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md` pointing to the registry as the continuity front door

### Mandatory Registry Fields

Each registered surface MUST declare:

- `id`
- `surfaceClass`
- `status`
- `lastScannedAt`
- `scopePaths`
- `canonicalSource`
- `nextAction`
- `reopenCondition`
- `evidenceRefs`

### Operating Rule

The registry is continuity truth, not a replacement for evidence.

It records what has already been scanned and what the next worker should do, while audits, reviews, closure packets, and tracker sync notes remain the evidence layer that justifies that state.

## Enforcement Surface

- repo-level enforcement runs through `governance/compat/check_surface_scan_registry.py`
- local pre-push enforcement runs through `governance/compat/run_local_governance_hook_chain.py`
- CI enforcement runs through `.github/workflows/documentation-testing.yml`

## Related Artifacts

- `governance/compat/CVF_SURFACE_SCAN_REGISTRY.json`
- `AGENT_HANDOFF.md`
- `docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md`
- `docs/reference/CVF_CONTEXT_CONTINUITY_MODEL.md`
- `docs/reference/CVF_SESSION_GOVERNANCE_BOOTSTRAP.md`
- `governance/compat/check_surface_scan_registry.py`

## Final Clause

If CVF does not preserve what was already scanned, every new tranche wastes time relearning yesterday's truth before it can do today's work.
