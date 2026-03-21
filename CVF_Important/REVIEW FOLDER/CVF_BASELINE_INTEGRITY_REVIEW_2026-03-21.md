# Enterprise Architect Baseline Integrity Review
> **Date:** 2026-03-21
> **Reviewer Role:** Independent Enterprise Software Architect
> **Scope:** `CVF_CURRENT_STATE_SNAPSHOT_2026-03-20.md`, `CVF_CURRENT_TO_NEW_MAPPING.md`, `CVF_MASTER_ARCHITECTURE_WHITEPAPER.md`, `CVF_V2_RESTRUCTURING_ROADMAP.md`, and `EA_CROSS_CHECK_ASSESSMENT.md`
> **Purpose:** Re-validate the baseline before any CVF restructuring wave is authorized

---

## Executive Verdict

The review stack in `REVIEW FOLDER` is **not yet safe to use as an implementation baseline**.

The most important problem is not the phase model. The phase model has mostly been corrected to the current canonical CVF loop:

`INTAKE -> DESIGN -> BUILD -> REVIEW -> FREEZE`

The unstable parts are:

1. **Risk model truth**
2. **Guard baseline truth**
3. **Execution topology truth**
4. **Implementation authorization posture**

Those four areas are still described too aggressively or incorrectly in the current review bundle. If left uncorrected, they will contaminate the mapping, the whitepaper, and the restructuring roadmap.

---

## Findings

### 1. `CVF_CURRENT_STATE_SNAPSHOT_2026-03-20.md` is only partially reliable

The snapshot is directionally useful, but it currently overstates the runtime baseline in two key places:

- It says all execution goes through a single `GuardEngine` singleton for all fronts:
  - `CVF_CURRENT_STATE_SNAPSHOT_2026-03-20.md:13`
- It says the default core is a fixed set of `13 guards`:
  - `CVF_CURRENT_STATE_SNAPSHOT_2026-03-20.md:14`
  - `CVF_CURRENT_STATE_SNAPSHOT_2026-03-20.md:33`

Current source-of-truth in the repository does **not** support those claims in that strong form:

- Canonical phases and risk model in shared contract:
  - `EXTENSIONS/CVF_GUARD_CONTRACT/src/types.ts:19-31`
- Shared hardened default guard stack is `8` guards, not `13`:
  - `EXTENSIONS/CVF_GUARD_CONTRACT/src/index.ts:47-59`
- Full runtime preset in SDK is `15` guards:
  - `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/guard_runtime/sdk/cvf.sdk.ts:819-839`
- Official readiness language is limited to the **active reference path**, not a universal singleton claim:
  - `docs/reference/CVF_RELEASE_READINESS_STATUS_2026-03-20.md`
  - `docs/reviews/CVF_INDEPENDENT_SYSTEM_CHECKPOINT_2026-03-20.md`

**Verdict:** The snapshot is acceptable for posture and phase direction, but unsafe as the sole truth source for guard-count, topology, or universal control assertions.

### 2. The phase correction is mostly right; the risk correction is not

The strongest corrected element across the review stack is the phase vocabulary:

- `CVF_CURRENT_STATE_SNAPSHOT_2026-03-20.md:10-13`
- `CVF_CURRENT_TO_NEW_MAPPING.md:15-19`
- `CVF_MASTER_ARCHITECTURE_WHITEPAPER.md:15-27`

This is consistent with current code:

- `EXTENSIONS/CVF_GUARD_CONTRACT/src/types.ts:19-28`
- `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/guard_runtime/sdk/cvf.sdk.ts:902-907`

However, the risk vocabulary is not aligned:

- Whitepaper explicitly replaces `R0-R3` with `L0-L4`:
  - `CVF_MASTER_ARCHITECTURE_WHITEPAPER.md:31-42`
- Roadmap hard-codes `L0-L4 only`:
  - `CVF_V2_RESTRUCTURING_ROADMAP.md:17-23`
  - `CVF_V2_RESTRUCTURING_ROADMAP.md:42`
  - `CVF_V2_RESTRUCTURING_ROADMAP.md:256-264`
- Mapping also assumes `L0-L4` in the target role of the risk engine:
  - `CVF_CURRENT_TO_NEW_MAPPING.md:47`

Current repo source-of-truth still uses `R0-R3`:

- `EXTENSIONS/CVF_GUARD_CONTRACT/src/types.ts:31`
- `EXTENSIONS/CVF_GUARD_CONTRACT/src/types.ts:142-147`
- `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/guard_runtime/sdk/cvf.sdk.ts:72`
- `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/guard_runtime/sdk/cvf.sdk.ts:181`
- `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/guard_runtime/sdk/cvf.sdk.ts:910-915`

**Verdict:** Phase truth is largely corrected. Risk truth is still wrong for the current repo baseline.

### 3. `CVF_CURRENT_TO_NEW_MAPPING.md` is useful, but contaminated by baseline errors

The mapping file has genuine value:

- it correctly identifies the `EXECUTE -> REVIEW` phase correction
- it correctly flags many candidate proposals as merge-or-upgrade rather than create-net-new

But it inherits two major incorrect assumptions:

- `CVF_ECO_v1.2_LLM_RISK_ENGINE` becomes an `L0-L4` scorer:
  - `CVF_CURRENT_TO_NEW_MAPPING.md:47`
- `CVF_GUARD_CONTRACT` is described as `Guard Engine (13 Guards)`:
  - `CVF_CURRENT_TO_NEW_MAPPING.md:52`

Those claims do not match current code:

- risk remains `R0-R3` in current runtime and shared contract
- shared default guard stack is `8`, full runtime preset is `15`

**Verdict:** The mapping file is **structurally useful**, but must be treated as contaminated until risk vocabulary and guard-baseline references are corrected.

### 4. `CVF_MASTER_ARCHITECTURE_WHITEPAPER.md` is a target-state concept, not current-state truth

The whitepaper is strongest when it describes:

- canonical 5-phase flow
- a merged target-state architecture
- subsystem consolidation

It becomes unsafe when it describes those target-state moves as if they are already baseline-authorized:

- “mọi Plane, Module, Guard đều phải vận hành trong khuôn khổ này”
  - `CVF_MASTER_ARCHITECTURE_WHITEPAPER.md:12-13`
- “R0-R3 ... chính thức bị thay thế”
  - `CVF_MASTER_ARCHITECTURE_WHITEPAPER.md:31-35`
- guard baseline represented as `13+ Guards`
  - `CVF_MASTER_ARCHITECTURE_WHITEPAPER.md:94-99`

Current governance posture does not authorize that language yet:

- active wave is closed
- successor wave is not automatically open
- next continuation candidate `N1` is only `REVIEW REQUIRED`, with `Authorized now: NO`
  - `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_N1_2026-03-20.md:32-39`
  - `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_N1_2026-03-20.md:53-56`

**Verdict:** Good target-state architecture study. Not safe to use as present-tense source-of-truth.

### 5. `CVF_V2_RESTRUCTURING_ROADMAP.md` is not implementation-authorized yet

The roadmap contains several strong ideas:

- merge, do not duplicate
- learning plane must come last
- trust hardening before production posture

But it is not currently executable as an approved restructuring roadmap because:

- it enforces `L0-L4 only`
  - `CVF_V2_RESTRUCTURING_ROADMAP.md:19`
- it hard-freezes `GuardEngine singleton + 13 Guards core`
  - `CVF_V2_RESTRUCTURING_ROADMAP.md:22`
- it requires repo-wide `R0-R3` removal in Phase 0 and Phase 7
  - `CVF_V2_RESTRUCTURING_ROADMAP.md:42`
  - `CVF_V2_RESTRUCTURING_ROADMAP.md:48`
  - `CVF_V2_RESTRUCTURING_ROADMAP.md:256`
- it assumes a big-bang source tree restructure into `/src/control_plane`, `/src/execution_plane`, `/src/governance`
  - `CVF_V2_RESTRUCTURING_ROADMAP.md:66-73`

That posture conflicts with current repo governance:

- current active wave is closed
- future continuation is gated by `GC-018`
- successor continuation candidate `N1` is not authorized

**Verdict:** Useful as restructuring proposal. Not currently valid as an approved execution roadmap.

### 6. `EA_CROSS_CHECK_ASSESSMENT.md` is the strongest file in the folder, but still not fully clean

This file correctly catches several important issues:

- Review 12 should be conditional because the Red Team file itself lists three unresolved hardening items:
  - `EA_CROSS_CHECK_ASSESSMENT.md:97-101`
- Review 7, 8, and 9 overlap heavily and should be unified:
  - `EA_CROSS_CHECK_ASSESSMENT.md:65-77`
  - `EA_CROSS_CHECK_ASSESSMENT.md:117-118`
- Review 3 and Review 5 overlap around consensus:
  - `EA_CROSS_CHECK_ASSESSMENT.md:53`
  - `EA_CROSS_CHECK_ASSESSMENT.md:118`
- risk scale mismatch is real:
  - `EA_CROSS_CHECK_ASSESSMENT.md:109`
  - `EA_CROSS_CHECK_ASSESSMENT.md:119`

However, it still inherits too much optimism from the unclean baseline:

- it keeps Review 2 as `FULL CANDIDATE`
- it places Constitutional Layer in the immediate wave
- it still speaks as if the package could become `CVF v2.0 Frozen Architecture Specification` after corrections
  - `EA_CROSS_CHECK_ASSESSMENT.md:128-142`
  - `EA_CROSS_CHECK_ASSESSMENT.md:154`

That exceeds current authorization posture.

**Verdict:** Best file in the review bundle, but still requires reconciliation against the cleaned baseline before it can guide sequencing.

---

## Error Propagation Chain

### Root error A: snapshot overstates control topology and guard baseline

Source:

- `CVF_CURRENT_STATE_SNAPSHOT_2026-03-20.md:13-14`
- `CVF_CURRENT_STATE_SNAPSHOT_2026-03-20.md:33`

Propagation:

- `CVF_CURRENT_TO_NEW_MAPPING.md:52`
- `CVF_MASTER_ARCHITECTURE_WHITEPAPER.md:94-99`
- `CVF_V2_RESTRUCTURING_ROADMAP.md:22`

### Root error B: snapshot does not clearly preserve `R0-R3` as current truth

Propagation:

- `CVF_CURRENT_TO_NEW_MAPPING.md:47`
- `CVF_MASTER_ARCHITECTURE_WHITEPAPER.md:31-42`
- `CVF_V2_RESTRUCTURING_ROADMAP.md:19`
- `CVF_V2_RESTRUCTURING_ROADMAP.md:42`
- `CVF_V2_RESTRUCTURING_ROADMAP.md:256-264`

### Root error C: target-state aspiration is treated like implementation authorization

Propagation:

- `CVF_MASTER_ARCHITECTURE_WHITEPAPER.md:4`
- `CVF_V2_RESTRUCTURING_ROADMAP.md:4`
- `EA_CROSS_CHECK_ASSESSMENT.md:128-154`

Current repo governance disproves that authorization level:

- `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_N1_2026-03-20.md:32-39`

---

## Clean Baseline to Use Going Forward

Until explicitly re-authorized, the clean baseline should be:

1. **Canonical phases**
   - `INTAKE -> DESIGN -> BUILD -> REVIEW -> FREEZE`
2. **Current risk model**
   - `R0 -> R3`
3. **Shared hardened default guard stack**
   - `8 guards`
4. **Full runtime preset**
   - `15 guards`
5. **Current posture**
   - substantially aligned on the active reference path
   - not universal fully unified parity
6. **Authorization**
   - no next restructuring wave is auto-open
   - future wave must pass continuation governance

Primary repo truth references:

- `EXTENSIONS/CVF_GUARD_CONTRACT/src/types.ts`
- `EXTENSIONS/CVF_GUARD_CONTRACT/src/index.ts`
- `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/guard_runtime/sdk/cvf.sdk.ts`
- `docs/reviews/CVF_INDEPENDENT_SYSTEM_CHECKPOINT_2026-03-20.md`
- `docs/reference/CVF_RELEASE_READINESS_STATUS_2026-03-20.md`
- `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_N1_2026-03-20.md`

---

## EA Conclusion

### Reliability grading

| File | Reliability | Verdict |
|---|---|---|
| `CVF_CURRENT_STATE_SNAPSHOT_2026-03-20.md` | Partial | Useful posture reference, not safe as sole baseline |
| `CVF_CURRENT_TO_NEW_MAPPING.md` | Partial | Structurally useful, but contaminated by baseline errors |
| `CVF_MASTER_ARCHITECTURE_WHITEPAPER.md` | Medium as concept | Good target-state concept, not current-state truth |
| `CVF_V2_RESTRUCTURING_ROADMAP.md` | Low as execution plan | Not implementation-authorized yet |
| `EA_CROSS_CHECK_ASSESSMENT.md` | Highest in folder | Strongest corrective review, still requires cleaned-baseline reconciliation |

### Decision

Before auditing source proposal folders, the review stack must be treated in this order:

1. Establish cleaned baseline truth
2. Correct errata in snapshot, mapping, whitepaper, and roadmap
3. Reconcile `EA_CROSS_CHECK_ASSESSMENT.md` against the cleaned baseline
4. Only then audit each source folder for merge fit and governance readiness
