# AGENT_HANDOFF

Memory class: workspace-agent-handoff

Status: ACTIVE

Purpose: compact handoff for the next agent working in this local workspace.

## Purpose

Record the current task, boundary, next action, and any operator checkpoint so
another agent can continue without guessing from chat history.

## Startup Acknowledgment

Startup acknowledged: workspace mode=`local-workspace`; active
handoff=`AGENT_HANDOFF.md`; next allowed move=`operator-selected`; parked
checkpoint=`none recorded`.

## Current Task

| Field | Value |
|---|---|
| Task | `none recorded` |
| Owner | `operator-selected agent` |
| Status | `idle` |
| Last verified workspace rule pack | See `CVF_RULE_PACKS/ACTIVE_RULE_PACK.json` |

## Boundary

This handoff is local workspace continuity. Do not record private credentials,
raw provider keys, private customer data, or unrelated chat transcript dumps.
Keep only the state needed for the next agent to resume safely.

## Next Allowed Move

Operator selection required.

## Parked Checkpoints

None recorded.

## Latest Notes

- Initial handoff template installed by the CVF rule-pack sync.

