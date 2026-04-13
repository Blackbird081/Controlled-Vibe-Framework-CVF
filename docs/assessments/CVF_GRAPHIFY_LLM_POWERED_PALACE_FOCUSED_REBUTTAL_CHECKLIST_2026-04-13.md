# CVF Focused Rebuttal Checklist — Graphify / LLM-Powered / Palace

**Document ID:** `CVF_GRAPHIFY_LLM_POWERED_PALACE_FOCUSED_REBUTTAL_CHECKLIST_2026-04-13`
**Date:** 2026-04-13
**Role:** next-round rebuttal targeting only unresolved conflict points
**Scope posture:** rebut the unresolved items from `CVF_GRAPHIFY_LLM_POWERED_PALACE_ARBITRATION_SYNTHESIS_2026-04-13.md`
**Status:** `OPEN FOR ONE MORE REBUTTAL ROUND`

---

## 1. Purpose

This checklist exists to constrain the next rebuttal round.

The next agent must **not** re-run a full broad evaluation unless required by evidence.

The next agent must focus on:

1. points where the independent evaluation and expert rebuttal still differ
2. places where one side made a strong claim without enough evidence
3. details that need to be tightened before both sides can converge

The goal is:

`close disputes, narrow ambiguity, and produce acceptance-ready evidence`

not:

`generate another full parallel assessment packet`

---

## 2. Mandatory Reading Order

The next rebuttal agent must read these files in this order:

1. `docs/assessments/CVF_GRAPHIFY_LLM_POWERED_PALACE_ARBITRATION_SYNTHESIS_2026-04-13.md`
2. `docs/assessments/CVF_ADDING_NEW_GRAPHIFY_LLM_POWERED_PALACE_INDEPENDENT_EVALUATION_2026-04-13.md`
3. `docs/assessments/CVF_GRAPHIFY_LLM_POWERED_PALACE_EXPERT_REBUTTAL_2026-04-13.md`
4. `docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md`

Read source-folder files only as needed to support evidence for the unresolved items.

---

## 3. What Is Already Settled

The next rebuttal agent must **not** spend time re-arguing these unless new direct evidence overturns them:

1. top-line verdict remains `ACCEPT AS DESIGN INPUT / DIRECT INTEGRATION NOT APPROVED`
2. all `Approved` / `Approved for Integration` language in the source folders is too strong
3. no CLI/runtime surface should be reopened from this packet without a fresh bounded wave
4. Palace code is not implementation-ready
5. no score/weight/truth-delta doctrine from these folders is canon-ready
6. future reuse must happen through CVF-native synthesis, not folder-by-folder promotion

If the next rebuttal disagrees with any item above, it must provide:

1. direct contrary file evidence
2. exact architectural impact
3. a replacement verdict

Otherwise treat them as closed.

---

## 4. The Only 5 Open Items

The next rebuttal must answer exactly these 5 unresolved items.

### Open Item 1 — Priority Order

Which should be prioritized first in a future bounded wave:

- `LLM-Powered` because it is the strongest doctrine source
- or `Graphify` because it addresses the most actionable current gap

What must be answered:

1. which one goes first
2. why
3. what exact CVF surface would be touched first

### Open Item 2 — LLM-Powered Checkpoint Severity

The current arbitration accepts that `LLM-Powered` is missing a checkpoint between `Compile` and `Query`.

The next rebuttal must decide:

- is this only an `architecture gap`
- or is it already a `Zero Bypass violation`

What must be answered:

1. exact wording of the verdict
2. evidence from the source file
3. explanation of why the stronger or weaker interpretation is correct

### Open Item 3 — Guard-Like Construct Count

The expert rebuttal claimed that cross-folder overlap creates `22 guard-like constructs`.

The next rebuttal must either:

1. validate that number
2. correct that number
3. reject the counting method

But it must not leave the claim unquantified.

### Open Item 4 — Promotion Readiness of 2 LLM-Powered Policy Files

The current live question is whether these two files are really lighter-edit candidates:

1. `CVF_KNOWLEDGE_COMPILATION_POLICY.md`
2. `CVF_COMPILED_CONTEXT_POLICY.md`

The next rebuttal must decide whether each file is:

- `ADAPT_LIGHT`
- `ADAPT_MEDIUM`
- or `ADAPT_HEAVY`

with reasons.

### Open Item 5 — Provenance Hygiene for `Thong_tin.md`

The next rebuttal must decide whether current `reference-only` treatment is enough, or whether these files need an explicit provenance warning class before any future synthesis work.

What must be answered:

1. is `reference-only` sufficient containment
2. or is an extra provenance label required
3. if yes, what exact label should be used

---

## 5. Evidence Standards Per Open Item

### For Open Item 1

Required evidence:

1. exact file/section references showing why the chosen cluster is first-mover worthy
2. explicit mapping into existing CVF owner surfaces
3. explanation of why the other cluster should not go first

Insufficient evidence:

- broad statements like "more actionable" or "more strategic" without module-level grounding

### For Open Item 2

Required evidence:

1. quote or paraphrase of the exact loop in `CVF_KNOWLEDGE_COMPILATION_INTEGRATION_SPEC.md`
2. proof of whether compiled knowledge can or cannot flow into query/context use without an explicit governance gate
3. comparison against current CVF governance expectations

Insufficient evidence:

- merely saying "it feels unsafe"
- merely saying "it probably implies a bypass"

### For Open Item 3

Required evidence:

1. one explicit dedup table
2. grouped by file
3. each construct classified as one of:
   - `guard family`
   - `guard-like policy control`
   - `quality/eval rule`
   - `not actually guard-like`

The table must include:

- construct name
- source file
- claimed purpose
- nearest existing CVF owner if applicable

Insufficient evidence:

- giving only a total count without a breakdown

### For Open Item 4

Required evidence:

1. for each of the two files, list exact edits still required
2. explain whether those edits are wording-only, owner-mapping, or structural rewrite
3. then assign `ADAPT_LIGHT`, `ADAPT_MEDIUM`, or `ADAPT_HEAVY`

Insufficient evidence:

- saying "looks compact"
- saying "seems mostly fine"

### For Open Item 5

Required evidence:

1. identify what provenance ambiguity actually exists in `Thong_tin.md`
2. explain whether `reference-only` already neutralizes that ambiguity
3. if a new provenance label is needed, define it clearly

Insufficient evidence:

- generic distrust of commentary files

---

## 6. Required Response Format

The next rebuttal must answer in this exact structure.

### A. Scope Confirmation

1. files read
2. whether any extra source files were needed
3. whether any previously settled item is being reopened

### B. Open-Item Responses

For each of the 5 open items, use:

```text
Item:
Verdict: AGREE / PARTIAL AGREE / DISAGREE
Evidence:
Architectural impact:
Required correction:
```

### C. Dedup Appendix

Include one explicit table for Open Item 3.

### D. Final Narrowed Position

Must end with:

1. what is now fully closed
2. what remains open after this round, if anything
3. whether implementation is still blocked

---

## 7. Hard Stops For The Next Rebuttal

The next rebuttal agent must not:

1. propose implementation work
2. reopen the top-line verdict without new direct evidence
3. introduce new architecture surfaces not already in dispute
4. create new guard families as part of the rebuttal
5. drift into broad reassessment of all 21 files unless one open item truly requires it

If the next rebuttal wants to reopen a settled issue, it must explicitly say:

`REOPENING SETTLED ITEM`

and justify why.

---

## 8. Desired Outcome

The best outcome of the next round is one of these:

### Outcome A — Near Consensus

All 5 open items are closed strongly enough that a final synthesis packet can lock posture without another rebuttal.

### Outcome B — Narrow Residual Dispute

Only 1 or 2 highly specific items remain open, with the rest closed.

### Outcome C — Escalation Required

If one of the 5 items reveals a deeper architectural contradiction, the next rebuttal should say so explicitly rather than hiding it inside a general disagreement.

---

## 9. Final Instruction To The Next Agent

Do not try to win the argument broadly.

Do not rephrase the same packet in new words.

Close the 5 unresolved items with stronger evidence than the prior round.

The standard for acceptance is:

`specific enough that the other side can either accept or point to one exact remaining disagreement`

