# CVF ASSF Composition Control Contract

Memory class: FULL_RECORD

Status: CANDIDATE

Date: 2026-06-25

docType: reference

Batch ID: ASSF-T5

EPISTEMIC_PROCESS_NA_WITH_REASON: fixed-schema contract document; defines
mapping rules, gate requirements, and invariants rather than testing an
evidence-comparison hypothesis.

## Purpose

Define the architecture-level controls for how CVF agent system skill
packages compose, depend on each other, conflict, shadow, replace, extend,
or expose capabilities. The contract establishes deterministic composition
order, conflict and shadow vocabulary, capability claim controls, package
graph boundary, internal and external agent behavior boundaries, and failure
dispositions. Loading a skill must never grant new authority.

## Scope / Applies To

Applies to any future ASSF package author, normalizer implementation,
resolver wiring, composition-aware loader, or conflict checker that proposes
or processes package composition decisions. Also applies to any reviewer
deciding whether a proposed composition is valid.

Does not apply to runtime code changes, resolver algorithm changes, generated
index edits, package instance creation, SKILL.md authoring, skill.source.json
authoring, registry entry creation, CLI/MCP adapter implementation, normalizer
implementation, promoter implementation, or provider/live proof.

## Authority Chain

| Authority | Path |
|---|---|
| ASSF-T5 GC-018 baseline | `docs/baselines/CVF_GC018_ASSF_T5_COMPOSITION_DEPENDENCY_CONFLICT_CAPABILITY_CONTROLS_2026-06-25.md` |
| ASSF-T1 package contract (lifecycle states, provenance fields, composition family) | `docs/reference/agent_system_skills/CVF_ASSF_PACKAGE_CONTRACT.md` |
| ASSF-T2 resolver (progressive package selection) | `governance/compat/run_assf_skill_resolver.py` |
| ASSF-T3 bridge contract (no-self-activation invariant) | `docs/reference/agent_system_skills/CVF_ASSF_PROMOTION_BRIDGE_CONTRACT.md` |
| ASSF-T4 intake normalization contract (reverification gate) | `docs/reference/agent_system_skills/CVF_ASSF_INTAKE_NORMALIZATION_CONTRACT.md` |
| Dual Agent Surface Accounting Standard | `docs/reference/CVF_DUAL_AGENT_SURFACE_ACCOUNTING_STANDARD_2026-06-23.md` |
| ASSF roadmap | `docs/roadmaps/CVF_AGENT_SYSTEM_SKILLS_FOUNDATION_ROADMAP_2026-06-23.md` |

## ASSF-T1 Schema Alignment Decision

Required by ASSF-T5 scope. Each candidate field is classified against the
T1 Compact Machine Source Schema. Source for verification: ASSF-T1 Composition
And Dependency Fields section in
`docs/reference/agent_system_skills/CVF_ASSF_PACKAGE_CONTRACT.md`.

| Candidate field | Classification | T1 source field (if exists) | Rationale |
|---|---|---|---|
| `dependsOn` | `REUSE_EXISTING_FIELD` | `dependencies` | T1 already defines `dependencies` for packages/standards that must be selected first; `dependsOn` is an alias; use `dependencies` |
| `conflictsWith` | `REUSE_EXISTING_FIELD` | `conflicts` | T1 already defines `conflicts` for packages or contexts that cannot be combined; use `conflicts` |
| `compositionOrder` | `REUSE_EXISTING_FIELD` | `compositionOrder` | T1 already defines `compositionOrder` for deterministic ordering |
| `capabilityBoundary` | `REUSE_EXISTING_FIELD` | `capabilityBoundary` | T1 already defines `capabilityBoundary` for capabilities that remain forbidden even when dependencies load |
| `evidenceRequirements` | `REUSE_EXISTING_FIELD` | `evidenceRequirements` | T1 already defines `evidenceRequirements` for receipts, tests, or review artifacts needed for use |
| `composesWith` | `CONTRACT_ONLY_DERIVED_VIEW` | derived from `dependencies` + `compositionOrder` | soft-dependency semantics are captured by the existing `dependencies` list without marking any as required; no new field needed |
| `shadows` | `CONTRACT_ONLY_DERIVED_VIEW` | derived from `conflicts` + `compositionOrder` | shadowing is a conflict where the later package in `compositionOrder` overrides a capability range of the earlier one; encoded as a conflict-with-override note, not a separate field |
| `adapterBoundary` | `CONTRACT_ONLY_DERIVED_VIEW` | derived from `externalCliMcpDisposition` + `adapterContract` | the T1 external-disposition fields together express the adapter boundary; no separate `adapterBoundary` field is needed |
| `extends` | `PROPOSE_SCHEMA_EXTENSION` | none in T1 | T1 has no field for one package inheriting or augmenting another's behavior; T5 introduces `extends` as a schema extension for the T1 Composition family |
| `replaces` | `PROPOSE_SCHEMA_EXTENSION` | none in T1 (T1 Lifecycle has `successor` for deprecated-lifecycle replacement, not composition-level replacement) | composition-level `replaces` differs from the lifecycle `successor` field; T5 introduces it as a schema extension |
| `capabilityClaims` | `PROPOSE_SCHEMA_EXTENSION` | none in T1 (T1 has `capabilityBoundary` for what is forbidden, not an explicit claim list) | T5 introduces `capabilityClaims` as an explicit enumeration of what a package claims to provide, distinct from what it forbids |
| `compositionFailureDisposition` | `PROPOSE_SCHEMA_EXTENSION` | none in T1 | T1 has no failure-routing field for when composition rules are violated at load time; T5 introduces this field |
| `selectionPolicy` | `REJECT_RUNTIME_ONLY` | none | selection policy belongs in the resolver (ASSF-T2), not the package contract; any `selectionPolicy` in a package is non-authoritative and may conflict with resolver logic |

## No-Self-Activation Invariant

**Reused verbatim from ASSF-T3 promotion bridge contract and ASSF-T4
intake normalization contract. Equally binding on all composition-aware
loaders, resolvers, and any future implementation of this contract.**

1. No composition engine, loader, resolver, normalizer, promoter, agent,
   or automated process may set any skill to `APPROVED` or `ACTIVE` without
   an explicit reviewer decision recorded in a governed review artifact.
2. `autonomousMutationAuthorized=false` is invariant for all packages and
   must not be overridden by any composition rule, loader, or intake tool.
3. A loaded package is evidence of package-scope selection only. It does not
   activate any skill, grant any agent expanded authority, open any package
   instruction body, or authorize any CLI/MCP adapter scope.
4. A reviewer or operator may advance a candidate past `CANDIDATE` only
   after the reviewer-decision gate and, for `ACTIVE`, after the UAT
   requirement are both satisfied.
5. Session-local composition decisions that are not committed by a reviewer
   do not persist as CVF artifacts and must not be cited as CVF authority.

## No-Automatic-Promotion Invariant

Loading, composing, or resolving a package never grants new authority.
Specifically:

1. Loading a package does not raise the `authorityCeiling` for any agent,
   role, or surface.
2. Satisfying a `dependencies` list does not grant the dependent package
   any permissions beyond those explicitly declared in its own
   `permissions` and `capabilityBoundary` fields.
3. A composition order position (`compositionOrder: 1`) does not imply
   activation; it implies a deterministic load order if the package is
   selected through the normal resolver path.
4. No composition rule may grant additional role, phase, filesystem, git,
   provider, live, public, or external-adapter authority as stated in
   ASSF-T1.

## Composition Vocabulary

| Term | Definition | ASSF-T1 field mapping |
|---|---|---|
| `COMPOSE_SEQUENTIAL` | packages compose in a deterministic, ordered sequence; each package's outputs are available to the next | `compositionOrder` (ascending integer); lower number loads first |
| `COMPOSE_PARALLEL` | packages are selected independently and their scopes do not overlap; no ordering dependency | `compositionOrder` (same value or absent); no dependency declared |
| `COMPOSE_AUGMENT` | one package augments another's capability scope without replacing it | `extends` (proposed extension); cite parent package in `dependencies` |
| `COMPOSE_GATE` | one package must be verified as successfully loaded and its `acceptanceEvidence` satisfied before the dependent package is selected | `dependencies` with `evidenceRequirements` citing the gate artifact |

Composition terms appear in package documentation and in the T5 Schema
Alignment table above. They do not appear as field values in the current
T1 schema; they are documentation/contract vocabulary.

## Dependency Vocabulary

| Dependency class | Definition | ASSF-T1 field | Rule |
|---|---|---|---|
| `DEPENDS_ON` | hard dependency -- the package must be selected before this one; loading this package without its `DEPENDS_ON` target is a composition error | `dependencies` list entry without qualification | resolver must enforce; if dependency is missing, the dependent package must not be loaded |
| `SOFT_DEPENDS_ON` | preferred but not required; the package loads without the soft dependency but with reduced capability | `dependencies` list entry with note `(soft)` | resolver should prefer but must not block on absence |
| `REQUIRES_EVIDENCE_FROM` | the package requires a specific evidence receipt or review artifact from another package before it is usable | `evidenceRequirements` citing the source package or artifact | loader must validate the cited artifact exists before marking the package usable |

## Conflict Vocabulary

| Conflict class | Definition | ASSF-T1 field | Rule |
|---|---|---|---|
| `CONFLICTS_WITH` | packages cannot be simultaneously active; selecting both is a composition error | `conflicts` list entry | resolver must fail immediately if both packages are in the selected set |
| `SHADOWS` | this package overrides a specific capability range of the named package when they are both selected; the earlier-ordered package's behavior in that range is suppressed | derived from `conflicts` + `compositionOrder` note | document the shadowed range in `capabilityBoundary`; the shadowing package must have higher `compositionOrder`; loading order is deterministic |
| `REPLACES` | this package entirely supersedes the named package; the replaced package must not be selected when this one is | `replaces` (proposed extension, see Schema Alignment Decision); also add the replaced package to `conflicts` | document the replacement evidence in `reviewArtifacts`; the replaced package must transition to `DEPRECATED` or `RETIRED` |
| `EXTENDS` | this package augments the named package with additional capabilities; both may be selected and both apply | `extends` (proposed extension, see Schema Alignment Decision); cite parent in `dependencies` | the extending package must not narrow the parent's `capabilityBoundary`; narrowing is `SHADOWS`, not `EXTENDS` |

## Capability Claim Controls

1. Every package must declare its `capabilityClaims` explicitly (see Schema
   Alignment Decision: `PROPOSE_SCHEMA_EXTENSION`). Implicit capability from
   loading a dependency is not valid; each capability must be independently
   declared.
2. A package's `capabilityClaims` must not exceed its `authorityCeiling`.
3. A package may not claim capabilities that are listed in its own
   `capabilityBoundary` (forbidden capabilities list).
4. If a package `EXTENDS` another, it may add new claims but must not
   remove any claims from the parent.
5. If a package `REPLACES` another, it must explicitly re-declare any
   claims it retains; implicit transfer of claims is prohibited.
6. Capability claims must be consistent with the package's declared
   `sideEffects`, `permissions`, and `rollback` fields.
7. No capability claim may include runtime tool execution, provider API
   invocation, public-sync, external CLI/MCP adapter, or authority
   escalation unless those are explicitly declared in `permissions` and
   subject to a separate work order.

## Resolver Selection Behavior At Contract Level

The T5 contract defines the package-contract rules that a future resolver
must enforce. It does not implement resolver code changes. The T2 resolver
(`resolve_skill_packet`) operates on metadata from the generated index;
T5 rules apply when a resolver or loader interprets composition fields.

Contract rules for resolver behavior:

1. A resolver must reject any package selection that would violate a
   `CONFLICTS_WITH` constraint.
2. A resolver must fail on a missing `DEPENDS_ON` dependency.
3. A resolver must respect `compositionOrder` when multiple packages are
   selected; lower values load first.
4. A resolver must not infer composition behavior from field absence; all
   composition is explicit-declaration-only.
5. A resolver must not interpret loading as activation; `resolve_skill_packet`
   returns a bounded metadata packet, not an activation receipt.
6. A resolver implementing this contract must not expand `authorityCeiling`
   based on any combination of loaded packages.

## Package Graph Boundary

The package graph is the set of packages selected for a given resolver query,
ordered by `compositionOrder`, with their declared `dependencies`,
`conflicts`, `extends`, and `replaces` edges.

Rules:

1. The package graph is acyclic. A cycle (A depends on B which depends on A)
   is a composition error; the graph must be rejected.
2. The package graph is bounded by the caller's declared `riskCeiling`,
   `roles`, `phases`, and `surfaces` selector set; packages outside those
   bounds must not appear in the graph even as transitive dependencies.
3. The package graph may not include `REJECTED`, `RETIRED`, or
   `CANDIDATE` packages; only `PROPOSED`, `APPROVED`, or `ACTIVE` packages
   may be graph nodes.
4. Session-local or uncommitted packages must not appear in the graph.
5. The graph boundary does not expand authority; traversing the full graph
   does not grant the agent any capability beyond what is declared in each
   individual package's `capabilityBoundary` and `permissions`.

## Evidence Requirements For Composition Claims

All composition claims must be backed by evidence before a package advances
past `PROPOSED`:

| Claim type | Required evidence |
|---|---|
| `DEPENDS_ON` dependency | the dependency package exists in the governed registry at `CANDIDATE` state or higher; cite `sourceArtifacts` for the dependency |
| `CONFLICTS_WITH` conflict | at least one prior review or test artifact demonstrating the conflict exists; cite in `evidenceRequirements` |
| `SHADOWS` override | document the shadowed capability range in `capabilityBoundary`; cite the composition-order evidence |
| `REPLACES` replacement | the replaced package must have a `DEPRECATED` or `RETIRED` roadmap entry; cite the replacement review in `reviewArtifacts` |
| `EXTENDS` extension | the parent package must be at `APPROVED` or `ACTIVE` state; the extension must pass its own reviewer-decision gate and UAT |
| `capabilityClaims` | claims must be verifiable against the package's declared `acceptanceEvidence`; no empty or placeholder claims |

## Internal-Agent Behavior Boundary

| Rule | Description |
|---|---|
| Selection is metadata-only | internal agents select packages based on resolver metadata; they do not open instruction bodies or execute package content until a separate governed activation step |
| No silent composition | composition decisions must be logged; an agent must not silently compose packages without recording the selected set and their `compositionOrder` |
| No authority escalation | composing N packages never grants authority beyond the individual packages' declared `authorityCeiling` values; the minimum ceiling in the set applies |
| No package-graph bypass | an internal agent must not bypass the package graph by loading packages through out-of-band paths (provider memory, session state, uncommitted files) |
| Composition error handling | on a composition error (cycle, missing dependency, unresolvable conflict), the agent must stop and return a `COMPOSITION_ERROR` disposition; it must not fall back to a partial graph silently |

## External-Agent CLI/MCP Behavior Boundary

| Rule | Description |
|---|---|
| No direct mutation | external agents must not directly mutate package state, composition fields, or the generated index |
| No activation through composition | a composition-query response (if a future adapter is implemented) must not imply or grant package activation |
| Adapter not yet implemented | no external CLI/MCP composition-query adapter is implemented in ASSF-T5; `externalCliMcpDisposition: DEFERRED_WITH_REASON` applies to all composition-controlled packages |
| Adapter boundary on future implementation | a future adapter must not expose raw `permissions`, `rollback`, or `sideEffects` fields without redaction and a separate governed export decision |

## Failure Dispositions

| Failure class | Trigger | Required action | Package state |
|---|---|---|---|
| `COMPOSITION_CYCLE` | the package graph contains a dependency cycle | reject the entire graph; log the cycle path; return `COMPOSITION_ERROR` | no package in the cycle advances; all remain at their current lifecycle state |
| `MISSING_DEPENDS_ON` | a `DEPENDS_ON` dependency is absent from the governed registry | reject the dependent package selection; log the missing dependency path; return `DEPENDENCY_MISSING` | dependent package remains at its current state; the missing dependency must be filed as a `CANDIDATE` through a separate governed path |
| `UNRESOLVABLE_CONFLICT` | two or more packages in the selected set have mutual `CONFLICTS_WITH` edges | reject the conflicting package set; log the conflict pair(s); return `CONFLICT_UNRESOLVABLE` | the caller must narrow the selector set |
| `AUTHORITY_CEILING_EXCEEDED` | composing the selected set would require an `authorityCeiling` higher than the caller's declared ceiling | reject the over-budget package; log the exceeded field; return `AUTHORITY_EXCEEDED` | the offending package is not loaded |
| `EVIDENCE_MISSING` | a required `evidenceRequirements` artifact does not exist | hold the dependent package at `CANDIDATE` or `PROPOSED`; log the missing artifact path; return `EVIDENCE_REQUIRED` | package state does not advance until the evidence is filed |
| `CAPABILITY_CLAIM_CONFLICT` | a package's `capabilityClaims` include a capability listed in its own `capabilityBoundary` | reject the package; log the conflicting field values; return `CONTRACT_VIOLATION` | package must be corrected and re-reviewed before any state advance |
| `COMPOSITION_CONTRACT_GAP` | a composition claim (extends, replaces, depends) references a package not in the governed registry | flag as `BLOCKED_PENDING_DEPENDENCY_VERIFICATION`; log the unverified reference; return `GAP_FOUND` | package remains at `CANDIDATE`; a separate governed path must resolve the gap |

## Dual Agent Surface Matrix

| Consumer class | Interface or owner surface | Authority and risk boundary | Evidence | Adapter boundary | Disposition |
|---|---|---|---|---|---|
| `INTERNAL_AGENT` | the composition control contract that future internal package loaders, resolvers, and conflict checkers will consume | T5 defines composition rules and gates only; no loader or checker is implemented; composition rules never grant new authority; package graph boundary is enforced by rule; no self-activation | this contract with source-verified T1 composition fields and constraint rules; T1 package contract field reuse (NEW_FIELD_INTRODUCED for `extends`, `replaces`, `capabilityClaims`, `compositionFailureDisposition`); T3 no-self-activation invariant reuse | no loader or conflict checker implemented by ASSF-T5 | `CONTRACT_ONLY` |
| `EXTERNAL_AGENT_CLI_MCP` | future CLI/MCP composition-query or package-graph-view adapter | T5 records the external-agent disposition; does not implement, expose, or authorize any adapter; external agents must not directly mutate composition state | `externalCliMcpDisposition: DEFERRED_WITH_REASON` carried in all composition-aware packages; External-Agent CLI/MCP Behavior Boundary section | separate ASSF adapter work order required before any CLI/MCP composition interface is implemented | `DEFERRED_WITH_REASON` |

## External-Agent CLI/MCP Disposition

| Field | Value |
|---|---|
| Adapter contract | N/A with reason: external CLI/MCP composition-query or package-graph adapter not yet authored; separate ASSF adapter work order required before any CLI/MCP composition scope is implemented |
| Adapter evidence | N/A with reason: no adapter implemented in ASSF-T5 |
| External mutation boundary | external agents must not mutate composition state, package fields, or the generated index directly |
| Fixed constant in all composition-controlled packages | `externalCliMcpDisposition: DEFERRED_WITH_REASON` |

## Future Tranche Routing

| Future scope | Required next action |
|---|---|
| Executable composition engine or loader | route to a separately authorized tranche; requires GC-018 baseline and source-verified work order citing this contract as required read |
| Conflict-detection checker | route to ASSF-T7 or a checker tranche; this contract should be cited as required read |
| Schema extension implementation (`extends`, `replaces`, `capabilityClaims`, `compositionFailureDisposition`) | route to an ASSF-T1 schema extension work order; requires source-verified evidence that T1 does not already carry these fields (NEW_FIELD_INTRODUCED evidence command: `rg -n "extends|replaces|capabilityClaims|compositionFailureDisposition" docs/reference/agent_system_skills/CVF_ASSF_PACKAGE_CONTRACT.md`) |
| Composition-conformance machine check | route to ASSF-T7 or a checker tranche; checker should verify that package entries carry valid composition evidence citations |
| ASSF-T6 CVF Web Projection | next in roadmap after T5 closes; must not begin until T5 is closed |

## Delta Execution Claim Boundary Control Block

| Field | Disposition |
|---|---|
| claimScope | ASSF-T5 composition control contract authoring only |
| claimDisposition | BOUNDED_CLAIM_WITH_EVIDENCE -- contract-definition worker-return lane only |
| receiptEvidence | N/A with reason: no runtime execution, no composition engine invocation, no package instances created |
| actionEvidence | ACTION_EVIDENCE_PRESENT -- composition control contract with source-verified T1 field reuse and schema alignment decision table |
| invocationBoundary | reference document authoring only; no filesystem mutation beyond creating this file |
| interceptionBoundary | no IDE/shell/git/filesystem/provider interception claim |
| claimLanguage | authorizes a bounded composition control contract document only |
| forbiddenExpansion | no composition engine code, loader, resolver changes, generator/checker changes, package instances, SKILL.md, skill.source.json, registry entries, normalizer, promoter, CLI/MCP adapter, migration, runtime/provider/live, or public-sync |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: the composition control contract references private ASSF governance
architecture and private legacy provenance decisions. Public-safe export
requires later redaction and public-sync authorization.

## Claim Boundary

This document defines the composition control contract only. It does not
implement a composition engine, loader, conflict checker, resolver change,
generator change, drift checker, or test code. It does not create real
package instances, SKILL.md, skill.source.json, or registry entries. It
does not activate any skill, implement a CLI/MCP adapter, run a corpus
migration, update session state, or authorize ASSF-T6. Reviewer/closer
owns completion review authoring, roadmap status update, session sync, and
any material commit after acceptance.
