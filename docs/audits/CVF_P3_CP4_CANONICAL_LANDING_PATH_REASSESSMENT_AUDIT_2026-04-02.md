# CVF P3 CP4 Audit - Canonical Landing Path Reassessment

Memory class: FULL_RECORD

> Decision type: `GC-019` structural change audit
> Pre-public phase: `P3`
> Date: `2026-04-02`

---

## 1. Proposal

- Change ID:
  - `GC019-P3-CP4-CANONICAL-LANDING-PATH-REASSESSMENT-2026-04-02`
- Date:
  - `2026-04-02`
- Proposed target:
  - re-assess how a delivered isolated `P3` relocation wave is supposed to become canonical after review
  - specifically validate whether the current governance stack provides a legal landing path from:
    - `restructuring/p3-cp2-retained-internal-root-relocation`
    - into `cvf-next`
- Proposed change class:
  - `re-assessment only`
- Active roadmap anchor:
  - `docs/roadmaps/CVF_PREPUBLIC_REPOSITORY_RESTRUCTURING_ROADMAP_2026-04-02.md`

## 2. Scope

- in scope:
  - current `GC-039` landing behavior
  - current `P3` branch/worktree execution rule
  - branch-to-canonical integration semantics for delivered `P3` waves
- out of scope:
  - modifying `GC-039` implementation in this packet
  - physically landing `P3/CP2` onto `cvf-next`
  - opening any new physical relocation wave

## 3. Source-Truth Evidence

- canonical integration expectation currently stated in summary canon:
  - `docs/CVF_CORE_KNOWLEDGE_BASE.md:807-809`
  - wording:
    - future physical `P3` relocation waves must run on a dedicated `restructuring/p3-*` branch
    - future physical `P3` relocation waves must run from a secondary git worktree
    - `cvf-next` remains the canonical integration branch; relocation work merges back only after the move set is reviewed and clean
- execution-isolation rule currently enforced in `GC-039`:
  - `governance/compat/check_prepublic_p3_readiness.py:293-306`
  - if relocation changes are detected:
    - branch must match `restructuring/p3-*`
    - branch may not be `cvf-next`
- current delivered branch still differs structurally from `origin/cvf-next`:
  - `git diff --name-status origin/cvf-next..HEAD`
  - includes root relocation entries for:
    - `CVF_SKILL_LIBRARY`
    - `ui_governance_engine`
    - related canon/registry updates

## 4. Assessment

- direct execution path:
  - `CLEAR`
  - current canon clearly explains how to execute a `P3` move safely:
    - dedicated `restructuring/p3-*` branch
    - secondary git worktree
    - fresh `GC-019`
    - `GC-039` pass
- canonical landing path:
  - `UNRESOLVED`
  - the current summary canon says relocation work merges back after review
  - the current guard code blocks any relocation diff from being pushed while the current branch is `cvf-next`
- practical implication:
  - a delivered relocation branch can be reviewed and pushed as an isolated branch
  - but the repository currently lacks an explicit approved path for canonizing that relocation onto `cvf-next`

## 5. Risk Assessment

- governance ambiguity risk:
  - `HIGH`
  - different agents can reasonably infer opposite next steps from the current documents
- structural risk:
  - `MEDIUM`
  - operators may attempt a merge/cherry-pick to `cvf-next` that the local hook chain will reject
- continuity risk:
  - `MEDIUM`
  - branch truth and canonical-branch truth can diverge for longer than intended

## 6. Recommendation

- recommended outcome:
  - `HOLD`
- why:
  - no safe, explicit, machine-compatible landing path is currently canonized for delivered `P3` relocation branches
- required next action:
  - open a separate governance decision packet to resolve one of these options explicitly:
    - amend `GC-039` so it blocks only unreviewed relocation execution on `cvf-next`, not reviewed landing from an already-approved `restructuring/p3-*` branch
    - define a separate post-review landing procedure and corresponding checker semantics
    - or declare that `P3` relocation truth remains branch-scoped until a later publication/canonicalization phase

## 7. Verification Evidence

- commands used:
  - `git diff --name-status origin/cvf-next..HEAD`
  - `git status --short`
  - source inspection of:
    - `docs/CVF_CORE_KNOWLEDGE_BASE.md`
    - `docs/reference/CVF_PREPUBLIC_RESTRUCTURING_UNIFIED_AGENT_PROTOCOL.md`
    - `governance/compat/check_prepublic_p3_readiness.py`
- success criteria for this re-assessment:
  - current landing ambiguity is documented explicitly
  - no agent falsely assumes that merge-back to `cvf-next` is already a resolved path

## 8. Execution Posture

- audit decision:
  - `NOT READY FOR EXECUTION`
- ready for independent review:
  - `YES`
- notes:
  - this packet does not authorize any merge to `cvf-next`
  - this packet identifies a governance deadlock/ambiguity, not a filesystem issue
