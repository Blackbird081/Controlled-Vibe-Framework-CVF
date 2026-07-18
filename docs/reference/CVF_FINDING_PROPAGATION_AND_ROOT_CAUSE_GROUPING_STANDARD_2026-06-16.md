# CVF Finding Propagation And Root Cause Grouping Standard

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

docType: reference_standard

Date: 2026-06-16

Owner: CVF governance control plane

Batch ID: FPRC-T1

EPISTEMIC_PROCESS_NA_WITH_REASON: reference standard defining vocabulary and rules, not an evidence-heavy analysis packet requiring prediction/comparison/contradiction sections.

---

## Purpose

Define a governed vocabulary and table structure for grouping repeated
artifact-level findings under their root cause. CVF evidence must distinguish
one root defect from its propagated symptoms, evidence replications, stale-sync
fallout, and reviewer-repair side effects. This standard also defines the
Provider Memory Learning Escape Guard and the Boundary-Prose Trigger Discipline.

---

## Scope

In scope:

- root-cause grouping vocabulary and table structure for completion reviews and
  finding-bearing audits;
- Provider Memory Learning Escape Guard;
- Boundary-Prose Trigger Discipline;
- example root cause table.

Out of scope:

- replacing the existing `## Finding-To-Governance Learning Disposition` section;
- deleting or suppressing artifact-local guard output;
- retrofitting all historical findings;
- runtime, provider, live proof, public-sync, or legacy absorption work.

---

## Root Cause To Propagated Findings

### Vocabulary

| Term | Definition |
|---|---|
| `ROOT_CAUSE` | The single originating control-plane defect that generates multiple downstream failures. One batch typically has one or a small number of root causes. |
| `PROPAGATED_SYMPTOM` | A file-level failure that would not have occurred without the root cause. The same authoring error appearing in three artifacts is one root cause with three propagated symptoms. |
| `EVIDENCE_REPLICATION` | A finding that appears multiple times because the same evidence was copied or referenced across artifacts. Not a new root cause; cite the original source instead. |
| `STALE_SYNC` | A failure caused by a synchronized artifact (handoff, session state, memory) retaining an older value after the root-cause artifact was updated. Not a new defect; trace to the root-cause update. |
| `REVIEWER_REPAIR_SIDE_EFFECT` | A finding introduced by the reviewer's repair of the root cause rather than by the original worker. Record separately so it does not inflate the worker blame count. |

### Defect Role Field

Use the `defectRole` field in a finding row to declare the role of that finding
relative to the batch's root cause:

| `defectRole` value | Meaning |
|---|---|
| `ROOT_CAUSE` | This is the originating defect. |
| `PROPAGATED_SYMPTOM` | This is a downstream failure caused by the root defect; cite `upstreamCause`. |
| `EVIDENCE_REPLICATION` | This is a repeated copy of the root-cause finding; cite `upstreamCause`. |
| `STALE_SYNC` | This is a sync-lag artifact; cite `upstreamCause` and the update event. |
| `REVIEWER_REPAIR_SIDE_EFFECT` | This was introduced by reviewer repair; record separately. |

### Root Cause To Propagated Findings Table

Completion reviews and finding-bearing audits may include a
`## Root Cause To Propagated Findings` section with the following table:

| `rootFindingId` | `defectRole` | `owningArtifact` | `symptomFindingId` | `upstreamCause` | `blockingLevel` |
|---|---|---|---|---|---|
| `RF-<date>-<seq>` | `ROOT_CAUSE` | path or doc type | n/a | n/a | BLOCKING or REPAIR_REQUIRED or ADVISORY or N/A_WITH_REASON |
| n/a | `PROPAGATED_SYMPTOM` | path or doc type | `SF-<date>-<seq>-<letter>` | `RF-<date>-<seq>` | `REPAIR_REQUIRED` |
| n/a | `EVIDENCE_REPLICATION` | path or doc type | `SF-<date>-<seq>-<letter>` | `RF-<date>-<seq>` | `ADVISORY` |
| n/a | `STALE_SYNC` | path or doc type | `SF-<date>-<seq>-<letter>` | `RF-<date>-<seq>` + update event | `REPAIR_REQUIRED` |
| n/a | `REVIEWER_REPAIR_SIDE_EFFECT` | path or doc type | `SF-<date>-<seq>-<letter>` | reviewer repair of `RF-<date>-<seq>` | `ADVISORY` |

### Example Root Cause Table (Illustrative)

Context: a worker copied a stale template field into three review artifacts and
the session handoff retained the stale value.

| `rootFindingId` | `defectRole` | `owningArtifact` | `symptomFindingId` | `upstreamCause` | `blockingLevel` |
|---|---|---|---|---|---|
| `RF-2026-06-16-001` | `ROOT_CAUSE` | work order template | n/a | n/a | `BLOCKING` |
| n/a | `PROPAGATED_SYMPTOM` | `docs/reviews/CVF_REVIEW_A.md` | `SF-2026-06-16-001-A` | `RF-2026-06-16-001` | `REPAIR_REQUIRED` |
| n/a | `PROPAGATED_SYMPTOM` | `docs/reviews/CVF_REVIEW_B.md` | `SF-2026-06-16-001-B` | `RF-2026-06-16-001` | `REPAIR_REQUIRED` |
| n/a | `STALE_SYNC` | `AGENT_HANDOFF_V19_2026-06-15.md` | `SF-2026-06-16-001-C` | `RF-2026-06-16-001` + worker return committed | `REPAIR_REQUIRED` |

Root-cause grouping reduces the operator-visible error count from 4 to 1 root
defect with 3 downstream effects.

### Relationship To Finding-To-Governance Learning Disposition

The `## Root Cause To Propagated Findings` table does not replace the
`## Finding-To-Governance Learning Disposition` section. Both must appear when
a completion review or audit carries findings:

- `## Finding-To-Governance Learning Disposition` classifies the defect class,
  learning lane, escalation state, and next control action per the canonical
  finding-to-governance learning standard.
- `## Root Cause To Propagated Findings` explains the blast radius so reviewers
  and operators can see whether many file failures represent one real defect.

---

## Provider Memory Learning Escape Guard

### Rule

A reusable lesson recorded only in provider-specific memory (such as `CLAUDE.md`,
a Codex memory file, or an IDE side-channel summary) without a corresponding
CVF-governed learning artifact is a learning escape.

A learning escape fails the finding-to-governance gate because:

- provider memory is not version-controlled CVF governance;
- provider memory is not accessible to other agents or reviewers;
- the lesson can be silently lost when the provider session changes;
- the lesson cannot be audited, promoted, or machine-enforced via CVF checker.

### Guard Requirement

When a finding-bearing artifact (log, review, assessment, audit) documents a
reusable lesson and claims the lesson is stored or addressed in provider-specific
memory, the artifact must also provide one of the following in its
`## Finding-To-Governance Learning Disposition` section:

1. A governed learning disposition of `RULE_ADDED`, `STANDARD_UPDATED`,
   `STANDARD_ADDED`, `MACHINE_CHECK_ADDED`, `MACHINE_CHECK_CANDIDATE`, or
   `TEMPLATE_UPDATED` - pointing to a CVF source artifact that carries the rule;
   OR
2. An explicit `N/A_WITH_REASON` disposition only when the note is
   session-local, personal-preference, one-off, or otherwise non-reusable.

`N/A_WITH_REASON` is not valid for a reusable lesson, future-agent lesson,
gate-repair lesson, work-order authoring trap, or checker behavior trap. Those
lessons must be promoted into a CVF-governed artifact or machine-check
candidate before closure.

### Provider-Memory-Only Detection Signals

The checker detects a provider-memory-only learning escape when a
finding-bearing artifact contains any of the following signals:

- phrases that indicate storage exclusively in provider memory:
  - `stored in claude memory`
  - `saved to claude memory`
  - `recorded in claude memory`
  - `claude memory only`
  - `codex memory only`
  - `provider memory only`
  - `in provider-specific memory`
  - `stored in memory.md`
  - `saved to memory.md`
  - `recorded in memory.md`
  - `written to memory.md`
  - `added to memory.md`
  - `updated memory.md`
  - `memory.md updated`
  - `in memory.md`
  - `in claude.md`
  - `added to claude.md`
  - `written to claude.md`

AND the disposition section does not contain a CVF-governed promotion
disposition (`RULE_ADDED`, `STANDARD_UPDATED`, `STANDARD_ADDED`,
`MACHINE_CHECK_ADDED`, `MACHINE_CHECK_CANDIDATE`, `TEMPLATE_UPDATED`) and does
not contain a non-reusable/session-local `N/A_WITH_REASON`.

### FPRC-T2 Reusable Lesson Promotion Addendum

Provider-owned memory files such as `MEMORY.md` are provider-local execution
aids unless they are explicitly CVF-governed by the repository. They are not a
shared learning surface for other agents.

If an agent says a future run will be faster because a lesson was captured in
provider memory, that statement is itself evidence of reusability. The agent
must promote the lesson into one of:

- a CVF reference standard;
- a work-order authoring addendum;
- a governed roadmap or completion review with a follow-up control action;
- a checker/test update;
- a machine-check candidate with owner and next action.

Current FPRC-T2 examples:

| ID | Finding | Required promotion |
|---|---|---|
| B7 | Checklist text that repeats a section heading such as `## Heading Name` can confuse substring-based section extraction. | Template/addendum wording or checker hardening. |
| B8 | `NOT_APPLICABLE_WITH_REASON` can be the wrong verdict in dispatch or decision artifacts when closure-target terms appear elsewhere in the file. | Standard wording: use `COMPLETE_WITH_DECLARED_LIMITS` for bounded decision packets that name future closure targets. |
| B9 | `CLOSED_PASS_BOUNDED` in predecessor rows can trigger closure-packaging logic before the current artifact is a closure packet. | Standard wording: use `PREDECESSOR_SATISFIED` for authority-chain predecessor status values in dispatch packets. |
| B10 | Capturing B7-B9 only in Claude memory or `MEMORY.md` (`NOT_CVF_SOURCE`) is a provider-memory learning escape. | Governed artifact or machine check required before closure. |
| B11 | Provider registry absence or hardcoded-provider trigger phrases in N/A prose can force runtime-freshness evidence. | If unavoidable, name `EXTENSIONS/CVF_MODEL_GATEWAY/src/provider-registry.ts` and `PROVIDER_CAPABILITY_REGISTRY` as out-of-scope and untouched. |
| B12 | Dispatch trace manifests that include future Codex deliverables not created in the dispatch batch create false missing-deliverable failures. | Dispatch expected/actual manifests must list only the current dispatch changed set; future worker deliverables belong in Write Ownership or Expected Deliverables sections. |

### Provider Memory Is Not CVF Authority

`AGENTS.md` is canonical CVF authority. Do not confuse it with provider-specific
memory. Provider-specific memory examples: `CLAUDE.md`, `CODEX.md`, Codex
memory files, Claude memory files, and IDE side-channel summaries.

---

## Boundary-Prose Trigger Discipline

### Problem

Keyword-based machine gates infer the evidence class required for a changed
artifact by scanning its prose. When a work order, worker return, or completion
review uses specific trigger words in N/A reasons, out-of-scope disclaimers, or
boundary-prose sentences, the gate may infer a positive evidence-class claim and
demand evidence that was never intended.

Known keyword trigger classes:

| Trigger word class | Gate that fires | Evidence demanded |
|---|---|---|
| `scan`, `classification`, `corpus`, `readiness`, `GC-051` | Corpus scan registry gate | `Registry JSON` PASS, `Registry Markdown` PASS |
| `receipt` | Acceptance Receipt Assertion Matrix gate | full ARAM section |
| `no provider call`, `call providers`, `provider call` | Runtime Freshness gate | top-level `## Current Runtime Freshness Verification` section |
| `provider` within ~120 chars of `no registry`, `hardcoded`, `no model registry`, `no provider/API key use` (B11) | Work-order dispatch quality gate (`_validate_runtime_freshness_claims`) | the artifact must name `EXTENSIONS/CVF_MODEL_GATEWAY/src/provider-registry.ts` and `PROVIDER_CAPABILITY_REGISTRY` as accounted-for surfaces |

### Rule

Never use trigger words in N/A reasons or boundary-prose sentences as evidence
of scope exclusion.

When the intent is to declare that a scope class is excluded, use phrasing that
does not contain the trigger token itself:

| Scope intent | Forbidden phrasing | Compliant alternative |
|---|---|---|
| Corpus scan is excluded | `no corpus scan or readiness classification` | `doc-only scope; file-system enumeration not used` |
| Corpus registry is excluded | `GC-051 classification not applicable` | `file inventory not applicable to this tranche` |
| Receipt is excluded | `no receipt required` | `no acceptance handshake required` |
| Provider calls are excluded | `no provider call or API usage` | `no external API usage` |

### Application

This rule applies to:

- work-order `## Scope` and `## Claim Boundary` sections;
- worker-return `## Public Export Disposition` and `## Risk / Corrective Action` sections;
- completion-review `## Machine Closure Package` N/A reason cells;
- any prose that appears inside a finding-bearing artifact scanned by a
  keyword-based gate.

When boundary prose must be technical and cannot avoid a trigger word, place the
sentence in a section header or summary table row that is outside the scanned
prose body, and cite this standard as the reason.

---

## Dispatch Manifest Scope Discipline

Dispatch packet Agent Operation Trace manifests must describe the files changed
by the dispatch batch itself. They must not list future worker or Codex
deliverables that are authorized but not yet created.

Use this split:

| Artifact class | Where it belongs |
|---|---|
| GC-018, work order, and roadmap files changed in the dispatch batch | Agent Operation Trace expected and actual manifests |
| Decision packet, completion review, source file, test, or runtime artifact to be produced later | Write Ownership, Expected Deliverables, or Acceptance Criteria |

If a future deliverable is listed in the dispatch manifest before it exists, the
machine gate may correctly report it as missing or unobserved. That is a
dispatch-authoring defect, not a worker execution defect.

---

## Finding-To-Governance Learning Disposition

| Field | Disposition |
|---|---|
| Defect class | `RULE_GAP` |
| Learning lane | `GOVERNANCE_CONTROL_PLANE` |
| Escalation state | `STANDARD_ADDED` |
| Next control action | FPRC-T1 standard published; checker updated for provider-memory-only escape; addendum updated |
| Worker blame | `N/A_WITH_REASON`: these are control-plane gaps, not individual worker errors |

---

## Public Export Disposition

Disposition: DEFERRED_PRIVATE_ONLY

Reason: private provenance reference standard. No public-sync batch is
authorized for this tranche.

---

## Claim Boundary

This standard governs finding propagation vocabulary, root-cause grouping table
structure, provider-memory learning escape guard, and boundary-prose trigger
discipline. It does not prove runtime behavior, provider behavior, live proof,
public readiness, production readiness, or historical finding migration.
