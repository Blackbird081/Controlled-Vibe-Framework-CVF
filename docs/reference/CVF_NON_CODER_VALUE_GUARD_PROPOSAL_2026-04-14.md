# CVF Non-Coder Value Guard Proposal
Memory class: POINTER_RECORD

> Date: 2026-04-14
> Class: REFERENCE / GUARD_PROPOSAL / NON_CODER_VALUE
> Status: SUPERSEDED IN PART — `GC-044` now actively governs template/skill corpus quality and trusted-subset admission; the broader non-coder value guard remains proposed
> Authority: operator-confirmed product direction, 2026-04-14

---

## 0. Why This Guard Should Exist

CVF's public product value is now centered on the non-coder path.

That means future changes to:

- `/api/execute`
- front-door templates and wizards
- guided fallback behavior
- approval flow behavior
- risk visibility
- knowledge-native benefit claims for non-coders

must not drift based on provider preference, convenience, or legacy corpus noise.

This guard is proposed because non-coder value is no longer just a roadmap preference. It is a public-facing quality invariant.

---

## 1. Proposed Guard Name

`CVF_NON_CODER_VALUE_GUARD`

This remains a proposed broader guard-class artifact.

Current repo truth:

- `GC-044` is already active for template/skill corpus quality and trusted-subset admission
- the broader public non-coder value guard is still not active runtime or CI enforcement yet

---

## 2. What The Guard Should Enforce

The future guard should enforce the following invariants:

1. **No public-facing non-coder value claim without governed evidence**
   Any tranche claiming improved value for non-coders must cite the approved measurement standard and evidence packet.

2. **No benchmark-value proof using an untrusted corpus**
   Any template/skill corpus used for non-coder value proof must be classified through the corpus rescreen workflow first.

3. **No threshold rewriting after evidence starts**
   Once a benchmark tranche begins, the template set, task set, and pass thresholds cannot be changed mid-wave.

4. **No fake quality proof from template count**
   Quantity of templates or skills may not be used as evidence of product value.

5. **No public non-coder tranche may bypass the measurement authority**
   The tranche must read and apply:
   - `CVF_NON_CODER_VALUE_MEASUREMENT_STANDARD_2026-04-14.md`
   - `CVF_QUALITY_ASSESSMENT_STANDARD.md`
   - the frozen one-provider benchmark methodology where applicable

6. **No public non-coder tranche may weaken governance for prettier metrics**
   Guard/policy weakening to improve benchmark appearance is forbidden.

---

## 3. What The Guard Must NOT Enforce

The future guard must explicitly NOT enforce provider freeze as a permanent core invariant.

Why:

- provider freeze is an execution profile for the current proof phase
- CVF's real invariant is that all providers/agents are still governed by CVF
- once core non-coder value is proven, multi-provider work becomes portability/robustness/engineering scale

So:

- **Guard hóa chuẩn non-coder value: đúng**
- **Guard hóa provider freeze hiện tại: không đúng**

Provider freeze belongs in roadmap/execution policy, not in the permanent guard itself.

---

## 4. Proposed Guard Scope Boundary

This proposed guard applies to:

- front-door non-coder execution surfaces
- benchmark tranches that claim non-coder value
- template/skill corpus quality claims used as evidence for non-coder value
- public-facing documentation that claims CVF helps non-coders

This proposed guard does not directly apply to:

- operator-only knowledge governance surfaces
- internal exploratory model/provider experiments
- non-public helper scripts that do not claim public product value

---

## 5. Activation Prerequisites

Before this proposal becomes a real guard:

1. the non-coder measurement standard must remain stable enough to act as a guard source
2. the template/skill corpus rescreen lane must define trusted vs legacy corpus classes
3. a fresh guard-adoption tranche must wire the guard into the control matrix and compat chain

---

## 6. Minimum Activation Outputs

When activated in a future tranche, the guard-adoption batch must at minimum deliver:

1. canonical guard document
2. control-matrix row
3. compat checker or equivalent verification hook
4. handoff/tracker sync
5. explicit statement that provider freeze is not part of the permanent guard invariant

---

## 7. Immediate Repo Truth Until Activation

Until the broader guard is formally adopted:

- this proposal is the doctrine source
- `governance/toolkit/05_OPERATION/CVF_TEMPLATE_SKILL_STANDARD_GUARD.md` is the active narrower guard already governing corpus-quality truth
- `CVF_NON_CODER_VALUE_MEASUREMENT_STANDARD_2026-04-14.md` is the binding measurement authority
- `CVF_TEMPLATE_SKILL_CORPUS_RESCREEN_ROADMAP_2026-04-14.md` is the binding corpus-cleanup prerequisite for benchmark truth

This keeps the repo aligned now, without pretending the guard is already active.
