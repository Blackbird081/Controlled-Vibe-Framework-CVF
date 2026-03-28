
Memory class: SUMMARY_RECORD


> Date: 2026-03-22
> Scope: promote the `memory / handoff / context loading` model into a canonical cross-cutting CVF principle tied to `GC-020`

## Intent

Turn one useful architectural observation into an explicit governed rule:

- `memory = repository of facts, history, and durable evidence`
- `handoff = governance-filtered summary and transfer checkpoint`
- `context loading = phase-bounded loading of only what the current step needs`

This delta makes that model canonical so it guides later multi-agent work, token discipline, and context quality decisions consistently.

## Why This Delta Exists

Recent `GC-020` work already established:

- handoff is mandatory for governed pause/transfer states
- transition semantics are classified before a handoff is written
- repo-level compatibility enforcement exists
- active runtime checkpoint surfacing now exists on current governed execution paths

What was still missing:

- one explicit cross-cutting statement that separates durable memory, transition summary, and active context loading
- one canonical rule that explains why handoff matters beyond work-transfer etiquette
- one repo-level compat expectation that keeps this principle present in policy, guard, template, and control evidence

## Canonical Clarification

CVF now treats the following as the canonical context-continuity model:

- `memory = repository of facts, history, and durable evidence`
- `handoff = governance-filtered summary and transfer checkpoint`
- `context loading = phase-bounded loading of only what the current step needs`

The practical meaning is:

- durable truth should stay in memory/reference artifacts
- pause/transfer truth should be compressed into one governed handoff
- the next worker or phase should load only the bounded context it truly needs

Therefore:

> Handoff is not only work transfer.  
> Handoff is context quality control by phase for multi-agent CVF.

## Changes Made

- added `docs/reference/CVF_CONTEXT_CONTINUITY_MODEL.md` as the canonical reference
- updated `CVF_MASTER_POLICY` so `GC-020` now names the context-continuity model directly
- updated the transition guard, handoff guard, and handoff template to explain the model consistently
- updated the governance control matrix so `GC-020` is explicitly identified as the enforced handoff layer of the model
- updated whitepaper-facing scope/roadmap docs so future realization-first tranches preserve this rule
- extended `check_agent_handoff_guard_compat.py` so the principle cannot silently drift out of the canonical handoff chain

## Resulting Governance Truth

CVF now has all of the following for `GC-020` and context continuity:

- transition taxonomy
- mandatory handoff guard
- canonical handoff template
- canonical context-continuity model
- master-policy rule
- control-matrix registration
- repo-level compatibility enforcement
- active runtime handoff checkpoint surfaces on current governed execution paths

## Verification

- `python governance/compat/check_agent_handoff_guard_compat.py --enforce`
- `python governance/compat/check_docs_governance_compat.py --enforce`
- `python governance/compat/check_baseline_update_compat.py --enforce`
- `python governance/compat/check_release_manifest_consistency.py --enforce`
- `python governance/compat/run_local_governance_hook_chain.py --hook pre-push`

## Closing Readout

> `GC-020` is now stronger in both posture and meaning. It no longer says only "leave a handoff when work pauses." It now says why the handoff exists in CVF at all: to preserve high-quality, phase-bounded continuation without paying the cost of replaying full history.
