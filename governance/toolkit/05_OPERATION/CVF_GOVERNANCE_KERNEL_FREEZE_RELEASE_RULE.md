# CVF Governance Kernel Freeze-Release Rule

Memory class: FULL_RECORD

Status: RULE_BINDING

Applies to: Future work that touches a governance-kernel surface classified in
`docs/reference/archive/CVF_GOVERNANCE_KERNEL_OWNER_MAP_2026-05-20.md`.

Enforced by: Rebuttal intake, GC-018 baselines, work-order review, and future
mechanical guard work if separately authorized.

---

## Purpose

Define what the governance-kernel freeze means, what can release one surface
from freeze, and how release decisions must be recorded.

This rule is policy text. It does not implement a runtime engine or repository
guard.

---

## Scope / Target / Owner Boundary

Target: the 12 governance-kernel surfaces classified by the HN2.b owner map.

Owner boundary: this rule governs release intake for those surfaces only. It
does not own doctrine, runtime guard execution, public claims, or the adapter
implementation plan.

---

## Owner Surface / Source Lineage

Owner surface: per-surface freeze-release intake for governance-kernel owner
changes.

Source lineage:

- HN2.b owner map:
  `docs/reference/archive/CVF_GOVERNANCE_KERNEL_OWNER_MAP_2026-05-20.md`
- HN2.c GC-018:
  `docs/baselines/archive/CVF_GC018_HN2C_GOVERNANCE_KERNEL_FREEZE_RELEASE_RULE_2026-05-20.md`
- HN2.c rebuttal:
  `docs/reviews/archive/CVF_HN2C_FREEZE_RELEASE_RULE_CODEX_REBUTTAL_2026-05-20.md`

---

## Protocol / Contract / Requirements

The protocol is:

1. Identify the exact owner-map surface.
2. Classify the proposed change using the frozen-state table.
3. If release is required, file a one-surface release packet.
4. Satisfy all five release conditions.
5. Record the result in GC-018/rebuttal/owner-map/completion artifacts.

---

## Rule

The 12 governance-kernel surfaces classified by the HN2.b owner map are frozen
against silent owner replacement, alias reclassification, surface expansion, and
kernel-semantic drift.

Doctrine remains supreme. If this rule conflicts with
`ECOSYSTEM/doctrine/CVF_DOCTRINE_RULES.md`, doctrine wins and the release
proposal is rejected at intake.

Global release is prohibited. A release packet may address only one named
surface at a time.

---

## Enforcement Surface

This rule is enforced through review and authoring gates:

- roadmap/rebuttal intake;
- GC-018 baselines;
- work-order scope checks;
- completion reviews;
- future mechanical guard if separately authorized.

Mechanical enforcement is out of scope for HN2.c and requires its own roadmap,
rebuttal, GC-018, work order, and closure review.

---

## Frozen Scope

The frozen surfaces are:

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

Source of truth:

- `docs/reference/archive/CVF_GOVERNANCE_KERNEL_OWNER_MAP_2026-05-20.md`

---

## Frozen States

| Change class | Posture | Intake action |
| --- | --- | --- |
| Rename canonical owner file/symbol | BLOCKED | Return BLOCKING unless a release packet is filed |
| Reclassify an alias to a stronger class | BLOCKED | Return BLOCKING unless a release packet is filed |
| Add new alias under an existing surface | CONDITIONALLY_PERMITTED | Requires owner-map update GC-018 unless purely documentary and classified as documentation_alias |
| Add new surface beyond the 12 | BLOCKED | Return BLOCKING |
| Add new role taxonomy, policy engine, risk engine, guard engine, receipt envelope, memory tier, provider method contract, or phase | BLOCKED | Return BLOCKING |
| Add pack-local instance of an existing canonical contract | PERMITTED_WITH_NORMAL_GC018 | Normal GC-018 and work order apply |
| Adapter implementation that respects the owner-map classification | PERMITTED_WITH_NORMAL_GC018 | Normal GC-018 and work order apply |
| Documentation update without classification change | PERMITTED_WITH_FAST_LANE_OR_DOC_GATE | GC-024 or relevant docs gate applies |
| Release one frozen surface | BLOCKED_WITHOUT_RELEASE_PACKET | Requires this rule's release packet |
| Release all surfaces globally | REJECTED | Global lift is prohibited |

---

## Release Conditions

A release packet may release one named surface only when all five conditions
hold:

1. Written justification: the current owner/classification is insufficient for
   a real active CVF need.
2. Replacement design: the proposed owner/classification and migration path for
   every affected alias are explicit.
3. Evidence of harm: at least one blocked work order, GC-018, or external
   pain point proves the current freeze causes concrete harm.
4. Reviewer rebuttal: a reviewer in a different agent role from the proposer
   returns a non-blocking disposition.
5. Operator approval: the operator explicitly approves the release and the
   approval is recorded in active session state or its successor registry.

Release is not exemption. A released surface remains under normal CVF
governance.

---

## Authority Chain

The authority chain is:

1. Doctrine
2. Operator
3. Reviewer
4. Proposer

Rules:

- Doctrine cannot be overridden by a release packet.
- The reviewer must be a different agent role than the proposer.
- The proposer cannot self-approve.
- Operator approval is required for any release to become binding.

---

## Recording Requirements

Every release must record:

- a GC-018 baseline under `docs/baselines/`;
- a reviewer rebuttal under `docs/reviews/`;
- an updated owner-map version under `docs/reference/`;
- active-state pointer/status text if needed;
- a completion review under `docs/reviews/`.

Per-surface release state belongs in the rule artifact or owner-map update, not
as a new schema in `CVF_SESSION/ACTIVE_SESSION_STATE.json`.

---

## Machine-Readable Block

```yaml
ruleId: CVF_GOVERNANCE_KERNEL_FREEZE_RELEASE_RULE
version: "2026-05-20"
status: RULE_BINDING
globalLiftAllowed: false
ownerMap: docs/reference/archive/CVF_GOVERNANCE_KERNEL_OWNER_MAP_2026-05-20.md
surfacePosture:
  authority_model: frozen
  role_model: frozen
  policy_decision_surface: frozen
  risk_model: frozen
  guard_model: frozen
  execution_lifecycle: frozen
  delegation_handoff: frozen
  receipt_envelope: frozen
  memory_tier_model: frozen
  capability_surface: frozen
  provider_execution_semantics: frozen
  vocabulary_aliases: frozen
releaseRequires:
  - written_justification
  - replacement_design
  - evidence_of_harm
  - different_role_reviewer_rebuttal
  - operator_approval
mechanicalGuard: separate_follow_on_gc018_required
```

---

## Related Artifacts

- `ECOSYSTEM/doctrine/CVF_DOCTRINE_RULES.md`
- `docs/reference/archive/CVF_GOVERNANCE_KERNEL_OWNER_MAP_2026-05-20.md`
- `docs/baselines/archive/CVF_GC018_HN2C_GOVERNANCE_KERNEL_FREEZE_RELEASE_RULE_2026-05-20.md`
- `docs/reviews/archive/CVF_HN2C_FREEZE_RELEASE_RULE_CODEX_REBUTTAL_2026-05-20.md`

---

## Boundaries / Non-Goals

This rule does not:

- approve any release by itself;
- implement mechanical repository enforcement;
- alter doctrine;
- alter runtime guard behavior;
- authorize adapter implementation;
- lift the freeze globally.

---

## Final Clause

The kernel freeze protects ownership truth. A worker may extend behavior only
through the owner-map route and the appropriate governance gate; it may not
silently redefine the kernel to make a local task easier.
