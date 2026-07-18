# CVF System Chain Map Freshness Standard

Memory class: POINTER_RECORD

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-07-10

## Purpose

Define the deterministic contract that keeps
`docs/reference/system_chain/README.md` and
`docs/reference/system_chain/CVF_SYSTEM_CHAIN_MAP.json`, plus the orthogonal
`docs/reference/system_chain/CVF_SYSTEM_CHAIN_LIVE_PROOF_COVERAGE.json`, from silently going
stale after reviewer-accepted MSEA-R90 Audit A. This standard governs
`governance/compat/check_system_chain_map_freshness.py`: what it must
detect, what it must never do, and how local, CI, and weekly automation
must invoke it.

## Scope / Applies To

Applies to the system-chain map JSON, its human README companion, and the
freshness checker/tests/wiring that enforce this standard. Does not apply
to runtime/product code, the R72F lifecycle decision, or any semantic
re-audit of CVF's governance chain - those remain the exclusive authority
of a fresh governed review.

## Freshness States

| State | Meaning | Trigger |
|---|---|---|
| `CURRENT` | Every fingerprinted source matches its recorded hash, README and JSON lane records agree, and review age is within `maxAgeDays`. | Default passing state. |
| `SOURCE_DRIFT` | A fingerprinted source file's SHA-256 no longer matches the recorded value. | The cited file changed since `lastVerifiedDate`. |
| `PATH_MISSING` | A fingerprinted source path no longer exists. | The cited file was moved, renamed, or deleted. |
| `MAP_DRIFT` | README lane IDs or verdict wording disagree with the JSON `lanes` array. | The Markdown and JSON companions were edited independently and now disagree. |
| `COVERAGE_DRIFT` | Live-proof coverage is missing, incomplete, uses invalid enums, disagrees with semantic posture/verdict, or leaves an unproven live-applicable lane without a use case. | The semantic map and operational-proof ledger changed independently. |
| `AGE_EXPIRED` | `asOfDate - lastVerifiedDate > maxAgeDays`. | No governed review has refreshed `lastVerifiedDate` within the review-age ceiling. |

## Machine JSON Contract

`docs/reference/system_chain/CVF_SYSTEM_CHAIN_MAP.json` must include:

- `schemaVersion` and a stable `mapId`;
- `sourceAudit` and `reviewerCompletion` paths naming the accepted MSEA-R90
  Audit A artifacts this map summarizes;
- required `auditManifestFingerprint`, `auditEvidenceFingerprint`, and
  `reviewerCompletionFingerprint` records anchoring the accepted Audit A
  Markdown, JSON evidence, and reviewer completion authority;
- exactly five ordered lane records, each with `laneId`, `planeRange`,
  `currentPosture`, `verdict`, `implementedBy`, `invokedBy`, `testedBy`,
  `evidenceOwner`, `operatorSurface`, `knownGaps`, and `nextReviewAction`;
- a `sourceFingerprints` array per lane with repo-relative `path`, `sha256`,
  and `evidenceRole` for every source that lane's finding depends on;
- `lastVerifiedDate` (`2026-07-10` at this standard's authoring) and
  `maxAgeDays` (`30`);
- this reminder policy: **semantic verdicts are never auto-rewritten**.
  Automation may detect drift and instruct a review; only a governed review
  may update `currentPosture`, `verdict`, or any lane's narrative fields.

## Checker Contract

`governance/compat/check_system_chain_map_freshness.py` must:

1. Parse the machine JSON with explicit UTF-8 encoding.
2. Validate required top-level and per-lane keys, enum values, five unique
   ordered `laneId` values, and SHA-256 hex format (64 hex characters) for
   every fingerprint entry.
3. Recompute every source SHA-256 directly from the current repository
   content and fail on any missing path or hash mismatch.
4. Compare the README's lane IDs and verdict tokens against the JSON's
   `lanes` array and fail on any disagreement.
5. Fail when `asOfDate - lastVerifiedDate > maxAgeDays`.
6. Validate exactly one live-proof coverage row per canonical lane, agreement
   with semantic posture and verdict, valid proof/applicability/status enums,
   retained SOT3 UC-01 evidence, and a known next use case for every unproven
   live-applicable lane.
7. Validate that the checker's own command is present exactly once in each
   of the four local catalogs
   (`governance/compat/agent_autorun_command_catalog.py`,
   `governance/compat/local_governance_hook_catalog_pre_commit.py`,
   `governance/compat/local_governance_hook_catalog_pre_push.py`,
   `governance/compat/local_governance_hook_catalog_reviewer_fast.py`) and
   both CI workflow surfaces
   (`.github/workflows/documentation-testing.yml`,
   `.github/workflows/system-chain-map-freshness.yml`).
8. Emit one actionable, human-readable remediation message per failure
   class, plus a secret-free `--json` machine output.
9. Accept `--as-of-date YYYY-MM-DD`, `--json`, and `--enforce` command-line
   flags.
10. **Never write** the map, its fingerprints, its verdicts, session state,
   or any source file. This checker is strictly read-only.

## No-Auto-Semantics Guarantee

This is the binding rule of this standard: hash mismatch, missing path,
Markdown/JSON disagreement, and review-age expiry are **detection signals**
only. None of them may cause any automation to change a lane's
`currentPosture`, `verdict`, `knownGaps`, or `nextReviewAction`. The correct
response to any failure state is a human-triggered governed review that
reads the changed source and issues a fresh accepted finding - never an
automatic rewrite of the map to match the new source state.

## Local, CI, and Weekly Wiring

- **Local autorun**: the checker command is added to
  `_common_commands` in `governance/compat/agent_autorun_command_catalog.py`
  so every phase run of `governance/compat/run_agent_autorun_workflow_gate.py`
  exercises it.
- **Pre-commit / pre-push / reviewer-fast**: the checker command is added
  once to each of `PRE_COMMIT_CHECKS`, `PRE_PUSH_CHECKS`, and
  `REVIEWER_FAST_CHECKS` in their respective
  `governance/compat/local_governance_hook_catalog_*.py` files.
- **Existing documentation CI**: the checker command is added as a step in
  the `Documentation & Testing` workflow
  (`.github/workflows/documentation-testing.yml`).
- **Weekly reminder**: `.github/workflows/system-chain-map-freshness.yml`
  runs the checker with `--enforce` on a weekly cron plus manual dispatch,
  using read-only repository permissions and no secrets. Its sole purpose
  is to make review-age expiry visible even when no other tranche happens
  to touch the map that week.

## Review Cadence

`maxAgeDays` is `30`. When the freshness checker reports `AGE_EXPIRED`, the
required remediation is a governed review of the five lanes against current
source, followed by an update to `lastVerifiedDate` (and, if source
fingerprints changed, updated hashes) as part of that review's own material
commit - never a bare `lastVerifiedDate` bump without a substantive review.

## Claim Boundary

This standard governs a read-only freshness-detection contract for one
reference family. It does not implement, modify, or supersede any other
`governance/compat/check_*.py` checker, does not authorize semantic
auto-repair of the system-chain map, and does not reopen or re-decide the
R72F lifecycle disposition or any MSEA-R90 Audit A finding.

## Delta Execution Claim Boundary Control Block

| Field | Disposition |
|---|---|
| claimScope | read-only freshness-detection standard for the system-chain map reference family |
| claimDisposition | BOUNDED_CLAIM_WITH_EVIDENCE: defines a deterministic, testable contract; the paired checker and tests provide the executable evidence |
| receiptEvidence | N/A with reason: this standard document itself produces no runtime receipt; the checker's own JSON output is the receipt |
| actionEvidence | ACTION_EVIDENCE_PRESENT: the paired checker, focused tests, and catalog/workflow wiring are the action evidence for this contract |
| invocationBoundary | manually authored governance standard; enforced only through the paired read-only checker |
| interceptionBoundary | no IDE, shell, git, filesystem, provider, CLI, MCP, or Web interception claim |
| claimLanguage | deterministic drift/age detection contract, not a semantic-correctness guarantee |
| forbiddenExpansion | no semantic auto-rewrite, Web dashboard, runtime/provider/live behavior, public export, R72F lifecycle re-decision, or session-state mutation |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: no public-sync authorization exists for MSEA-R91.
