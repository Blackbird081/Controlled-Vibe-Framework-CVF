# CVF Task-Proportional Governance Routing Standard

Memory class: governed-standard

Status: ACTIVE_T0_SHADOW_ENFORCEMENT

Date: 2026-08-17

## Purpose

Make governance cost follow task risk instead of guard count. Every newly
activated governed work order must declare one closed-shape task manifest and
receive a deterministic routing receipt before dispatch. TPGR-T0 is shadow
enforcement: it classifies and fails closed, but it does not skip, reorder, or
replace any current legacy gate.

## Scope

This standard governs CVF absorption and project-delivery tasks. It owns the
profile vocabulary, classification manifest, escalation triggers, bundle
selection explanation, and activation rule. Existing domain standards remain
owners of their substantive controls.

## Canonical Machine Surfaces

- registry: `governance/compat/CVF_TASK_GOVERNANCE_ROUTE_REGISTRY.json`;
- schema: `governance/compat/CVF_TASK_GOVERNANCE_ROUTE_MANIFEST.schema.json`;
- deterministic router: `governance/compat/route_task_governance.py`;
- activation checker: `governance/compat/check_task_governance_route.py`;
- focused tests: `governance/compat/test_route_task_governance.py` and
  `governance/compat/test_check_task_governance_route.py`.

The registry is canonical for enum values, profile ordering, protected-path
minimums, and bundle names. The schema documents the exact manifest shape; the
router additionally enforces cross-field and path contradictions.

## Mandatory Classification

The manifest declares all eight dimensions:

| Dimension | Values |
| --- | --- |
| `taskKind` | `READ_ONLY`, `DOC_CHANGE`, `PURE_LOCAL_IMPLEMENTATION`, `STATEFUL_LOCAL_IMPLEMENTATION`, `EXTERNAL_ABSORPTION`, `RUNTIME_INTEGRATION`, `LIVE_PROOF`, `PUBLIC_RELEASE`, `DESTRUCTIVE_OPERATION` |
| `authorityImpact` | `NONE`, `USES_EXISTING_OWNER`, `ENRICHES_EXISTING_OWNER`, `CREATES_OR_CHANGES_AUTHORITY` |
| `externalEffect` | `NONE`, `LOCAL_REVERSIBLE`, `NETWORK_READ`, `NETWORK_WRITE`, `PUBLIC_WRITE`, `DESTRUCTIVE` |
| `dataSensitivity` | `PUBLIC`, `PRIVATE_REPO`, `CREDENTIAL_REFERENCE`, `SECRET_VALUE`, `REGULATED` |
| `reversibility` | `READ_ONLY`, `GIT_REVERSIBLE`, `STATEFUL_REVERSIBLE`, `PARTIALLY_REVERSIBLE`, `IRREVERSIBLE` |
| `sourceScale` | `NONE`, `NAMED_FILES`, `BOUNDED_CLUSTER`, `CORPUS` |
| `delegation` | `SINGLE_ROLE`, `MULTI_ROLE_NO_COMMIT`, `MULTI_ROLE_WITH_COMMIT` |
| `novelty` | `KNOWN_PATTERN`, `OWNER_COMPOSITION`, `NEW_INTERFACE`, `NEW_AUTHORITY` |

It also declares exact path families, claims, proof, checkpoints, forbidden
effects, and source-read evidence. Selected named files or bounded clusters in
an absorption task require `selectedFilesFullyRead: true`. Corpus work requires
a prior corpus receipt reference; a terminal ledger row is not full-read proof.

## Profiles And Minimums

| Profile | Minimum posture |
| --- | --- |
| `P0_OBSERVE` | read-only evidence; no mutation |
| `P1_LIGHT` | small docs/pure local work under an existing owner |
| `P2_BOUNDED` | delegated or bounded-cluster work with independent review |
| `P3_ELEVATED` | canonical standard/checker/hook/generator/authority, state, dependency, auth, persistence, install, migration, or network change |
| `P4_CRITICAL` | provider/live, public write, push/deploy/production, secret value, regulated data, destructive or irreversible work |

File and byte counts never override a minimum. Unknown values, missing fields,
contradictions, protected-path mismatches, or self-downgrade produce
`REJECTED_ESCALATED`, select the full legacy bundle, and set the fallback
profile to at least `P3_ELEVATED`.

## Mandatory Escalation

- multi-role delegation sets at least `P2_BOUNDED`;
- corpus scope sets at least `P2_BOUNDED` plus `CORPUS_ACCOUNTING`;
- canonical standards, checkers, hooks, generators, continuity state, new
  interfaces or authority set at least `P3_ELEVATED`;
- stateful work, credentials, dependencies, auth, persistence, installation,
  migration, network read/write, or partially reversible work set at least
  `P3_ELEVATED`;
- live/provider, secret value, regulated data, public write/release,
  destructive or irreversible work sets `P4_CRITICAL`.

Escalation is monotonic. A task may regenerate a stronger route when new facts
appear; it may not self-downgrade after dispatch.

## Bundle Contract

The router explains applicability using `CORE_INTEGRITY`, `ARTIFACT_SHAPE`,
`SOURCE_PROVENANCE`, `CORPUS_ACCOUNTING`, `DELEGATION_HANDOFF`, `CODE_QUALITY`,
`STATE_AND_SECURITY`, `RUNTIME_LIVE`, `PUBLIC_RELEASE`, and `CONTINUITY`.
Every omitted bundle carries a machine reason. Bundle selection is an
explanation only during T0.

## Activation Rule

The commit introducing this standard is its shadow activation boundary. In
that commit the checker validates its registry and remains compatible with the
legacy range. In every later range, a changed work order whose status is
`DISPATCH_READY`, `READY`, `ACTIVE`, or `APPROVED_FOR_EXECUTION` must include:

    ## Task Governance Routing Manifest

    ```json
    { ... cvf.taskGovernanceManifest.v1 ... }
    ```

The JSON must route to `ROUTED_SHADOW`. Missing or rejected manifests block
dispatch. Closed historical work orders are not retroactively rewritten.

## TPGR-T0 Legacy Full-Gate Interlock

Every T0 receipt must contain:

- `selectiveExecutionAuthorized: false`;
- `legacyGateDisposition: RUN_FULL_LEGACY_BUNDLE`;
- `receiptStatus: ROUTED_SHADOW` for valid manifests.

Autorun and local hook catalogs invoke the TPGR checker in addition to their
current commands. They continue to run the complete legacy command lists.
Selective execution is unauthorized until TPGR-T2 and TPGR-T4 equivalence
evidence are independently accepted.

## Absorption Cost Rule

Immutable corpus inventory, hashes, and completeness evidence are recorded
once. Later clusters reference that receipt, recompute selected hashes, and
fully read each selected file. P1/P2 packets must not reproduce unrelated
corpus, runtime, provider, public, or destructive evidence unless a manifest
trigger selects those risks. During T0, this is a packet-authoring rule and
routing receipt; legacy gates still execute.

## Tranche Admission And Continuation Value

An optional, additive `trancheValue` object may be declared on the manifest
without changing the closed `cvf.taskGovernanceManifest.v1` shape. Its
purpose is a pre-dispatch and continuation-value decision that sits beside
risk classification: risk continues to set the minimum governance profile;
value only ever narrows toward stopping, parking, or consolidating a
proposed tranche, and never relaxes, skips, reorders, or shortens a
risk-required guard.

This record is scoped first to the remediation/finding-repair task class,
where the accepted TPGR-TV1 design and its predecessor evidence (EAFR-R11's
Tranche Admission And Continuation Value Learning section, the RFR final
reconciliation review) supplied concrete before/after evidence. External
repository absorption and app/project delivery are named future consumers of
the same record shape; extending this section to either requires its own
independently accepted design and predecessor evidence before the record is
declared for that class.

### Closed Record Shape

When present, `trancheValue` is a closed object with exactly fourteen
top-level fields: `outcomeConsumer`, `severity`, `findingEvidenceState`,
`rootCauseIdentity`, `marginalValue`, `valueEvidenceState`, `costEnvelope`,
`consolidationKey`, `stopCondition`, `successorAuthority`, `decisionReason`,
`reviewerIdentity`, `freshness`, `overrideAppealEvidence`. The exact JSON
Schema shape is canonical in
`governance/compat/CVF_TASK_GOVERNANCE_ROUTE_MANIFEST.schema.json`.

Finding evidence and value evidence are two separate labeled fields
(`findingEvidenceState`, `valueEvidenceState`), each one of `OBSERVED`,
`HISTORICAL_BOUNDED`, `PROJECTED`, `UNKNOWN`. A strong finding must never be
inferred from strong economics, or vice versa. `costEnvelope` separates six
sub-fields (`workerTime`, `reviewerTime`, `latency`, `tokenOrQuotaUsage`,
`providerCallCost`, `opportunityCost`), each independently evidence-labeled;
an unmeasured sub-field is the literal string `UNKNOWN`, never a numeric
zero. `rootCauseIdentity` is a typed causal identity (`relation` one of
`INDEPENDENT`, `DEPENDENT`, `DUPLICATE`, plus a causal invariant, owner
surface, and non-empty evidence references) rather than a bare boolean, so a
renamed or retitled duplicate cannot escape detection by title-text
comparison alone.

### Authority-Sourced Successor Cap

A declared record's `successorAuthority` (authority path, authority hash,
full authority commit, declared cap, current ordinal) is never the trust source for cap or ordinal
by itself. The route checker
(`governance/compat/check_task_governance_route.py`) resolves the cited path
from the cited commit only after proving that commit is an ancestor of HEAD,
recomputes its SHA-256, and compares it against the declared hash before
treating any cap or ordinal value as trusted. A missing file, unreadable
content, non-ancestor commit, hash mismatch, missing or
malformed successor-authority JSON block, or a candidate/authority
disagreement fails closed: the router
(`governance/compat/route_task_governance.py`) never returns
`CONTINUE_HIGH_VALUE` for an unverified or mismatched authority.

Direct CLI evaluation of the router without an explicitly supplied trusted
authority argument remains shadow-only: it returns a fail-closed park
explanation for a declared record and never trusts candidate-controlled cap
fields. Only the checker's authority-resolution seam may compose a trusted
authority object into the router call, and only from currently committed
roadmap content.

### Decision Vocabulary And Precedence

The value decision returns exactly one of four tokens: `CONTINUE_HIGH_VALUE`,
`CONSOLIDATE`, `PARK_LOW_VALUE`, `STOP_NO_INCREMENTAL_VALUE`. This is a
distinct vocabulary from the Review Cost standard's five-token
`stopDisposition`
(`docs/reference/review_cost_control/CVF_REVIEW_COST_AND_DIMINISHING_RETURN_CONTROL_STANDARD.md`):
this section's tokens answer whether a tranche should be dispatched or
continued at all, decided once per tranche before or during work; the Review
Cost standard's tokens answer whether an already-open review round should
stop repairing. The two vocabularies compose sequentially and are not
merged.

Decision precedence, evaluated in order:

1. malformed or missing declared fields, or an unverified/mismatched
   authority, park;
2. a stale or expired record parks before it can continue or consolidate;
3. a proved dependent or duplicate root cause with no new evidence, stop;
4. cap exhausted: a source-backed P0/P1 consolidates into a new-roadmap
   successor candidate; otherwise stop. No fourth ordinal is ever executed
   under an exhausted cap;
5. P0/P1 severity without observed or historical-bounded finding evidence,
   park;
6. source-backed P0/P1 with an independent root cause and observed or
   historical-bounded marginal value, continue; otherwise consolidate one
   bounded repair;
7. P2/P3/NONE severity continues only for an independent root cause plus
   observed or historical-bounded marginal value; projected or unknown value
   parks;
8. an override never overwrites the computed token and never becomes
   authoritative; it is preserved as
   additional evidence requiring a valid governed authority reference and
   independent reviewer confirmation.

Every receipt emitted for a declared record carries
`valueDispositionAuthoritative: false`; this field is a shadow explanation,
never a permission, waiver, or execution instruction. Risk-profile
computation happens first and is immutable; value output never changes
profile, selected/skipped bundles, escalation triggers, selective execution,
or legacy gate disposition. Omitted `trancheValue` manifests emit none of the
`valueDisposition*` receipt fields and retain byte-equivalent prior routing
semantics.

## Initial-Acquisition-Survey Admission

An optional, additive `initialIntakeAdmission` object may be declared on the
manifest without changing the closed `cvf.taskGovernanceManifest.v1` shape.
Its purpose is to remove the evidence-bootstrap contradiction that otherwise
blocks the very first identity/acquisition pass over an external source: the
ordinary selected-file rule requires `selectedFilesFullyRead: true` and the
ordinary corpus rule requires a prior `corpusReceiptRef`, but neither can be
true before any source has been read at all. This section grants no
absorption acceptance and does not weaken either ordinary rule when the
object is absent.

### Closed Record Shape

When present, `initialIntakeAdmission` is a closed object with exactly five
top-level fields, each a fixed literal value: `stage`
(`INITIAL_ACQUISITION_SURVEY`), `plannedReceiptPath` (a normalized
repo-relative `.json` or `.md` output under `docs/audits/` or
`docs/reviews/`, maximum 256 characters, no traversal, drive letter,
backslash, control character or empty path segment), `acceptanceDisposition`
(`NO_ABSORPTION_ACCEPTANCE`), `nextStageAuthority`
(`SEPARATE_REVIEWED_WORK_ORDER`), and `unknownEvidencePolicy`
(`PRESERVE_UNKNOWN`). Extra keys, missing keys, wrong types, or any other
value reject the whole manifest. The exact JSON Schema shape is canonical in
`governance/compat/CVF_TASK_GOVERNANCE_ROUTE_MANIFEST.schema.json`.

`plannedReceiptPath` names a planned future output, not existing evidence;
its existence on disk is never required at dispatch and it is never copied
into `corpusReceiptRef` or treated as a prior receipt. It must also fall
within at least one of the manifest's own declared `pathFamilies` entries
(exact-file or segment-aware prefix match); a syntactically safe path under
`docs/audits/` or `docs/reviews/` that the manifest did not itself declare as
a path family is still rejected, so a receipt cannot be planned outside the
scope the dispatching work order actually owns.

### Admission Conditions

The record activates the initial-stage bypass only when every one of these
also holds on the same manifest: `taskKind` is `EXTERNAL_ABSORPTION`;
`authorityImpact` is `NONE` or `USES_EXISTING_OWNER`; `externalEffect` is
`NONE`, `LOCAL_REVERSIBLE`, or `NETWORK_READ`; `dataSensitivity` is `PUBLIC`
or `PRIVATE_REPO`; `reversibility` is `READ_ONLY` or `GIT_REVERSIBLE`;
`sourceScale` is `NAMED_FILES`, `BOUNDED_CLUSTER`, or `CORPUS`; `delegation`
is `SINGLE_ROLE` or `MULTI_ROLE_NO_COMMIT`; `novelty` is `KNOWN_PATTERN` or
`OWNER_COMPOSITION`; no `trancheValue` record is present; and
`requestedProfile` is at least `P3_ELEVATED`. Any dimension outside this set,
a declared `trancheValue`, a sub-`P3_ELEVATED` request, or a blank
`corpusReceiptRef` string fails the manifest closed to `REJECTED_ESCALATED`
rather than falling back to the more permissive ordinary-rule path.

Every `pathFamilies` entry on an active initial-stage manifest must fall
within `docs/audits/`, `docs/reviews/`, `docs/work_orders/`,
`docs/baselines/`, `.private_reference/source_mirrors/`, or the explicit
continuity paths `CVF_SESSION/`, `CVF_SESSION_MEMORY.md`, and
`AGENT_HANDOFF_V60_2026-09-08.md`. The prefix check is segment-aware: a
broader root such as bare `docs/` or `.private_reference/`, or any
product-source, governance-code, hook, scripts, SDK, or public-workflow
family, rejects the manifest even though the classification is otherwise a
valid initial stage. Declaring a continuity path does not authorize a
worker to mutate it; those paths remain dispatcher-owned.

Truthful source evidence is still required: `selectedFilesFullyRead` must
remain `false` and `completenessClaimChanged` must remain `false` on an
active initial-stage manifest; either being `true` rejects rather than
blending acquisition with acceptance. `corpusReceiptRef` may be `null` or a
non-blank, non-whitespace-only prior reference retained for reuse; a blank
string or a string containing only whitespace characters rejects the
manifest inside the initial-stage admission path. This whitespace check is
scoped to the initial-stage admission branch only; it does not change the
existing plain-truthiness `corpusReceiptRef` check that ordinary manifests
without `initialIntakeAdmission` have always used. No new interpretation of
an old historical receipt is granted.

### Receipt And Scope Limitation

A successful initial-stage receipt carries `initialIntakeDisposition:
INITIAL_EVIDENCE_COLLECTION_ONLY` and `absorptionAcceptanceAuthorized:
false`, alongside the unchanged `selectiveExecutionAuthorized: false` and
`legacyGateDisposition: RUN_FULL_LEGACY_BUNDLE`. The computed minimum
profile is forced to at least `P3_ELEVATED`, and `SOURCE_PROVENANCE` and
`CORPUS_ACCOUNTING` are always selected regardless of `sourceScale`.

The initial stage permits only source identity/acquisition, immutable
pinning, freshness/license evidence, inventory, and bounded representative
reading. It cannot certify complete absorption, whole-repository semantic
reading, final novelty/NO_NEW_VALUE, or authorize integration; the planned
receipt at `plannedReceiptPath` must later record actual read depth,
source/manifest/ledger evidence, exclusions, unknowns, and the next
decision. Named observations and follow-up recommendations from the initial
pass remain advisory until independent reviewer acceptance under a separate
selected-absorption work order.

This is a declaration validator, not a natural-language semantic verifier or
a process sandbox: the schema and router cannot prove that a cited source was
actually read, cannot prevent arbitrary shell operations outside this
metadata contract, and cannot establish that a proposed receipt will in fact
be produced. They validate only the shape and internal consistency of the
declared manifest.

### Rollback

Removing this section removes only the optional `initialIntakeAdmission`
schema property, its router validation/bypass branch, and its focused tests.
It must leave the prior `cvf.taskGovernanceManifest.v1` manifest, the
ordinary selected-file and corpus rejection rules, and the full legacy gate
valid and unchanged for every manifest that omits `initialIntakeAdmission`.

## Verification

```powershell
python -m pytest governance/compat/test_route_task_governance.py governance/compat/test_check_task_governance_route.py
python governance/compat/check_task_governance_route.py --base <base> --head HEAD --enforce
python governance/compat/run_agent_autorun_workflow_gate.py --phase pre-dispatch --base <base> --head HEAD
```

## Rollback

Remove the TPGR checker from command catalogs and retain the legacy full gate.
Never roll back by accepting an invalid manifest or by silently authorizing
selective execution. Registry/schema/router changes require `P3_ELEVATED`,
independent review, focused tests, and the current guard-maintenance controls.

Rolling back the Tranche Admission And Continuation Value section removes
only the optional `trancheValue` schema property, its router evaluation
function, its checker authority-resolution seam, and their focused tests. It
must leave the prior `cvf.taskGovernanceManifest.v1` manifest and full legacy
gate valid for every manifest that omits `trancheValue`; no migration of
historical work orders is required or authorized.

## Claim Boundary

This standard activates classification and shadow receipts only. It grants no
task authority, runtime authority, provider call, public write, deployment, or
destructive action. It does not yet reduce the executed legacy guard bundle.
The optional Tranche Admission And Continuation Value record and its
`valueDisposition*` receipt fields are non-authoritative shadow explanations;
they authorize no selective execution, legacy suppression, or governance-
floor reduction, and grant no TV3, TV4, or successor-tranche authority by
themselves.
