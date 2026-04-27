# CVF W129 Stage A Signal Capture Evidence

> Date: 2026-04-27
> Source: dedicated Playwright live signal-capture spec (`w129-stage-a-signal-capture.live.spec.ts`)
> Status: EXPLICIT ROUTING SIGNAL CAPTURED

## Live Proof

- Live governed execution status: `200`
- Governance decision surfaced: `ALLOW`
- Provider lane: `alibaba / qwen-turbo`

## Browser-Local Analytics

- Total events captured: `12`
- `rollout_flag_enabled`: `6`
- `rollout_session_start`: `1`
- `intent_routed`: `5`
- `clarification_weak_confidence_detected`: `0`
- `clarification_browse_fallback`: `0`

## Lane Readout

| Lane | Status | Metric | Note |
|---|---|---|---|
| `entry_routing` | **healthy** | 0% | 0% fallback to browse. |
| `trusted_form` | **healthy** | 0% | Trusted form routing shares the weak-fallback signal. A decreasing trend confirms form routing is absorbing formerly-weak routes. |

## Continuation Posture

- This artifact resolves the W129 proof-scope gap for explicit Stage A routing signal.
- It does not by itself satisfy the Stage B playbook threshold of `>=10 execution_created` events.
- W130 remains blocked until continuation authorization criteria are explicitly met.
