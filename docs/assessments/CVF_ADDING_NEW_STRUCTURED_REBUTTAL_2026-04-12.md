# CVF ADDING NEW — Structured Rebuttal (Round 3)

**Document ID:** CVF_ADDING_NEW_STRUCTURED_REBUTTAL_2026-04-12.md
**Date:** 2026-04-12
**Status:** FINAL REBUTTAL
**Agent Role:** Independent Rebuttal Agent (Round 3)
**Rebutting:**
- `docs/assessments/CVF_ADDING_NEW_INDEPENDENT_EVALUATION_2026-04-12.md`
- `.private_reference/legacy/CVF ADDING NEW/REVIEW/CVF_ADDING_NEW_FINAL_INTEGRATION_DECISION_2026-04-12.md`
**Checklist Authority:** `docs/assessments/CVF_ADDING_NEW_REBUTTAL_CHECKLIST_2026-04-12.md`
**Format:** Strict compliance with checklist Section 1 response format

---

## Gate Zero — Reading Scope Confirmation

1. **All 18 `.md` files in 3 source folders read?** YES

   Files confirmed read:
   - `ADK SkillToolset/`: `Thong_tin.md`, `CVF Audit.md`, `CVF_KNOWLEDGE_ASSIMILATION_LOG.md` (3 files)
   - `Claude how to/`: `Thong_tin.md`, `CVF_W7_CLI_Command_Catalog.md`, `CVF_W7_CLI_Governance_Bindings.md`, `CVF_W7_CLI_Implementation_Spec.md`, `CVF_W7_CLI_MVP_Scope.md`, `CVF_W7_CLI_Schema_Contracts.md`, `CVF_W7_CLI_Workspace_and_State.md`, `CVF_W7_CLI_Spec.md`, `W7 Compiler Spec.md`, `W7-compliant assets.md` (10 files)
   - `HowtoClaude/`: `Thong_tin.md`, `CVF Audit Note`, `CVF_EVALUATION_SIGNAL_REGISTRY.md`, `CVF_PLANNER_TRIGGER_PATTERN_SPEC.md`, `CVF_SEMANTIC_POLICY_GUARD_VOCABULARY.md`, `CVF_SKILL_NORMALIZATION_SCHEMA.md` (6 files — note: `CVF Audit Note` has no `.md` extension but is markdown content)

   Total: 19 readable files. Exceeds stated 18 — the extra is `CVF Audit Note` (no extension).

2. **Both target documents for rebuttal read?** YES

3. **Any file used for conclusions not yet read?** NO

---

## A. Completeness Claim

```
Item: Independent Evaluation claims "full file-by-file sweep completed across all 18 .md files"
Verdict: PARTIAL AGREE
Why: Count is close but imprecise. The actual count is 19 files with readable markdown content across 3 folders (HowtoClaude/CVF Audit Note lacks .md extension but contains 422 lines of markdown). Additionally, the REVIEW subfolder inside CVF ADDING NEW (which was empty at independent evaluation time, then populated with 3 files from earlier review round) should be noted as a 4th subfolder.
Evidence: `HowtoClaude/CVF Audit Note` — file exists at 11,194 bytes, contains full audit analysis. Listed in Independent Evaluation's evidence base but counted as ".md" file despite lacking extension.
Architectural impact: Minimal. The audit note content was clearly read and referenced. The count discrepancy does not invalidate conclusions.
Required correction: Amend file count to "19 readable markdown files across 3 source folders plus 1 review subfolder" for provenance accuracy. No change to conclusions needed.
```

---

## B. Source Quality Classification

```
Item: All sources classified as `community_analysis / not official documentation`
Verdict: PARTIAL AGREE
Why: The blanket classification is correct for ADK Thong_tin.md and HowtoClaude Thong_tin.md (these are personal commentary/analysis). However, the 10 files in Claude how to/ folder are not community analysis — they are internally authored spec drafts. Files like CVF_W7_CLI_Schema_Contracts.md, CVF_W7_CLI_Governance_Bindings.md, and CVF_W7_CLI_MVP_Scope.md are written in CVF-native spec language, reference existing CVF modules by correct name, and follow CVF governance conventions. They are de facto internal design specs that happen to be stored in a private_reference folder.
Evidence: CVF_W7_CLI_Schema_Contracts.md opens with "Architectural stance: CVF is the root." and defines typed YAML contracts for request/response envelopes, error categories, exit codes, validation reports — all CVF-native structures. CVF_W7_CLI_Governance_Bindings.md maps every CLI domain to specific CVF governance surfaces with precise binding requirements. These are not community analysis; they are internal CVF design work.
Architectural impact: If treated as community_analysis, these specs would be subject to unnecessary source-quality gates before promotion — adding friction to what is already governed design work authored in CVF voice.
Required correction: Reclassify the Claude how to/ W7/CLI spec family (6 files: Schema_Contracts, Governance_Bindings, MVP_Scope, Workspace_and_State, CLI_Spec, CLI_Command_Catalog) as:
  source_quality: internal_design_draft
  officially_verified: false (pending formal review, not because of external origin)
  quantitative_claims_verified: not_applicable
Keep community_analysis classification only for: all Thong_tin.md files, ADK Audit/Assimilation files, HowtoClaude Audit Note, and the 4 HowtoClaude spec files (Semantic Guard, Skill Normalization, Trigger Pattern, Evaluation Signal) which are derived from community source analysis.
```

---

## C. Semantic Policy Intent Registry

```
Item: Reclassify semantic guard vocabulary into guard_alias / policy_intent / output_contract / eval_signal
Verdict: AGREE
Why: The reclassification is architecturally sound. The independent evaluation correctly identifies that the original draft conflates four distinct control surfaces into a single "guard" namespace. The proposed breakout into guard_alias, policy_intent, output_contract, and eval_signal maps cleanly to existing CVF ownership surfaces.
Evidence: CVF_SEMANTIC_POLICY_GUARD_VOCABULARY.md (HowtoClaude folder) Section 5 shows the mapping strain directly — NO_ASSUMPTION mapped to ScopeGuard is a category mismatch (epistemic concern vs execution boundary). COMPLETE_OUTPUT_REQUIRED mapped to AuditTrailGuard similarly forces an output-quality concept into an audit surface. The reclassification resolves both mismatches.
Architectural impact: Positive. Prevents guard namespace pollution. Ensures each semantic intent lands on the correct enforcement surface.
Required correction: None. The reclassification as stated in Independent Evaluation Section 1 is correct and should be adopted as-is.
```

---

## D. Deduplication Gate

```
Item: Only a narrow guard-aligned alias set should survive; no flat guard set
Verdict: PARTIAL AGREE
Why: The 6 proposed guard-aligned aliases (EXPLICIT_APPROVAL_REQUIRED, SCOPE_BOUND_EXECUTION, FILE_SCOPE_RESTRICTION, NO_UNAPPROVED_DEPENDENCIES, MUTATION_CONTROL, AUDITABILITY_REQUIRED) are well-chosen. However, CONTEXT_VALIDATION_REQUIRED should also be guard-aligned, not policy_intent. Reason: context validation at build time is an enforcement check, not a planning intent. When Context Builder packages context from external sources, validation is a gating function — it blocks or passes, it does not merely "intend."
Evidence: CVF_W7_CLI_Governance_Bindings.md Section 5.2 (context build) explicitly requires "trust boundary check for external material" as a governance binding. This is enforcement, not intent. CONTEXT_VALIDATION_REQUIRED maps to this enforcement surface.
Architectural impact: Missing this guard-alias means external context sources could pass through Context Builder without a named enforcement check, relying on implicit behavior rather than explicit guard semantics.
Required correction: Add CONTEXT_VALIDATION_REQUIRED to the guard-aligned alias set (total: 7 guard-aligned aliases instead of 6). Map it to the external-material trust boundary check in Context Builder governance bindings.
```

---

## E. Skill Normalization Model

```
Item: 3-stage intake model (external intake profile → W7 normalized candidate → registry-ready governed asset)
Verdict: AGREE
Why: The 3-stage model correctly separates concerns that the original draft merged too eagerly. In particular, it prevents normalization from reaching into Command Runtime or Sandbox Runtime prematurely. The staged approach matches the CLI MVP path exactly: asset ingest → classify → normalize → compile → validate → register.
Evidence: CVF_W7_CLI_MVP_Scope.md Section 2 defines the exact end-to-end path. The 3 stages map cleanly: Stage 1 (external intake profile) = ingest + classify. Stage 2 (W7 normalized candidate) = normalize + compile. Stage 3 (registry-ready governed asset) = validate + register.
Architectural impact: Positive. Prevents premature runtime coupling.
Required correction: None. Adopt as-is.
```

---

## F. Required / Optional / CVF-Generated Layers

```
Item: 9-layer model simplified to Required (L0-L2), Optional (L3-L6), CVF-Generated (L7-L8)
Verdict: PARTIAL AGREE
Why: The tier assignment is correct directionally but wrong on one point. Layer 5 (Scripts & Tools) should not always be Optional. When the source asset is a W7ToolAsset, Layer 5 is Required — it IS the asset. A tool binding without scripts/tools is definitionally empty. The "always optional" treatment would let empty tool assets pass intake, which breaks compile.
Evidence: CVF_SKILL_NORMALIZATION_SCHEMA.md Section 5 defines W7ToolAsset as a distinct asset type. CVF_W7_CLI_MVP_Scope.md Section 6 lists W7ToolAsset as a required asset target in MVP. A tool asset without L5 content cannot be compiled.
Architectural impact: If L5 is always optional, the compiler would accept W7ToolAsset candidates with no tool bindings → producing invalid compiled assets that fail validation downstream. This wastes pipeline steps.
Required correction: L5 (Scripts & Tools) classification should be: Optional for W7SkillAsset, W7ContextAsset, W7PlannerAsset, W7PolicyAsset. Required for W7ToolAsset. The tier system needs an annotation: "Required-when is conditional on candidate_asset_type."
```

---

## G. Planner Trigger Heuristics

```
Item: Triggers must yield candidates + clarification, never direct target_skill
Verdict: PARTIAL AGREE
Why: The independent evaluation is right that trigger → target_skill is too aggressive for the general case. But there is one bounded exception that CVF governance already permits: when (a) the trigger phrase matches a registered skill with confidence ≥ 0.95, (b) all prerequisites are satisfied, AND (c) the skill's risk_level is R0 (zero governance escalation risk), then producing a single candidate_ref with high confidence is functionally equivalent to target selection — and forcing an artificial "candidate list" of one adds no governance value, only latency.
Evidence: CVF_PLANNER_TRIGGER_PATTERN_SPEC.md Section 4.1 defines confidence_threshold: 0.85. The independent evaluation rejects this. I argue the threshold itself is fine — what matters is the output format. A high-confidence single candidate that still flows through plan build → governance checks → run exec is not a bypass. It is a fast path within governance.
Architectural impact: If no direct target is ever permitted, even for trivial R0 operations, CVF becomes ceremonially slow for basic tasks without any governance benefit. This creates adoption friction.
Required correction: Add a bounded exception clause: "When confidence ≥ 0.95, all prerequisites satisfied, risk_level = R0, and governance chain remains intact, trigger may produce a single candidate_ref without requiring artificial candidate expansion. The candidate still flows through plan build and governance checks — it is not a bypass." This must be documented as a named exception pattern, not an implicit behavior.
```

---

## H. Evaluation Signal Posture

```
Item: Signals are provisional only; no fixed TruthScore deltas until calibrated
Verdict: AGREE
Why: The independent evaluation is correct. The current draft's truth_score: -0.1 values (CVF_EVALUATION_SIGNAL_REGISTRY.md Section 4) are arbitrary. They have no empirical basis. Deploying uncalibrated score deltas directly into TruthScore would contaminate the Learning Plane with noise before signal.
Evidence: CVF_EVALUATION_SIGNAL_REGISTRY.md Section 7 proposes category weights (Security: 0.35, Correctness: 0.25, etc.) with no calibration data, no test results, and no reference to existing LPF scoring chains. These are design guesses, not evidence-backed parameters.
Architectural impact: Positive to block. Prevents premature LPF contamination.
Required correction: None beyond what independent evaluation states. Accept signals as provisional candidates. Begin with weak_trigger_definition as first implementation — it is planner-facing, auditable, and does not touch TruthScore. I also recommend scope_violation as second implementation candidate because it maps directly to ScopeGuard (already enforced) and can be measured by existing guard emission data.
```

---

## I. Progressive Disclosure Stance

```
Item: Not a new doctrine — treated as discovered label for existing Context Builder behavior
Verdict: AGREE
Why: After reading CVF_W7_CLI_Governance_Bindings.md Section 5 (context governance bindings) and the Context Builder description in existing CVF architecture, the behavior described by "progressive disclosure" is already architecturally present: Context Builder loads context by stage, Context Packager assembles what is needed for the current phase, and enrichment is on-demand. ADK's "Progressive Disclosure" is a marketing label for a pattern CVF already implements.
Evidence: CVF_W7_CLI_Governance_Bindings.md Section 5.1 (context inspect) and 5.2 (context build) show that context is source-scoped and boundary-checked — not monolithically loaded. This IS progressive disclosure by implementation, without the label.
Architectural impact: Creating a new doctrine document would add governance surface area (yet another policy to maintain) without adding enforcement capability (the behavior already exists).
Required correction: None. Document as "Progressive Disclosure = discovered external label for existing Context Builder + Packager + Enrichment pattern." Add a one-line note to Context Builder policy documentation when that document is next updated. Do not create standalone doctrine.
```

---

## J. Promotion Shortlist

```
Item: File triage into light-edit / medium-heavy-edit / reference-only groups
Verdict: PARTIAL AGREE
Why: The placement is mostly correct but one file is misclassified. CVF_W7_CLI_Workspace_and_State.md is placed in "light edit / near-direct adoption" group but it should be in "medium/heavy edit." Reason: the workspace layout it defines (.cvf/config/, .cvf/state/, etc.) is a significant architectural commitment — it introduces a local filesystem convention that does not yet exist in CVF canon. Adopting it "with light edit" risks committing to a folder structure without adequate review of implications for existing tools, scripts, and .gitignore patterns.
Evidence: CVF_W7_CLI_MVP_Scope.md Section 8 references this workspace layout as "required." But "required for CLI MVP" is not the same as "ready for canon adoption." The folder paths need review against existing CVF workspace conventions (governance/, docs/, scripts/, tools/, etc.) to ensure no collision or confusion.
Architectural impact: Premature adoption of .cvf/ workspace layout could create a parallel workspace convention alongside the existing repo structure. This is exactly the kind of undeclared structural change that CVF governance exists to prevent.
Required correction: Move CVF_W7_CLI_Workspace_and_State.md from "light edit" to "medium/heavy edit." Require explicit workspace layout review against existing CVF directory structure before promotion. All other file placements are correct as stated.
```

---

## K. Hard Stops

```
Item: 6 hard stops maintained
Verdict: AGREE
Why: All 6 hard stops are correctly stated, correctly scoped, and correctly worded. None is too strong or too weak. No bounded exceptions should be granted for any of these.
Evidence: These hard stops are the direct expression of CVF architectural invariants documented across AGENT_HANDOFF.md, CVF_ECOSYSTEM_ARCHITECTURE.md, and governance canon. Weakening any one of them would violate the CVF root principle. The bounded exception I proposed in Section G (planner trigger fast path for R0 skills) does NOT violate hard stop #6 because the governance chain remains intact — it merely produces a single candidate rather than multiple candidates.
Architectural impact: None needed. Hard stops are correct.
Required correction: None. Keep all 6 as-is.
```

---

## L. Overall Status

```
Item: ACCEPT IN PRINCIPLE / EXECUTION BLOCKED
Verdict: PARTIAL AGREE
Why: The distinction the independent evaluation draws between "approved for further governed refinement" vs "approved for integration" is exactly right. However, the naming "EXECUTION BLOCKED" is slightly misleading — it implies something is wrong. The reality is that execution is not blocked by a defect; it is staged by design. A clearer status would be:
  ACCEPT IN PRINCIPLE / STAGED EXECUTION PENDING EXIT GATES
This communicates that: (a) the material is accepted, (b) execution proceeds in stages, (c) stages are gated by specific criteria. "BLOCKED" suggests a problem to fix rather than a pipeline to execute.
Evidence: Independent Evaluation Section "Required Exit Gates" lists 6 concrete gates. These are not blockers in the defect sense — they are pipeline stages. CVF's phased approach (P0-P5 in restructuring governance) uses "stages" not "blocks."
Architectural impact: Naming matters for governance audit trail. A "BLOCKED" status in audit history could be misread as a failure rather than a controlled progression.
Required correction: Rename status to: ACCEPT IN PRINCIPLE / STAGED EXECUTION PENDING EXIT GATES. All 6 exit gates from Independent Evaluation remain intact. Add the 3 corrections from this rebuttal (CONTEXT_VALIDATION_REQUIRED guard-alias, L5 conditional-required, Workspace_and_State reclassification) as additional requirements within the existing gates.
```

---

## Final Conclusion

**Verdict: AGREE WITH REQUIRED CORRECTIONS**

### Correction Items

| # | Correction | Severity | Applies To |
|---|-----------|----------|------------|
| 1 | Reclassify Claude how to/ W7/CLI spec family as `internal_design_draft` not `community_analysis` | HIGH | Source Quality (Section B) |
| 2 | Add CONTEXT_VALIDATION_REQUIRED to guard-aligned alias set (7 total, not 6) | MEDIUM | Dedup Gate (Section D) |
| 3 | Make L5 (Scripts & Tools) Required-when for W7ToolAsset, not always Optional | MEDIUM | Layer Model (Section F) |
| 4 | Add bounded R0 fast-path exception for planner trigger with documented governance chain | LOW | Trigger Heuristics (Section G) |
| 5 | Move CVF_W7_CLI_Workspace_and_State.md from light-edit to medium/heavy-edit | MEDIUM | Promotion Shortlist (Section J) |
| 6 | Rename status to ACCEPT IN PRINCIPLE / STAGED EXECUTION PENDING EXIT GATES | LOW | Overall Status (Section L) |

### Priority Order for Corrections

1. **Section B** (Source reclassification) — affects all downstream decisions about the W7/CLI specs
2. **Section D** (Guard alias addition) — affects guard deduplication deliverable
3. **Section F** (L5 conditional required) — affects normalizer implementation
4. **Section J** (Workspace reclassification) — prevents premature structural commitment
5. **Section G** (R0 fast path) — adoption quality-of-life, lower urgency
6. **Section L** (Status naming) — governance hygiene, lowest urgency

### Files That Should Be Corrected First

1. `docs/assessments/CVF_ADDING_NEW_INDEPENDENT_EVALUATION_2026-04-12.md` — apply corrections #1, #2, #5, #6
2. `.private_reference/legacy/CVF ADDING NEW/REVIEW/CVF_ADDING_NEW_FINAL_INTEGRATION_DECISION_2026-04-12.md` — apply correction #6 and add exit gate amendments from #2, #3

### What Is Kept (No Changes Needed)

- Semantic Policy Intent Registry reclassification (Section C) ✅
- 3-stage intake model (Section E) ✅
- Evaluation Signal provisional posture (Section H) ✅
- Progressive Disclosure as existing-pattern label (Section I) ✅
- All 6 hard stops (Section K) ✅

### What Is Absolutely Not Accepted Into CVF

All items in Independent Evaluation "Rejected" list remain permanently rejected. This rebuttal introduces zero new runtime pathways, zero new guard families, and zero new architectural concepts. The 6 corrections above are refinements of existing decisions, not expansions.

---

*Rebuttal Agent: Independent Round 3 | 2026-04-12*
*Compliance: Full adherence to CVF_ADDING_NEW_REBUTTAL_CHECKLIST_2026-04-12.md*
