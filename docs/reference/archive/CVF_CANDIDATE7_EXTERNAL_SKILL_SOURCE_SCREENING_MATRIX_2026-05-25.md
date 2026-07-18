# CVF Candidate 7 External Skill Source Screening Matrix

Memory class: SUMMARY_RECORD

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-05-25

---

## Purpose

Screen the highest-value local Candidate 7 external-skill source families after
ES1. The goal is to absorb useful knowledge without turning CVF into a large,
loose skill dump.

This matrix answers: which source-family concepts are valuable now as CVF
patterns, which require future runtime/registry gates, and which should not be
adopted directly.

## Scope / Target / Owner Boundary

This is a documentation and governance screening matrix only.

Allowed:

- read local legacy/source-catalog evidence;
- extract reusable patterns;
- map accepted value to existing CVF owner surfaces;
- recommend the next bounded tranche.

Not authorized:

- external skill import;
- product pack creation or modification;
- registry publication;
- runtime adapter creation;
- live external repository fetch;
- tool, MCP, CLI, script, model, provider, browser, or database execution;
- public-sync, marketplace claims, hosted readiness, production readiness, or
  freeze release.

## Source Inventory

Local source families audited:

| Source family | Representative files | File-count posture |
| --- | --- | --- |
| Hugging Face | `.private_reference/legacy/CVF ADD/Hugging Face/CVF_HF_SKILL_ABSORPTION_SPEC.md`, `.private_reference/legacy/CVF ADD/Hugging Face/CVF_HF_SKILL_NORMALIZATION_SCHEMA.md` | 11 local files in family |
| Hermes Agent | `.private_reference/legacy/CVF ADD/Hermes Agent/CVF_HERMES_SKILL_PACKAGE_MODEL.md` | 11 local files in family |
| Memento-Skills | `.private_reference/legacy/CVF 16.5/Memento-Skills/GOVERNED_SKILL_EVOLUTION_SPEC.md` | 9 local files in family |
| Agent Engineer | `.private_reference/legacy/CVF ADD/AGENT ENGINEER/CVF_AGENT_ENGINEERING_CONTRACT.md` | 10 local files in family |
| skillsmp local shortlist | `governance/skill-library/registry/external-sources/skillsmp/skillsmp_shortlist.json` | 100 local catalog entries |

Source families intentionally skipped:

- live external repositories: out of C7B scope;
- concrete third-party skill contents behind URLs: require candidate-specific
  source/use-case binding and fresh GC-018 before import;
- runtime execution files from these families: only their boundary lessons are
  considered here.

## Prior Absorption Resolution

Resolved evidence:

- `docs/reference/CVF_EXTERNAL_SKILL_INTAKE_SCREENING_PACKET_2026-05-25.md`
- `docs/reference/CVF_GOVERNED_CAPABILITY_INTAKE_DOCTRINE_2026-05-07.md`
- `docs/reference/CVF_LEGACY_HARVEST_CLOSEOUT_LEDGER_2026-05-25.md`
- `docs/reviews/CVF_ES1_EXTERNAL_SKILL_INTAKE_SCREENING_PACKET_COMPLETION_2026-05-25.md`
- `docs/reviews/CVF_C7A_PRODUCT_SKILL_PACK_TOP10_COMPLETION_2026-05-25.md`
- `docs/reviews/CVF_C8_PRODUCT_SKILL_PACK_SELECTION_READOUT_COMPLETION_2026-05-25.md`
- `docs/reviews/CVF_TA1_TOOL_ACTION_APPROVAL_READOUT_COMPLETION_2026-05-25.md`

Corrected status:

- Hugging Face: `PARTIALLY_ABSORBED`, normalization and boundary doctrine
  accepted, runtime ingestion deferred.
- Hermes Agent: `PARTIALLY_ABSORBED`, package model accepted, cron/MCP/runtime
  deferred.
- Memento-Skills: `PARTIALLY_ABSORBED`, governed evolution loop accepted,
  mutation/reinjection deferred.
- Agent Engineer: `PARTIALLY_ABSORBED`, strict contract doctrine accepted,
  execution/eval framework not imported.
- skillsmp shortlist: `READ_NOT_DISPOSITIONED`, catalog is locally present but
  too broad for direct import.

## Candidate 7 Screening Matrix

| Source | Accepted value | Duplicate/dilution screen | Risk screen | Owner surface | Disposition |
| --- | --- | --- | --- | --- | --- |
| Hugging Face absorption | External skills are untrusted knowledge inputs; no direct trust, no parallel runtime, lifecycle from source intake to normalization to risk/policy/registry/trace. | Not a new pack. Improves the ES1 intake standard and future validator. | Medium as docs pattern; high if execution or adapters are added. | `docs/reference`, future external-skill candidate validator, governed capability intake doctrine. | `ACCEPT_AS_PATTERN` for lifecycle and boundary language; `DEFER_RUNTIME_GATED` for execution adapters/sandbox. |
| Hugging Face normalization schema | Required normalized fields: provenance, task intents, tools, execution mode, artifacts, risk, data sensitivity, side effects, human review, sandbox, policy, context injection, trace, status. | Merges into ES1 normalization minimum; no new pack. | Low as schema; high if treated as registry admission. | ES1 screening record and future validator/readout. | `MERGE_AS_PATTERN`; no direct registry publication. |
| Hermes skill package model | Skill package must carry identity, version, provenance, purpose, scope, policy bindings, maturity/evaluation/registry status, runtime constraints, enable/disable scope. | Complements HF normalization; no new pack. | Low as package metadata; high for cron, MCP, backend, or scheduled actions. | Future candidate record schema and registry-readiness preflight. | `ACCEPT_AS_PATTERN`; `DEFER_RUNTIME_GATED` for cron/MCP/backend execution. |
| Memento governed evolution | Agents may propose skill evolution but cannot self-write production skills; mutation requires reflection, verification, approval, receipt, and governed reinjection. | Not a workflow pack; it is a control loop for future pack improvement. | Medium as proposal lane; high if automatic mutation/reinjection is enabled. | Proposal-only evolution lane, Learning Plane evidence, future skill governance review. | `ACCEPT_AS_PATTERN`; `DEFER_EVOLUTION_GATED` for mutation/reinjection. |
| Agent Engineer contract | Strict schemas, required fields, exact outputs, no implicit assumptions, no silent correction of violations. | Merges with governance/contracts and validator posture; no new pack. | Low as contract discipline. | `governance/contracts`, ES1/C7B candidate validator. | `ACCEPT_AS_PATTERN`. |
| skillsmp local shortlist | Local catalog has 100 entries and can help discover concrete candidate sources later. Current distribution is broad: 60 app_development, 12 business_analysis, 10 ai_ml_evaluation, 6 product_ux, and smaller categories. Top examples include React/Next.js guidance, browser automation, backend guidelines, data-context extraction, database tools, competitor alternatives, and LLM evaluation. | High dilution risk. Many entries duplicate existing packs or require tools/browser/database/runtime execution. | Medium as local metadata; high if URL contents are fetched/imported or tool skills are executed. | Future candidate-specific screening only, using ES1 required record. | `DEFER_CANDIDATE_SPECIFIC_SCREEN`; reject direct bulk import. |

## Accepted Pattern Set

C7B accepts these patterns into CVF reference posture:

1. External skills are evidence, not authority.
2. Every external skill candidate needs provenance, source revision or
   fingerprint, and transformation notes.
3. Normalization must re-express the skill in CVF-native fields before any
   registry or execution discussion.
4. Side effects, tools, secrets, data sensitivity, policy binding, sandbox
   need, trace requirements, and human review mode must be explicit.
5. Skill packages need maturity and registry status, not just a prompt body.
6. Skill evolution is proposal first: no self-write into production, no risk
   lowering without positive evidence, and all mutations require receipts.
7. Candidate libraries should be screened against the ten certified packs
   before adding any eleventh workflow.
8. Strict schema validation is part of intake quality, not optional polish.

## Deferred Or Rejected Value

Deferred:

- direct external skill ingestion;
- live external repository fetch;
- any MCP/tool/CLI/browser/database/provider execution;
- runtime adapter or sandbox implementation;
- registry publication or marketplace display;
- creating new product packs from skillsmp entries;
- automatic skill mutation or reinjection.

Rejected:

- treating external source popularity, star count, or packaging as trust;
- importing `SKILL.md` files as CVF law;
- accepting hidden side effects or unknown credential requirements;
- bulk importing a skill catalog to create choice theater.

## Normalized Candidate Record Delta

ES1 already defines the required screening record. C7B adds four fields for
future validator/readout work:

```yaml
external_skill_screen:
  source_family: hugging_face|hermes|memento|agent_engineer|skillsmp|other
  duplicate_target_pack: string|null
  dilution_risk: low|medium|high
  registry_readiness: not_ready|candidate_only|normalized|governed|approved
```

These fields help distinguish "valuable pattern" from "ready skill".

## Next Highest-Value Bounded Tranches

Recommended order:

1. **C7C External Skill Candidate Record Validator/Readout.**
   Convert ES1+C7B into a deterministic local validator/readout for one YAML
   screening record. This is highest value because it makes the rule
   enforceable without importing anything.
2. **C7D Candidate-Specific Screen From Local skillsmp Catalog.**
   Pick one concrete high-value use case that improves an existing certified
   pack, such as competitor alternatives for `competitor_review` or data
   context extraction for `data_analysis`. Screen only metadata first; fetch or
   import requires separate authorization.
3. **C7E Proposal-Only Skill Evolution Lane.**
   Normalize Memento into a proposal packet for improving an existing pack
   after real use signals exist. Do not implement mutation/reinjection yet.

Not recommended now:

- bulk skill-library import;
- new generic "skill marketplace" UI;
- browser/database/tool skills before TA1-style runtime approval surfaces are
  wired to concrete execution owners;
- new eleventh pack without evidence that the ten-pack selector misses a
  repeated non-coder job.

## Adversarial Role Review

Implementer:

- The smallest useful proof is a deterministic source-family matrix and a next
  validator tranche. It uses existing docs and keeps runtime closed.

Skeptic/Auditor:

- The biggest blind spot is mistaking local catalog metadata for evaluated
  skill quality. C7B blocks that by requiring candidate-specific screening and
  no direct import.

Product/Operator Advocate:

- The user problem is not "more skills"; it is better selection for real
  non-coder outcomes. C7B preserves the ten-pack focus and recommends
  enforceable intake before expansion.

Safety/Boundary Owner:

- Runtime authority remains unavailable. No external content, tool command,
  browser automation, database access, provider method, registry publication,
  or public claim is authorized by this matrix.

## Verification

C7B verification is documentation/governance only:

- the source-family matrix exists;
- accepted value is mapped to CVF owner surfaces;
- every source family has disposition and reason;
- runtime/import/registry/public boundaries remain closed;
- next tranche is value-screened and fresh-GC-018-gated.

Live proof N/A. No live provider, API key, CLI, MCP, browser, database, or
external repository was used.

## Claim Boundary

C7B proves only a local docs-only Candidate 7 source-family screening matrix.
It does not prove external skill ingestion, skill quality, registry admission,
runtime execution, live tool/MCP/database/provider behavior, marketplace
readiness, hosted readiness, production readiness, public release readiness, or
freeze release.
