# CVF Governance Kernel Owner Map

Memory class: FULL_RECORD

Status: OWNER_MAP_AUTHORITATIVE

docType: reference

Date: 2026-05-20

---

## Purpose

Provide the authoritative owner map for the 12 governance-kernel surfaces
inventoried in HN2.a.

Future work orders that touch a kernel surface must cite the applicable row in
this map before changing ownership, aliases, adapters, policy, or runtime
behavior.

---

## Scope / Target / Owner Boundary

In scope:

- The 12 HN2.a surfaces only.
- Classification of observed owner candidates and aliases.
- Routing guidance for future GC-018 and work-order authoring.

Out of scope:

- New governance semantics.
- Runtime enforcement.
- Doctrine modification.
- Freeze release.
- New roles, engines, receipts, memory tiers, provider methods, phases, or
  kernel surfaces.

---

## Authority Chain

- Doctrine: `ECOSYSTEM/doctrine/CVF_DOCTRINE_RULES.md`
- Split direction:
  `docs/reviews/CVF_POST_PAIN_POINT_CLOSURE_HARDENING_ROADMAP_CLAUDE_REBUTTAL_2026-05-20.md`
- Inventory:
  `docs/reviews/CVF_HN2A_GOVERNANCE_KERNEL_OWNER_INVENTORY_2026-05-20.md`
- Roadmap:
  `docs/roadmaps/CVF_HN2B_GOVERNANCE_KERNEL_OWNER_MAP_ROADMAP_2026-05-20.md`
- Rebuttal:
  `docs/reviews/CVF_HN2B_GOVERNANCE_KERNEL_OWNER_MAP_CODEX_REBUTTAL_2026-05-20.md`
- Baseline:
  `docs/baselines/CVF_GC018_HN2B_GOVERNANCE_KERNEL_OWNER_MAP_2026-05-20.md`

---

## Owner Surface / Source Lineage

Owner surface: governance-kernel owner routing for the 12 HN2.a surfaces.

Source lineage:

1. HN2.a inventoried the surfaces.
2. HN2.b rebuttal accepted the closed classification set and precedence rule.
3. HN2.b GC-018 authorized only this owner-map artifact.
4. This file is the authoritative HN2.b version until a later GC-018
   supersedes it.

---

## Protocol / Contract / Requirements

Requirements:

- Use only the closed classification set in this file.
- Apply class precedence before promoting any alias to an owner-like class.
- Treat `documentation_alias`, `legacy_alias`, and `parallel_surface` as
  non-owner classes.
- Require a fresh GC-018 before owner replacement, alias strengthening, or
  expansion beyond the 12 HN2.a surfaces.

---

## Classification Set

Closed classification set:

- `canonical_owner`
- `canonical_alias`
- `adapter_required`
- `legacy_alias`
- `deferred`
- `rejected`
- `parallel_surface`
- `documentation_alias`
- `repository_guard`
- `runtime_guard`
- `canonical_method_contract`

Class precedence:

- `canonical_owner` is reserved for the root owner of a surface or declared
  sub-surface.
- `runtime_guard` and `repository_guard` classify the two guard-model
  sub-surfaces.
- `canonical_method_contract` is provider-method only.
- `documentation_alias` is not a `canonical_alias`.
- Unresolved or insufficiently proven cases default to `deferred`, not
  `canonical_owner`.

---

## Map Table

| Surface | Alias observed in HN2.a | Classification | Rationale | Evidence path |
| --- | --- | --- | --- | --- |
| Authority model | `EXTENSIONS/CVF_GUARD_CONTRACT/src/contracts/orchestrator.contract.ts` | `canonical_owner` | Current delegation authority contract owns worker-lane delegation shape. | `EXTENSIONS/CVF_GUARD_CONTRACT/src/contracts/orchestrator.contract.ts` |
| Authority model | legacy governance-kernel freeze recommendation | `legacy_alias` | Legacy packet describes broader authority chain; owner map does not replace doctrine. | `.private_reference/legacy/CVF 17.05/REVIEW FOLDER/CVF_17_05_GOVERNANCE_KERNEL_FREEZE_CODEX_RECOMMENDATION_2026-05-17.md` |
| Authority model | system reconvergence stop decision | `legacy_alias` | Legacy decision supports posture context, not canonical runtime owner. | `.private_reference/legacy/CVF 17.05/REVIEW FOLDER/CVF_17_05_SYSTEM_RECONVERGENCE_STOP_DECISION_2026-05-17.md` |
| Authority model | governance control matrix authority rows | `documentation_alias` | Matrix lists enforcement owners per GC control; it is not the delegation contract owner. | `docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md` |
| Role model | `docs/reference/CVF_AGENT_ROLE_CATALOG.md` | `canonical_owner` | G1 closed the role catalog as reference taxonomy. | `docs/reference/CVF_AGENT_ROLE_CATALOG.md` |
| Role model | `CVFRole` | `adapter_required` | Runtime role union expresses the catalog in guard-contract code; it is not a new taxonomy source. | `EXTENSIONS/CVF_GUARD_CONTRACT/src/types.ts` |
| Role model | `AgentFunctionRole` / role-permission contract | `adapter_required` | Role-permission surfaces are runtime expressions of role capability, not catalog replacement. | `EXTENSIONS/CVF_GUARD_CONTRACT/src/contracts/role-permission.contract.ts` |
| Role model | `execute-role-resolver.ts` | `adapter_required` | Web execution resolves RBAC to CVF roles for a lane-specific path. | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/execute-role-resolver.ts` |
| Role model | Web RBAC roles | `parallel_surface` | Web RBAC roles are app auth roles and must not collide with CVF execution roles. | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/execute-role-resolver.ts` |
| Policy decision surface | `policy-decision.contract.ts` | `canonical_owner` | Defines policy decision shape and decision verbs. | `EXTENSIONS/CVF_GUARD_CONTRACT/src/contracts/policy-decision.contract.ts` |
| Policy decision surface | governed pack `execution.policy.json` files | `adapter_required` | Pack-local policy data must remain instances/adapters of the policy decision surface. | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/governed-packs/app_builder_complete/execution.policy.json` |
| Policy decision surface | governance control matrix policy entries | `documentation_alias` | Matrix records control ownership, not a parallel PolicyEngine. | `docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md` |
| Risk model | `risk-engine.contract.ts` | `canonical_owner` | Owns the risk-engine contract surface for R0-R3. | `EXTENSIONS/CVF_GUARD_CONTRACT/src/contracts/risk-engine.contract.ts` |
| Risk model | `CVFRiskLevel` / R-scale in `types.ts` | `canonical_alias` | Shared runtime type mirrors the same frozen R0-R3 scale. | `EXTENSIONS/CVF_GUARD_CONTRACT/src/types.ts` |
| Risk model | R-scale references in docs/control matrix | `documentation_alias` | Documentation references the same scale but does not own it. | `docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md` |
| Guard model | `GuardRuntimeEngine` | `runtime_guard` | Runtime guard evaluation owner. | `EXTENSIONS/CVF_GUARD_CONTRACT/src/engine.ts` |
| Guard model | mandatory guard types and guard result contracts | `runtime_guard` | Shared runtime guard vocabulary belongs to the guard contract. | `EXTENSIONS/CVF_GUARD_CONTRACT/src/types.ts` |
| Guard model | `CVF_GUARD_AUTHORING_STANDARD_GUARD.md` | `repository_guard` | Repository guard authoring owner for guard-file quality. | `governance/toolkit/05_OPERATION/CVF_GUARD_AUTHORING_STANDARD_GUARD.md` |
| Guard model | `CVF_GUARD_REGISTRY_GUARD.md` | `repository_guard` | Repository guard discoverability owner. | `governance/toolkit/05_OPERATION/CVF_GUARD_REGISTRY_GUARD.md` |
| Guard model | other `governance/toolkit/05_OPERATION/*GUARD.md` files | `repository_guard` | Repo-level governance guards are distinct from runtime guard evaluation. | `governance/toolkit/05_OPERATION/` |
| Execution lifecycle | `runtime-workflow.contract.ts` | `canonical_owner` | Owns workflow lifecycle contract. | `EXTENSIONS/CVF_GUARD_CONTRACT/src/contracts/runtime-workflow.contract.ts` |
| Execution lifecycle | `INTAKE`, `DESIGN`, `BUILD`, `REVIEW`, `FREEZE` | `canonical_alias` | Canonical phase vocabulary is shared in runtime types. | `EXTENSIONS/CVF_GUARD_CONTRACT/src/types.ts` |
| Execution lifecycle | `DISCOVERY` | `legacy_alias` | Accepted phase alias at boundaries only. | `EXTENSIONS/CVF_GUARD_CONTRACT/src/types.ts` |
| Execution lifecycle | legacy system reconvergence phase terms | `legacy_alias` | Historical phase labels map to canonical lifecycle terms. | `.private_reference/legacy/CVF 17.05/REVIEW FOLDER/CVF_17_05_SYSTEM_RECONVERGENCE_STOP_DECISION_2026-05-17.md` |
| Delegation / handoff | delegation via `orchestrator.contract.ts` | `canonical_owner` | Orchestrator contract owns delegation from authority role to worker lane. | `EXTENSIONS/CVF_GUARD_CONTRACT/src/contracts/orchestrator.contract.ts` |
| Delegation / handoff | active handoff format | `parallel_surface` | Handoff continuity is adjacent to delegation but owned by active-session handoff rules. | `AGENT_HANDOFF_V10_2026-05-19.md` |
| Delegation / handoff | handoff/delegation ADRs | `documentation_alias` | ADRs document the split and do not merge envelopes. | `docs/reference/archive/CVF_ADR_AGENT_HANDOFF_CONTRACT_RELATIONSHIP_2026-05-17.md` |
| Receipt envelope | `GovernanceEvidenceReceipt` | `canonical_owner` | Shared root evidence receipt shape. | `EXTENSIONS/CVF_GUARD_CONTRACT/src/types.ts` |
| Receipt envelope | `GatewayReceipt` | `adapter_required` | Gateway lane receipt composes lane-specific receipt metadata. | `EXTENSIONS/CVF_MODEL_GATEWAY/src/gateway-receipt.ts` |
| Receipt envelope | web governance envelope | `adapter_required` | Web lane wraps execution metadata around the root evidence receipt. | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/web-governance-envelope.ts` |
| Receipt envelope | audit-memory receipt | `adapter_required` | Memory capture receipt is lane-specific and must not become a new root envelope. | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/audit-memory-receipt.ts` |
| Memory tier model | memory tier classifier contract | `canonical_owner` | Owns the tier classifier contract for the memory tier model. M2 one-surface release: `freeze_released: true`; `freeze_release_date: 2026-05-24`; rationale: bounded M1 durable memory must use the canonical classifier instead of duplicating tier semantics; packet `docs/reviews/CVF_FREEZE_RELEASE_PACKET_M2_MEMORY_TIER_2026-05-24.md`; rebuttal `docs/reviews/CVF_GC019_M2_D06_MEMORY_TIER_FREEZE_RELEASE_REBUTTAL_2026-05-24.md`. | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-tier-classifier.contract.ts` |
| Memory tier model | audit-memory receipt | `adapter_required` | Capture-side observer that records policy fields; not a tier definition. | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/audit-memory-receipt.ts` |
| Memory tier model | reinjection references in legacy packets | `legacy_alias` | Historical reinjection vocabulary remains outside the current no-reinjection capture boundary. | `.private_reference/legacy/CVF 17.05/REVIEW FOLDER/CVF_17_05_SYSTEM_RECONVERGENCE_STOP_DECISION_2026-05-17.md` |
| Capability surface | `skill-registry.ts` | `canonical_owner` | Runtime capability registry owner. | `EXTENSIONS/CVF_GUARD_CONTRACT/src/runtime/skill-registry.ts` |
| Capability surface | `full-skill-registry.ts` | `canonical_alias` | Expanded data set using the same registry type, not a separate owner. | `EXTENSIONS/CVF_GUARD_CONTRACT/src/runtime/full-skill-registry.ts` |
| Capability surface | governed capability intake doctrine | `canonical_alias` | Intake-side doctrine governs admission of new capability material. | `docs/reference/CVF_GOVERNED_CAPABILITY_INTAKE_DOCTRINE_2026-05-07.md` |
| Capability surface | boundary-first intake doctrine | `canonical_alias` | Intake doctrine companion; no runtime skill is added by the document. | `docs/reference/archive/CVF_GOVERNED_CAPABILITY_INTAKE_AND_BOUNDARY_FIRST_GOVERNANCE_DOCTRINE_2026-05-17.md` |
| Provider execution semantics | Model Gateway public barrel | `canonical_owner` | Gateway package owns provider-output contract surface exports. | `EXTENSIONS/CVF_MODEL_GATEWAY/src/index.ts` |
| Provider execution semantics | provider output contract | `canonical_method_contract` | Method contract only; no runtime provider execution claim. | `EXTENSIONS/CVF_MODEL_GATEWAY/src/provider-output-contract.ts` |
| Provider execution semantics | stream contract | `canonical_method_contract` | Method contract only. | `EXTENSIONS/CVF_MODEL_GATEWAY/src/stream-contract.ts` |
| Provider execution semantics | tool-call contract | `canonical_method_contract` | Method contract only. | `EXTENSIONS/CVF_MODEL_GATEWAY/src/tool-call-contract.ts` |
| Provider execution semantics | json-mode contract | `canonical_method_contract` | Method contract only. | `EXTENSIONS/CVF_MODEL_GATEWAY/src/json-mode-contract.ts` |
| Provider execution semantics | reasoning contract | `canonical_method_contract` | Contract-only evidence; no reasoning runtime. | `EXTENSIONS/CVF_MODEL_GATEWAY/src/reasoning-contract.ts` |
| Provider execution semantics | vision contract | `canonical_method_contract` | Contract-only evidence; no vision runtime. | `EXTENSIONS/CVF_MODEL_GATEWAY/src/vision-contract.ts` |
| Provider execution semantics | gateway receipt | `adapter_required` | Receipt support for gateway output, not a provider execution owner. | `EXTENSIONS/CVF_MODEL_GATEWAY/src/gateway-receipt.ts` |
| Vocabulary aliases | runtime type aliases | `canonical_owner` | Runtime vocabulary owner for phase/risk/role aliases. | `EXTENSIONS/CVF_GUARD_CONTRACT/src/types.ts` |
| Vocabulary aliases | doctrine vocabulary | `documentation_alias` | Doctrine is supreme but does not become a runtime alias file. | `ECOSYSTEM/doctrine/CVF_DOCTRINE_RULES.md` |
| Vocabulary aliases | role catalog terms | `documentation_alias` | Catalog terms document role taxonomy; runtime aliases remain in guard contract types. | `docs/reference/CVF_AGENT_ROLE_CATALOG.md` |
| Vocabulary aliases | legacy `DISCOVERY` and ORCHESTRATOR terms | `legacy_alias` | Historical vocabulary must map to current canonical terms. | `.private_reference/legacy/CVF 17.05/REVIEW FOLDER/CVF_17_05_GOVERNANCE_KERNEL_FREEZE_CODEX_RECOMMENDATION_2026-05-17.md` |

---

## Coverage Assertion

All 12 HN2.a surfaces are represented:

1. Authority model
2. Role model
3. Policy decision surface
4. Risk model
5. Guard model
6. Execution lifecycle
7. Delegation / handoff
8. Receipt envelope
9. Memory tier model
10. Capability surface
11. Provider execution semantics
12. Vocabulary aliases

Every alias family named in the HN2.a inventory is classified in the map table
above. Ambiguous or historical aliases are intentionally classified as
`legacy_alias`, `documentation_alias`, `parallel_surface`, or `deferred` style
classes instead of being promoted to `canonical_owner`.

---

## Forbidden Expansion Register

This owner map does not authorize:

- new role taxonomy or role IDs;
- new policy engine, risk engine, or guard engine;
- new receipt envelope;
- new memory tier;
- new provider method contract;
- new runtime provider execution support;
- new lifecycle phase;
- new kernel surface beyond the 12 HN2.a surfaces;
- memory reinjection or persistent/archive memory behavior;
- doctrine modification;
- public-sync claim expansion;
- freeze release.

---

## Citation Rule

Any future work order touching a governance-kernel surface must cite the row or
rows from this owner map that cover the touched surface.

If a work order proposes to reclassify an alias, replace an owner, add a new
alias, or release a frozen surface, it must file a fresh GC-018 with reviewer
rebuttal before implementation.

---

## Change Protocol

Updates to this owner map require:

1. a new roadmap or work order naming the proposed change;
2. a reviewer rebuttal;
3. a fresh GC-018 baseline;
4. a replacement owner-map version under `docs/reference/`;
5. a closure review that records supersession of this version.

Silent reclassification is forbidden.

---

## Risk / Corrective Action

| Risk | Corrective action |
| --- | --- |
| Parallel guard surfaces collapse | Runtime guard and repository guard are separate classified rows |
| Provider contracts are mistaken for runtime support | Method contracts are `canonical_method_contract`, not runtime owners |
| Receipt lanes create new root envelopes | Lane receipts are `adapter_required` around the root evidence receipt |
| Memory capture becomes reinjection | Audit memory is capture-side only; reinjection stays out of scope |
| Documentation aliases become canonical owners | Documentation aliases cannot outrank source-owner rows |

---

## Enforcement / Verification

Verification is static:

- future work orders must cite matching rows;
- HN2.c release intake uses this map as prerequisite;
- reviewer role rejects silent reclassification or unlisted kernel-surface
  expansion.

There is no runtime enforcement in this file.

---

## Related Artifacts

- `docs/reviews/CVF_HN2A_GOVERNANCE_KERNEL_OWNER_INVENTORY_2026-05-20.md`
- `docs/roadmaps/CVF_HN2B_GOVERNANCE_KERNEL_OWNER_MAP_ROADMAP_2026-05-20.md`
- `docs/reviews/CVF_HN2B_GOVERNANCE_KERNEL_OWNER_MAP_CODEX_REBUTTAL_2026-05-20.md`
- `docs/baselines/CVF_GC018_HN2B_GOVERNANCE_KERNEL_OWNER_MAP_2026-05-20.md`
- `governance/toolkit/05_OPERATION/CVF_GOVERNANCE_KERNEL_FREEZE_RELEASE_RULE.md`

---

## Decision / Disposition

Disposition: OWNER_MAP_AUTHORITATIVE.

This map is locked as the HN2.b owner map. HN2.c may cite this map as the
prerequisite owner map, but HN2.c still requires its own GC-018 and work order.

---

## Claim Boundary

This reference map is a private governance routing artifact. It proves no live
runtime behavior, changes no source code, creates no new governance semantics,
lifts no freeze posture, and makes no public-facing CVF claim.
