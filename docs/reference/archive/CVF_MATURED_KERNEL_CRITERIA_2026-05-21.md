# CVF Matured Kernel Criteria

Memory class: POINTER_RECORD

Status: CRITERIA_AUTHORITATIVE_NO_LIFT

docType: reference

Date: 2026-05-21

---

## Purpose

Define the review criteria for deciding whether a frozen governance-kernel
surface is stable, eligible to request one-surface release, or should remain
frozen indefinitely.

This reference does not release any surface. It supplies criteria for future
review, GC-018, and work-order authoring.

---

## Scope / Target / Owner Boundary

Target: the 12 governance-kernel surfaces listed in the HN2.b owner map.

In scope:

- maturity vocabulary for review packets;
- per-surface maturity criteria;
- release-candidate screening;
- permanent-freeze recommendation criteria;
- relationship to HN2.c release packets.

Out of scope:

- active-state schema change;
- owner-map supersession;
- release approval;
- global freeze lift;
- doctrine change;
- runtime or repository guard implementation.

---

## Authority Chain

1. Doctrine:
   `ECOSYSTEM/doctrine/CVF_DOCTRINE_RULES.md`
2. Operator:
   explicit future approval for any release.
3. HN2.b owner map:
   `docs/reference/archive/CVF_GOVERNANCE_KERNEL_OWNER_MAP_2026-05-20.md`
4. HN2.c freeze-release rule:
   `governance/toolkit/05_OPERATION/CVF_GOVERNANCE_KERNEL_FREEZE_RELEASE_RULE.md`
5. This criteria reference:
   `docs/reference/CVF_MATURED_KERNEL_CRITERIA_2026-05-21.md`

If this document conflicts with doctrine or HN2.c, the stricter rule wins.

---

## Owner Surface / Source Lineage

Owner surface: review criteria for governance-kernel maturity assessment.

Source lineage:

1. HN2.a inventoried governance-kernel surfaces.
2. HN2.b locked the owner map.
3. HN2.c defined the one-surface release rule and prohibited global lift.
4. This document defines maturity criteria that future reviews may use before
   opening a release packet.

---

## Protocol / Contract / Requirements

Protocol:

1. Identify the exact HN2.b surface.
2. Cite the HN2.b row or rows that govern the proposed work.
3. Classify the surface using the posture vocabulary in this document.
4. If the surface is only stable, keep it frozen.
5. If the surface is a release candidate, file a separate HN2.c one-surface
   release packet.
6. If the surface is permanent-freeze recommended, reject owner replacement
   unless a later doctrine-level decision supersedes this posture.

---

## Posture Vocabulary

Use these labels only as review vocabulary. They do not add schema fields and
do not alter `freezePosture`.

| Label | Meaning | Effect |
| --- | --- | --- |
| `frozen_recommended` | Surface remains governed by the current freeze. | Normal default. |
| `maturity_candidate` | Surface has enough stable evidence to be assessed, but no release need is proven. | Keep frozen; may file assessment only. |
| `surface_release_candidate` | Surface may justify a future HN2.c one-surface release request. | Requires separate HN2.c packet. |
| `surface_released` | Surface has completed HN2.c release with operator approval. | Not reachable through this document. |
| `permanent_freeze_recommended` | Surface should remain frozen indefinitely unless doctrine/operator direction changes. | Reject release proposals absent extraordinary justification. |

---

## Maturity Criteria

A surface may be called `maturity_candidate` only when all criteria below hold:

1. Owner clarity: the HN2.b owner row is unambiguous, and no unresolved
   stronger owner candidate exists.
2. Alias control: known aliases are classified without silent promotion to
   canonical owner.
3. Drift control: recent work has not introduced a new role taxonomy, policy
   engine, risk engine, guard engine, receipt envelope, memory tier, provider
   execution semantic, lifecycle phase, or kernel surface.
4. Evidence continuity: at least one completion review or authoritative
   reference proves the current owner still routes future work correctly.
5. Rebuttal stability: recent reviewer findings are non-blocking or already
   closed for the surface.
6. Operator need: no current operator-approved work is blocked by the freeze.
7. Claim safety: public or product wording can remain bounded without
   pretending the surface is released.

If any criterion fails, keep the surface `frozen_recommended`.

---

## Release-Candidate Criteria

A surface may be called `surface_release_candidate` only when all maturity
criteria hold and all screening criteria below are present:

1. Concrete blocked need: a real work order, GC-018, or external pain point is
   blocked by the frozen owner/classification.
2. Replacement design: the proposed owner/classification and alias migration
   path are explicit.
3. Harm comparison: the harm of staying frozen is greater than the drift risk
   of release.
4. Evidence path: the proposer can name the live, static, or review evidence
   required by HN2.c for the specific surface.
5. Review independence: a different agent role can review the release request.
6. Operator checkpoint: the operator has approved opening a release packet or
   can approve before release becomes binding.

`surface_release_candidate` is not release. It is only permission to prepare a
future HN2.c packet.

---

## Permanent-Freeze Criteria

A surface should be labeled `permanent_freeze_recommended` when any condition
below is true:

1. Doctrine dependency: changing the surface would alter doctrine or doctrine
   interpretation.
2. Global semantics risk: release would effectively redefine multiple kernel
   surfaces at once.
3. No concrete harm: no blocked real work exists, only hypothetical future
   flexibility.
4. Mature-as-frozen: the surface is stable precisely because it is frozen and
   adapter work can proceed through existing owners.
5. Public-trust risk: release would create pressure to overstate CVF runtime,
   product, provider, or safety maturity.
6. Replacement ambiguity: no replacement owner is clearer than the current
   owner map.

Permanent-freeze recommendation is a review posture, not a new irreversible
schema state.

---

## Surface Assessment Matrix

Initial posture for all 12 HN2.b surfaces remains `frozen_recommended`.

| Surface | Initial maturity posture | Release path |
| --- | --- | --- |
| Authority model | `frozen_recommended` | HN2.c one-surface release only |
| Role model | `frozen_recommended` | HN2.c one-surface release only |
| Policy decision surface | `frozen_recommended` | HN2.c one-surface release only |
| Risk model | `frozen_recommended` | HN2.c one-surface release only |
| Guard model | `frozen_recommended` | HN2.c one-surface release only |
| Execution lifecycle | `frozen_recommended` | HN2.c one-surface release only |
| Delegation / handoff | `frozen_recommended` | HN2.c one-surface release only |
| Receipt envelope | `frozen_recommended` | HN2.c one-surface release only |
| Memory tier model | `frozen_recommended` | HN2.c one-surface release only |
| Capability surface | `frozen_recommended` | HN2.c one-surface release only |
| Provider execution semantics | `frozen_recommended` | HN2.c one-surface release only |
| Vocabulary aliases | `frozen_recommended` | HN2.c one-surface release only |

No row in this matrix is released by this document.

---

## HN2.c Bridge

This criteria reference can support a future HN2.c release packet by organizing
evidence, but it cannot replace HN2.c.

Every release still requires:

1. written justification;
2. replacement design;
3. evidence of harm;
4. different-role reviewer rebuttal;
5. operator approval.

If any HN2.c condition is missing, the surface remains frozen even if it is a
`maturity_candidate`.

---

## Global Freeze Posture

Global lift remains prohibited.

The phrase "matured kernel" means a set of criteria for evaluating surfaces,
not a claim that all 12 surfaces are released. A future global posture change
would require a later doctrine-level roadmap, explicit operator authorization,
and a superseding rule that explains why HN2.c's global-lift prohibition no
longer protects CVF.

---

## Enforcement / Verification

Future reviewers should verify:

- the work order cites the relevant HN2.b rows;
- maturity labels are used as review vocabulary only;
- release requests still file HN2.c packets;
- no global release is inferred;
- no public or product claim says the kernel is globally mature unless a
  later superseding artifact authorizes that wording.

---

## Related Artifacts

- `docs/reference/archive/CVF_GOVERNANCE_KERNEL_OWNER_MAP_2026-05-20.md`
- `governance/toolkit/05_OPERATION/CVF_GOVERNANCE_KERNEL_FREEZE_RELEASE_RULE.md`
- `docs/roadmaps/CVF_MATURED_KERNEL_CRITERIA_ROADMAP_2026-05-21.md`
- `docs/baselines/CVF_GC018_MATURED_KERNEL_CRITERIA_2026-05-21.md`
- `docs/reviews/CVF_MATURED_KERNEL_CRITERIA_COMPLETION_2026-05-21.md`

---

## Decision / Disposition

Disposition: CRITERIA_AUTHORITATIVE_NO_LIFT.

This criteria reference is available for future work-order and rebuttal
screening. It does not supersede HN2.b or HN2.c.

---

## Claim Boundary

This reference defines review criteria only. It does not release any kernel
surface, change `freezePosture`, update owner classifications, implement a
guard, change runtime behavior, or publish a public-facing maturity claim.
