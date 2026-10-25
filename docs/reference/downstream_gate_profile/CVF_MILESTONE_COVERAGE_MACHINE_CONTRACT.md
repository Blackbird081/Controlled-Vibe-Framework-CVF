# CVF Milestone Coverage Machine Contract

Memory class: POINTER_RECORD
Status: ACTIVE_STANDARD
docType: reference
Date: 2026-10-23

## Purpose

Implement the declared milestone reconciliation in the existing lifecycle owner
`docs/reference/CVF_PRODUCT_MILESTONE_COVERAGE_CONTRACT_2026-10-23.md` using one
stdlib validator shared by Core dispatch quality and downstream profile1.2.
The work-order acceptance ledger remains the selected-deliverable reducer.

## Scope / Owner Boundary

Forward admission: changed roadmaps and executable work orders, explicit coverage
blocks on reviews/direct Local artifacts, and active enrolled packets on invocation.
Archives and unchanged unenrolled history are not migrated. Core and portable
callers declare this scope; arbitrary shell/IDE actions remain outside these gates.
Roadmap drafts may PLAN with explicit unknowns. Execution requires DISPATCH;
terminal claims use REVIEW. Read-only HTML evidence does not resume that product.

## Contract / Requirements

Exactly one unfenced-start code block tagged `cvf-milestone-coverage-json` holds a
JSON object. Duplicate keys, extra fields, invalid enums/types, unsafe paths,
missing files, multiple blocks or malformed fences fail closed. Inputs are bounded
to 1MiB per file, 500 criteria and 100 evidence refs per list. These are parser
limits, not work budgets. All path references stay under the receiving repository.

Schema `cvf.milestoneCoverage@1.0.0` has exactly: schemaVersion, authority,
milestone, phase, action, rows, supportingWork, conclusions.

The governed project source `docs/milestone-coverage-authority.json` binds each
milestone ID to its approved criterion section. It has exactly `schemaVersion`
(`cvf.milestoneAuthority@1.0.0`) and `milestones`, a map from milestone ID to
exact `{path, heading}`. Local owns admission of those pointers against the
operator-approved scope. The validator requires the selected entry to equal the
block authority path/heading; another table or milestone ID cannot substitute.
Registry declarations are reviewed authority, not authenticated operator consent.

Fresh install deliberately does not copy Core's product registry into a project.
Before first implementation dispatch, Local creates the project registry from
the approved roadmap. If that source is missing/unclear, only the null-authority
finite VERIFY form below is admitted. Explicit profile upgrade preserves project
content; its owner enrolls current roadmap/order packets and their registry before
using them. Historical packets are not silently populated or re-approved.

| Object | Required fields and semantics |
|---|---|
| authority | path, heading, sha256; heading is the exact Markdown heading line; hash is SHA256 of UTF-8 section text after CRLF-to-LF conversion, from heading through before next heading of equal/lower depth; retain trailing newlines; no NFC/trim transformation |
| milestone | id, consumer, outcome, checkpoint; checkpoint has trigger, owner, decision (concrete text) |
| phase | PLAN, DISPATCH or REVIEW |
| action | kind (PLAN/IMPLEMENT/VERIFY/REVIEW), selected (criterion IDs), owner, output, budgetMinutes (positive integer), stop, next; VERIFY additionally needs question and sourceBoundary |
| row | id, state (NOT_STARTED/IMPLEMENTED_UNPROVED/VERIFIED/BLOCKED/UNKNOWN), gap, owner, destination, evidence; optional independence has reviewer, reason, evidence |
| evidence ref | path, sha256; SHA256 of file bytes after CRLF-to-LF conversion, identical to portable bundle text normalization |
| supporting work | criterionIds, reason, budgetMinutes, stop, returnToProduct; every referenced criterion exists |
| conclusions | tranche (PENDING/COMPLETE/BLOCKED), trancheSummary, trancheEvidence, product (PENDING/COMPLETE/BLOCKED), productSummary, acceptance, owner |

The authority section contains exactly one Markdown table. Its first body column
starts with one ID matching `[A-Z][A-Z0-9_-]*[0-9][A-Z0-9_-]*`, followed by whitespace
or end of cell. Header and separator rows are excluded. Every body row must carry
an ID; duplicates, ambiguity or an empty set refuse. A suffix is either prose
without a second bare criterion ID, or `/` followed by comma-separated alias IDs.
H01 / A01 and F1 description
are supported. Authority cannot be the coverage block itself: criterion extraction
uses only Markdown outside fences. The authority hash binds the whole section,
including acceptance descriptions, not an agent-selected list of IDs.

Rows must equal that extracted set exactly, with no omissions, extras or duplicates.
All approved criteria are mandatory. Each unresolved row has a concrete gap, owner
and destination. VERIFIED requires a valid file evidence ref; evidence identity
does not establish semantic truth. Selected IDs form a nonempty unique subset for
IMPLEMENT/VERIFY; planning and review may have an empty selection.

DISPATCH requires IMPLEMENT or VERIFY. PLAN cannot carry terminal completion.
Any selected UNKNOWN blocks IMPLEMENT. Unselected UNKNOWN requires a Local
independence declaration with pinned evidence before IMPLEMENT can proceed.
VERIFY is admitted with finite question/source/output/owner/budget/stop/next;
it cannot claim either terminal COMPLETE while coverage remains unknown.

For initial finite discovery only, authority may be null and rows/selected empty
when kind is VERIFY with its full finite contract. No COMPLETE claim is then valid.
This is bounded unknown coverage, never empty implementation admission.

REVIEW requires kind REVIEW. A tranche COMPLETE needs trancheEvidence, while the
existing acceptance ledger owns its fulfillment semantics. Product COMPLETE needs
all criterion rows VERIFIED and acceptance evidence. Non-REVIEW conclusions remain
PENDING. Owner/role declarations and file hashes are not authenticated acceptance.
Workers report affected rows; Local owns the aggregate product conclusion.
Enrolled roadmap/review status prefixes CLOSED, COMPLETE, ACCEPTED, BLOCKED and
REJECTED require REVIEW and both conclusions non-PENDING. A worker return without
an aggregate block is outside this control; if it declares the block at a terminal
status, it must distinguish its tranche position and unresolved product position.
This does not replace the role/status owner or authorize worker product acceptance.

## Phase And Integration Design

Core: existing check_work_order_dispatch_quality.py calls the shared validator on
changed roadmap/work-order artifacts and any changed declared coverage block;
an enrolled currentAuthority work order is rechecked on invocation. The current
source/return release contracts still bind execution. An unenrolled active legacy
packet is not upgraded by merely running a historical range check.

Portable: mandatory CVF-DG-COV-01 in profile1.2, all six existing phases. Bootstrap
without roadmap/order candidates reports N/A with reason, not coverage PASS.
Changed/explicit roadmap, work-order and declared review packets plus active
work orders from implementation status are considered. Every invocation reads
the bound authority/evidence files for those candidates again, even when the
bound files were not changed. Active order paths into archive refuse. Unchanged
non-active roadmaps/reviews are not reverse-indexed; use an explicit packet when
reassessing them. This gate does not claim repository-wide continuous validity.

Profile1.2 increments profileId, profileVersion, schema constant, Core bundle and
carrier projection together. Existing installations refuse trusted drift until
explicit install --upgrade. Project-owned roadmap, learning and continuity content
is preserved. A previously generated untouched CI workflow can receive new pins
on explicit upgrade; an edited workflow is preserved and reported for owner
reconciliation, never silently overwritten. CI execution is a separate claim.
The partial-upgrade status UPGRADED_CI_RECONCILIATION_REQUIRED is non-success:
new bundle/lock may already be written, edited workflow bytes remain intact, and
installation verification refuses until its owner reconciles the three new pins.

## Verification / Acceptance

F3: use the existing HTML H01-H14 section and foundation F1-F5 section as read-only
authority inputs. Positive current reconciliation and negative omitted/duplicate
ID, stale hash, missing owner, malformed JSON, unsafe path, unbounded verification,
UNKNOWN implementation and premature product completion must be observed.
No historical HTML PASS upgrades; source-derived fixtures are documentary checks.

F4: disposable fresh install, inherited runner invocation, tamper/missing coverage
refusal, genuine pinned profile1.1-to1.2 explicit upgrade, retained project content,
CI pin transition/preservation and repeat-install behavior. Run existing profile
regression tests; real child projects and public rollout remain unmodified.

## Public Projection Boundary

Public normative projection authorized on 2026-10-25. Private project evidence and session state are excluded. This copy states requirements and mechanical limits; it does not prove agent compliance, installed-workspace adoption or product acceptance.

## Claim Boundary

EPISTEMIC_PROCESS_NA_WITH_REASON: normative machine design; actual proof is recorded
in the Local review. Mechanical source-set/hash/shape joins only. Semantic coverage,
human acceptance, hosted CI and agent/provider behavior need separate evidence.
