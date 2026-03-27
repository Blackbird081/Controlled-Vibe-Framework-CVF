# CVF Progress Tracker Sync Guard

**Control ID:** `GC-026`
**Guard Class:** `CONTINUITY_AND_DECISION_GUARD`
**Status:** Active tracker-freshness rule that keeps canonical progress pointers aligned with governed tranche truth.
**Applies to:** all governed tranche, continuation, closure, or equivalent workline state changes that alter canonical progress posture.
**Enforced by:** `governance/compat/check_progress_tracker_sync.py`

## Purpose

- keep canonical tracker pointers aligned with repo truth after closure or authorization changes
- prevent session bootstrap from routing through stale progress readouts
- require one short standardized sync note instead of relying on ad hoc tracker edits

## Rule

Whenever a governed tranche, continuation packet, closure packet, or equivalent workline state change is completed, the responsible worker must:

1. update the canonical progress tracker for that workline
2. leave one standardized tracker-sync note using the canonical `GC-026` form
3. ensure the tracker now states the correct current active tranche and last canonical closure

Canonical template:

- `docs/reference/CVF_GC026_PROGRESS_TRACKER_SYNC_TEMPLATE.md`

### Minimum Required Sync

This guard does not require a full status review rewrite after every tranche.

It does require:

- one updated tracker pointer
- one short sync note that states what changed

The sync note is the minimum durable explanation for the pointer update.

### When `GC-026` Triggers

`GC-026` is mandatory whenever a governed change updates any of these state classes:

- `AUTHORIZED`
- `DONE`
- `CLOSED DELIVERED`
- `DEFERRED`
- `REVIEW REQUIRED`
- current active tranche changed
- last canonical closure changed

Typical trigger examples:

- a tranche closure review is issued
- a continuation candidate changes current authorization posture
- a tranche-local execution wave finishes and the tracker should move forward
- a validation wave advances its last canonical closure

### What This Guard Does Not Require

`GC-026` does not require:

- a full roadmap rewrite after every tranche
- a fresh long-form assessment after every tranche
- redundant duplication of closure truth across every canonical document

The guard only requires enough sync to keep bootstrap routing truthful.

### Standardized Sync Form

Every tracker sync note should record:

- workline
- trigger source
- previous pointer
- new pointer
- last canonical closure
- current active tranche
- next governed move
- whether tracker, status review, and roadmap were updated

## Enforcement Surface

- mandatory by policy
- reviewable through tracker files and tracker-sync notes
- machine-enforced at repo level by `governance/compat/check_progress_tracker_sync.py`
- surfaced in local hook and CI so stale tracker posture cannot silently pass

This guard enforces tracker alignment for registered worklines. It does not claim to infer every product milestone automatically without governed artifacts.

## Related Artifacts

- `docs/reference/CVF_GC026_PROGRESS_TRACKER_SYNC_TEMPLATE.md`
- `docs/reference/CVF_SESSION_GOVERNANCE_BOOTSTRAP.md`
- `docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md`
- `governance/compat/CVF_PROGRESS_TRACKER_REGISTRY.json`
- `governance/compat/check_progress_tracker_sync.py`

## Final Clause

Bootstrap can only stay truthful if the tracker front door stays current.
