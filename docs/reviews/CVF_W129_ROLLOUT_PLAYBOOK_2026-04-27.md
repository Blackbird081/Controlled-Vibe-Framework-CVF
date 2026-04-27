# CVF W129 Controlled Rollout Playbook

> Date: 2026-04-27
> Tranche: W129-T1
> Status: LOCKED

---

## 1. Flag Roster

| Stage | Flag | Default | W129 Action |
|---|---|---|---|
| A | `NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR` | false | **ENABLE in CP1** |
| B | `NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP` | false | Enable in CP1-B only after Stage A has ≥10 executions |
| C | `NEXT_PUBLIC_CVF_NONCODER_ITERATION_MEMORY` | false | Deferred — only after Stage A+B have accepted executions |
| — | Trusted-form routing (W126) | always active | No change |

## 2. Rollout Order

```
Stage A  →  Stage B  →  Stage C (optional)
```

One stage per CP. No parallel enables.

## 3. Enable Criteria

| Stage | Can enable when |
|---|---|
| A | GC-018 issued (done); `.env.local` updated; readout baseline captured |
| B | Stage A has ≥10 `execution_created` events AND `entry_routing` lane is NOT `action_required` |
| C | Stage B has ≥5 `clarification_question_asked` events AND `clarification_recovery` lane is NOT `action_required` |

## 4. Hold Criteria (pause, do not enable next stage)

- Any lane moves to `action_required` — hold all further flag enables
- Fewer than 3 governed executions in the observation window after flag enable

## 5. Rollback Criteria

- `weak_fallback_rate` > 60% after ≥10 events → rollback Stage A
- `route_recovery_rate` = 0% after ≥5 clarification triggers → rollback Stage B
- Any unhandled runtime error traceable to a noncoder flag → rollback that flag immediately

## 6. Minimum Observation Window

- Stage A: minimum 1 governed session before reading lane status
- Stage B: minimum 3 clarification interactions before reading recovery rate
- `no_data` threshold: < 5 events in the relevant event set = remain `no_data`

## 7. Rollout Sequence in W129

| CP | Action |
|---|---|
| CP1 | Enable Stage A flag; capture readout baseline |
| CP2 | Instrument `rollout_flag_enabled` + `rollout_session_start` events |
| CP3 | Run live governed sessions via Alibaba lane; verify entry_routing exits `no_data` |
| CP4 | Publish first signal readout; lock continuation decision |
| CP5 | Handoff + closure |
