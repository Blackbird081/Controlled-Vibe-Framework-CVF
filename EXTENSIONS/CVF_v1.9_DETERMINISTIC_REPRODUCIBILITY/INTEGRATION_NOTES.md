# CVF v1.9 — Integration Notes

## Additive Relationship with v1.8

v1.9 is **purely additive**. It does not modify any v1.8 component.

The original spec states: *"Không phá 1.8. Chỉ thêm layer deterministic."*
Translation: "Does not break 1.8. Only adds deterministic layer."

| What v1.8 provides | What v1.9 adds |
|--------------------|----------------|
| ExecutionContext schema | ExecutionRecord (9 fields, immutable) |
| Phase isolation | Context Freezer (locks context before ANALYSIS) |
| commitHash | Deterministic Hash (ensures replay matches) |
| Snapshot ID | Replay Engine (audit-only replay capability) |
| Audit Logger (requestId + traceHash) | Full ExecutionRecord with forensic replay |

## Relationship with v1.7.1

v1.9 enhances the `requestId + traceHash` audit trail from v1.7.1 into a full forensic replay system.
v1.7.1 audit: records what happened. v1.9 audit: records AND replays what happened.

## Compat Gate

```bash
python governance/compat/check_core_compat.py --base HEAD~1 --head HEAD
```

v1.9 must not break v1.7, v1.7.1, or v1.8 specs.
