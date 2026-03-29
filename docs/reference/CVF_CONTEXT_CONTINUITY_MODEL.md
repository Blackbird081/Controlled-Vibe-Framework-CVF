# CVF Context Continuity Model

Memory class: POINTER_RECORD

Status: canonical cross-cutting model for context quality control across memory, handoff, and phase-bounded loading in multi-agent CVF.

## Purpose

- reduce token waste across pause, resume, transfer, and multi-agent continuation
- improve context quality by loading only the highest-signal state for the active phase
- prevent continuation from depending on hidden memory or replay of full chat history

## Canonical Model

CVF should use the following model consistently:

- `memory = repository of facts, history, and durable evidence`
- `handoff = governance-filtered summary and transfer checkpoint`
- `context loading = phase-bounded loading of only what the current step needs`

## Why This Matters

Without this separation, multi-agent work tends to drift into one of two failure modes:

- everything is replayed, so token cost climbs and the next worker still misses the important part
- too little is transferred, so the next worker guesses scope, repo truth, or the next governed move

The CVF model avoids both problems:

- memory keeps durable history available
- handoff extracts the truthful bounded state needed at a transition
- context loading keeps each phase focused on only the material inputs it actually needs

## Canonical Truth Precedence

When continuity is resumed, treat truth sources in this order:

1. repository state and tracked remote state
2. canonical continuity artifacts inside the repo such as handoff, tracker, closure review, and sync notes
3. external agent memory files, scratch notes, and tool-specific summaries

For handoff-writing specifically:

- exact remote tip SHA is live git truth, not a hand-maintained continuity field
- handoff should record the tracked remote branch, while exact remote SHA should be derived live when resume or push decisions depend on it

External memory outside the repo is non-canonical convenience only.

It may help navigation, but it must not override repo truth.

## Operational Principle

In CVF, handoff is not only work transfer.

In CVF, handoff is context quality control by phase for multi-agent continuation.

This means every governed handoff should help the next worker answer:

1. what facts/history belong in durable memory
2. what bounded transition summary must be carried forward now
3. what minimal context should be loaded for the next phase

## Design Implications

- do not treat handoff as a courtesy note or conversational convenience
- do treat handoff as a governed compression layer between one phase and the next
- do not load whole histories by default when a bounded handoff plus canonical references is enough
- do preserve the line between durable memory, transition summary, and active working context
- do reconcile external memory against repo truth before treating it as continuation input

## Relationship To GC-020

`GC-020` is the active governance control that enforces the handoff side of this model.

It does not replace memory systems or context loaders by itself.

Instead, it ensures that pause/transfer boundaries produce one truthful, reviewable summary checkpoint so later context loading can stay phase-bounded.

## Relationship To GC-022

`GC-022` governs the memory-storage side of this model.

It distinguishes:

- full durable evidence
- durable summary records
- pointer-only routing records

This keeps durable memory truthful without forcing every record to preserve the same level of detail.

## Related References

- `governance/toolkit/05_OPERATION/CVF_AGENT_HANDOFF_TRANSITION_GUARD.md`
- `governance/toolkit/05_OPERATION/CVF_AGENT_HANDOFF_GUARD.md`
- `governance/toolkit/05_OPERATION/CVF_MEMORY_GOVERNANCE_GUARD.md`
- `docs/reference/CVF_AGENT_HANDOFF_TEMPLATE.md`
- `docs/reference/CVF_MEMORY_RECORD_CLASSIFICATION.md`
- `docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md`
- `docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md`
