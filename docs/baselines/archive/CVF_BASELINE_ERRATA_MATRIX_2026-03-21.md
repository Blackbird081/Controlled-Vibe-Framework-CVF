
Memory class: SUMMARY_RECORD

> **Date:** 2026-03-21
> **Purpose:** Precise errata register for the four baseline-driving files in `REVIEW FOLDER`

| File | Assertion | Status | Evidence | Required Correction |
|---|---|---|---|---|
| `CVF_CURRENT_STATE_SNAPSHOT_2026-03-20.md` | CVF execution universally goes through a single `GuardEngine` singleton | Stale / Overstated | Snapshot `:13`; readiness/checkpoint only claim active reference-path alignment | Narrow wording to active reference path, not universal execution topology |
| `CVF_CURRENT_STATE_SNAPSHOT_2026-03-20.md` | Default governance core is `13 guards` | Wrong | Snapshot `:14`, `:33`; shared default is `8` in `EXTENSIONS/CVF_GUARD_CONTRACT/src/index.ts:47-59`; full runtime preset is `15` in `cvf.sdk.ts:819-839` | Replace with explicit distinction: shared hardened default = 8, full runtime preset = 15 |
| `CVF_CURRENT_STATE_SNAPSHOT_2026-03-20.md` | Review question should test against `GuardEngine (13 guards)` | Wrong | Snapshot `:33`; actual current baseline splits shared contract and full runtime presets | Reframe review question around guard ownership and execution path, not fixed 13-guard claim |
| `CVF_CURRENT_TO_NEW_MAPPING.md` | `CVF_ECO_v1.2_LLM_RISK_ENGINE` maps to `L0-L4` scorer | Wrong | Mapping `:47`; current risk type remains `R0-R3` in `types.ts:31`, `cvf.sdk.ts:910-915` | Change to `R0-R3` baseline unless and until repo-wide migration is formally authorized |
| `CVF_CURRENT_TO_NEW_MAPPING.md` | `CVF_GUARD_CONTRACT` is `Guard Engine (13 Guards)` | Wrong | Mapping `:52`; shared default is `8`, not `13` | Replace with “shared hardened default guard contract” and note runtime presets separately |
| `CVF_MASTER_ARCHITECTURE_WHITEPAPER.md` | `R0-R3` is officially replaced by `L0-L4` | Wrong / Not Authorized | Whitepaper `:31-42`; current repo types and SDK still use `R0-R3` | Downgrade to design proposal only, or revert to current `R0-R3` baseline |
| `CVF_MASTER_ARCHITECTURE_WHITEPAPER.md` | All planes/modules/guards must already operate within this whitepaper | Not Authorized | Whitepaper `:12-13`; continuation wave is not open; `N1` is `Authorized now: NO` | Reword as target-state architecture subject to future authorization |
| `CVF_MASTER_ARCHITECTURE_WHITEPAPER.md` | Guard Engine baseline is `13+ Guards` | Wrong | Whitepaper `:94-99`; no current source-of-truth supports this phrasing | Replace with explicit current-state numbers or make it target-state only |
| `CVF_V2_RESTRUCTURING_ROADMAP.md` | `L0-L4` only, no `R0-R3` anywhere | Wrong / Not Authorized | Roadmap `:19`, `:42`, `:256-264`; repo still runs `R0-R3` | Remove as mandatory phase gate until migration is formally approved |
| `CVF_V2_RESTRUCTURING_ROADMAP.md` | `GuardEngine singleton + 13 Guards core` is frozen truth | Wrong | Roadmap `:22`; current repo does not have that exact baseline | Replace with actual current guard architecture and execution-path caveat |
| `CVF_V2_RESTRUCTURING_ROADMAP.md` | Restructuring into `/src/control_plane`, `/src/execution_plane`, `/src/governance` can proceed as roadmap truth | Not Authorized | Roadmap `:66-73`; current repo is extension-based and next wave is not authorized | Reclassify as proposal roadmap pending continuation approval |
| `EA_CROSS_CHECK_ASSESSMENT.md` | Review 12 must be downgraded because Red Team still has 3 unresolved hardening items | Correct | EA Cross Check `:97-101`; corroborated by source Red Team scenarios | Keep |
| `EA_CROSS_CHECK_ASSESSMENT.md` | Reviews 7, 8, 9 overlap and should be unified | Correct | EA Cross Check `:65-77`, `:117`; source docs also overlap strongly | Keep |
| `EA_CROSS_CHECK_ASSESSMENT.md` | Risk scale mismatch exists and must be resolved | Correct | EA Cross Check `:109`, `:119`; corroborated by current repo baseline | Keep |
| `EA_CROSS_CHECK_ASSESSMENT.md` | Immediate wave can start with Constitutional Layer as foundation | Not Authorized | EA Cross Check `:128-142`; current `N1` is only `REVIEW REQUIRED` | Reframe as prioritization hypothesis, not approved wave sequencing |
| `EA_CROSS_CHECK_ASSESSMENT.md` | After fixes, this package can become `CVF v2.0 Frozen Architecture Specification` | Not Authorized | EA Cross Check `:154`; no continuation approval exists | Downgrade to “candidate basis for a future authorized spec” |
