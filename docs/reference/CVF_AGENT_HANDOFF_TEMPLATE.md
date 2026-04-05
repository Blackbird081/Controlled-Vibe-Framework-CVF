# CVF Agent Handoff Template

Memory class: POINTER_RECORD

Status: canonical handoff template for pause, session stop, and agent-to-agent transfer.

## Purpose

- preserve truthful execution state when work pauses
- reduce restart confusion for the next user or agent
- reduce token waste by avoiding full-history replay when a bounded checkpoint is enough
- keep continuation aligned with the active tranche scope, governance boundary, and documentation standards

This template follows the CVF context-continuity model:

- `memory = repository of facts, history, and durable evidence`
- `handoff = governance-filtered summary and transfer checkpoint`
- `context loading = phase-bounded loading of only what the current step needs`

In CVF, handoff is context quality control by phase for multi-agent continuation.

## When To Use

Before using this template, classify the current transition with:

- `governance/toolkit/05_OPERATION/CVF_AGENT_HANDOFF_TRANSITION_GUARD.md`

Use this template whenever any of the following happens:

- the current agent is about to stop before the tranche is closed
- work is being transferred to another agent
- the user wants a resumable checkpoint
- a governed packet has been opened or implemented and the next step matters

Do not use this template for:

- casual one-line replies with no repo change
- fully closed work with no meaningful next step
- ephemeral brainstorming that never touched governed scope

## Required Truth Rules

Every handoff must be truthful about:

- latest completed commit
- tracked remote branch when the branch tracks a remote
- whether the working tree is clean or dirty
- what is actually implemented vs merely planned
- what remains out of scope
- what the next governed move is
- whether any external agent memory was used only as convenience rather than canonical truth

Important stability rule:

- exact remote SHA must be derived live from git when needed
- do not hand-maintain exact remote tip SHA inside `AGENT_HANDOFF.md` as a required truth field, because that value changes at the push boundary and creates a false self-update loop

Never write a handoff that:

- claims a target-state block is complete when only a bounded slice was implemented
- hides missing receipts, missing tests, or a dirty working tree
- skips the governing packet chain for the next step

## Minimum Handoff Fields

Every handoff should include:

- current repo state
- latest completed commit
- tracked remote branch when available
- canonical docs the next agent must read first
- canonical scan continuity registry when next-tranche selection depends on prior scan state
- the minimal phase-bounded context the next worker should load first
- current tranche truth
- what was actually delivered in the last batch
- non-negotiable scope rules
- next governed move
- documentation standards to preserve
- verification minimum
- explicit `Do not` list

## Copy-Paste Template

```text
Handoff context:
- Repo state: <clean | dirty>
- Latest completed commit: `<sha> <message>`
- Tracked remote branch: `<remote>/<branch>` | `<none>`
- Exact remote SHA: derive live from git when needed; do not hand-maintain it as a required handoff field
- External agent memory files: `<non-canonical convenience only | not used>`

Read these first:
- `<canonical doc path 1>`
- `<canonical doc path 2>`
- `<canonical doc path 3>`
- `<canonical doc path 4>`
- `governance/compat/CVF_SURFACE_SCAN_REGISTRY.json` when the next move depends on what was already scanned

Phase-bounded context to load first:
- `<fact/history source that should stay as reference memory>`
- `<handoff-critical artifact or delta>`
- `<small set of files/docs needed for the next phase only>`

Current tranche truth:
- We are in `<wave/tranche>`.
- `<CP or packet status>`
- The tranche is `<open | closed>`.
- Do not describe current state as `<common overclaim to avoid>`.

What the last completed batch actually delivered:
- `<code/doc change 1>`
- `<code/doc change 2>`
- `<behavioral value 1>`
- `<boundary still not crossed>`

Non-negotiable scope rules:
- `<rule 1>`
- `<rule 2>`
- `<rule 3>`
- `<rule 4>`

Next governed move:
- `<open packet / approve packet / implement packet>`
- `<approval dependency if any>`
- `<recommended scope for next packet>`

CVF documentation standards that must be preserved:
- packet audit
- independent review
- packet/planning/implementation delta
- execution plan update
- roadmap/status/index/test-log update
- inventory/manifest/maturity update if implementation truth changes
- commit each completed batch immediately with CVF-style classified commit message

Verification minimum for each batch:
- package-local `check`
- package-local `test`
- package-local `test:coverage` when available
- regression for depended-on source lines
- `python governance/compat/check_docs_governance_compat.py --enforce`
- `python governance/compat/check_baseline_update_compat.py --enforce`
- `python governance/compat/check_release_manifest_consistency.py --enforce`
- `python governance/compat/run_local_governance_hook_chain.py --hook pre-push`

Do not:
- `<forbidden move 1>`
- `<forbidden move 2>`
- `<forbidden move 3>`
- `<forbidden move 4>`
```

## Recommended Wording Pattern

Prefer this shape:

1. start with repo truth
2. state tracked remote branch if available
3. point to canonical docs
4. state the active tranche truth in one short block
5. state the next governed move
6. end with clear prohibitions against scope drift or overclaiming

## Current Canonical Example

For a live example aligned to the current whitepaper-completion continuation:

- `W1-T2 / CP1` usable intake contract baseline handoff as summarized after commit:
  - `973b9c0 feat(control-plane): implement w1-t2 cp1 usable intake contract baseline`

Use the current tranche artifacts instead of copying stale scope language from older waves.

## Related References

- `governance/toolkit/05_OPERATION/CVF_AGENT_HANDOFF_TRANSITION_GUARD.md`
- `docs/reference/CVF_CONTEXT_CONTINUITY_MODEL.md`
- `docs/reviews/CVF_WHITEPAPER_SCOPE_CLARIFICATION_PACKET_2026-03-22.md`
- `docs/reference/CVF_GC018_CONTINUATION_CANDIDATE_TEMPLATE.md`
- `docs/reference/CVF_GC019_STRUCTURAL_CHANGE_AUDIT_TEMPLATE.md`
- `docs/reference/CVF_GC019_STRUCTURAL_CHANGE_REVIEW_TEMPLATE.md`
- `docs/CVF_INCREMENTAL_TEST_LOG.md`
