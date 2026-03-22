# CVF Agent Handoff Template

Status: canonical handoff template for pause, session stop, and agent-to-agent transfer.

## Purpose

- preserve truthful execution state when work pauses
- reduce restart confusion for the next user or agent
- keep continuation aligned with the active tranche scope, governance boundary, and documentation standards

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
- whether the working tree is clean or dirty
- what is actually implemented vs merely planned
- what remains out of scope
- what the next governed move is

Never write a handoff that:

- claims a target-state block is complete when only a bounded slice was implemented
- hides missing receipts, missing tests, or a dirty working tree
- skips the governing packet chain for the next step

## Minimum Handoff Fields

Every handoff should include:

- current repo state
- latest completed commit
- canonical docs the next agent must read first
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

Read these first:
- `<canonical doc path 1>`
- `<canonical doc path 2>`
- `<canonical doc path 3>`
- `<canonical doc path 4>`

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
2. point to canonical docs
3. state the active tranche truth in one short block
4. state the next governed move
5. end with clear prohibitions against scope drift or overclaiming

## Current Canonical Example

For a live example aligned to the current whitepaper-completion continuation:

- `W1-T2 / CP1` usable intake contract baseline handoff as summarized after commit:
  - `973b9c0 feat(control-plane): implement w1-t2 cp1 usable intake contract baseline`

Use the current tranche artifacts instead of copying stale scope language from older waves.

## Related References

- `governance/toolkit/05_OPERATION/CVF_AGENT_HANDOFF_TRANSITION_GUARD.md`
- `docs/reviews/CVF_WHITEPAPER_SCOPE_CLARIFICATION_PACKET_2026-03-22.md`
- `docs/reference/CVF_GC018_CONTINUATION_CANDIDATE_TEMPLATE.md`
- `docs/reference/CVF_GC019_STRUCTURAL_CHANGE_AUDIT_TEMPLATE.md`
- `docs/reference/CVF_GC019_STRUCTURAL_CHANGE_REVIEW_TEMPLATE.md`
- `docs/CVF_INCREMENTAL_TEST_LOG.md`
