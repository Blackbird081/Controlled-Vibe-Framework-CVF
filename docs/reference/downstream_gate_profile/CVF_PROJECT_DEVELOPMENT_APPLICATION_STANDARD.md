# CVF Project Development Application Standard

Memory class: FULL_RECORD
Status: ACTIVE_STANDARD
docType: reference
Date: 2026-11-01

EPISTEMIC_PROCESS_NA_WITH_REASON: normative application and discovery contract;
source delivery and verification evidence belong to the development application learning.

## Purpose

Translate inherited CVF rules into the decisions made while building a particular
tool. Inheritance supplies the common baseline; project requirements determine
how the team applies it. This extends existing lifecycle and milestone owners,
without adding a phase, approval ceremony or parallel task registry.

## Scope / Owner

Applies to new projects and authorized development of existing projects. The
maintainer/orchestrator owns the mapping; the implementation actor uses it and
the code reviewer evaluates its relevance and evidence. Product runtime roles
are not automatically development reviewers. The operator owns business choices.

Authority remains with the existing lifecycle/design-control standard and
product milestone coverage contract. A local application may strengthen or
specialize inherited rules; it cannot silently weaken them or reopen held work.

## Project Development Application

Common baseline, project-specific controls, task evidence: keep these three
layers connected in the existing design, roadmap, adoption record or task brief.
Use a short paragraph for a small task; use a table when several risks differ.
Do not create a new file per feature or copy the full CVF rulebook into a project.

| Layer | Required content | Accountable role |
|---|---|---|
| Common baseline | Applicable CVF authority/version, scope and risk, native reuse, evidence-based review, internal acceptance, continuation and learning duties | Maintainer |
| Project-specific controls | Requirement/milestone source, concrete failure to prevent, affected development action, expected result and proportionate test/review | Maintainer with domain input where needed |
| Task evidence | Selected criteria, scope/owner, relevant controls, actual result and version, unresolved remainder and next justified action | Implementer and code reviewer |

For each material project-specific row identify: source criterion; common rule;
concrete development control; trigger and owner; verification/evidence; current
status or unknown. A path to AGENTS alone is not an application. A row headed
"tests pass" without a user outcome is insufficient product acceptance.
Record exceptions with reason, owner and dependent action held; do not invent
domain rules, business consent or results absent from the project sources.

## Proactive New-Project Protocol

1. On first authorized work in an unfamiliar/new project, read its instructions,
   requirements and current roadmap/design/continuity progressively. Locate its
   existing application record before writing another. Folder discovery alone
   is not permission to alter an unrelated or parked project.
2. Resolve the project-pinned Core baseline. If a workspace rule pack is active,
   read `CVF_RULE_PACKS/ACTIVE_RULE_PACK.json`, then its named manifest and the
   `project-development-application-standard` artifact. Record this supplemental
   source/version separately; do not silently replace the project's Core pin.
   If absent, use this standard in the pinned Core when available. If neither
   source exists, report the missing application guidance and use available
   authorized baseline rules; do not claim that the new standard was inherited.
3. During INTAKE/DESIGN, derive common and project-specific controls from the
   clarified requirements and known milestone risks. Prepare the mapping
   proactively before dependent BUILD. A full roadmap is not a prerequisite to
   intake or independent work. Ask only for material unresolved business choices;
   resolve ordinary technical details and required QA within existing authority.
4. Before execution, reference only the rows relevant to the selected task.
   Reconcile milestone contribution, native capabilities already available,
   scope, acceptance and remaining work. Missing necessary acceptance holds the
   dependent action, not all work. Existing SPEC/WORK_ORDER requirements still apply.
5. At review, compare evidence with those rows and usable output. Preserve valid
   prior evidence, report meaningful gaps, and distinguish task completion from
   milestone/product completion. Refresh the mapping when requirements, risk,
   architecture, provider support assumptions or milestone scope change.

For an existing project, apply at its next authorized development boundary.
Preserve its vocabulary, approvals and historical evidence. Do not upgrade its
kit, rewrite locked acceptance or activate runtime controls just to adopt this rule.

## Native Capability And Product Boundary

Evaluate provider/host native capabilities and skills before proposing custom
adapters. Record only the missing development support that needs CVF work.
Developing a tool and governing its later use are distinct: absence of embedded
CVF code, hooks or a runtime engine does not establish weak development control.
Domain acceptance can still require package, integration or realistic workflow
checks; ordinary source unit tests do not substitute for those checks.

## Enforcement / Verification

The existing instruction-carrier checker protects the Core and downstream
template routing literals at the existing autorun entrypoint. Rule-pack sync
delivers the source and a create-if-missing workspace AGENTS entrypoint. Existing
custom entrypoints require deliberate merge; sync must not overwrite them.
The maintainer verifies the mapping and relevant evidence during normal review.

## Claim Boundary

Carrier checks and file hashes prove routing/delivery, not agent comprehension,
automatic host loading, universal enforcement or product readiness. Folder
arrival installs no watcher/daemon. Tests asserting CVF governs AI behavior
require the existing real provider proof; static checks must be labeled static.

## Related Artifacts

- `docs/reference/CVF_GOVERNED_WORK_LIFECYCLE_AND_DESIGN_CONTROL_STANDARD_2026-06-11.md`
- `docs/reference/CVF_PRODUCT_MILESTONE_COVERAGE_CONTRACT_2026-10-23.md`
- `docs/reference/downstream_gate_profile/CVF_PROJECT_LEARNING_LOOP_STANDARD.md`
- `docs/reference/CVF_WORKSPACE_RULES.md`
