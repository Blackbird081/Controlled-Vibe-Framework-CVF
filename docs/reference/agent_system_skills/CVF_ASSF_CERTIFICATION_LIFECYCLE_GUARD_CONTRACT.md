# CVF ASSF Certification Lifecycle Guard Contract

Memory class: FULL_RECORD

Status: CANDIDATE

Date: 2026-06-25

docType: reference_contract

Batch ID: ASSF-T7

EPISTEMIC_PROCESS_NA_WITH_REASON: fixed-schema contract document; it
defines taxonomy, vocabulary, and rule tables rather than testing an
evidence-comparison hypothesis.

## Purpose

Define the certification, UAT, drift, deprecation, successor, retirement,
duplicate-ID, and adapter-claim honesty control model for CVF agent
system-skill packages. ASSF-T1 through ASSF-T6 each surfaced a lifecycle
risk that no single contract yet unified: T1 defined lifecycle fields
without a violation taxonomy; T2 built a generated index and resolver
without a drift-detection model; T5 forbade automatic promotion without a
deprecation/retirement rule; T6 found a schema gap between Web `corpusClass`
and ASSF `certificationState` with no bridge rule. This contract controls
certification, UAT, drift, deprecation, successor, retirement, and adapter
honesty together because a reviewer cannot safely decide any one of them in
isolation: a stale successor pointer makes deprecation unsafe, a dangling
source artifact makes certification unsafe, and an unverified adapter claim
makes external-agent disposition unsafe regardless of internal package
state.

This contract is documentation-only guard foundation. It does not
implement a checker, mutate the generated index or resolver, create a
package instance, implement a CLI/MCP adapter, or classify any current Web
example as certified.

## Source Authority

| Authority | Path |
|---|---|
| ASSF-T1 package contract | `docs/reference/agent_system_skills/CVF_ASSF_PACKAGE_CONTRACT.md` |
| ASSF-T2 generated index | `docs/reference/agent_system_skills/generated/skill-index.json` |
| ASSF-T2 resolver | `governance/compat/run_assf_skill_resolver.py` |
| ASSF-T5 composition control contract | `docs/reference/agent_system_skills/CVF_ASSF_COMPOSITION_CONTROL_CONTRACT.md` |
| ASSF-T6 Web projection contract | `docs/reference/agent_system_skills/CVF_ASSF_WEB_PROJECTION_CONTRACT.md` |
| ASSF-T6 migration audit | `docs/audits/CVF_ASSF_T6_EXISTING_WEB_SKILL_EXAMPLE_MIGRATION_AUDIT_2026-06-25.md` |
| Dual Agent Surface Accounting Standard | `docs/reference/CVF_DUAL_AGENT_SURFACE_ACCOUNTING_STANDARD_2026-06-23.md` |
| ASSF-T7 GC-018 baseline | `docs/baselines/CVF_GC018_ASSF_T7_CERTIFICATION_UAT_DRIFT_DEPRECATION_RETIREMENT_GUARD_2026-06-25.md` |
| ASSF-T7 work order | `docs/work_orders/CVF_AGENT_WORK_ORDER_ASSF_T7_CERTIFICATION_UAT_DRIFT_DEPRECATION_RETIREMENT_GUARD_FOR_CLAUDE_2026-06-25.md` |

## Scope / Applies To

Applies to future package certification and UAT review; future generated
index and resolver drift checks; future deprecation, successor,
retirement, duplicate-ID, and stale-claim detection; future Web projection
promotion from `PACKAGE_CANDIDATE` to `CERTIFIED_PACKAGE_PROJECTION`; and
future internal-agent and external-agent CLI/MCP skill package consumers.

Does not apply to implementing a Python checker or local hook; changing
`docs/reference/agent_system_skills/generated/skill-index.json`; changing
`governance/compat/run_assf_skill_resolver.py`; creating package
instances, `SKILL.md`, or `skill.source.json`; changing CVF Web runtime
source or Web projection data; implementing an external CLI/MCP adapter;
or using provider secrets, live proof, public-sync, push, or session
state.

## Certification And UAT State Model

`certificationState` and `uatState` are existing ASSF-T1 Compact Machine
Source Schema fields (see Source Authority). This contract adds a
documentation-level value vocabulary for both fields; the values below are
doc-only proposals until a later source-verified tranche implements them
in a checker, generator, or registry entry schema.

| Field | Proposed value | Meaning | T1 source status |
|---|---|---|---|
| `certificationState` | `NOT_STARTED` | no certification review has begun | source-backed: observed in current `skill-index.json` entries |
| `certificationState` | `IN_REVIEW` | a reviewer has opened a certification pass | doc-only proposal |
| `certificationState` | `CERTIFIED` | reviewer has accepted certification evidence and committed it | doc-only proposal |
| `certificationState` | `CERTIFICATION_REJECTED` | reviewer found certification evidence insufficient or contradicted | doc-only proposal |
| `certificationState` | `CERTIFICATION_REVOKED` | a previously certified package failed a later drift or lifecycle check | doc-only proposal |
| `uatState` | `NOT_STARTED` | no UAT evidence collected | source-backed: observed in current `skill-index.json` entries |
| `uatState` | `IN_PROGRESS` | UAT evidence collection has begun | doc-only proposal |
| `uatState` | `PASSED` | UAT evidence satisfies the package's `acceptanceEvidence` | doc-only proposal |
| `uatState` | `FAILED` | UAT evidence contradicts the package's `acceptanceEvidence` | doc-only proposal |

Rule: `certificationState` may not advance to `CERTIFIED` while `uatState`
is `NOT_STARTED`, `IN_PROGRESS`, or `FAILED`. `uatState: PASSED` is a
precondition for `certificationState: CERTIFIED`, not a substitute for
reviewer decision.

## Lifecycle Violation Taxonomy

| Violation class | Trigger | Required reviewer disposition |
|---|---|---|
| `MISSING_UAT` | `certificationState` advances toward `CERTIFIED` while `uatState` is not `PASSED` | hold at current `certificationState`; return `EVIDENCE_REQUIRED` |
| `INVALID_SELECTOR` | a package's `roles`, `phases`, `surfaces`, or `riskCeiling` selector value is not a value the resolver or composition contract recognizes | reject the package entry; log the invalid selector field and value |
| `DANGLING_SOURCE` | a `sourceArtifacts` or `canonicalRoot` path does not exist on disk at the commit cited | hold the package at its current lifecycle state; return `SOURCE_NOT_FOUND` |
| `DUPLICATE_ID` | two or more registry entries declare the same `skillId` | reject the later-registered entry; require a corrected `skillId` before re-registration |
| `STALE_SUCCESSOR` | a package's `successor` field names a `skillId` that does not exist in the registry, or that itself is `RETIRED`/`REJECTED` | hold the deprecation; require a valid, non-terminal successor before the deprecation is accepted |
| `ILLEGAL_RETIREMENT` | a package transitions to `RETIRED` without a `DEPRECATED` state first, or while other active packages declare a hard `DEPENDS_ON` dependency on it (per the ASSF-T5 Dependency Vocabulary) | block the retirement; require dependents to be migrated or the dependency removed first |
| `GRAPH_STATE_VIOLATION` | a package graph (per the ASSF-T5 Package Graph Boundary) includes a `REJECTED`, `RETIRED`, or `CANDIDATE` package as a graph node | reject the graph; return `COMPOSITION_ERROR` per the ASSF-T5 contract |

This taxonomy extends, and does not replace, the ASSF-T5 Failure
Dispositions table (`COMPOSITION_CYCLE`, `MISSING_DEPENDS_ON`,
`UNRESOLVABLE_CONFLICT`, `AUTHORITY_CEILING_EXCEEDED`, `EVIDENCE_MISSING`,
`CAPABILITY_CLAIM_CONFLICT`, `COMPOSITION_CONTRACT_GAP`). A package may
trigger both a T5 composition failure and a T7 lifecycle violation; both
dispositions apply independently.

## Drift Detection Classes

| Drift class | Definition | What it compares | Disposition on detection |
|---|---|---|---|
| `PACKAGE_CONTRACT_DRIFT` | a registry entry's fields no longer match the ASSF-T1 Compact Machine Source Schema field families | registry entry fields vs. T1 schema field families | flag entry as `SCHEMA_DRIFT`; require a corrected entry before further lifecycle advance |
| `GENERATED_INDEX_DRIFT` | `skill-index.json` does not match its declared source entries under `docs/reference/agent_system_skills/registry/entries/` | generated index content vs. registry source entries | regenerate via `governance/compat/generate_assf_skill_index.py --generate`; do not hand-edit the generated file (per the ASSF-T2 generated README) |
| `RESOLVER_SELECTION_DRIFT` | `resolve_skill_packet` returns a package that should be excluded under `_EXCLUDED_STATUSES`, or omits a package that should match the caller's selectors | resolver output vs. expected selector match against current index `status` values | treat as a resolver-source defect; do not work around it by editing the generated index |
| `WEB_PROJECTION_DRIFT` | a CVF Web surface displays or implies a `certificationState` or projection classification that the canonical package registry entry does not support | Web display/classification vs. package registry `certificationState` (per the ASSF-T6 Canonical-Vs-Presentation Boundary Table) | reclassify the Web entry per the ASSF-T6 Classification Vocabulary; never elevate the registry state to match the Web display |
| `ADAPTER_CLAIM_DRIFT` | an `externalCliMcpDisposition`, `adapterContract`, or `adapterEvidence` value claims more than the cited evidence supports | declared disposition/evidence vs. actual adapter implementation and test/review evidence | see Adapter Claim Honesty Rules below |

## Deprecation Successor Retirement Rules

| Disposition | Condition | Rule |
|---|---|---|
| `HOLD_DEPRECATION` | a package's `deprecation` field is set but `successor` is `none` or names a non-existent `skillId` | hold the deprecation; the package remains at its prior lifecycle state until a valid successor is named or the deprecation is withdrawn |
| `HOLD_RETIREMENT` | a package's `retirement` field would set `status: RETIRED` while a `STALE_SUCCESSOR` violation (see Lifecycle Violation Taxonomy) is open on it | hold the retirement; resolve the successor reference first |
| `REJECT_RETIREMENT_WITHOUT_EVIDENCE` | a package is retired with no `reviewArtifacts` entry documenting the retirement decision | reject the retirement; require a governed review artifact citing the retirement reason before `status: RETIRED` is accepted |
| `ACCEPT_DEPRECATION` | `deprecation` names a reason and `successor` names a `skillId` present in the registry at a non-terminal lifecycle state (`PROPOSED`, `APPROVED`, or `ACTIVE`) | accept the deprecation; the deprecated package may remain selectable with a warning until retirement |

## Adapter Claim Honesty Rules

Binds the ASSF-T1 external-disposition fields (`externalCliMcpDisposition`,
`adapterContract`, `adapterEvidence`) and the ASSF-T1 `externalMutationBoundary`
field to evidence before any `IMPLEMENTED` claim.

1. `externalCliMcpDisposition: IMPLEMENTED` requires `adapterContract` to
   cite an existing, source-verified adapter contract path (not `N/A with
   reason` and not a doc-only proposal).
2. `externalCliMcpDisposition: IMPLEMENTED` requires `adapterEvidence` to
   cite an existing test or review artifact path, not a prose description
   of intended testing.
3. A package may not carry `externalCliMcpDisposition: IMPLEMENTED` while
   its `adapterContract` or `adapterEvidence` field is `N/A with reason`;
   that combination is `ADAPTER_CLAIM_DRIFT`.
4. `externalMutationBoundary` must be present and non-empty for any
   package with `externalCliMcpDisposition` other than `PROHIBITED`; an
   empty or `TBD` boundary on an externally-reachable package is an
   `ADAPTER_CLAIM_DRIFT`.
5. A reviewer must reject any worker or completion-review claim that an
   adapter is "implemented," "live," or "working" without the matching
   `adapterContract` and `adapterEvidence` source citations present in the
   same artifact (this rule is the T7 lifecycle-specific instance of the
   general equivalence-claim-evidence discipline already machine-checked
   by `governance/compat/check_equivalence_claim_evidence.py`).
6. Per the ASSF-T1 Provider Adapter Boundary, no adapter export may
   imply package activation; an `IMPLEMENTED` adapter claim is never
   evidence of package `status: ACTIVE`.

## Web Projection Certification Bridge

Preserves the ASSF-T6 rule (Design Principle 3: Projection Requires Prior
Certification) that current Web entries remain `PACKAGE_CANDIDATE` or
`LEGACY_REFERENCE_ONLY` until package certification evidence exists. The
ASSF-T6 migration audit found a schema gap: the CVF Web `Skill` interface
(`types/skill.ts`) carries `corpusClass`, not the ASSF-T1
`certificationState` field.

Bridge rule: a Web example may be reclassified from `PACKAGE_CANDIDATE` to
`CERTIFIED_PACKAGE_PROJECTION` only after all of the following are true,
in this order:

1. The underlying legacy skill is registered as an ASSF package with a
   `skillId` (per ASSF-T1 Identity fields).
2. That package's `certificationState` reaches `CERTIFIED` per the
   Certification And UAT State Model above, with `uatState: PASSED`.
3. A separate source-verified work order updates the Web `Skill` type or
   mapping layer to carry or derive from `certificationState` -- this
   contract does not perform that schema bridge implementation.

Until all three conditions are met, `corpusClass` and `certificationState`
remain two separate fields on two separate surfaces, and no Web display
value may be cited as certification evidence.

## Dual Agent Surface Matrix

| Consumer class | Interface or owner surface | Authority and risk boundary | Evidence | Adapter boundary | Disposition |
|---|---|---|---|---|---|
| `INTERNAL_AGENT` | this guard contract, consumed by future internal certification reviewers, drift checks, and lifecycle decisions under `docs/reference/agent_system_skills/` | internal agents may use this contract to classify lifecycle violations, drift, and deprecation/retirement dispositions; this contract grants no loader, resolver, generator, or registry-mutation authority; no package may be activated or certified by reading this contract alone | ASSF-T1 package contract, ASSF-T2 generated index and resolver, ASSF-T5 composition contract, ASSF-T6 Web projection contract and migration audit, this contract's own taxonomy tables | no internal checker, loader, resolver, hook, or generated-index change is authorized by this tranche | `CONTRACT_ONLY` |
| `EXTERNAL_AGENT_CLI_MCP` | future external-agent package readout or adapter certification claim | external agents cannot certify, mutate, activate, or execute packages through this contract; any external disposition claim must satisfy the Adapter Claim Honesty Rules above before `IMPLEMENTED` is used | Dual Agent Surface Accounting Standard; ASSF-T1 external disposition fields; this contract's Adapter Claim Honesty Rules | any implemented CLI/MCP adapter requires a later source-verified adapter contract, tests, and public/private boundary review; this tranche implements none | `DEFERRED_WITH_REASON` |

## Machine-Check Candidate Matrix

Future checker candidates only. No checker is implemented in this
tranche.

| Candidate checker | Would detect | Phase placement candidate |
|---|---|---|
| `check_assf_certification_lifecycle_guard.py` | `MISSING_UAT`, `INVALID_SELECTOR`, `DANGLING_SOURCE`, `DUPLICATE_ID`, `STALE_SUCCESSOR`, `ILLEGAL_RETIREMENT` violations against registry entries | pre-closure, after registry entries exist in volume |
| `check_assf_generated_index_drift.py` extension | `GENERATED_INDEX_DRIFT` and `RESOLVER_SELECTION_DRIFT` (extends the already-named `governance/compat/check_assf_skill_index_drift.py` generator-drift check cited in the ASSF-T2 generated README) | pre-commit, after the generator/checker pairing is in active use |
| `check_assf_web_projection_drift.py` | `WEB_PROJECTION_DRIFT` between Web `certificationState`/`corpusClass` display and canonical registry state | pre-closure, after the Web Projection Certification Bridge schema work lands |
| `check_assf_adapter_claim_honesty.py` | `ADAPTER_CLAIM_DRIFT` per the Adapter Claim Honesty Rules | reviewer-fast, after any first external adapter work order is dispatched |

Per the ASSF-T7 roadmap requirement, machine gates are integrated only
after stable repeated manual use demonstrates the rule is correct; none of
the above are implemented by this tranche.

## Source Verification Block

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Source fact type | Disposition |
|---|---|---|---|---|---|---|
| T1 defines `certificationState` field | `docs/reference/agent_system_skills/CVF_ASSF_PACKAGE_CONTRACT.md` | Compact Machine Source Schema | `certificationState` | ASSF-T1 package schema | EXISTS | ACCEPT |
| T1 defines `uatState` field | `docs/reference/agent_system_skills/CVF_ASSF_PACKAGE_CONTRACT.md` | Compact Machine Source Schema | `uatState` | ASSF-T1 package schema | EXISTS | ACCEPT |
| T1 defines lifecycle status vocabulary including `RETIRED` and `REJECTED` | `docs/reference/agent_system_skills/CVF_ASSF_PACKAGE_CONTRACT.md` | Risk And Lifecycle Fields | `RETIRED` | ASSF-T1 package schema | VALUE_SET | ACCEPT |
| T1 defines external disposition fields | `docs/reference/agent_system_skills/CVF_ASSF_PACKAGE_CONTRACT.md` | Internal-Agent And External-Agent CLI/MCP Disposition Fields | `externalCliMcpDisposition` | ASSF-T1 package schema | EXISTS | ACCEPT |
| T1 requires `adapterContract` before `IMPLEMENTED` | `docs/reference/agent_system_skills/CVF_ASSF_PACKAGE_CONTRACT.md` | Internal-Agent And External-Agent CLI/MCP Disposition Fields | `adapterContract` | ASSF-T1 package schema | LITERAL_INVARIANT | ACCEPT |
| T1 defines `externalMutationBoundary` field | `docs/reference/agent_system_skills/CVF_ASSF_PACKAGE_CONTRACT.md` | Internal-Agent And External-Agent CLI/MCP Disposition Fields | `externalMutationBoundary` | ASSF-T1 package schema | EXISTS | ACCEPT |
| Current generated index entries use `certificationState: NOT_STARTED` and `uatState: NOT_STARTED` | `docs/reference/agent_system_skills/generated/skill-index.json` | skill entries | `certificationState` | ASSF-T2 generated index | VALUE_SET | ACCEPT |
| T2 generated index is metadata-only and not activation evidence | `docs/reference/agent_system_skills/generated/skill-index.json` | `claimBoundary` | `claimBoundary` | ASSF-T2 generated index | LITERAL_INVARIANT | ACCEPT |
| T2 resolver excludes retired and rejected skills by default | `governance/compat/run_assf_skill_resolver.py` | `_EXCLUDED_STATUSES` | `_EXCLUDED_STATUSES` | ASSF-T2 resolver | VALUE_SET | ACCEPT |
| T2 resolver exposes read-only skill packet resolution | `governance/compat/run_assf_skill_resolver.py` | `resolve_skill_packet` | `resolve_skill_packet` | ASSF-T2 resolver | EXISTS | ACCEPT |
| T2 generated README names the drift checker and forbids hand-editing the index | `docs/reference/agent_system_skills/generated/README.md` | Purpose | `check_assf_skill_index_drift.py` | ASSF-T2 generated README | EXISTS | ACCEPT |
| T5 composition contract forbids automatic package promotion | `docs/reference/agent_system_skills/CVF_ASSF_COMPOSITION_CONTROL_CONTRACT.md` | No-Automatic-Promotion Invariant | `No-Automatic-Promotion Invariant` | ASSF-T5 composition contract | LITERAL_INVARIANT | ACCEPT |
| T5 defines the package graph boundary excluding `REJECTED`, `RETIRED`, and `CANDIDATE` nodes | `docs/reference/agent_system_skills/CVF_ASSF_COMPOSITION_CONTROL_CONTRACT.md` | Package Graph Boundary | `Package Graph Boundary` | ASSF-T5 composition contract | LITERAL_INVARIANT | ACCEPT |
| T5 defines `DEPENDS_ON` hard-dependency enforcement rule | `docs/reference/agent_system_skills/CVF_ASSF_COMPOSITION_CONTROL_CONTRACT.md` | Dependency Vocabulary | `DEPENDS_ON` | ASSF-T5 composition contract | VALUE_SET | ACCEPT |
| T5 Failure Dispositions table defines `COMPOSITION_ERROR`-class returns | `docs/reference/agent_system_skills/CVF_ASSF_COMPOSITION_CONTROL_CONTRACT.md` | Failure Dispositions | `COMPOSITION_CYCLE` | ASSF-T5 composition contract | VALUE_SET | ACCEPT |
| T6 Web projection contract defines `CERTIFIED_PACKAGE_PROJECTION` and `PACKAGE_CANDIDATE` tokens | `docs/reference/agent_system_skills/CVF_ASSF_WEB_PROJECTION_CONTRACT.md` | Classification Vocabulary | `CERTIFIED_PACKAGE_PROJECTION` | ASSF-T6 Web projection contract | VALUE_SET | ACCEPT |
| T6 contract states projection requires prior certification | `docs/reference/agent_system_skills/CVF_ASSF_WEB_PROJECTION_CONTRACT.md` | Design Principle 3 | `Projection Requires Prior Certification` | ASSF-T6 Web projection contract | LITERAL_INVARIANT | ACCEPT |
| T6 migration audit found zero certified Web projections and confirmed the `corpusClass` schema gap | `docs/audits/CVF_ASSF_T6_EXISTING_WEB_SKILL_EXAMPLE_MIGRATION_AUDIT_2026-06-25.md` | Findings / Key Finding | `corpusClass` | ASSF-T6 migration audit | LITERAL_INVARIANT | ACCEPT |
| T6 migration audit escalated the certification schema gap to T7 | `docs/audits/CVF_ASSF_T6_EXISTING_WEB_SKILL_EXAMPLE_MIGRATION_AUDIT_2026-06-25.md` | Finding-To-Governance Learning Disposition | `certificationState` | ASSF-T6 migration audit | LITERAL_INVARIANT | ACCEPT |
| Dual Agent standard requires explicit external-agent disposition and adapter boundary | `docs/reference/CVF_DUAL_AGENT_SURFACE_ACCOUNTING_STANDARD_2026-06-23.md` | Mandatory Dual Agent Surface Matrix | `EXTERNAL_AGENT_CLI_MCP` | Dual Agent Surface Accounting Standard | VALUE_SET | ACCEPT |
| An equivalence-claim evidence checker already exists for unverified-claim defects | `governance/compat/check_equivalence_claim_evidence.py` | module purpose | `check_equivalence_claim_evidence.py` | EQC-T1 equivalence claim checker | EXISTS | ACCEPT |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: this contract references private ASSF provenance architecture and
repository source surfaces. Public-safe export requires a separate
redaction and public-sync authorization.

## Delta Execution Claim Boundary Control Block

| Field | Disposition |
|---|---|
| claimScope | ASSF-T7 certification lifecycle guard contract authoring only |
| claimDisposition | BOUNDED_CLAIM_WITH_EVIDENCE -- contract-definition worker-return lane only |
| receiptEvidence | N/A with reason: no runtime execution, provider call, or adapter receipt exists for this tranche |
| actionEvidence | ACTION_EVIDENCE_PRESENT -- Source Verification Block and Roadmap-To-Work-Order Trace Matrix in the matching work order |
| invocationBoundary | governed local documentation authoring only |
| interceptionBoundary | no IDE, shell, git, filesystem, provider, CLI, MCP, Web runtime, or adapter interception claim |
| claimLanguage | defines a documentation-only certification, UAT, drift, deprecation, retirement, and adapter-claim honesty guard contract |
| forbiddenExpansion | no checker implementation, generated-index mutation, resolver mutation, package activation, Web runtime change, CLI/MCP adapter, provider call, live proof, public-sync, push, commit, or session-sync edit |

## Claim Boundary

This contract defines the certification, UAT, drift, deprecation,
successor, retirement, duplicate-ID, and adapter-claim honesty guard model
only. It does not implement a checker, mutate the generated index or
resolver, create a package instance, `SKILL.md`, or `skill.source.json`,
implement a CLI/MCP adapter, classify any current Web example as
`CERTIFIED_PACKAGE_PROJECTION`, or activate any skill. Reviewer/closer
owns completion review authoring, roadmap status update, session sync, and
any material commit after acceptance.
