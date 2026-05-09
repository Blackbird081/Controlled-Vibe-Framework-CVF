# CVF Architecture

CVF is a governance control plane. Its job is to control how AI and agents are
allowed to act, not to replace the agents or providers that perform the work.

## Canonical Flow

```text
request
  -> intake and context assembly
  -> risk classification
  -> policy and approval gate
  -> provider or agent adapter
  -> execution
  -> DLP/redaction and output validation
  -> audit receipt
  -> governed result
```

## Planes

| Plane | Responsibility |
|---|---|
| Guard Contract | Shared types, rules, enforcement primitives, runtime helpers. |
| Control Plane | Intake, routing, context packaging, knowledge selection, provider selection. |
| Execution Plane | Dispatch, command/runtime boundary, policy gate, async execution status. |
| Governance Expansion | Checkpoints, watchdogs, audit logs, reintake, external asset governance. |
| Learning Plane | Feedback ledger, truth score, pattern detection, drift, reinjection. |
| Web Surface | Operator/non-coder visibility and control surface over governed paths. |

## Provider And Agent Boundary

CVF does not need to own the model or the worker agent. A provider, plugin,
tool, or external agent connects to CVF through an adapter boundary.

The adapter must make governance-visible facts available:

- selected provider/model
- request metadata
- risk and policy decision
- output validation result
- token/cost signal where available
- audit receipt reference

## Local-First Posture

The default deployment posture is local-first. Developers can clone and run CVF
on their own machine. Web exists to make the same controls visible and usable,
especially for non-coders and operators.

Managed/cloud persistence can be added later, but it must not become the only
valid way to use CVF.

## Web Boundary

`cvf-web` is a control surface. It is not the whole CVF runtime.

The web app helps users:

- submit governed requests
- see risk and provider posture
- inspect evidence receipts
- run protected governance jobs
- operate non-coder workflows

Claims about web governance must still be backed by live provider evidence.

