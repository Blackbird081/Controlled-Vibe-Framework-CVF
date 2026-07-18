# CVF Knowledge Absorption Blind-Spot Prevention Standard

Memory class: FULL_RECORD

Status: BINDING_STANDARD

docType: reference

Date: 2026-06-01

Supersedes: `docs/reference/archive/CVF_KNOWLEDGE_ABSORPTION_BLINDSPOT_PREVENTION_STANDARD_2026-05-24.md`

Fast Lane authorization: `docs/baselines/CVF_GC021_BLINDSPOT_STANDARD_UPGRADE_2026-06-01.md`

---

## Change Log (v2 — 2026-06-01)

Two machine-verifiable rules added based on the LHW20 regression:
audit record claimed "13 subfolders / 97 files / NONE skipped" but filesystem
contained 24 subfolders / 230 files. Skill and Context Optimization folders
were completely absent from Gate 3. Root cause: agent self-reported scope
instead of verifying from filesystem. Same failure mode as LHW17→LHW20.

- **Gate 1** — added `FILESYSTEM_LISTING_REQUIRED` sub-rule.
- **Gate 7** — added `COMPLETENESS_CROSS_CHECK` sub-rule.
- **Do-Not-Bypass List** — two new bypass patterns added.

All other content is unchanged from the 2026-05-24 version.

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

---

## Required Gate 1 — Source Inventory

The agent must list the actual folders and files considered, not just cite a
parent folder.

Minimum evidence:

- root paths scanned;
- file count by root or source family;
- representative file list for each source family used;
- explicit statement of any source family skipped and why.

This gate prevents the false confidence pattern where "we audited the folder"
really means "we read a summary and missed detailed files."

### Gate 1 Sub-rule: FILESYSTEM_LISTING_REQUIRED *(added 2026-06-01)*

**Before listing any subfolder count or claiming "all files read", the agent
MUST run a shell command that enumerates subfolders directly from the
filesystem and include the raw output in the Gate 1 evidence block.**

Required commands (use one matching the runtime environment):

```powershell
# PowerShell
Get-ChildItem "<root_path>" -Directory | Select-Object Name
Get-ChildItem "<root_path>" -Recurse -File | Measure-Object | Select-Object Count
```

```bash
# Bash / Linux
ls -d "<root_path>"/*/
find "<root_path>" -type f | wc -l
```

The Gate 1 evidence block must contain:
- the actual shell command run;
- the raw output (subfolder names listed, not paraphrased);
- the actual total file count from the command output.

Bare `rg --files` is not valid completeness evidence because ignored or hidden
files may disappear. If ripgrep is used for inventory, use
`rg --files --hidden --no-ignore`; otherwise use filesystem enumeration or a
structured complete API.

**Self-reported counts ("I read 13 subfolders / 97 files") without the
corresponding shell output are not valid Gate 1 evidence and render the
blind-spot verdict BLOCKED.**

This rule exists because LHW20 (2026-05-31) claimed "13 subfolders / 97 files /
NONE skipped" based on a self-reported count. The actual filesystem contained
24 subfolders / 230 files. The 11 missing subfolders — including all Skill and
Context Optimization folders — were never read.

---

## Required Gate 2 — Prior Absorption Resolution

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

---

## Required Gate 3 — File-Level Value Extraction

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

---

## Required Gate 4 — Owner-Surface Normalization

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

---

## Required Gate 5 — Accept / Defer / Reject Disposition

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

---

## Required Gate 6 — Adversarial Role Review

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

---

## Required Gate 7 — Thin Proof And Closure Delta

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

### Gate 7 Sub-rule: COMPLETENESS_CROSS_CHECK *(added 2026-06-01)*

**Before claiming a blind-spot verdict of `CLEAR`, the agent MUST cross-check
the subfolder set listed in Gate 1 against the subfolder set that actually
appears in Gate 3.**

Required check:

```
Gate 1 subfolder list (from shell output)
  MINUS
Gate 3 subfolder list (subfolders with at least one file extracted)
  =
UNREAD_SUBFOLDERS set
```

If `UNREAD_SUBFOLDERS` is non-empty:

- each missing subfolder must appear in Gate 5 with an explicit disposition
  (`DEFER_DEMAND_GATED`, `OUT_OF_SCOPE`, or `REJECT_DIRECT`) and a reason;
- if no disposition exists → verdict is `BLOCKED`, not `CLEAR`;
- if a disposition exists but was assigned without reading the files → verdict
  is `PARTIAL` with an explanation.

The cross-check table must appear in the Gate 7 evidence block:

```
| Subfolder | In Gate 3? | Disposition if absent | Reason |
| --- | --- | --- | --- |
| <name> | YES / NO | <disposition or N/A> | <reason or N/A> |
```

**Claiming `CLEAR` without this table when Gate 1 lists more than one
subfolder is a governance defect that invalidates the scan record.**

This rule exists because LHW20 Gate 7 claimed `CLEAR` without any cross-check.
The 11 unread subfolders (Skill Formation, Skill Creator, AI Constitutional
Layer, Multi-Agent, Context Engine partial, Claude how to, HowtoClaude,
Knowledge Base_Graphify, Knowledge Base_LLM-Powered, Knowledge Base_Palace,
ADK SkillToolset, Windows_Skill_Normalization) were never dispositioned.

---

## Mandatory Blind-Spot Control Block

Every future GC-018 or work order touching this standard's scope must include:

```text
Knowledge Absorption Blind-Spot Control Block
- Standard read: docs/reference/CVF_KNOWLEDGE_ABSORPTION_BLINDSPOT_PREVENTION_STANDARD_2026-06-01.md
- Source inventory:
  - <root/family + file count — from shell command output, not self-reported>
  - Shell command run: <command>
  - Shell output (subfolder list): <raw output>
  - Total file count (from shell): <N>
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
- Gate 7 completeness cross-check:
  | Subfolder | In Gate 3? | Disposition if absent | Reason |
  | ... | ... | ... | ... |
- Blind-spot verdict: CLEAR | PARTIAL | BLOCKED
```

`CLEAR` means the tranche can proceed if all other governance gates pass AND
the Gate 7 completeness cross-check table is present with no undispositioned
rows.

`PARTIAL` means implementation may proceed only if the open blind spot is
explicitly out of scope and low risk.

`BLOCKED` means do not implement.

---

## Do-Not-Bypass List

This standard may not be bypassed by saying:

- "the folder was already audited";
- "the summary file is enough";
- "the source is archived";
- "the concept is obvious";
- "this is only a small implementation";
- "another agent already reviewed it";
- "we will fix missed details later";
- *(added 2026-06-01)* "I read N files / M subfolders" without providing the
  shell command output that confirms N and M — self-reported counts are not
  evidence;
- *(added 2026-06-01)* "the verdict is CLEAR" without a Gate 7 completeness
  cross-check table reconciling every subfolder from Gate 1 against Gate 3.

Any of these claims must be converted into evidence using the control block.

---

## Relationship To Existing Standards

Use this standard together with:

- `docs/reference/CVF_CORPUS_COMPLETENESS_AND_REPORT_INTEGRITY_STANDARD_2026-06-01.md`
- `docs/reference/CVF_KNOWLEDGE_ABSORPTION_AND_EXTENSION_PRIORITY_STANDARD_2026-04-13.md`
- `docs/reference/archive/CVF_LEGACY_SPEC_ABSORPTION_REGISTRY_2026-05-23.md`
- `docs/reference/CVF_GC018_CONTINUATION_CANDIDATE_TEMPLATE.md`
- `docs/reference/CVF_LIVE_RUN_DIAGNOSTIC_STANDARD_2026-05-24.md`
- `docs/reference/CVF_GOVERNED_CAPABILITY_INTAKE_DOCTRINE_2026-05-07.md`
- `docs/reference/CVF_BOUNDARY_FIRST_GOVERNANCE_DOCTRINE_2026-05-07.md`
- `docs/reference/CVF_AGENT_CONTINUITY_AND_DELEGATION_DOCTRINE_2026-05-07.md`
- `docs/reference/CVF_SCOPED_KNOWLEDGE_PROVIDER_BOUNDARY_DOCTRINE_2026-05-07.md`

The corpus-completeness standard supplies the reusable manifest, processing
ledger, reconciliation, and report-integrity invariant for any bounded source
set. Priority standard controls sequencing. This standard adds the
knowledge-absorption-specific blind-spot controls and evidence shape.

---

## Claim Boundary

This is a process standard. It does not claim that all legacy knowledge is now
absorbed, implemented, runtime-proven, public-ready, or production-ready. It
requires future agents to prove that scoped knowledge was considered,
normalized, dispositioned, reviewed adversarially, and closed with a bounded
blind-spot delta.
