# CVF LSC-T1 Signal Ledger Source Layout And De-Dup Contract

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-06-20

Path policy: stable reference-family file retained at an undated path; dated
closure evidence lives in the worker-return and completion-review artifacts.

EPISTEMIC_PROCESS_NA_WITH_REASON: reference contract - it defines field
ownership, mapping, and de-dup rules; it makes no evidence comparison claim
that requires the full epistemic process block.

## Purpose

Define how the Learning Signal Chain (LSC) captures, normalizes, and
de-duplicates learning signals without creating a second learning-signal
core beside the existing Learning Plane intake bridge. This contract binds
worker-experience tokens (AAF-T5), finding-to-governance rows, and future
MLW3/CLI/MCP projections to one signal model.

## Scope

Applies to: the Learning Signal Chain field-ownership, severity-mapping,
disposition-authority, root-cause-derivation, and de-dup rules defined
below. Does not apply to ledger store, generator, drift checker, CLI/MCP
adapter, or runtime implementation, which are out of LSC-T1 scope per the
Claim Boundary section.

## Source Authority

- `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/learning-signal-intake-bridge.ts`
  owns `LearningSignalLane`, `LearningSignalDefectClass`,
  `LearningSignalSeverity`, `LearningSignalDisposition`,
  `LearningSignalIntakeInput`, `LearningSignalIntakeRecord`, and the
  `autonomousMutationAuthorized: false` invariant.
- `governance/compat/check_worker_experience_retrospective.py` owns
  `WORKER_EXPERIENCE_RETRO` / `WORKER_EXPERIENCE_RETRO_NA_WITH_REASON` token
  syntax and `FRICTION_LEVELS`.
- `docs/reference/worker_experience_retrospective/README.md` owns the token's
  human-readable contract and enum table.

## Non-Authority Inputs

The LSC-T0 roadmap, dispatcher classification, and two advisory rebuttals are
reconciliation inputs that shaped this contract. They are not source authority
for runtime fields; the intake bridge interfaces are.

## Existing Intake Field Ownership

These fields are owned by `LearningSignalIntakeInput` /
`LearningSignalIntakeRecord` and must be reused, not redefined:

| Field | Owner |
|---|---|
| `sourceId` | intake bridge |
| `sourceArtifact` | intake bridge |
| `sourceSummary` | intake bridge |
| `lane` (`LearningSignalLane`) | intake bridge |
| `defectClass` (`LearningSignalDefectClass`) | intake bridge |
| `severity` (`LearningSignalSeverity`: `critical`/`high`/`medium`/`low`) | intake bridge |
| `disposition` (`LearningSignalDisposition`) | intake bridge |
| `nextControlAction` | intake bridge |
| `evidenceBasis` | intake bridge |
| `autonomousMutationAuthorized` (always `false`) | intake bridge |
| `recordId`, `recordedAt`, `bridgeVersion`, `recordHash` | intake bridge (record-only) |

## LSC Extension Field Ownership

These fields do not exist on the intake bridge today. LSC owns them as
ledger-only extension fields layered on top of an intake-bridge-shaped
input, never replacing it:

| Field | Purpose |
|---|---|
| `sourceProjection` | which capture surface produced this entry: `AAF_T5_TOKEN`, `FINDING_TO_GOVERNANCE_ROW`, `MLW3_CANDIDATE`, `CLI_MCP_EVENT` |
| `rootCauseGroupId` | deterministic grouping key shared by all projections of one root cause |
| `captureState` | operational lifecycle view: `CAPTURED`/`TRIAGED`/`PARKED`/`ACCEPTED`/`PROMOTED`/`REJECTED`/`CLOSED` |
| `repeatRisk` | `POSSIBLE`/`OBSERVED_REPEATED` |

`sourceProjection`, `rootCauseGroupId`, `captureState`, and `repeatRisk` are
the only fields LSC is authorized to add at T1. No other new field may be
introduced without a fresh source-verified tranche.

## AAF-T5 Token To Intake Mapping

A `WORKER_EXPERIENCE_RETRO` token maps deterministically into either a
ledger entry or no entry at all. Mapping is keyed on `frictionLevel`.

## Severity Mapping Table

| AAF-T5 `frictionLevel` | Intake result |
|---|---|
| exact `WORKER_EXPERIENCE_RETRO_NA_WITH_REASON` asserting no-friction reason | no ledger entry |
| `NONE` | no ledger entry |
| `LOW` | `severity=low` |
| `MEDIUM` | `severity=medium` |
| `HIGH` | `severity=high` |
| `BLOCKING` | `severity=critical` |

No-friction returns (the exact NA assertion, or a structured token with
`frictionLevel: NONE`) must never produce a ledger entry. Counting
no-friction returns would pollute de-dup and trend metrics with empty
signals, defeating the purpose of capturing real friction. This table is the
baseline; a future tranche may only override it if it source-verifies a
stronger current CVF owner rule and records that verification.

`frictionType` and `preventiveControlCandidate` are carried into
`sourceSummary` / `evidenceBasis` text rather than mapped to a new intake
enum, since the intake bridge has no equivalent typed field for them at this
revision.

## Disposition And Capture-State Authority Rule

`disposition` (`LearningSignalDisposition`, owned by the intake bridge) is
the governed source of truth for every ledger entry. `captureState` is a
derived, advisory operational view layered by LSC.

Allowed-pairs table:

| `disposition` | Allowed `captureState` values |
|---|---|
| `RULE_EXISTS` | `CLOSED` |
| `RULE_ADDED` | `PROMOTED`, `CLOSED` |
| `MACHINE_CHECK_ADDED` | `PROMOTED`, `CLOSED` |
| `MACHINE_CHECK_CANDIDATE` | `CAPTURED`, `TRIAGED`, `ACCEPTED` |
| `PHASE_GATE_PLACEMENT_GAP` | `CAPTURED`, `TRIAGED` |
| `DESIGN_REVIEW_REQUIRED` | `CAPTURED`, `TRIAGED`, `ACCEPTED` |
| `RUNTIME_LEARNING_CANDIDATE` | `CAPTURED`, `TRIAGED`, `PARKED` |
| `N/A_WITH_REASON` | `REJECTED`, `CLOSED` |

Conflict rule: if a ledger entry's `captureState` is not in the allowed set
for its current `disposition`, the entry is invalid. It must be recomputed
from `disposition` using this table, never silently resolved by preferring
the existing `captureState`. `disposition` always wins.

## Root-Cause Group ID Derivation

`rootCauseGroupId` is owned and minted by the LSC ledger only. It must be
deterministically derivable, not hand-assigned by any projection, so the
same underlying lesson computes the same id no matter which surface
observes it first.

Derivation rule: a stable hash of the normalized pair
`(sourceArtifact, defectClass)`, using the repository's existing
deterministic hashing utility
(`EXTENSIONS/CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash`,
already imported by the intake bridge) over the normalized
`sourceArtifact` path and `defectClass` value. A future implementation
tranche must specify the exact normalization (path separator, case,
trailing slash) before computing hashes; LSC-T1 fixes the input pair and
hash function choice, not the byte-level normalization.

Other projections (Finding-To-Governance row, MLW3 candidate, CLI/MCP
event) must carry `rootCauseGroupId` once minted by the ledger; they must
never mint their own.

## Projection De-Dup Rule

| Projection | Role |
|---|---|
| AAF-T5 `WORKER_EXPERIENCE_RETRO` token | capture source for worker friction |
| Finding-To-Governance row | disposition view of the same root cause |
| MLW3 candidate | proposal/evidence view of the same root cause |
| CLI/MCP event (future, out of LSC-T1 scope) | external-agent capture view of the same root cause |

When two or more projections refer to the same root cause, they must share
one `rootCauseGroupId` and must not create separate ledger counts. A future
generator/checker tranche is responsible for enforcing this at write time;
LSC-T1 defines the rule, not the enforcement code.

## JSON Source Layout

Future implementation must follow
`docs/reference/CVF_JSON_GENERATED_AGGREGATE_DISCIPLINE_STANDARD_2026-06-12.md`:

- one small JSON source file per ledger entry under a future
  `docs/reference/learning_signal_chain/ledger_source/` directory (not
  created by LSC-T1);
- JSON source files are the future source of truth for ledger entries;
- a generator builds any aggregate from these source files;
- a drift checker fails if the aggregate disagrees with the sources.

LSC-T1 creates only the entry template
(`CVF_LEARNING_SIGNAL_LEDGER_ENTRY_TEMPLATE.json`), not the source directory,
generator, or drift checker.

## Generated Markdown Index Rule

A future generated, human-readable Markdown index of ledger entries must be
treated exactly like other CVF generated state (for example active session
state): generated only, never hand-edited once a generator exists, and
explicitly marked as generated at the top of the file. The Markdown index is
a readout, never a second source of truth; the JSON source files remain
authoritative. Generator and drift-checker implementation are out of LSC-T1
scope.

## CLI/MCP Minimal Payload Boundary

Per the LSC-T0 roadmap and round-1 rebuttal answer, a future external-agent
CLI/MCP capture payload must stay minimal: `signalClass`, `actorRole`,
`sourceSummary`, `severity`, `lane`. A future helper synthesizes
`sourceId`/`recordId` (pending-id pattern), `recordedAt`, `repeatRisk`
(default `POSSIBLE`), `captureState` (default `CAPTURED`), and
`autonomousMutationAuthorized=false`. No CLI/MCP adapter is implemented by
LSC-T1.

## Parking Ledger For AAF-T6/T7, CGE-T3, ACE-R1, MLW7/8

| Lane | Status | Relationship to LSC-T1 |
|---|---|---|
| AAF-T6 Guard Orientation Read-Receipt Gate | parked | future signal input only; not reopened |
| AAF-T7 friction-finding hardening | parked | future signal input only; not reopened |
| CGE-T3 external knowledge ledger | parked | future `EXTERNAL_REPO_SIGNAL` input only; not a prerequisite |
| ACE-R1 coding-evidence replay | parked | future `RUNTIME_SIGNAL`/coding-evidence input only; not a prerequisite |
| MLW7/MLW8 | parked | not reopened by this contract |

None of these lanes are required, reopened, or implemented by LSC-T1.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance reference contract for Learning Signal Chain
work. No public-sync remote, public commit, public artifact path, or public
claim is authorized.

## Delta Execution Claim Boundary Control Block

| Field | Disposition |
|---|---|
| claimScope | LSC-T1 signal-ledger source-layout and de-dup contract only |
| claimDisposition | N/A with reason: no Delta execution-control claim is made |
| receiptEvidence | N/A with reason: no Delta receipt evidence is created or consumed |
| actionEvidence | N/A with reason: no runtime action is executed or observed |
| invocationBoundary | documentation/reference and JSON-template authoring only |
| interceptionBoundary | no direct IDE/shell/git/filesystem/provider interception claim |
| claimLanguage | source-layout contract, de-dup rule, schema template, and generated-index decision only |
| forbiddenExpansion | wrapper/proxy enforcement, arbitrary-command execution, EDIT/COMMIT execution, provider/live, public-sync, queue/daemon, watcher, readiness, full-hook equivalence, and universal control remain out of scope |

## Claim Boundary

This contract defines field ownership, mapping, and de-dup rules only. It
does not implement a ledger store, generator, drift checker, helper
readout, runtime Learning Plane mutation, provider/live proof, CLI/MCP
adapter behavior, public-sync, direct interception, wrapper/proxy
enforcement, queue/daemon, watcher, readiness, cost optimization,
full-hook equivalence, or universal governed-coding control.
