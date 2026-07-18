# CVF L2A-T0 Learning-To-Acceleration Classification Standard

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-06-22

Index classification: GOVERNED_DOC (not an INDEX_ARTIFACT). This is a canonical
classification standard authorized by the L2A-T0 GC-018 baseline. Per the INDEX
classification standard, a GOVERNED_DOC is not labeled with an INDEX type.

EPISTEMIC_PROCESS_NA_WITH_REASON: classification standard - it defines a
taxonomy and routing questions; it makes no evidence comparison verdict
requiring the full epistemic process block.

## Purpose

Define the Learning-To-Acceleration (L2A) loop. Finding-To-Governance (F2G)
already turns a repeated finding into prevention work: a reminder, a rule, a
machine check, or an earlier phase gate. The Agent-Error-To-Governance
Escalation Ladder formalizes that prevention path.

L2A adds the missing second direction. A repeated finding is not only a defect
to prevent; it can also be mechanical work to accelerate. When the same
hand-authored structure, table, or boilerplate must be produced again and again,
the lesson is not only "remind the worker" but also "let the worker spend less
effort next time, safely."

L2A classifies each repeated finding on two axes at once:

- prevention: does this need a reminder, rule, checker, or phase-gate (F2G owns
  this);
- acceleration: can this safely become a helper, scaffold, patch preview, or
  template that reduces future labor (L2A owns this).

## Scope / Target / Owner Boundary

Target: any repeated, reusable, or future-agent finding already eligible for F2G
classification. L2A is consulted alongside F2G, not instead of it.

Owner: CVF governance control chain - the same owner surface as F2G, the
agent-error learning philosophy, and the autorun workflow.

Boundary: L2A is a documentation/reference classification standard only. It does
not implement a helper, scaffold, checker, patch-preview engine, or apply mode.
It does not authorize runtime behavior, provider behavior, public claims, or any
automatic acceleration. Classifying a finding as an acceleration candidate is a
routing decision; building the accelerator is always a separate, operator-
selected, governed tranche.

## Relationship To Finding-To-Governance

F2G remains the source learning surface and the machine-enforced trigger. Every
material finding still records its F2G disposition (defect class, learning lane,
disposition, next control action, handled/deferred).

L2A is an extension layer:

- F2G answers "what prevents recurrence of this error?"
- L2A additionally answers "can this repeated work be made cheaper to do
  correctly next time?"

A finding may carry both. For example, a repeated missing-section defect can be
`MACHINE_CHECK_CANDIDATE` for prevention (F2G) and `SCAFFOLD_CANDIDATE` for
acceleration (L2A) - the checker blocks the omission, the scaffold makes the
section present from the start so the checker rarely fires.

L2A does not change F2G checker semantics. F2G keeps its own minimum lanes,
dispositions, and defect classes. L2A adds an `accelerationDisposition` that an
artifact may record next to the F2G row when acceleration is relevant.

## Classification Taxonomy

`accelerationDisposition` records one of these tokens for a repeated finding:

| Token | Meaning |
|---|---|
| `NO_ACCELERATION_APPLICABLE` | No safe or worthwhile acceleration exists; prevention via F2G is the whole response. State the reason. |
| `REMINDER_ONLY` | Surface the lesson early (orientation index row, helper readout) without blocking and without generating anything. |
| `CHECKER_CANDIDATE` | Better served by a machine check than an accelerator; route to the F2G machine-check path. |
| `PHASE_GATE_CANDIDATE` | The control exists but runs too late; route to earlier autorun/hook placement (Escalation Ladder bottom rung). |
| `ACCELERATOR_CANDIDATE` | Repeated labor could be reduced by a read-only helper that suggests or assembles, with human review. |
| `SCAFFOLD_CANDIDATE` | A generated skeleton or template would remove repeated boilerplate authoring. |
| `PATCH_PREVIEW_CANDIDATE` | A non-mutating patch preview could show the correct change for human approval. |
| `TEMPLATE_CANDIDATE` | A static template update (no code) would carry the required structure forward. |
| `ACCELERATOR_ADDED` | An accelerator was actually delivered in a governed tranche; cite the artifact. |

`CHECKER_CANDIDATE` and `PHASE_GATE_CANDIDATE` overlap with F2G on purpose: L2A
may decide that the safest "acceleration" of a repeated defect is simply to make
the machine catch it earlier, so the worker never spends effort on the wrong
shape. Prevention and acceleration are not always different actions.

## Acceleration Safety Levels

Any accelerator candidate must declare the safe automation level it targets.
Levels are ordered from least to most powerful; nothing above read-only is
authorized by L2A itself.

| Level | Behavior | Human boundary |
|---|---|---|
| L0 read-only suggestion | Helper prints what is missing or recommended; changes nothing. | Human authors every change. |
| L1 scaffold generation | Helper writes a new skeleton file or section with required structure and empty fields. | Human fills content and reviews before use. |
| L2 patch preview | Helper computes a proposed diff and shows it; does not apply. | Human reviews and applies manually. |
| L3 allowlisted apply with postcondition checker | A future, separately governed helper applies a tightly allowlisted change and a checker verifies the postcondition. | Human authorizes the allowlist and the postcondition gate; never silent. |

L3 is explicitly future work. L2A authorizes describing it as a target only. No
apply mode, patch application, or EDIT/COMMIT behavior is authorized by this
standard.

## Required Classification Questions

When an artifact records a repeated or generalizable finding and consults L2A,
it answers:

| Question | Required treatment |
|---|---|
| What was the repeated friction? | short, source-backed finding statement |
| Is prevention needed? | record the F2G disposition (reminder, rule, checker, phase-gate) |
| Is acceleration possible? | record an `accelerationDisposition` token |
| What is the safe automation level? | L0 read-only, L1 scaffold, L2 patch preview, or L3 future allowlisted apply |
| What must remain human-reviewed? | the review boundary and any required postcondition checker |
| What future tranche, if any, should implement it? | name the candidate lane without dispatching it |

If acceleration is not applicable, the artifact records
`NO_ACCELERATION_APPLICABLE` with a reason. L2A never forces an accelerator to
exist; it forces the question to be answered.

## Example Use Cases

These are illustrative routings, not implemented behavior.

- Repeated worker-return missing `## Scope / Applies To`, `## Risk / Corrective
  Action`, or the External-Intake/Rescan tables (a real recurring friction):
  F2G `MACHINE_GATE_GAP` / `MACHINE_CHECK_CANDIDATE` for prevention; L2A
  `SCAFFOLD_CANDIDATE` at L1 - a generated worker-return skeleton with all
  required sections present so the worker fills rather than recalls them.
- Repeated stale "actual line count" or stale base-head evidence: F2G
  `MACHINE_CHECK_ADDED`; L2A `NO_ACCELERATION_APPLICABLE` - the fix is
  verification, not generation.
- AAF-T7A closure-conversion assistance (one example use case, not the whole
  lane): a future helper that, after an accepted worker return, drafts the
  reviewer completion-review skeleton from the worker-return packet. L2A
  classifies this as `ACCELERATOR_CANDIDATE` at L1/L2 (scaffold or patch
  preview), with the reviewer owning every accepted line and a postcondition
  checker required before any L3 apply mode is ever considered. AAF-T7A is one
  instance of the L2A loop, not its definition.

## Non-Goals

- L2A does not replace F2G, the Escalation Ladder, or any machine checker.
- L2A does not implement any helper, scaffold, checker, patch-preview engine, or
  apply mode.
- L2A does not claim future agents are automatically accelerated or that any
  accelerator reduces cost, latency, or error without its own proof.
- L2A does not authorize runtime, provider/live, public-sync, CLI/MCP adapter,
  or EDIT/COMMIT behavior.
- L2A does not weaken any human-review boundary; acceleration never means
  removing the human author or reviewer.

## Claim Boundary

This standard defines a classification taxonomy and routing questions for the
Learning-To-Acceleration loop. It does not prove that any accelerator exists,
works, is safe at scale, or improves productivity. Every accelerator, scaffold,
patch preview, checker, or phase-gate named here remains a candidate until a
separate operator-selected governed tranche implements and proves it. L2A does
not authorize helper implementation, scaffold generation, patch application,
autorun/hook wiring, runtime behavior, provider behavior, CLI/MCP behavior,
public-sync, readiness claims, speed or cost claims, or universal
governed-coding control.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: L2A-T0 is private provenance governance-learning foundation work. No
public-sync remote, public commit, public artifact path, or public claim is
authorized.

## Delta Execution Claim Boundary Control Block

| Field | Disposition |
|---|---|
| claimScope | L2A-T0 classification standard only |
| claimDisposition | N/A with reason: no Delta execution-control behavior is implemented or claimed |
| receiptEvidence | N/A with reason: no Delta receipt is created or consumed |
| actionEvidence | N/A with reason: no runtime action is executed or observed |
| invocationBoundary | governed documentation/reference classification only |
| interceptionBoundary | no IDE/shell/git/filesystem/provider interception claim |
| claimLanguage | learning classification and acceleration candidate taxonomy only |
| forbiddenExpansion | helper implementation, scaffold generator, patch application, wrapper/proxy enforcement, arbitrary-command execution, EDIT/COMMIT execution, provider/live, public-sync, queue/daemon, watcher, readiness, full-hook equivalence, and universal control remain out of scope |

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | worker |
| Provider or surface | local workspace |
| Session or invocation | L2A-T0 worker execution, 2026-06-22 |
| Working directory | repository root |
| Command or tool surface | source reads, file creation, required gates |
| Target paths | this standard; the L2A front-door README; the F2G pointer update; the worker-return artifact |
| Allowed scope source | L2A-T0 work order Allowed Scope |
| Before status evidence | executionBaseHead recorded in the worker-return artifact; clean worktree before worker edits |
| After status evidence | L2A reference deliverables present and uncommitted |
| Diff evidence | recorded in the worker-return artifact `git status --short` |
| Approval boundary | worker authoring only; no commit, no helper/checker/runtime implementation |
| Claim boundary | classification standard only |
| Agent type | worker |
| Invocation ID | `l2a-t0-classification-standard-worker-2026-06-22` |
| Expected manifest | L2A standard, front-door README, F2G pointer, worker return |
| Actual changed set | recorded in the worker-return artifact |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename |
