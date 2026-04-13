# CVF Next Development Direction Review — 2026-04-13

Memory class: POINTER_RECORD

## 1. Executive Verdict

CVF is now in a cleaner position than it was before the `2026-04-12` and `2026-04-13` integration wave:

- the MC1-MC5 architecture baseline remains closed and stable
- the one-provider / Alibaba / multi-role PVV checkpoint is sufficient for the current internal pause point
- the `CVF ADDING NEW` and `Windows_Skill_Normalization` packets are no longer private-reference ideas only
- the promoted uplift now exists in three forms:
  - canon/reference docs
  - CPF/LPF helper contracts and tests
  - a bounded runnable inheritance surface in `cvf-web`

This means CVF now has enough stable truth to stop expanding sideways and choose a narrower next development wave.

## 2. What Is Now True

### 2.1 Baseline

- canonical architecture snapshot remains `v3.7-W46T1`
- MC1-MC5 remains fully complete
- PVV governed-path core claim for the current internal checkpoint is confirmed, then intentionally paused

### 2.2 Verified Surfaces

Latest verified local counts in this sweep:

- CPF: `2999/2999`
- EPF: inherited clean baseline `1301`
- GEF: inherited clean baseline `625`
- LPF: `1493/1493`
- `cvf-web`: `1872 passed / 3 skipped`

Additional app-level verification in this sweep:

- `cvf-web` `npx tsc -p tsconfig.json --noEmit` passed
- `cvf-web` `npm run build` passed
- bounded route `/api/governance/external-assets/prepare` is present in the build manifest

### 2.3 Post-Closure Uplift Now Integrated

The uplift from `CVF ADDING NEW` and `Windows_Skill_Normalization` now exists in code and canon:

- semantic policy intent registry
- external asset intake profile
- execution environment enrichment
- planner trigger heuristics
- provisional evaluation signal capture
- Windows compatibility evaluation
- W7 normalized asset candidate preparation
- registry-ready governed asset preparation
- Stage 1 diagnostic interpretation and packet assembly
- bounded `cvf-web` runtime inheritance for the same flow

## 3. What Should Not Be Confused

The following are different things and should stay different:

- PVV provider-lane evidence
- bounded governance-preparation runtime in `cvf-web`
- internal design draft references

The new `cvf-web` route proves that the uplift is runnable inside CVF. It does **not** replace provider-lane execution evidence and it does **not** turn every promoted draft into a user-facing production feature automatically.

## 4. Highest-Value Next Wave

The best next development direction is:

`turn the bounded external-asset governance flow into a first-class intake-to-registry product path`

Why this is the best next wave:

- it builds directly on newly integrated canon, CPF, LPF, and `cvf-web`
- it deepens real product value without reopening provider comparison too early
- it converts current bounded inheritance into a more visible and reusable governed workflow
- it helps CVF absorb external skills, toolsets, and operating patterns in a governed way

## 5. Recommended Next Tranche

Recommended wave shape:

### 5.1 Primary Goal

Promote `external-assets/prepare` from a bounded API surface into a governed product path with:

- stable request/response contract documentation
- UI or operator workflow entry point
- storage/registry handoff for approved governed assets
- review visibility for intake issues, semantic mismatches, and Windows compatibility results

### 5.2 Concrete Priorities

Priority 1:

- add a small user-facing or operator-facing `cvf-web` surface for external asset preparation
- make the output legible and actionable, not just machine-structured

Priority 2:

- connect approved `registry_ready_governed_asset` output to a real governed registry or artifact sink
- avoid leaving the route as a dead-end analysis surface

Priority 3:

- harden contract docs around this flow so future agents and operators do not improvise payload shape

## 6. What To Avoid Next

Avoid these as the immediate next step:

- reopening multi-provider PVV right away
- broadening the design-draft corpus again before this wave is absorbed
- building another private-reference ingestion packet before the current one becomes more product-real
- mixing provider execution routing with the bounded external-asset preparation flow

## 7. Decision

Recommended next direction:

`OPEN A NEW BOUNDED GC-018 FOR EXTERNAL-ASSET PRODUCTIZATION`

Suggested scope:

- stay inside canon / CPF / LPF / `cvf-web`
- do not reopen PVV/provider execution
- do not widen the wave into unrelated architecture exploration

This is the narrowest next move with the highest leverage.
