# CVF Independent Evaluation — CVF ADDING NEW Intake

Independent evaluation of the material in `.private_reference/legacy/CVF ADDING NEW/`

> **Assessment Date**: 2026-04-12
> **Scope**: `ADK SkillToolset`, `Claude how to`, `HowtoClaude`, and the review packet created on 2026-04-12
> **Memory class**: SUMMARY_RECORD
> **Assessment posture**: CVF remains the root; no external runtime, prompt system, or skill format is authoritative by default
> **Completeness note**: full file-by-file sweep completed across 19 readable markdown files in the 3 source folders, including `HowtoClaude/CVF Audit Note` (markdown content without `.md` extension), before finalizing this assessment

## Verdict

The earlier intake and rebuttal are directionally correct, but still too permissive in three places: they keep the semantic guard set too broad, they place parts of normalization on the wrong architectural surface, and they treat uncalibrated planner/eval heuristics as if they were ready for canon adoption.

Final independent verdict:

`ACCEPT IN PRINCIPLE / EXECUTION BLOCKED`

Accepted only as constrained inputs for:

1. semantic policy intent vocabulary
2. external asset normalization heuristics
3. planner-facing trigger/description heuristics
4. provisional learning signals

Not accepted as:

1. new guard families
2. new runtime pathways
3. direct skill-routing authority
4. truth-score weighting doctrine
5. a new architectural concept competing with existing Context Builder and W7 governance paths

## Evidence Base

Primary canon checked:

- `docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md`
- `docs/roadmaps/CVF_MASTER_ARCHITECTURE_CLOSURE_ROADMAP_2026-04-05.md`
- `AGENT_HANDOFF.md`

Primary intake material checked:

- `.private_reference/legacy/CVF ADDING NEW/ADK SkillToolset/CVF_KNOWLEDGE_ASSIMILATION_LOG.md`
- `.private_reference/legacy/CVF ADDING NEW/ADK SkillToolset/CVF Audit.md`
- `.private_reference/legacy/CVF ADDING NEW/Claude how to/CVF_W7_CLI_Governance_Bindings.md`
- `.private_reference/legacy/CVF ADDING NEW/Claude how to/CVF_W7_CLI_Schema_Contracts.md`
- `.private_reference/legacy/CVF ADDING NEW/HowtoClaude/CVF_SEMANTIC_POLICY_GUARD_VOCABULARY.md`
- `.private_reference/legacy/CVF ADDING NEW/HowtoClaude/CVF_SKILL_NORMALIZATION_SCHEMA.md`
- `.private_reference/legacy/CVF ADDING NEW/HowtoClaude/CVF_PLANNER_TRIGGER_PATTERN_SPEC.md`
- `.private_reference/legacy/CVF ADDING NEW/HowtoClaude/CVF_EVALUATION_SIGNAL_REGISTRY.md`
- `.private_reference/legacy/CVF ADDING NEW/REVIEW/CVF_ADDING_NEW_INTAKE_ASSESSMENT_2026-04-12.md`
- `.private_reference/legacy/CVF ADDING NEW/REVIEW/CVF_ADDING_NEW_DEVILS_ADVOCATE_REBUTTAL_2026-04-12.md`
- `.private_reference/legacy/CVF ADDING NEW/REVIEW/CVF_ADDING_NEW_FINAL_INTEGRATION_DECISION_2026-04-12.md`

This assessment is therefore not based only on prior reviews or `Thong_tin.md` commentary. It is based on the full readable source set.

## Independent Findings

### 1. The proposed semantic guard vocabulary mixes four different classes of control

The current semantic vocabulary draft is useful, but it is not a pure guard layer. It currently mixes:

- guard aliases for existing enforcement surfaces
- policy intents that should shape clarification or approval behavior
- output-contract requirements
- evaluation-only signals

That mixture is the main reason the current mappings feel strained.

Examples:

- `NO_ASSUMPTION` is an epistemic policy intent, not a natural alias for `ScopeGuard`
- `REQUIRE_CLARIFICATION` is an intake/boardroom policy behavior, not a natural alias for `PhaseGateGuard`
- `COMPLETE_OUTPUT_REQUIRED` and `FUNCTIONAL_UI_REQUIRED` are output contracts, not guard identities
- `XSS_PREVENTION` and `INPUT_VALIDATION_REQUIRED` are security review checks and validation obligations, not evidence that a new standalone guard family is needed

Independent decision:

- Keep only a narrow set as **guard-aligned semantic aliases**: `EXPLICIT_APPROVAL_REQUIRED`, `SCOPE_BOUND_EXECUTION`, `FILE_SCOPE_RESTRICTION`, `NO_UNAPPROVED_DEPENDENCIES`, `MUTATION_CONTROL`, `AUDITABILITY_REQUIRED`, `CONTEXT_VALIDATION_REQUIRED`
- Reclassify as **policy/clarification intents**: `NO_ASSUMPTION`, `REQUIRE_CLARIFICATION`, `CODEBASE_IS_SOURCE_OF_TRUTH`, `CONTEXT_VALIDATION_REQUIRED`, `SECURITY_FIRST_POLICY`
- Reclassify as **output contract / review contract**: `COMPLETE_OUTPUT_REQUIRED`, `RUNNABLE_OUTPUT_ONLY`, `ERROR_HANDLING_REQUIRED`, `FUNCTIONAL_UI_REQUIRED`, `EXPLAIN_WHY_ONLY`, `STYLE_CONSISTENCY_REQUIRED`, `WORKSPACE_HYGIENE_REQUIRED`, `NO_UNRELATED_CHANGES`
- Reclassify as **security validation checks / eval signals**: `INPUT_VALIDATION_REQUIRED`, `INJECTION_PREVENTION`, `XSS_PREVENTION`

This means the correct CVF deliverable is not `semantic guards`. The correct deliverable is:

`semantic policy intent registry`

with explicit fields:

- `classification: guard_alias | policy_intent | output_contract | eval_signal`
- `existing_owner`
- `enforcement_surface`
- `evidence_required`

### 2. The current normalization schema places some responsibilities on the wrong plane

The normalization draft is valuable, but parts of its module mapping are too eager:

- `Skill Compilation -> Command Runtime` is too late and too execution-adjacent
- `Skill Execution -> Sandbox Runtime` is true only after registration and planning, so it should not appear as part of normalization flow
- `Skill Registration -> Agent Definition & Capability Registry` needs source-quality and provenance gates before any registry-ready status

Independent decision:

The intake model should be split into three stages:

1. `external intake profile`
2. `w7 normalized asset candidate`
3. `registry-ready governed asset`

Required fields for stage 1:

- `source_ref`
- `source_kind`
- `source_quality`
- `provenance_notes`
- `candidate_asset_type`
- `description_or_trigger`
- `instruction_body`

Optional fields for enrichment:

- `references`
- `examples`
- `tools`
- `templates`

Required-when enrichment:

- `tools` is required when `candidate_asset_type = W7ToolAsset`

CVF-generated fields only after review:

- `governance`
- `risk_level`
- `approval_state`
- `observability`
- `evaluation_profile`
- `registry_refs`

This keeps external material in an intake posture until CVF fills the governed fields itself.

### 3. Trigger patterns are useful, but direct skill routing is too strong

The planner trigger draft currently routes from trigger phrases to `target_skill` with a confidence threshold. That is too aggressive for CVF.

Why:

- CVF already has governed intake, clarification refinement, boardroom, and orchestrator surfaces
- a trigger phrase should propose candidates, not authorize execution intent
- missing prerequisites should bias to clarification, not to premature routing

Independent decision:

Planner trigger patterns are accepted only if they produce:

- `candidate_refs[]`
- `confidence`
- `missing_inputs[]`
- `clarification_needed`
- `negative_matches[]`

Bounded fast-path exception:

- when `confidence >= 0.95`
- all prerequisites are satisfied
- `risk_level = R0`
- and the full governed plan/build/check chain remains intact

the trigger may emit a single `candidate_ref` directly without artificial candidate expansion

They must not produce:

- direct runtime permission
- direct tool invocation
- unconditional `target_skill`

The correct path is:

`trigger detection -> clarification/boardroom refinement -> planner candidate selection -> governed plan`

not:

`trigger phrase -> skill`

### 4. The evaluation registry is promising, but its scoring is not canon-ready

The signal list is useful. The proposed weighting and direct TruthScore impact are not yet trustworthy.

Problems:

- `truth_score: -0.1` style impacts are arbitrary in the current draft
- category weights in the draft are not tied to the already delivered LPF scoring and governance-signal chains
- some signals are valid observations, but not yet stable scoring dimensions

Independent decision:

Accept the signal catalog only as:

`provisional LPF signal candidates`

Each candidate must declare:

- `capture_source`
- `evidence_type`
- `phase`
- `severity`
- `recommended_remediation`

But it must not declare fixed score deltas until calibrated through real FeedbackLedger and W7Eval evidence.

Minimum first implementation should be one low-risk signal:

- `weak_trigger_definition`

because it is planner-facing, auditable, and does not distort runtime governance.

### 5. Progressive Disclosure is not a new doctrine unless a real CVF gap is proven

ADK vocabulary is useful here, but CVF already has the architectural substrate for governed context build, clarification refinement, context packaging, and enrichment.

Independent decision:

- Do not create a new standalone CVF doctrine for Progressive Disclosure yet
- Treat it as a discovered label for the existing `Context Builder -> Context Packager -> Context Enrichment` behavior unless a concrete missing contract is shown
- Any future canon update must identify one exact missing rule in current Context Builder policy before adding new terminology

### 6. Source quality must be part of the integration decision, not a footnote

The current review packet correctly notes community-source risk, but that requirement should become structural.

Independent decision:

Any asset or policy intent derived from community-derived intake material must carry:

```yaml
source_quality: community_analysis
officially_verified: false
quantitative_claims_verified: false
```

This is mandatory for all first-pass W7 intake candidates created from community-derived materials.

### 7. Full-source curation result: not all files have equal promotion value

The full sweep makes one thing very clear: the most reusable material is the `Claude how to` W7/CLI specification family, not the commentary-heavy ADK or prompt-analysis files.

That family should not be classified as `community_analysis`.
It should be classified as:

```yaml
source_quality: internal_design_draft
officially_verified: false
quantitative_claims_verified: not_applicable
```

#### Promote candidate with light edit

These are the strongest copy-forward candidates into canonical CVF docs, provided they are aligned to current naming and module boundaries:

1. `Claude how to/CVF_W7_CLI_Schema_Contracts.md`
2. `Claude how to/CVF_W7_CLI_Governance_Bindings.md`
3. `Claude how to/CVF_W7_CLI_MVP_Scope.md`

Why:

- they are concrete
- they are already governance-aware
- they are mostly typed/operator-facing rather than speculative
- they map cleanly onto an identified CVF gap: external repo -> governed W7 intake/compile/register path

#### Promote candidate with medium/heavy edit

These contain real value, but should be consolidated or reclassified before copy-forward:

1. `Claude how to/CVF_W7_CLI_Workspace_and_State.md`
2. `Claude how to/CVF_W7_CLI_Command_Catalog.md`
3. `Claude how to/CVF_W7_CLI_Spec.md`
4. `Claude how to/CVF_W7_CLI_Implementation_Spec.md`
5. `Claude how to/W7 Compiler Spec.md`
6. `Claude how to/W7-compliant assets.md`
7. `HowtoClaude/CVF_SEMANTIC_POLICY_GUARD_VOCABULARY.md`
8. `HowtoClaude/CVF_SKILL_NORMALIZATION_SCHEMA.md`
9. `HowtoClaude/CVF_PLANNER_TRIGGER_PATTERN_SPEC.md`
10. `HowtoClaude/CVF_EVALUATION_SIGNAL_REGISTRY.md`
11. `HowtoClaude/CVF Audit Note`

Why:

- some parts duplicate each other
- some parts overreach into runtime authority
- some parts use draft asset names or guard names that need canon alignment
- some parts are valuable only after being weakened from "control" into "heuristic", "intake profile", or "provisional signal"

#### Reference-only

These should be preserved for provenance and reasoning history, but should not be copied forward as canon text:

1. all `Thong_tin.md` files
2. `ADK SkillToolset/CVF Audit.md`
3. `ADK SkillToolset/CVF_KNOWLEDGE_ASSIMILATION_LOG.md`

Why:

- they are commentary-heavy
- they are derivative rather than primary spec
- they are useful for explaining origin, not for defining canon behavior

## Final Integration Shape

The final CVF-aligned shape is narrower than the current review packet suggests.

### Accepted

1. A `semantic policy intent registry`, not a new guard set
2. A 3-stage external asset intake profile, not a runtime-ready skill schema
3. Planner trigger heuristics that yield candidates plus clarification requirements, not direct skill routing
4. Provisional evaluation signals with no fixed score deltas until calibrated
5. A curated promotion path for the W7/CLI spec family, with file-level reuse decisions

### Rejected

1. Any implication that external `SKILL.md` is close to runtime authority
2. Any mapping that moves normalization into Command Runtime too early
3. Any attempt to make prompt-derived output rules look like native guard identities
4. Any new scoring doctrine for TruthScore without LPF calibration evidence
5. Any suggestion that ADK Progressive Disclosure is a novel CVF capability by itself

## Required Exit Gates Before Canon Integration

1. Produce a canonical `semantic policy intent registry` spec under `governance/` with reclassification and owner mapping.
2. Define a `community_external_asset` intake profile for W7 with mandatory `source_quality` and provenance fields.
3. Test planner trigger patterns with at least 9 cases:
   positive match, clarification-required, and reject/negative-match.
4. Implement one provisional LPF signal end-to-end through evidence capture, not just documentation.
5. Resolve the Progressive Disclosure question explicitly:
   either "already covered by Context Builder policy" or "exact missing contract identified".
6. Create a promotion shortlist so future agents do not re-audit the same 18 source files from scratch.

## Final Recommendation

Use this assessment as the stricter gate over the 2026-04-12 review packet.

The 3 source folders are worth keeping, but only as governed design input. The right final method is not "integrate the new agent ideas". The right method is:

1. strip them down to CVF-compatible intent
2. reclassify each piece into the proper owner surface
3. admit only what can be traced through W7 and LPF without inventing a parallel doctrine

Until those exit gates are satisfied, the correct CVF status is:

`APPROVED FOR STAGED EXECUTION PENDING EXIT GATES`

not:

`APPROVED FOR INTEGRATION`
