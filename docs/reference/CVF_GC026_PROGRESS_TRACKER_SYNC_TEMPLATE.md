# CVF GC-026 Progress Tracker Sync Template

Memory class: POINTER_RECORD

Status: canonical short-form note for synchronizing a workline tracker after a governed state change.

## When To Use

Use this template whenever a governed batch changes:

- current active tranche
- last canonical closure
- authorization posture
- defer / review-required / delivered posture

## Required Block

Copy this block into a suitable baseline delta or review note:

```text
GC-026 Progress Tracker Sync Note
- Workline: <workline id>
- Trigger source: <closure packet / authorization packet / tranche review / other>
- Previous pointer: <previous short tracker posture>
- New pointer: <new short tracker posture>
- Last canonical closure: <tranche or packet id>
- Current active tranche: <id or NONE>
- Next governed move: <short statement>
- Canonical tracker updated: YES | NO
- Canonical status review updated: YES | NO
- Canonical roadmap updated: YES | NO
```

## Preferred Placement

Prefer:

- `docs/baselines/...`

The note may also appear in a short review note when a tracker sync is the main purpose of the batch.

## Related Controls

- `governance/toolkit/05_OPERATION/CVF_PROGRESS_TRACKER_SYNC_GUARD.md`
- `docs/reference/CVF_SESSION_GOVERNANCE_BOOTSTRAP.md`
