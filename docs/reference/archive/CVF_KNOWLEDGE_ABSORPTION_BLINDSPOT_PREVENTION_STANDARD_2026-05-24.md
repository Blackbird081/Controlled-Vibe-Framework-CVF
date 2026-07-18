# CVF Knowledge Absorption Blind-Spot Prevention Standard

Memory class: FULL_RECORD

Status: BINDING_STANDARD

docType: reference

Date: 2026-05-24

---

## Purpose

Prevent future AI/agent work from repeating the same failure mode: relevant
legacy or external knowledge exists, but the active tranche scopes from current
reviews only, forgets prior source-file detail, and closes without reconciling
what the repository already knows.

This standard is mandatory for any future work that absorbs, reopens, scopes,
or implements knowledge from `.private_reference/legacy/`, archived absorption
packets, external capability sources, Review-CVF pain points, memory, graph,
workflow, CLI/MCP/tool, provider, benchmark, context, or non-coder outcome
surfaces.

## Scope / Target / Owner Boundary

Target: knowledge absorption and legacy-informed implementation scoping.

Owner: CVF agent/session governance and future tranche authors.

This standard changes process obligations only. It does not authorize source
code changes, runtime behavior, provider behavior, receipt-envelope changes,
public-sync updates, memory reinjection, hosted persistence, external tool
execution, or public capability claims.

## Binding Rule

No knowledge-absorption or legacy-adjacent implementation tranche may be scoped
from active summaries alone.

Before implementation, the agent must produce a reviewable blind-spot control
record that proves all seven gates below were executed:

1. source inventory;
2. prior absorption resolution;
3. file-level value extraction;
4. owner-surface normalization;
5. accept/defer/reject disposition;
6. adversarial role review;
7. thin proof and closure delta.

If any gate is missing, the tranche is not ready for implementation unless the
operator explicitly grants a one-off exception and the exception is recorded in
the GC-018 packet.

## Required Gate 1 - Source Inventory

The agent must list the actual folders and files considered, not just cite a
parent folder.

Minimum evidence:

- root paths scanned;
- file count by root or source family;
- representative file list for each source family used;
- explicit statement of any source family skipped and why.

This gate prevents the false confidence pattern where "we audited the folder"
really means "we read a summary and missed detailed files."

## Required Gate 2 - Prior Absorption Resolution

The agent must resolve existing absorption evidence before claiming a source is
new, unabsorbed, already closed, or irrelevant.

Minimum evidence:

- `docs/reference/archive/CVF_LEGACY_SPEC_ABSORPTION_REGISTRY_2026-05-23.md`;
- prior review/baseline/roadmap packets relevant to the source;
- archived absorption packets when the active registry points there;
- corrected status using one of:
  `UNREAD`, `READ_NOT_DISPOSITIONED`, `PARTIALLY_ABSORBED`,
  `BOUNDARY_ABSORBED_ENGINE_MISSING`, `ABSORBED_RUNTIME_PROVEN`,
  `REJECTED`, `DEFERRED_DEMAND_GATED`.

This gate preserves the correction from the 2026-05-23 blindspot review: the
defect was often not "nobody ever read it"; it was "the active chain forgot
what was previously read."

## Required Gate 3 - File-Level Value Extraction

The agent must extract value at the file or source-family level before ranking
work. It is not enough to summarize a folder.

Minimum evidence for each relevant source family:

- accepted concept;
- user or operator pain point it addresses;
- runtime/proof surface it could affect;
- risk class if promoted;
- source path evidence.

Use detailed agent-written files when present. For WC-series work, the required
high-signal sources include:

- `.private_reference/legacy/CVF ADD/REVIEW FOLDER/CVF_ADD_KNOWLEDGE_ABSORPTION_EXECUTIVE_ASSESSMENT_2026-05-06.md`
- `.private_reference/legacy/CVF ADD/REVIEW FOLDER/CVF_ADD_OWNER_SURFACE_PROMOTION_MAP_2026-05-06.md`
- `.private_reference/legacy/CVF ADD/REVIEW FOLDER/CVF_ADD_FINAL_ACCEPTED_VALUE_AND_REJECTION_MAP_2026-05-07.md`
- `.private_reference/legacy/CVF ADD/REVIEW FOLDER/CVF_ADD_SOURCE_FILE_REUSE_AND_NORMALIZATION_APPENDIX_2026-05-07.md`
- `.private_reference/legacy/CVF Edit/CVF_EDIT_ANALYSIS.md`
- `.private_reference/legacy/CVF Edit/CVF AUDIT LOG_md`
- `.private_reference/legacy/CVF Edit/Failure Simulation cho CVF.md`
- `.private_reference/legacy/CVF Edit/Review CVF_1.md`
- `.private_reference/legacy/CVF Edit/Review CVF_4.md`

## Required Gate 4 - Owner-Surface Normalization

No external or legacy source may define CVF authority by itself. Every accepted
concept must map into an existing CVF owner surface or explicitly justify why a
narrow new surface is unavoidable.

Accepted owner-surface examples:

- Governance Layer / Policy Engine / Guard Engine;
- Knowledge Layer;
- Context Builder and Packager;
- Learning Plane;
- Execution Plane / Command Runtime / Sandbox Runtime;
- Model Gateway / Provider Router;
- W7 evidence, trace, decision, eval, artifact, and memory records;
- existing `cvf-web` non-coder surfaces.

Default posture: enhance an existing owner surface first.

## Required Gate 5 - Accept / Defer / Reject Disposition

Every relevant source family must receive a disposition:

| Disposition | Meaning |
| --- | --- |
| `ACCEPT_NOW` | May enter this tranche's bounded scope. |
| `ACCEPT_AS_DOCTRINE` | Useful as language or standard only; no runtime claim. |
| `ACCEPT_AS_OWNER_MAP` | Useful only after mapping to existing owner surfaces. |
| `DEFER_DEMAND_GATED` | Valuable but needs a later operator demand and fresh GC-018. |
| `REJECT_DIRECT` | Do not adopt directly; keep as contrast or source evidence. |
| `OUT_OF_SCOPE` | Not relevant to the current pain point. |

The disposition must include a reason. A missing reason is a blind-spot defect.

### LHW Scope-Rejection Semantics

For Legacy Harvest Workflow (LHW) connector waves, `REJECT_DIRECT`,
`OUT_OF_SCOPE`, or free-text `rejected` labels must not imply that a source
family has no future value unless the evidence proves that.

If a family is excluded only because the current LHW wave is documentation-only,
the label must say:

`rejected from this LHW wave (doc-only scope) - requires live route; eligible for separate live-proof roadmap post-LHW.`

This distinction is mandatory for families such as `abtop` and `gridex`, where
operator keys or API access may make live testing possible, but the current
connector wave is the wrong work type. Do not blame a worker for failing to
run live proof when the work order itself scoped a doc-only wave.

LHW sequence rule: finish LHW connector waves for remaining
`PARTIALLY_ABSORBED` LH1 families first. Only after the Orchestrator confirms no
additional connector value remains should CVF open a separate live-proof
roadmap for `abtop`, `gridex`, or other families that require route execution.

## Required Gate 6 - Adversarial Role Review

Before implementation, the agent must run at least three explicit role lenses:

| Role | Required question |
| --- | --- |
| Implementer | What is the smallest bounded proof that uses existing surfaces? |
| Skeptic / Auditor | What source did we skip, what boundary could we overclaim, and what prior closure could contradict us? |
| Product / Operator Advocate | What user pain is reduced, and what would still confuse an end user after this tranche? |

For high-risk surfaces such as external tools, MCP, CLI execution, database
actions, provider routing, memory reinjection, or public claims, add a fourth
role:

| Role | Required question |
| --- | --- |
| Safety / Boundary Owner | What authority must remain unavailable even if the source suggests it? |

## Required Gate 7 - Thin Proof And Closure Delta

Implementation must target a thin proof, not broad absorption.

Every closure must state:

- blind spots closed;
- blind spots still open;
- sources accepted;
- sources deferred or rejected;
- proof evidence produced;
- whether live governance proof was required and, if so, the live receipt;
- why the next candidate remains or no longer remains highest value.

If the tranche is documentation-only, closure must state that no runtime or
public capability was proven.

## Mandatory Blind-Spot Control Block

Every future GC-018 or work order touching this standard's scope must include:

```text
Knowledge Absorption Blind-Spot Control Block
- Standard read: docs/reference/CVF_KNOWLEDGE_ABSORPTION_BLINDSPOT_PREVENTION_STANDARD_2026-05-24.md
- Source inventory:
  - <root/family + file count>
- Prior absorption evidence resolved:
  - <registry/review/baseline/roadmap paths>
- Detailed source files used:
  - <file path>
- Source families skipped:
  - <family + reason>
- File-level accepted value:
  - <source path -> value>
- Owner-surface normalization:
  - <value -> existing CVF owner>
- Accept/defer/reject matrix:
  - <source/value -> disposition + reason>
- Adversarial roles completed:
  - Implementer: <finding>
  - Skeptic/Auditor: <finding>
  - Product/Operator Advocate: <finding>
  - Safety/Boundary Owner: <finding or N/A>
- Thin proof target:
  - <bounded proof>
- Blind-spot verdict: CLEAR | PARTIAL | BLOCKED
```

`CLEAR` means the tranche can proceed if all other governance gates pass.
`PARTIAL` means implementation may proceed only if the open blind spot is
explicitly out of scope and low risk. `BLOCKED` means do not implement.

## Do-Not-Bypass List

This standard may not be bypassed by saying:

- "the folder was already audited";
- "the summary file is enough";
- "the source is archived";
- "the concept is obvious";
- "this is only a small implementation";
- "another agent already reviewed it";
- "we will fix missed details later."

Any of these claims must be converted into evidence using the control block.

## Relationship To Existing Standards

Use this standard together with:

- `docs/reference/CVF_KNOWLEDGE_ABSORPTION_AND_EXTENSION_PRIORITY_STANDARD_2026-04-13.md`
- `docs/reference/archive/CVF_LEGACY_SPEC_ABSORPTION_REGISTRY_2026-05-23.md`
- `docs/reference/CVF_GC018_CONTINUATION_CANDIDATE_TEMPLATE.md`
- `docs/reference/CVF_LIVE_RUN_DIAGNOSTIC_STANDARD_2026-05-24.md`
- `docs/reference/CVF_GOVERNED_CAPABILITY_INTAKE_DOCTRINE_2026-05-07.md`
- `docs/reference/CVF_BOUNDARY_FIRST_GOVERNANCE_DOCTRINE_2026-05-07.md`
- `docs/reference/CVF_AGENT_CONTINUITY_AND_DELEGATION_DOCTRINE_2026-05-07.md`
- `docs/reference/CVF_SCOPED_KNOWLEDGE_PROVIDER_BOUNDARY_DOCTRINE_2026-05-07.md`

Priority standard controls sequencing. This standard controls blind-spot
prevention and evidence shape.

## Claim Boundary

This is a process standard. It does not claim that all legacy knowledge is now
absorbed, implemented, runtime-proven, public-ready, or production-ready. It
requires future agents to prove that scoped knowledge was considered,
normalized, dispositioned, reviewed adversarially, and closed with a bounded
blind-spot delta.
