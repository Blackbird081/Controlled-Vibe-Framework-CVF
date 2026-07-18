# CVF Agent Review Anti-Collusion Guard

**Control ID:** `GC-046`
**Guard Class:** `MULTI_AGENT_REVIEW_GUARD`
**Memory class:** POINTER_RECORD
**Status:** Active canonical rule for multi-agent absorption reviews, rebuttal cycles, and cross-agent knowledge intake convergence.
**Applies to:** All AI agents (Claude, Codex, or any future agent) participating in CVF knowledge absorption reviews, rebuttal cycles, or multi-agent audit chains.
**Enforced by:** `docs/reference/CVF_GC018_CONTINUATION_CANDIDATE_TEMPLATE.md` (Evidence Trace Block template requirement); `governance/compat/check_anti_collusion_evidence_trace.py` (pre-commit hard-fail, registered in `governance/compat/run_local_governance_hook_chain.py`). Hard enforcement active as of Phase 0.C (commit on 2026-05-18, authorized by `docs/baselines/archive/CVF_GC018_PHASE_0C_ANTI_COLLUSION_HARD_FAIL_2026-05-18.md`). Grandfathering: legacy review packets added before 2026-05-17 are advisory-only.

## Purpose

- prevent two or more agents from converging on a false verdict by sharing the same blind spot
- require each agent to trace every significant claim back to concrete working-tree evidence
- enforce adversarial role assignment so PROPOSER and REVIEWER are structurally opposed by design
- provide a deterministic convergence algorithm that resolves per-claim disagreements without operator arbitration
- record the 17.05 chain as the canonical worked example of what this guard prevents and enables

## Rule

### Anti-Collusion Protocol

Every absorption review chain governed by this guard must satisfy the following five rules before any convergence packet is considered authoritative:

**Rule 1 — Evidence Trace per Claim**

Every significant claim in a review or rebuttal packet must include an Evidence Trace Block. An Evidence Trace Block must contain:

- the exact command or grep query used (not a prose description);
- the result count or representative output;
- the file path and line number for any "X exists" or "X is absent" assertion.

A claim without a supporting Evidence Trace Block is advisory only and must not be cited as convergence evidence.

**Rule 2 — Doctrine Does Not Override Evidence**

A claim that a capability "exists in CVF doctrine or architecture" does not prove that the capability is implemented, composed, or reachable. Codebase evidence (grep, file read, test run) is required separately from doctrine evidence. Agents must not satisfy a convergence claim with architecture narrative alone.

**Rule 3 — Run the Trace**

Before writing a final verdict on any claim, the asserting agent must run the trace itself. Relying solely on the opposing agent's grep output is permitted for corroboration but not for primary evidence. At least one independent trace per claim.

**Rule 4 — Count the Duplicates**

When a convergence review identifies a drift surface (duplicate engines, role enums, receipt envelopes), the agent must count and list the specific file paths for each duplicate instance. Saying "PolicyEngine has duplicates" without listing the paths is insufficient for convergence.

**Rule 5 — Adversarial Role Assignment**

In every absorption review chain, agents must be assigned structurally opposing roles:

- **PROPOSER:** argues that the source material has value and identifies what CVF gains from absorbing it.
- **REVIEWER:** argues that the source material overclaims and identifies what CVF already has or what risks arise from absorbing it.

Both roles are bound to the same evidence standards. The role convention for any given review chain must be declared in advance and recorded in the review packet header. A review chain with no declared role convention is not governed.

### Convergence Algorithm

When PROPOSER and REVIEWER disagree on a claim, the following algorithm applies. The operator is never asked to arbitrate evidence disputes. The operator only receives ESCALATED claims with structured options.

| Round | Action |
|---:|---|
| 1 | PROPOSER states claim + Evidence Trace Block |
| 2 | REVIEWER either accepts with evidence, rejects with counter-evidence, or requests a specific additional trace |
| 3 | PROPOSER incorporates the counter-evidence and states ACCEPTED / REVISED / MAINTAINS with updated Evidence Trace Block |

Decision table after round 3:

| State | Outcome |
|---|---|
| Both agents accept the same verdict | ACCEPTED — claim is closed |
| PROPOSER accepts REVIEWER correction | ACCEPTED WITH CORRECTION — claim is closed |
| Both maintain disagreement with different evidence | ESCALATED — operator receives three options: Accept PROPOSER version, Accept REVIEWER version, Defer claim to a separate review chain |
| No evidence exists on either side | DEFERRED — claim must be re-opened only after the relevant inventory exists |

Maximum 3 rounds per claim. If ESCALATED, the operator chooses from the three options above. The operator is never asked "who is right?" — only "which structured option applies?"

### Termination Guarantee

A review chain that has used 3 rounds on every open claim must terminate. Remaining OPEN claims after round 3 are automatically ESCALATED. An ESCALATED packet may not block implementation of claims already in ACCEPTED state.

## 17.05 Role Convention (Private Chain Only)

For the 17.05 private absorption review chain (`CVF 17.05`):

| Absorption review number | Codex role | Claude role |
|---:|---|---|
| Odd, starting with #1 | REVIEWER | PROPOSER |
| Even, starting with #2 | PROPOSER | REVIEWER |

This convention is binding for the 17.05 private review chain only. It was established by operator instruction and confirmed in the final converged roadmap. It must not be treated as a general CVF governance rule without separate codification.

The counter for the 17.05 chain: review #1 is CLOSED (Convergence State: 10/10 ACCEPTED, 0 OPEN, 0 ESCALATED). Review #2 will see Codex as PROPOSER and Claude as REVIEWER.

## Worked Example — 17.05 Chain

The 17.05 review chain is the canonical worked example of the anti-collusion protocol.

**What happened without the protocol:**

Both Claude and Codex used the same evaluation lens ("CVF already has this component") when assessing `Review CVF.md`. Neither agent independently cross-checked the source's Problems A–H against the working tree. Both would have converged on a false-negative: `Review CVF.md` has no residual value because CVF components exist.

**What the protocol caught:**

The operator pushed back. Claude ran concrete grep traces. Codex independently re-ran the traces. The result: CVF has components but they do not compose into a governed product capability system. The convergence gap is real and critical.

**The 5 over-claims from v0.1 that Adversarial Role Assignment caught:**

1. `skill.meta.json` was described as absent — Codex REVIEWER found it at `EXTENSIONS/CVF_v1.2.1_EXTERNAL_INTEGRATION/skill.publisher.ts:17`
2. `stream()` was described as entirely missing — Codex REVIEWER found `parseProviderNdjsonStream` at `EXTENSIONS/CVF_MODEL_GATEWAY/src/provider-output-contract.ts:92`
3. Role convention was reversed in the v0.1 draft — Codex REVIEWER identified the correct assignment
4. Phase 1 was bundled into one GC-018 across 6 surfaces with different blast radii — Codex REVIEWER required the split
5. Pre-commit hard-fail was proposed for the first anti-collusion tranche — Codex REVIEWER deferred to a later codification tranche

All 5 were caught because the REVIEWER role was structurally obligated to find risk. The PROPOSER role would not have caught these self-corrections.

**Source origins (private, do not copy into public-facing product docs):**

- `.private_reference/legacy/CVF 17.05/REVIEW FOLDER/CVF_17_05_REVIEW_CVF_FINAL_CONVERGED_REMEDIATION_ROADMAP_2026-05-17.md`
- `.private_reference/legacy/CVF 17.05/REVIEW FOLDER/CVF_17_05_REVIEW_CVF_CODEX_REVIEWER_REBUTTAL_TO_CONSENSUS_ROADMAP_DRAFT_2026-05-17.md`
- `.private_reference/legacy/CVF 17.05/REVIEW FOLDER/CVF_17_05_REVIEW_CVF_CLAUDE_PROPOSER_RESPONSE_TO_REVIEWER_REBUTTAL_2026-05-17.md`

The canonical convergence verdict artifact for the 17.05 chain is:

`docs/reviews/archive/CVF_17_05_REVIEW_CVF_CONVERGED_VERDICT_2026-05-17.md`

## Evidence Trace Block Template

Every absorption review packet must include a block structured as follows for each significant claim:

```text
Evidence Trace Block
- Claim: <exact claim text>
- Command: <exact grep/find/read command used>
- Result: <count or representative output>
- Key path: <file:line for the key finding>
- Verdict: EXISTS | ABSENT | PARTIAL | DRIFT
- Counter-evidence (if any): <opposing agent's evidence>
```

## Enforcement Surface

Phase 0.A (current): document and template requirement only. No hook. No CI blocker.

Phase 0.B (pending GC-018): manual checker for review packets missing Evidence Trace Blocks. CI advisory (non-blocking). Requires at least 3 review packets using the protocol before Phase 0.C may be considered.

Phase 0.C (deferred): pre-commit or CI hard-fail for missing Evidence Trace Blocks. Requires separate GC-018. Requires evidence from Phase 0.B.

## Related Artifacts

- `docs/reviews/archive/CVF_17_05_REVIEW_CVF_CONVERGED_VERDICT_2026-05-17.md` — 17.05 chain converged verdict
- `docs/reference/CVF_GC018_CONTINUATION_CANDIDATE_TEMPLATE.md` — GC-018 packet template (updated with Evidence Trace Block requirement)
- `governance/toolkit/05_OPERATION/CVF_MULTI_AGENT_REVIEW_DOC_GUARD.md` — canonical multi-agent review doc chain
- `governance/toolkit/05_OPERATION/CVF_KNOWLEDGE_ABSORPTION_PRIORITY_GUARD.md` — doctrine-first absorption mandate
- `docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md#GC-046`

## Final Clause

Two agents sharing the same blind spot is not convergence — it is correlated error. Adversarial role assignment and evidence-traced claims are the minimum structural requirements to distinguish genuine convergence from shared hallucination.

A review chain that cannot produce Evidence Trace Blocks for its significant claims has not earned the right to authorize implementation.
