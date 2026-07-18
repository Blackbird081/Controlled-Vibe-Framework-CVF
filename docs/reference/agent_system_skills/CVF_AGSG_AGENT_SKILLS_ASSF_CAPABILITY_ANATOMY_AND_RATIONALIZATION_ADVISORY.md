# CVF AGSG-T2 Agent Skills ASSF Capability Anatomy And Rationalization Advisory

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

Date: 2026-06-28

docType: reference

Batch ID: AGSG-T2

## Purpose

Provide a compact ASSF-aligned advisory for applying the useful
`addyosmani/agent-skills` patterns without importing upstream runtime,
commands, personas, hooks, or checker code.

This advisory is intentionally subordinate to the ASSF package, intake,
resolver, composition, certification, and dual-agent contracts. It introduces
no package instance, resolver behavior, runtime loader, generated aggregate,
CLI/MCP adapter, public export, or certification claim.

## Scope

Applies to future authors or reviewers of ASSF package candidates, package
advisories, or skill-like documentation that needs to decide whether an
external skill pattern is worth adapting.

Does not apply to direct runtime activation, live provider execution, external
agent adapter behavior, public catalog claims, benchmark claims, security
certification, or automatic skill selection.

## Source Verification Block

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |
|---|---|---|---|---|---|
| ASSF-T1 already requires purpose, invocation boundary, inputs/outputs, risk, progressive disclosure, evidence, and external disposition in `SKILL.md` profile | `docs/reference/agent_system_skills/CVF_ASSF_PACKAGE_CONTRACT.md` | `SKILL.md Profile` | `SKILL.md Profile` | ASSF package contract | ACCEPT |
| ASSF-T1 compact schema already owns trigger, use/do-not-use, selectors, risk, authority, composition, and external disposition fields | `docs/reference/agent_system_skills/CVF_ASSF_PACKAGE_CONTRACT.md` | `Compact Machine Source Schema` | `useWhen`; `doNotUseWhen`; `authorityCeiling` | ASSF package contract | ACCEPT |
| ASSF-T5 controls composition, dependency, conflict, capability claims, and no authority expansion | `docs/reference/agent_system_skills/CVF_ASSF_COMPOSITION_CONTROL_CONTRACT.md` | `No-Automatic-Promotion Invariant`; `Capability Claim Controls`; `Package Graph Boundary` | `capabilityClaims`; `authorityCeiling` | ASSF composition control contract | ACCEPT |
| ASSF-T2 index is metadata-only and does not activate skills | `docs/reference/agent_system_skills/generated/skill-index.json` | `claimBoundary` | `claimBoundary` | ASSF generated index | ACCEPT |
| Upstream skill anatomy recommends rationalization, red flag, and verification sections | `.private_reference/external_repos/agent-skills/docs/skill-anatomy.md` | `Recommended Structure`; `Common Rationalizations`; `Red Flags`; `Verification` | `## Common Rationalizations` | upstream advisory source | ACCEPT |
| Upstream validator owns section exemptions in script allowlist | `.private_reference/external_repos/agent-skills/scripts/validate-skills.js` | `REQUIRED_SECTIONS`; `SECTION_EXEMPT_SKILLS`; `validateSkill` | `SECTION_EXEMPT_SKILLS` | upstream advisory source | ACCEPT |
| Upstream persona guidance separates skill, persona, and command and says personas do not call other personas | `.private_reference/external_repos/agent-skills/docs/agents.md` | `How personas relate to skills and commands`; `Rules for personas` | `Persona`; `Command` | upstream advisory source | ACCEPT |
| Local pack remains advisory-only and excludes runtime/provider claims | `.private_reference/legacy/CVF_Agent_Skills_Governance_Absorption_Pack/docs/absorptions/agent-skills-governance/00_SCOPE_AND_CLAIM_BOUNDARY.md` | `Out of scope`; `Prohibited claims` | `ABSORPTION_SPEC_ONLY` | local advisory pack | ACCEPT |

## Advisory Anatomy

When a future ASSF candidate draws from an external skill pattern, reviewers
should verify these seven fields before accepting the pattern as a CVF-owned
candidate:

| Anatomy check | ASSF owner field or section | Review question | Failure disposition |
|---|---|---|---|
| Trigger specificity | `triggerPatterns`; `useWhen`; `doNotUseWhen` | Does the candidate say when to use and when not to use the capability? | return to source verification |
| Invocation boundary | roles, phases, surfaces, risk ceiling | Does selection stay within CVF role and phase authority? | block until owner surface is cited |
| Procedure body | `inputs`; `outputs`; `executionConstraints` | Is it a workflow with steps and exits, not generic advice? | return to advisory rewrite |
| Anti-rationalization signals | `safeStop`; `riskProfile`; review notes | Does it name shortcuts that must stop or escalate? | require reviewer note |
| Red flags | `failureDisposition`; `capabilityBoundary` | Does it say how misuse is detected? | block if R1+ and no red flags |
| Verification | `acceptanceEvidence`; `evidenceRequirements` | What evidence proves the candidate was used correctly? | no trusted closure without evidence |
| External disposition | `externalCliMcpDisposition`; `adapterContract`; `externalMutationBoundary` | Is external-agent behavior prohibited, deferred, contract-only, or implemented with evidence? | defer external row until source-backed |

## Anti-Rationalization Advisory Signals

These are advisory review signals, not a new machine-enforced guard:

| Signal | CVF risk | Required response |
|---|---|---|
| "small change, no need for spec" | source facts may be skipped | require source verification or narrow the claim |
| "obvious fix, no need to test" | evidence gap | require verification evidence or mark no trusted closure |
| "I know this framework" | stale or provider-memory-only knowledge | cite current source or mark blocked |
| "just import the skill" | external authority bypass | reject direct import; map to ASSF owner surface |
| "persona can orchestrate this" | role-boundary drift | route through role matrix and handoff contract |
| "metadata match means activation" | ASSF boundary breach | stop; metadata resolution is not activation |

## Validator-Owned Exemption Principle

If a future ASSF checker validates package anatomy, exemptions must be owned by
the checker or a CVF-governed registry, not by the candidate package itself.

Advisory rule:

- package content may request an exception;
- the exception authority must live in a governed checker, registry, review
  artifact, or work order;
- self-declared package exemptions are advisory only and must not bypass gates.

This principle is selected for AGSG-T3 value decision, not implemented here.

## Persona, Command, And Skill Boundary

CVF maps external terms as follows:

| External term | CVF mapping | Boundary |
|---|---|---|
| Skill | ASSF package candidate or advisory pattern | cannot activate itself |
| Persona | role lens under CVF role matrix | cannot spawn or orchestrate another persona |
| Command | entry surface or phase shortcut | cannot bypass work order, source verification, or autorun gates |
| Hook | runtime/platform behavior | parked unless separately authorized |

## External Knowledge Intake Routing

| Field | Value |
|---|---|
| Chain map | `docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md` |
| Input type | external repo or copied folder |
| Chain map route | `External/corpus/repo input -> input router -> old authority/blind-spot/corpus guards -> external-agent packet/checklist when applicable -> returned-output absorption table when applicable -> promote/adapt/defer/reject/block -> GC-018/work order/source verification/autorun when implementation or governed action is needed` |
| Matching local-view guard | `governance/compat/check_external_knowledge_intake_routing.py`; `governance/compat/check_external_agent_absorption_table.py` |
| Owner surface | ASSF reference family and this AGSG-T2 advisory reference |
| Disposition | ADAPT anatomy/rationalization patterns; DEFER checker/runtime/adapter lanes; REJECT direct import |
| Claim boundary | advisory reference only; external material is not CVF authority by itself |

## Dual Agent Surface Matrix

| Consumer class | Interface or owner surface | Authority and risk boundary | Evidence | Adapter boundary | Disposition |
|---|---|---|---|---|---|
| `INTERNAL_AGENT` | this advisory reference under ASSF reference family | internal agents may read this as guidance for future ASSF candidate review; it grants no execution, commit, resolver, package, or activation authority | source verification rows and AGSG-T1 baseline | N/A with reason: documentation-only internal reference | `CONTRACT_ONLY` |
| `EXTERNAL_AGENT_CLI_MCP` | future ASSF external projection | not implemented; no external agent may consume this as an adapter contract or mutate ASSF state | dual-agent standard and ASSF external disposition fields | separate adapter work order required | `DEFERRED_WITH_REASON` |

## Finding-To-Governance Learning

| Finding | Governance learning | Disposition |
|---|---|---|
| External skills are useful when framed as workflow plus evidence | Preserve anatomy checks as review guidance | ADAPTED |
| Rationalization tables are useful but not source proof | Treat them as review signals, not machine verdicts | ADAPTED |
| Validator-owned exemptions reduce bypass risk | Park for checker value decision, not immediate implementation | DEFERRED |
| Persona/command separation prevents authority drift | Reuse role matrix and handoff controls | ADAPTED |

## Delta Execution Claim Boundary Control Block

| Field | Disposition |
|---|---|
| claimScope | AGSG-T2 ASSF advisory reference |
| claimDisposition | BOUNDED_CLAIM_WITH_EVIDENCE - documentation/reference only |
| receiptEvidence | N/A with reason: no runtime receipt, provider call, adapter run, checker implementation, or package activation |
| actionEvidence | ACTION_EVIDENCE_PRESENT - source verification table and advisory mapping tables |
| invocationBoundary | manual reference read by future governed authors/reviewers |
| interceptionBoundary | no IDE/shell/git/filesystem/provider interception claim |
| claimLanguage | advisory anatomy and rationalization review guidance |
| forbiddenExpansion | no runtime activation, plugin import, command import, persona orchestration, hook install, checker implementation, resolver mutation, package instance, CLI/MCP adapter, provider/live proof, public-sync, benchmark, security certification, or production-readiness |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: this reference cites private provenance paths and local advisory pack
material. Public-safe publication requires separate redaction and public-sync
authorization.

## Claim Boundary

This advisory is a documentation-only ASSF companion. It does not replace ASSF
contracts, implement a checker, activate skills, create package instances,
mutate the resolver or generated index, expose CLI/MCP behavior, prove live
provider behavior, certify security, or claim production readiness.
