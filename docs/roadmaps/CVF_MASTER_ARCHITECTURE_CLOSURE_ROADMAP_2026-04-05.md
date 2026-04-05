# CVF Master Architecture Closure Roadmap

Memory class: SUMMARY_RECORD

> Date: 2026-04-05
> Scope: convert the current `SUBSTANTIALLY DELIVERED` master architecture posture into one canonical closure path that future agents can follow without re-scanning already-closed lanes
> Canonical baseline: `docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md` (`v3.7-W46T1`; operational readout refreshed through `W56-T1`)
> Entry condition: no active tranche; current-cycle restructuring is `DONE`; relocation remains closed-by-default
> Authorization posture: planning-only until a fresh bounded `GC-018` is opened for one closure family at a time

---

## 1. Objective

Turn the current post-`W56-T1` architecture state into a single closure sequence that:

- preserves the delivered CPF and EPF closure work already recorded as canon
- prevents future agents from re-scanning already-closed surfaces by default
- promotes fresh work only where the canonical scan continuity registry still shows unresolved or not-yet-scanned posture
- distinguishes between `closure decision`, `fresh assessment`, and `new implementation`
- keeps relocation closed and out of the critical path unless a separate preservation override is approved

---

## 2. Fixed Baseline

The following are treated as fixed unless a new governed wave explicitly reopens them:

- authoritative architecture baseline remains `docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md`
- current whitepaper target-state remains `SUBSTANTIALLY DELIVERED`
- current-cycle restructuring remains `DONE`
- relocation remains `CLOSED_BY_DEFAULT`
- CPF batch barrel families remain `FULLY_CLOSED`
- EPF dispatch-gate-runtime-async-status-reintake family remains `FULLY_CLOSED`
- future next-tranche selection must start from `governance/compat/CVF_SURFACE_SCAN_REGISTRY.json`

---

## 3. Current Closure Posture

| Area | Current posture | What is already settled | What still blocks `DONE` |
|---|---|---|---|
| Control Plane | `SUBSTANTIALLY DELIVERED` -> `DONE-ready` | CPF consumer bridges closed; post-W7 CPF closures delivered through `W46-T1`; CPF batch barrel families fully closed; `W55-T1 MC1` closure assessment is canonically closed | promotion to `DONE` is deferred to `MC5` canon pass |
| Execution Plane | `SUBSTANTIALLY DELIVERED` | EPF consumer bridges closed; dispatch family through `W54-T1` fully closed | `Model Gateway` and `Sandbox Runtime` still represent the most visible unresolved target-state gap |
| Governance Layer | `SUBSTANTIALLY DELIVERED` -> `DONE (6/6)` | GEF bridges and W6/W7 governance surfaces are delivered; `W56-T1 MC2 CP1+CP2` is canonically closed; Trust & Isolation label currency gap is resolved | promotion to whitepaper `DONE` wording is deferred to `MC5` canon pass |
| Learning Plane | `SUBSTANTIALLY DELIVERED` | LPF bridges and learning expansion through `W10-T1` are delivered | no governed closure scan has yet promoted LPF from delivered state to closure-ready plane posture |
| Cross-cutting architecture claims | mixed | whitepaper truth reconciliation is done; current baseline is synchronized | whitepaper still does not claim a fully consolidated agent-definition registry or `L0-L4` physical source-tree consolidation |

---

## 4. Canonical Read Order For Future Agents

Agents continuing this lane must read in this order:

1. `AGENT_HANDOFF.md`
2. `docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md`
3. `governance/compat/CVF_SURFACE_SCAN_REGISTRY.json`
4. this roadmap
5. `docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md`

Do not start by re-scanning the whole repo.

---

## 5. Official Closure Sequence

| Phase | Scope | Type | Why this phase exists | Exit criteria |
|---|---|---|---|---|
| `MC0` | Closure routing lock | `CANON ALIGNMENT` | freeze one successor path so future agents stop guessing | handoff, tracker, whitepaper, and this roadmap point to the same closure path |
| `MC1` | CPF closure assessment | `ASSESSMENT / DECISION` | closed canonically at `W55-T1`; establishes whether CPF is already closure-complete without reopening implementation | outcome recorded as `DONE-ready`; final promotion deferred to `MC5` |
| `MC2` | GEF closure assessment | `ASSESSMENT / DECISION` | closed canonically at `W56-T1 CP1+CP2`; resolves plane closure posture plus Trust & Isolation label currency | outcome recorded as `DONE (6/6)`; final whitepaper promotion deferred to `MC5` |
| `MC3` | LPF closure assessment | `ASSESSMENT` | scan continuity registry says LPF is `NOT_YET_SCANNED` | governed LPF assessment records `DONE-ready`, `open-candidate`, or `defer-with-reason` |
| `MC4` | EPF closure focus | `ASSESSMENT / POSSIBLE IMPLEMENTATION` | EPF has the clearest visible residual gap in whitepaper topology | one bounded decision clarifies whether `Model Gateway` and `Sandbox Runtime` require code, wording refinement, or formal deferment |
| `MC5` | Whitepaper promotion pass | `DOCUMENTATION / DECISION` | after per-plane posture is known, canon must be upgraded in one truth pass | whitepaper/tracker/handoff are updated to reflect the new closure posture without reopening unrelated lanes |

---

## 6. Phase Rules

### 6.1 `MC1` Control Plane

Default assumption:

- do not reopen CPF implementation by default

What to verify:

- whether CPF already satisfies plane-level `DONE` criteria
- whether any remaining gap is architectural wording only
- whether any new CPF work would introduce genuinely new master-architecture scope

Reopen rule:

- reopen CPF only through fresh `GC-018` if a new whitepaper target introduces a genuinely unclosed CPF surface

### 6.2 `MC2` Governance Layer

Default assumption:

- GEF is closed for implementation in the current cycle unless a future whitepaper target introduces a genuinely new open surface

What to verify:

- `W56-T1 CP1+CP2` already verified plane-level closure and resolved the Trust & Isolation label currency gap
- no new GEF implementation is required before `MC5`

### 6.3 `MC3` Learning Plane

Default assumption:

- LPF is not reopened for implementation before a governed scan exists

What to verify:

- whether LPF is already complete enough for plane-level `DONE`
- whether any remaining work is limited to closure posture rather than new code

### 6.4 `MC4` Execution Plane

Default assumption:

- EPF dispatch family stays closed

Required focus:

- `Model Gateway`
- `Sandbox Runtime (Worker Agents)`

What to decide:

- whether these are true open implementation targets
- whether they are intentionally future-facing and should remain outside the current closure baseline
- whether the whitepaper diagram or plane wording should be tightened before any new code is authorized

### 6.5 `MC5` Canon Promotion

Allowed outcomes:

- promote one or more planes from `SUBSTANTIALLY DELIVERED` to `DONE`
- keep a plane at `SUBSTANTIALLY DELIVERED` but with an explicit bounded reason
- record any intentionally deferred target as outside the current closure cycle

Not allowed:

- implicit relocation reopening
- hidden `L0-L4` migration
- omnibus cross-plane implementation without bounded `GC-018`

---

## 7. Decision Heuristics

Use these rules to avoid over-expanding the closure lane:

- if a surface is already marked `FULLY_CLOSED` in the scan continuity registry, do not re-scan it by default
- if a plane is `NOT_YET_SCANNED`, perform assessment before proposing implementation
- if a gap only affects whitepaper wording or status promotion, prefer documentation closure over code
- if a gap would broaden scope into new target-state capability, require a fresh bounded `GC-018`
- if a proposal touches relocation, reject it unless it follows the separate relocation reopen rule

---

## 8. Success Condition

This closure roadmap is considered complete when:

- every plane has an explicit closure posture justified by governed assessment
- handoff, tracker, scan continuity registry, and whitepaper all agree on the same next-step logic
- no future agent needs to infer “what should we scan next?” from scratch
- master architecture continuation becomes a bounded decision rather than an open-ended repo search

---

## 9. Immediate Default Next Steps

1. Treat `MC1` as canonically closed with outcome `DONE-ready`; do not reopen CPF by default.
2. Treat `MC2` as canonically closed with outcome `DONE (6/6)`; do not reopen GEF by default.
3. Execute `MC3` for LPF because it remains explicitly `NOT_YET_SCANNED`.
4. Execute `MC4` for EPF with focus limited to `Model Gateway` and `Sandbox Runtime`.
5. Execute `MC5` after `MC3` and `MC4` finalize the remaining plane postures.

---

## 10. Canonical References

- `AGENT_HANDOFF.md`
- `docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md`
- `docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md`
- `governance/compat/CVF_SURFACE_SCAN_REGISTRY.json`
- `docs/roadmaps/CVF_POST_W7_OPEN_TARGETS_UPGRADE_ROADMAP_2026-03-28.md` (historical predecessor roadmap, not the primary closure route)
