# CVF Truth Foundation Source Provenance And Verification Contract

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

docType: reference_contract

Date: 2026-06-28

Batch ID: TKG-T1

contractVersion: `cvf.truthFoundation.sourceProvenanceVerification.tkgT1.v1`

## Purpose

Define the CVF-native truth foundation contract promoted from TKG-T0. The
contract absorbs useful Agent Governance Toolkit and Truth Kernel doctrine
without copying external code, adopting external runtime packages, or creating
a parallel evidence or truth system.

The governing chain is:

```text
source authority -> provenance label -> evidence or obligation record -> verification result -> bounded claim movement
```

## Scope / Target / Owner Boundary

In scope:

- source authority and external-input boundaries;
- provenance labels for important claims;
- evidence record minimums;
- obligation record minimums;
- verification-result minimums;
- strict, relaxed, and blocked claim movement semantics;
- relationship to existing CVF evidence, learning, release, and TruthScore
  owner surfaces;
- future tranche routing for field reconciliation and checker candidates.

Out of scope:

- AGT runtime, MCP gateway, hypervisor, kill switch, quarantine, circuit
  breaker, policy engine, or hosted service;
- Truth Kernel runtime, package import, evidence database, obligation registry
  runtime, SOT index runtime, independent verifier service, or monitor;
- provider/live proof, public-sync export, external adapter behavior,
  certification, generated aggregate, or MPI-T6 runtime reopening;
- replacing Enterprise Evidence Pack, MLW3, release truth packet, or WD1
  TruthScore owner surfaces.

## Source Conversion Matrix

| Source input | Reused substance | CVF adaptation | Disposition |
|---|---|---|---|
| TKG-T0 roadmap | next route and audited value classification | converted into CVF-owned TKG-T1 reference contract scope | ACCEPT_AS_CONTRACT |
| AGT policy and MCP doctrine | deterministic interception, deny/block posture, structured decision records | adapted as future guard/runtime doctrine only; no runtime import | ADAPT_WITH_BOUNDARY |
| AGT independence doctrine | core-versus-adapter separation | mapped to CVF authority and adapter boundaries | ACCEPT_AS_DOCTRINE |
| Truth Kernel doctrine | CVF-root authority, integrity is not truth, LLM output is not self-trusting | mapped to source authority and claim movement rules | ACCEPT_AS_DOCTRINE |
| Truth Kernel evidence, obligation, and provenance specs | record minimums and label vocabulary | adapted as doc-only contract fields pending reconciliation | ADAPT_WITH_BOUNDARY |
| Truth Kernel SOT and verifier specs | avoid parallel truth islands and require independent verification methods | mapped to reference-not-copy and verification result rules | ADAPT_WITH_BOUNDARY |
| Truth Kernel strict-mode package code | runtime candidate shows incomplete spec alignment | direct import rejected until future source-verified tranche | REJECT_DIRECT_IMPORT |

## Source Authority Rule

CVF source authority is the governed source artifact, runtime source file,
generated aggregate source fragment, or canonical contract that owns the claim.

External inputs include:

- external repositories;
- copied folders;
- package source trees;
- provider-local memories;
- external-agent critique or recommendation files;
- cached summaries or context packs.

External inputs are advisory until a CVF-owned surface maps, adapts, or rejects
their substance. An external input must not be cited as canonical CVF authority
in a Source Verification ACCEPT row unless the claim is specifically about that
external input's own contents and the surrounding artifact records the external
source boundary.

## Integrity Is Not Truth

Hashes, signatures, receipts, commit IDs, and immutable storage prove that a
byte sequence or event record is stable within a stated boundary. They do not
prove that the contents are correct, complete, current, or semantically true.

Allowed integrity claims:

- a file or receipt matches a recorded hash;
- a source was captured from a fixed commit;
- a generated aggregate matches its source fragments after a drift check;
- a command produced a recorded output in a stated run.

Forbidden truth overclaims:

- treating a hash as proof that the statement inside the file is correct;
- treating approval as proof that the underlying fact is true;
- treating LLM agreement as independent verification;
- treating a receipt as proof beyond the action it records;
- treating a copied truth pack as authority after its source changed.

## LLM Output Is Not Self-Trusting

LLM or reviewer judgment may identify ambiguity, inconsistency, risk, weak
evidence, or missing decisions. It must not be the sole verifier for hard
obligations, numeric invariants, legal or contractual claims, security
posture, production readiness, freeze claims, source availability, or runtime
behavior.

For hard claims, at least one non-self-referential verification method must be
available, such as source read, deterministic check, command output, receipt,
schema validation, test, live-proof result when authorized, or accountable
human decision for authorization-only questions.

## Reference-Not-Copy Rule

Truth should be referenced from canonical CVF source surfaces instead of copied
into project-local truth islands.

When a future project or package needs a truth-supporting fact, it should
prefer:

- canonical path plus section or symbol;
- receipt ID or artifact path;
- source hash or commit where relevant;
- generated aggregate source fragment plus drift check where relevant;
- public-safe summary that names its private provenance boundary.

If a fact must be copied into another artifact, the copy must record snapshot
status, source path or source receipt, capture date, validity boundary, and
supersession behavior.

## Provenance Label Contract

Future truth-foundation artifacts should label important claims with one of
these doc-only labels unless a later source-verified contract supersedes them:

```text
SOURCE_BACKED
COMPUTED
RECEIPT_BACKED
LLM_INFERRED
HUMAN_APPROVED
EXTERNAL_INPUT
MISSING_EVIDENCE
STALE_SOURCE
CONFLICTED_SOURCE
```

Label semantics:

| Label | Meaning | Strict movement |
|---|---|---|
| `SOURCE_BACKED` | claim is supported by a current CVF source or canonical external-source citation within stated boundary | may proceed if required source remains current |
| `COMPUTED` | claim is produced by deterministic code, formula, schema, or command output | may proceed if method and input are recorded |
| `RECEIPT_BACKED` | claim is supported by a receipt for the recorded action only | may proceed for action evidence, not broader truth |
| `LLM_INFERRED` | claim is model or reviewer inference from available context | cannot satisfy hard-obligation strict movement by itself |
| `HUMAN_APPROVED` | accountable approval or decision exists | authorizes action within scope but does not prove factual truth |
| `EXTERNAL_INPUT` | claim comes from external repo, copied folder, or external agent | must be adapted or source-verified before CVF authority use |
| `MISSING_EVIDENCE` | required support is absent | blocks strict movement |
| `STALE_SOURCE` | source may no longer be current | blocks strict movement until refreshed or bounded |
| `CONFLICTED_SOURCE` | sources disagree | blocks strict movement until resolved or escalated |

These labels are documentation contract vocabulary. They are not runtime enum
fields until a future implementation creates and source-verifies them.

## Evidence Record Minimum

A future evidence record should include at least:

```yaml
evidence_id:
source_type:
source_path_or_uri:
source_section_or_symbol:
source_commit_or_version:
source_hash:
captured_at_utc:
captured_by:
claim_supported:
provenance_label:
validity_boundary:
sensitivity:
status:
supersedes:
superseded_by:
claim_boundary:
```

Evidence supports a claim within a stated boundary. Missing evidence must stay
visible as `MISSING_EVIDENCE`, not be hidden by stronger prose.

## Obligation Record Minimum

A future obligation record should include at least:

```yaml
obligation_id:
source_document:
source_section:
source_commit_or_version:
obligation_text:
obligation_class:
hard_or_soft:
trigger:
required_evidence:
required_verification:
failure_action:
owner:
status:
valid_from_utc:
valid_until_utc:
claim_boundary:
```

Hard obligations must not move through strict gates without current source
support and verification results. Soft obligations may warn or escalate when
their supporting evidence is incomplete, depending on the governing artifact.

## Verification Result Minimum

A future verification result should include at least:

```yaml
verification_id:
method:
method_version:
input_refs:
evidence_refs:
obligation_refs:
rule_or_formula:
status:
message:
checked_at_utc:
checked_by:
limitations:
claim_boundary:
```

Allowed status tokens for this contract are:

```text
PASS
WARN
FAIL
BLOCKED
NOT_APPLICABLE_WITH_REASON
```

A verification result is not broader than its method, inputs, and limitations.
For example, a schema pass proves shape, not business correctness; a source
read proves current text, not runtime behavior; a live run proves only the
observed invocation.

## Claim Movement Semantics

Strict movement applies when a claim may affect governance closure, release,
public wording, hard obligation satisfaction, source authority, safety,
security, legal or contractual posture, production readiness, or runtime
behavior.

Strict movement must block on:

- missing hard evidence;
- missing hard-obligation verification;
- failed verification;
- important claim without a provenance label;
- stale source or expired evidence;
- conflicted source without resolution;
- LLM inference used as sole hard-claim verifier;
- external input treated as CVF authority without adaptation or boundary.

Relaxed movement may be used for draft, exploratory, low-risk, or planning
claims. Relaxed movement must still label unsupported, inferred, external,
stale, or conflicted claims and must not be used to close hard obligations.

Blocked movement means the artifact must keep a blocked, draft, hold, or
needs-evidence posture until a source-backed release condition exists.

## Relationship To Existing CVF Owner Surfaces

| Surface | Relationship |
|---|---|
| `docs/reference/CVF_ENTERPRISE_EVIDENCE_PACK.md` | remains the owner for evidence pack principles, export layout, packet types, and release-quality evidence packaging |
| `docs/reference/CVF_MLW3_EVIDENCE_TO_TRUTH_LEARNING_SIGNAL_PIPELINE_2026-06-05.md` | remains the owner for learning-signal workflow from evidence to truth update proposals |
| `docs/reference/CVF_RELEASE_CANDIDATE_TRUTH_PACKET_2026-04-21.md` | remains the owner for release-candidate claim boundaries and milestone proof wording |
| `docs/reviews/CVF_WD1_TRUTHSCORE_WEIGHTING_DOCTRINE_COMPLETION_2026-05-31.md` | remains the owner for delivered TruthScore weighting doctrine and scoring behavior |

TKG-T1 adds a source/provenance/verification contract layer. It does not
recalculate TruthScore, replace release truth packets, rewrite evidence-pack
exports, or change MLW3 learning behavior.

## Future Tranche Routing

| Tranche | Candidate objective | Required condition |
|---|---|---|
| TKG-T2 | owner-surface field reconciliation matrix for evidence, obligation, provenance, verification, release, MLW3, and TruthScore surfaces | TKG-T1 contract committed and current |
| TKG-T3 | static checker candidate for provenance-collapse, unlabeled important claims, or integrity-overclaim language | TKG-T2 field reconciliation plus fresh GC-018 |
| TKG-RUNTIME | Truth Kernel runtime, evidence database, obligation registry, verifier service, monitor, AGT gateway, hypervisor, circuit breaker, package import, or adapter work | explicit operator authorization, fresh GC-018, source verification, tests, and live proof if governance behavior is claimed |

## Source Verification Block

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Source fact type | Disposition |
|---|---|---|---|---|---|---|
| TKG-T0 selected TKG-T1 as the next CVF-owned contract tranche | `docs/roadmaps/CVF_TKG_T0_AGENT_GOVERNANCE_TRUTH_KERNEL_EXTERNAL_ABSORPTION_ROADMAP_2026-06-28.md` | Purpose; Proposed Roadmap | `AUTHOR_TKG_T1_TRUTH_FOUNDATION_SOURCE_PROVENANCE_AND_VERIFICATION_CONTRACT` | TKG-T0 roadmap | VALUE_SET | ACCEPT |
| Current CVF already has enterprise evidence-pack discipline | `docs/reference/CVF_ENTERPRISE_EVIDENCE_PACK.md` | Evidence Pack Principles; Minimum Evidence Set | CVF Enterprise Evidence Pack | CVF owner surface | EXISTS | ACCEPT |
| Current CVF already has evidence-to-truth learning signal routing | `docs/reference/CVF_MLW3_EVIDENCE_TO_TRUTH_LEARNING_SIGNAL_PIPELINE_2026-06-05.md` | Purpose; Workflow; Failure Modes | `cvf.mlw3.evidenceToTruthLearningSignalPipeline.v1` | CVF owner surface | EXISTS | ACCEPT |
| Current CVF already has release truth packet boundary language | `docs/reference/CVF_RELEASE_CANDIDATE_TRUTH_PACKET_2026-04-21.md` | Purpose; Claim Boundary; What Is Proven | CVF Release Candidate Truth Packet | CVF owner surface | EXISTS | ACCEPT |
| Current CVF already has TruthScore weighting doctrine | `docs/reviews/CVF_WD1_TRUTHSCORE_WEIGHTING_DOCTRINE_COMPLETION_2026-05-31.md` | Purpose; Doctrine Summary | `cvf.truthScoreWeightingDoctrine.wd1.v1` | CVF owner surface | EXISTS | ACCEPT |

## External Knowledge Intake Routing

| Field | Value |
|---|---|
| Chain map | `docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md` |
| Input type | External repo or copied folder |
| Chain map route | External repo or copied folder -> Root/folder lifecycle classification plus absorption map when retained -> CVF-owned reference contract -> ABSORB, ADAPT, DEFER, REJECT, or BLOCK |
| Matching local-view guard | `governance/compat/check_external_knowledge_intake_routing.py` |
| Owner surface | `docs/reference/truth_foundation/CVF_TRUTH_FOUNDATION_SOURCE_PROVENANCE_AND_VERIFICATION_CONTRACT.md` |
| Disposition | ABSORB TKG-T0 selected doctrine into CVF-owned source/provenance/verification contract language |
| Claim boundary | external sources remain inputs; this contract creates no runtime, checker, package, public, provider, adapter, MCP, or hypervisor support |

## Rescan Intelligence Hardening

- Original source artifact: upstream `microsoft/agent-governance-toolkit` at
  commit `e5693cb` plus operator-provided `CVF_Truth_Kernel_Patch/`.
- Predecessor intake artifact:
  `docs/roadmaps/CVF_TKG_T0_AGENT_GOVERNANCE_TRUTH_KERNEL_EXTERNAL_ABSORPTION_ROADMAP_2026-06-28.md`.
- Delta ledger status: TKG-T1 converts TKG-T0 selected doctrine into a
  CVF-owned reference contract and does not reopen rejected runtime import.
- Routing matrix status: field reconciliation and checker candidates are
  routed to later tranches; runtime/package work remains parked.
- Semantic sampling status: sampled source authority, integrity boundary,
  LLM self-trust boundary, provenance labels, evidence record minimums,
  obligation record minimums, and verification-result semantics.
- Rescan intelligence verdict: COMPLETE_WITH_DELTA_ROUTING_SAMPLE

### Original-Intake Delta Ledger

| Category | Disposition |
|---|---|
| UNCHANGED_FROM_INTAKE | AGT and Truth Kernel patch remain external inputs, not CVF authority |
| CHANGED_DISPOSITION | TKG-T0 recommendation is promoted into CVF-owned contract language |
| NEW_FINDING | source/provenance/verification record minimums need TKG-T2 owner-surface reconciliation before any checker or runtime field work |
| REMOVED_OR_REJECTED | direct AGT runtime import, MCP gateway implementation, hypervisor, package activation, and Truth Kernel runtime package import remain rejected for this tranche |

### Follow-Up Routing Matrix

| Routing lane | Disposition |
|---|---|
| DO_NOW | commit TKG-T1 reference front door and source/provenance/verification contract |
| SEPARATE_RECONCILIATION_TRANCHE | TKG-T2 owner-surface field reconciliation |
| SEPARATE_CHECKER_TRANCHE | TKG-T3 static checker candidate only after TKG-T2 and fresh GC-018 |
| SEPARATE_RUNTIME_TRANCHE | AGT hypervisor, MCP gateway, runtime monitor, kill switch, circuit breaker, and package import require fresh authorization |
| OUT_OF_SCOPE | provider/live proof, public-sync, hosted readiness, production readiness, package activation, MCP/CLI bridge, generated aggregates |
| RESOLVED_BY_DESIGN | external-source authority boundary and direct-import rejection remain recorded |

### Semantic Sampling / Adversarial Review

| sampleId | source section | source claim | disposition checked | adversarial challenge | verdict |
|---|---|---|---|---|---|
| TKG-T1-S1 | Source Authority Rule | CVF source authority must come from CVF-governed owner surfaces | ACCEPT_AS_CONTRACT | Could external repos become CVF authority by being cited? | PASS: external inputs remain advisory until mapped through CVF owner surface |
| TKG-T1-S2 | Integrity Is Not Truth | hash and receipt evidence do not prove semantic correctness | ACCEPT_AS_DOCTRINE | Could a receipt be overclaimed as truth? | PASS: receipt claims are limited to recorded action evidence |
| TKG-T1-S3 | LLM Output Is Not Self-Trusting | LLM inference cannot be sole hard-claim verifier | ACCEPT_AS_DOCTRINE | Could review prose close a hard obligation? | PASS: hard claims require non-self-referential verification |
| TKG-T1-S4 | Claim Movement Semantics | strict movement blocks missing evidence, stale sources, conflicted sources, and unlabeled important claims | ACCEPT_AS_CONTRACT | Could this imply a runtime gate now exists? | PASS: field and gate semantics are documentation-only until a later implementation |

## Dual Agent Surface Matrix

| Consumer class | Interface or owner surface | Authority and risk boundary | Evidence | Adapter boundary | Disposition |
|---|---|---|---|---|---|
| `INTERNAL_AGENT` | this reference contract | may use as documentation guidance for future source-verified work | TKG-T1 source conversion matrix and TKG-T0 roadmap | N/A with reason: no runtime adapter | `CONTRACT_ONLY` |
| `EXTERNAL_AGENT_CLI_MCP` | future public-safe or adapter truth-foundation readout | no external interface, MCP tool, CLI command, or public package behavior exists in TKG-T1 | deferred by this contract | separate GC-018/source-verified work order required | `DEFERRED_WITH_REASON` |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: this contract is private provenance documentation derived from an
external repository and operator-provided patch audit. Public-safe truth
foundation wording requires separate public-sync authorization.

## Delta Execution Claim Boundary Control Block

| Field | Disposition |
|---|---|
| claimScope | TKG-T1 truth foundation source provenance and verification reference contract |
| claimDisposition | N/A with reason: reference documentation contract only |
| receiptEvidence | N/A with reason: no runtime receipt or execution-control claim |
| actionEvidence | ACTION_EVIDENCE_PRESENT - reference contract authored from TKG-T0-selected doctrine |
| invocationBoundary | local governed documentation authoring |
| interceptionBoundary | no IDE/shell/git/filesystem/provider interception claim |
| claimLanguage | contract/reference language only |
| forbiddenExpansion | no Truth Kernel runtime, AGT runtime, MCP gateway, hypervisor, evidence database, obligation registry runtime, verifier service, provider/live proof, public-sync, adapter, package activation, certification, generated aggregate, or MPI-T6 runtime |

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Codex dispatcher/worker/reviewer/closer |
| Provider or surface | local workspace |
| Session or invocation | TKG-T1 truth foundation source provenance and verification contract promotion, 2026-06-28 |
| Working directory | repository root |
| Command or tool surface | source reads, TKG-T0 roadmap read, apply_patch, governance gates |
| Target paths | `docs/reference/truth_foundation/README.md`; `docs/reference/truth_foundation/CVF_TRUTH_FOUNDATION_SOURCE_PROVENANCE_AND_VERIFICATION_CONTRACT.md` |
| Allowed scope source | operator approval after TKG-T0 commit `036350d5` and TKG-T0 recommendation |
| Before status evidence | `baseHead=9c56a16e` |
| After status evidence | TKG reference contract active after material commit |
| Diff evidence | `git diff --name-status 9c56a16e..HEAD` after material commit |
| Approval boundary | documentation contract promotion only |
| Claim boundary | no runtime, provider/live proof, public-sync, checker, generated aggregate, adapter, package activation, certification, MCP gateway, hypervisor, circuit breaker, evidence database, obligation registry runtime, SOT index runtime, verifier service, or Truth Kernel package import |
| Agent type | single-agent multi-role |
| Invocation ID | `cvf-tkg-t1-truth-foundation-contract-promotion-2026-06-28` |
| Expected manifest | README and truth foundation contract |
| Actual changed set | README and truth foundation contract |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename |

## Claim Boundary

This contract promotes selected AGT and Truth Kernel doctrine into CVF-owned
documentation. It does not implement AGT runtime governance, MCP gateway
interception, hypervisor execution rings, circuit breakers, Truth Kernel
runtime, evidence database, obligation registry runtime, SOT index runtime,
independent verifier service, provider/live proof, public-sync export,
CLI/MCP adapter, package activation, certification, generated aggregate, or
production/hosted readiness.
