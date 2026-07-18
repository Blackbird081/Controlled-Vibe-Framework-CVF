# CVF GC-018 Continuation Candidate Template

Memory class: POINTER_RECORD

Status: reusable template for any future attempt to reopen a materially delivered roadmap under `GC-018`.

## Purpose

- provide one standard continuation packet for post-closure roadmap reopening
- make `GC-018` scoring comparable across waves
- reduce ambiguity about when a new batch is authorized versus merely proposed

## Scope / Applies-To

Applies to future continuation candidates that propose reopening a materially
delivered roadmap or wave under GC-018. It is a reusable authoring template,
not an authorization record by itself.

## Scope / Target / Owner Boundary

Target: GC-018 continuation candidate packets. Owner: CVF governance
documentation surface. This template must be copied into a concrete
candidate/review artifact before it can govern implementation.

## Claim Boundary

Using this template does not close, reopen, or authorize any roadmap. Closure,
reopening, and implementation authority require a filled candidate packet,
source verification where applicable, and the relevant autorun gates.

## When To Use

Use this template only when all of the following are true:

- the roadmap or wave is already marked `MATERIALLY DELIVERED`, `DEPTH-FROZEN`, or equivalent
- a proposer wants to reopen breadth expansion, semantic deepening, or proof-strengthening
- the proposer needs a reviewable `GC-018` decision before implementation begins

Do not use this template for:

- ordinary bug fixes on an already authorized active batch
- baseline-only reconciliation updates
- post-fix verification or closeout receipts

## Required Packet

Copy the following block into one reviewable artifact:

- roadmap update
- baseline delta
- reassessment addendum
- governance decision note

For absorption review packets (any packet produced by a multi-agent rebuttal chain governed by GC-046),
two additional blocks are required before a claim may be counted as convergence evidence:

```text
Evidence Trace Block (required per significant claim, per GC-046)
- Claim: <exact claim text>
- Command: <exact grep/find/read command used>
- Result: <count or representative output>
- Key path: <file:line for the key finding>
- Verdict: EXISTS | ABSENT | PARTIAL | DRIFT
- Counter-evidence (if any): <opposing agent's evidence>

Counter-Evidence Block (required when a REVIEWER challenges a PROPOSER claim)
- Claim challenged: <original claim text>
- Original evidence: <PROPOSER's command + result>
- Counter-evidence: <REVIEWER's command + result>
- Corrected verdict: <corrected claim text>
```

See `governance/toolkit/05_OPERATION/CVF_AGENT_REVIEW_ANTI_COLLUSION_GUARD.md` for the full protocol.

For any continuation candidate that touches Review-CVF pain points, memory,
graph knowledge, context building, operational intelligence, external
knowledge absorption, or legacy-source implementation, add this block before
scoping:

```text
Legacy Spec Scan Block (required for legacy-adjacent scope)
- Registry read: docs/reference/archive/CVF_LEGACY_SPEC_ABSORPTION_REGISTRY_2026-05-23.md
- Legacy folders scanned:
  - <path 1>
  - <path 2>
- Relevant source specs found:
  - <file or folder>
- Existing absorption evidence checked:
  - <review/baseline/roadmap path>
- Absorbed in this tranche:
  - <source file or concept>
- Explicitly deferred:
  - <source file or concept + reason>
- Out of scope:
  - <source file or concept + reason>
- Blindspot risk verdict: CLEAR | PARTIAL | BLOCKED
```

For any continuation candidate that absorbs, reopens, scopes, or implements
knowledge from `.private_reference/legacy/`, archived absorption packets,
external capability sources, Review-CVF pain points, memory, graph, workflow,
CLI/MCP/tool, provider, benchmark, context, or non-coder outcome surfaces, add
this block before implementation:

```text
Knowledge Absorption Blind-Spot Control Block
- Standard read: docs/reference/CVF_KNOWLEDGE_ABSORPTION_BLINDSPOT_PREVENTION_STANDARD_2026-06-01.md
- Source inventory:
  - <root/family + file count - from shell output, not self-reported>
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

For any task that reads an existing folder, subfolder tree, archive, file
list, or project source set to produce an inventory, report, comparison,
extraction, audit, migration, roadmap, work order, or knowledge-absorption
decision, add this block before claiming corpus completeness:

```text
## Corpus Completeness And Report Integrity

- Corpus task class: INVENTORY | REPORT | EXTRACTION | COMPARISON | AUDIT |
  MIGRATION | KNOWLEDGE_ABSORPTION | OTHER
- Corpus root: <path or explicit bounded list>
- Snapshot time: <timestamp>
- Enumeration command: <exact command>
- Manifest artifact or inline manifest: <path or inline table>
- Manifest hash: <hash or N/A with reason>
- Processing ledger artifact or inline ledger: <path or inline table>
- Allowed terminal statuses: READ | SKIPPED_WITH_REASON | DEFERRED |
  BLOCKED_UNREADABLE
- Reconciliation: manifest=<N>; ledger_terminal=<N>; exclusions=<N>;
  unresolved=<N>
- Unresolved files: <0 or explicit paths>
- Declared exclusions: <none or paths + reasons>
- Unreadable or unsupported files: <none or paths + reasons>
- Aggregation check: <PASS or bounded reason>
- Drift check: <PASS, STALE_SNAPSHOT, or N/A with reason>
- Output traceability: <source locator evidence>
- Adversarial verification: <sample/recompute evidence>
- Corpus verdict: COMPLETE_VERIFIED | COMPLETE_WITH_DECLARED_EXCLUSIONS |
  PARTIAL | BLOCKED | STALE_SNAPSHOT
```

For any corpus-derived knowledge map, semantic-region ledger, architecture
reconciliation, Memory synthesis, graphification plan, or retrieval-readiness
claim, add:

Machine check:
`governance/compat/check_corpus_to_knowledge_map_reconciliation.py`

For any GC-018 packet derived from an external review, legacy/intake scan,
corpus-finding replay, or rescan, add:

Machine check:
`governance/compat/check_rescan_intelligence_hardening.py`

```text
## Rescan Intelligence Hardening

- Original source artifact: <path or N/A with reason>
- Predecessor intake artifact: <path or N/A with reason>
- Delta ledger status: present | N/A with reason
- Routing matrix status: present | N/A with reason
- Semantic sampling status: present | N/A with reason
- Rescan intelligence verdict: COMPLETE_WITH_DELTA_ROUTING_SAMPLE |
  COMPLETE_WITH_DECLARED_LIMITS | PARTIAL | BLOCKED |
  NOT_APPLICABLE_WITH_REASON

### Original-Intake Delta Ledger

| Category | Item | Disposition | Reason |
| --- | --- | --- | --- |
| UNCHANGED_FROM_INTAKE | <item> | <disposition> | <reason> |
| CHANGED_DISPOSITION | <item> | <disposition> | <reason> |
| NEW_FINDING | <item> | <disposition> | <reason> |
| REMOVED_OR_REJECTED | <item> | <disposition> | <reason> |

### Follow-Up Routing Matrix

| Routing lane | Item | Routed action |
| --- | --- | --- |
| DO_NOW | <item> | <action> |
| SEPARATE_RUNTIME_TRANCHE | <item> | <action> |
| STRATEGIC_OPERATOR_DECISION | <item> | <action> |
| OUT_OF_SCOPE | <item> | <action> |
| RESOLVED_BY_DESIGN | <item> | <action> |

### Semantic Sampling / Adversarial Review

| sampleId | source section | source claim | disposition checked | adversarial challenge | verdict |
| --- | --- | --- | --- | --- | --- |
| <sample-id> | <section> | <claim> | <disposition> | <challenge> | <PASS/FAIL/N/A with reason> |
```

```text
## Knowledge System Reconciliation

- Knowledge task class: ARCHITECTURE_MAP | SEMANTIC_REGION_MAP | MEMORY_SYNTHESIS |
  GRAPHIFICATION | RETRIEVAL_READINESS | CORPUS_ABSORPTION | OTHER
- Source manifest: <path or inline manifest>
- Source manifest hash: <hash or N/A with reason>
- Enumeration safety: <filesystem-backed command or structured complete API evidence>
- Intake registry or ledger: <path or inline ledger>
- Authority assets: <source-backed assets or ledger evidence>
- Derived views: <graph, regions, Palace, summary, cache, snapshot, or N/A with reason>
- Semantic region ledger: <path or inline ledger>
- Region reconciliation: assets=<N>; mapped=<N>; deferred=<N>; unmapped=<N>
- Orphan or unmapped assets: <none or explicit paths>
- Cross-region links: <evidence or N/A with reason>
- Drift check: <PASS, STALE_MAP, or N/A with reason>
- Rebuildability check: <PASS or bounded reason>
- Retrieval boundary: <bounded capability and deeper-review lane>
- Adversarial verification: <recomputed totals and challenged risks>
- Knowledge-map verdict: RECONCILED_VERIFIED | RECONCILED_WITH_DECLARED_GAPS |
  PARTIAL | BLOCKED | STALE_MAP
```

```text
GC-018 Continuation Candidate
- Candidate ID: <stable id>
- Date: <YYYY-MM-DD>
- Parent roadmap / wave: <path>
- Proposed scope: <short description>
- Continuation class: VALIDATION_TEST | PACKAGING_ONLY | TRUTH_CLAIM | REALIZATION | STRUCTURAL | MIXED | OTHER
- Active quality assessment: <path>
- Assessment date: <YYYY-MM-DD>
- Weighted total: <0.0..10.0/10>
- Lowest dimension: <dimension name> (<0.0..10.0/10>)
- Quality-first decision: REMEDIATE_FIRST | EXPAND_NOW
- Why expansion is still the better move now: <required if EXPAND_NOW>
- Quality protection commitments: <required if EXPAND_NOW>
- Remediation target if not expanding: <required if REMEDIATE_FIRST>
- Why now: <short justification>
- Active-path impact: NONE | LIMITED | MATERIAL
- Risk if deferred: <short description>
- Lateral alternative considered: YES | NO
- Why not lateral shift: <short justification>
- Real decision boundary improved: YES | NO
- Expected enforcement class:
  - RUNTIME_GUARD | GATEWAY_PRECONDITION | APPROVAL_CHECKPOINT | CI_REPO_GATE | GOVERNANCE_DECISION_GATE
- Required evidence if approved:
  - <artifact or test 1>
  - <artifact or test 2>

Depth Audit
- Risk reduction: <0|1|2>
- Decision value: <0|1|2>
- Machine enforceability: <0|1|2>
- Operational efficiency: <0|1|2>
- Portfolio priority: <0|1|2>
- Total: <0..10>
- Decision: CONTINUE | REVIEW REQUIRED | DEFER
- Reason: <short justification>

Authorization Boundary
- Authorized now: YES | NO
- If YES, next batch name: <planned batch>
- If NO, reopen trigger: <fresh reassessment or new candidate condition>
```

## Guard-Clean Authoring Addendum

Before marking a GC-018, dispatch packet, session-sync review, or closure packet
ready, verify these authoring constraints:

- Corpus/intake/rescan-derived `docs/baselines/` artifacts include the
  `Corpus Completeness And Report Integrity` block with exact GC-047 fields
  and filesystem-backed enumeration evidence, even when a fresh corpus scan is
  out of scope.
- Corpus/intake/rescan-derived artifacts include `## Rescan Intelligence
  Hardening` with delta ledger, follow-up routing matrix, and semantic
  sampling/adversarial review.
- Changes to `CVF_SESSION/ACTIVE_SESSION_STATE.json`, `CVF_SESSION_MEMORY.md`,
  `AGENTS.md`, `CLAUDE.md`, or guard/control files are backed by a changed
  artifact containing `## Core Guard Self-Protection Authorization` and exact
  protected-path rows.
- New `docs/reviews/` authorization or sync reviews include these structural
  sections: `## Scope / Target / Owner Boundary`, `## Target / Source`,
  `## Scope / Methodology`, `## Findings / Position`, and
  `## Risk / Corrective Action`.
- Finding-bearing artifacts use canonical learning vocabulary from GC-049 for
  defect class, learning lane, escalation state, and next control action.
- Active session updates keep `nextAllowedMove` aligned with the latest closed
  LHW wave and record the current handoff HEAD after each commit that affects
  governed continuity.
- Autorun gates use real ranges. Do not use `--base HEAD --head HEAD` as
  dispatch, closure, or push evidence for changed governed artifacts.

## Tranche Closure Checklist (mandatory before filing closure packet)

Every tranche closure packet must include this checklist. Each item must
be explicitly ticked or marked N/A with a one-line reason.

```text
Tranche Closure Checklist
- [ ] Public catalog updated OR explicitly N/A: <reason>
      If new proven capability added → add row to catalog capability table
      If new/extended extension → add/update extension inventory row
      If row status upgraded → update status + evidence link
      Catalog path (public-sync): docs/reference/CVF_TECHNICAL_PRODUCT_CATALOG_2026-05-18.md
- [ ] All new catalog paths Test-Path verified in public-sync clone
- [ ] GC-020 handoff Current HEAD updated to this tranche's commit SHA
- [ ] Evidence Trace Block present for all significant claims (GC-046)
- [ ] Legacy Spec Scan Block present OR explicitly N/A: <reason>
- [ ] Knowledge Absorption Blind-Spot Control Block present OR explicitly N/A:
      <reason>
- [ ] Corpus Completeness And Report Integrity block present OR explicitly N/A:
      <reason>
- [ ] Rescan Intelligence Hardening block present OR explicitly N/A:
      <reason>
- [ ] Knowledge System Reconciliation block present OR explicitly N/A:
      <reason>
- [ ] Protected file changes, if any, have Core Guard Self-Protection Authorization
- [ ] New review/sync review artifacts include required structural review sections
- [ ] Finding-bearing artifacts include canonical Finding-To-Governance Learning Disposition
- [ ] Active session nextAllowedMove and latest closed LHW continuity remain aligned
- [ ] Pre-push autorun gate run on a committed non-empty range
```

Omitting the catalog item without an explicit N/A is a closure defect.
The pre-commit advisory (GC-024) will remind the agent at commit time,
but the checklist is the authoritative closure gate.

## Reading Rules

- every fresh `GC-018` packet must read and cite the active quality assessment before claiming expansion is the right next move
- if the current quality posture triggers the standard's remediation-first conditions, the packet should default to `Quality-first decision: REMEDIATE_FIRST`
- `Quality-first decision: EXPAND_NOW` requires a higher-value justification plus explicit quality protection commitments
- `Authorized now: YES` should only appear if the score satisfies the current `GC-018` threshold and no hard-stop override is triggered.
- any `0` in `Risk reduction`, `Decision value`, or `Machine enforceability` should force `Decision: DEFER`
- if the proposed step changes active-path implementation, the resulting packet must remain reviewable by the repository continuation gate
- low-yield continuation classes (`VALIDATION_TEST`, `PACKAGING_ONLY`, `TRUTH_CLAIM`) must record a lateral alternative and may continue only if they improve a real decision boundary in a reviewable way
- legacy-adjacent packets must not scope from active reviews alone; they must
  reconcile the active review with `docs/reference/archive/CVF_LEGACY_SPEC_ABSORPTION_REGISTRY_2026-05-23.md`
  and any relevant `.private_reference/legacy/` source folders before the
  candidate can be treated as complete
- knowledge-absorption packets must follow
  `docs/reference/CVF_KNOWLEDGE_ABSORPTION_BLINDSPOT_PREVENTION_STANDARD_2026-06-01.md`
  and must include the Knowledge Absorption Blind-Spot Control Block before any
  implementation begins
- bounded-corpus tasks must follow
  `docs/reference/CVF_CORPUS_COMPLETENESS_AND_REPORT_INTEGRITY_STANDARD_2026-06-01.md`
  and must reconcile manifest files against processing-ledger terminal statuses
  before claiming completeness

## Preferred Placement

For system-level continuation, prefer one of:

- `docs/roadmaps/...`
- `docs/baselines/...`
- `docs/reviews/...`

The same packet may be summarized in multiple places, but there should be one obvious canonical source.

## Related Controls

- `governance/toolkit/05_OPERATION/CVF_DEPTH_AUDIT_GUARD.md`
- `governance/toolkit/05_OPERATION/CVF_AGENT_REVIEW_ANTI_COLLUSION_GUARD.md` (GC-046: Evidence Trace Block requirement for absorption review chains)
- `docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md#GC-018`
- `docs/reference/archive/CVF_LEGACY_SPEC_ABSORPTION_REGISTRY_2026-05-23.md`
- `docs/reference/CVF_KNOWLEDGE_ABSORPTION_BLINDSPOT_PREVENTION_STANDARD_2026-06-01.md`
- `docs/reference/CVF_CORPUS_COMPLETENESS_AND_REPORT_INTEGRITY_STANDARD_2026-06-01.md`
- `governance/compat/check_corpus_completeness_report_integrity.py`
- `governance/compat/check_depth_audit_continuation_compat.py`
- `docs/roadmaps/CVF_SYSTEM_UNIFICATION_REMEDIATION_ROADMAP_2026-03-19.md`
