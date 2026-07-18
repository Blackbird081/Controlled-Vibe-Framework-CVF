# CVF Corpus Scan Registry Standard

Memory class: FULL_RECORD

Status: ACTIVE

Control ID: GC-051

docType: reference

Date: 2026-06-02

---

## Purpose

This standard defines the **Corpus Scan Registry** — a mandatory, machine-readable
index that any CVF agent must consult before scanning, classifying, or absorbing
knowledge from any bounded corpus.

The registry solves three problems that arise in multi-agent, multi-session
systems:

1. **Re-scan duplication** — agents re-scan the same corpus because prior scan
   state lived only in prose handoffs or session memory.
2. **Finding loss** — findings from prior scans are not discoverable by future
   agents given a related task.
3. **Blind spot accumulation** — without a structured index, no agent can
   reliably diff "what has been scanned" against "what exists", making blind
   spots invisible.

---

## Scope

This standard applies to **all corpora** that a CVF agent may scan, classify,
or absorb knowledge from, including but not limited to:

| Corpus type | Examples |
| --- | --- |
| `LEGACY_FOLDER` | `.private_reference/legacy/CVF_Important/`, `CVF ADD/`, any version-archived source |
| `PROJECT_SOURCE` | Client project repos, workspace projects (e.g. `tan-thuan-port/`, `Nha tre Maika/`) |
| `POLICY_DOCUMENT` | Legal/policy PDFs, company HR docs, compliance documents |
| `COMPANY_DOCS` | Internal wikis, Notion exports, SharePoint docs, Confluence spaces |
| `EXTERNAL_SOURCE` | GitHub repos, open-source libraries absorbed as knowledge |
| `CVF_EXTENSION` | CVF's own EXTENSIONS/ — tracked by the existing GC-041 surface scan registry |
| `TEST_CORPUS` | Synthetic or sample corpora used for capability validation |

---

## Registry Location

**Generated machine registry:** `docs/corpus-intelligence/CVF_CORPUS_SCAN_REGISTRY.json`

**Authoring header source:** `docs/corpus-intelligence/registry/CVF_CORPUS_SCAN_REGISTRY_HEADER.json`

**Authoring entry sources:** `docs/corpus-intelligence/registry/entries/*.json`

**Human companion:** `docs/corpus-intelligence/CVF_CORPUS_SCAN_REGISTRY.md`

**Finding packets:** `docs/corpus-intelligence/findings/<corpus-slug>.md`

**Manifests:** `docs/corpus-intelligence/manifests/<corpus-slug>.json`

The generated registry is the **front door** for any corpus work. It is not a
replacement for evidence; it points to evidence. Agents must not hand-edit the
generated aggregate for ordinary entry changes. Add or update the per-entry
source file, then run:

```text
python governance/compat/generate_corpus_scan_registry.py --generate
```

`governance/compat/check_corpus_scan_registry.py` fails if the generated
aggregate drifts from the per-entry sources.

---

## Required Registry Entry Fields

Every corpus entry in `CVF_CORPUS_SCAN_REGISTRY.json` must declare:

| Field | Type | Description |
| --- | --- | --- |
| `id` | string | Unique slug, kebab-case, e.g. `legacy-cvf-important-graphify` |
| `corpusType` | enum | One of the allowed corpus types |
| `displayName` | string | Human-readable name |
| `scopePaths` | string[] | Exact filesystem paths in scope |
| `fileCount` | int or null | File count from last enumeration; null if not yet enumerated |
| `status` | enum | Scan status (see below) |
| `scanWave` | string or null | Tranche ID that performed the scan (e.g. `CI1-T2`) |
| `scanDate` | date or null | Date of last scan (ISO 8601) |
| `manifestHash` | string or null | SHA-256 hex digest (64 lowercase chars); null if not yet scanned. Must be a real 64-char hex string, not a path or description. |
| `hashAlgorithm` | string or null | Must be `"sha256"` when `manifestHash` is non-null |
| `hashInput` | string or null | Must be one of: `"sorted-paths-newline-joined-with-trailing-newline"` for CI1-style folder manifests, or `"manifest-internal-hash-from-script-output"` for legacy aggregate manifests whose hash was emitted by the manifest builder script. |
| `manifestPath` | string or null | Path to manifest JSON; null if not yet created |
| `packetPath` | string or null | Path to CI1-style readiness packet or equivalent |
| `completionReviewPath` | string or null | Path to completion review |
| `gcBaselineRef` | string or null | GC-018 baseline path if a tranche was opened |
| `verdicts` | object | `{gc047, gc048, gc050}` — each `"PASS"`, `"PARTIAL"`, `"NOT_RUN"`, or a verdict string |
| `semanticRegions` | string[] | Semantic regions mapped in the scan |
| `priorAbsorption` | string | Summary of any prior implementation that absorbed content from this corpus |
| `findings` | Finding[] | Structured finding records (see below) |
| `negativeSearchTerms` | string[] | Concepts explicitly searched for and NOT found in CVF source |
| `nextScanRecommendation` | string | What to do next with this corpus |

### Finding Record Fields

Each `findings[]` entry must declare:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | always | Unique finding ID within this corpus entry |
| `summary` | string | always | One-sentence finding |
| `disposition` | enum | always | One of the allowed finding dispositions |
| `nextAction` | string | always | Concrete next step or "None" |
| `defectClass` | enum | always | Finding-To-Governance defect class (see mapping table below) |
| `learningLane` | enum | always | Learning lane for routing follow-up (see mapping table below) |
| `f2gRef` | string or null | when disposition is DEFER_WITH_ROADMAP / DEFER_PHASED / BLOCKED_PENDING_DECISION | Path to the completion review's `## Finding-To-Governance Learning Disposition` section where this finding is classified |
| `roadmapRef` | string or null | when DEFER_WITH_ROADMAP | Path or description of the roadmap that will address this finding |
| `workOrderRef` | string or null | when DEFER_PHASED | Path or description of the work order that will address this finding |

### Scan-To-Learning Disposition Mapping Table

This table defines the canonical relationship between scan finding dispositions,
Finding-To-Governance defect classes, and the resulting CVF action. Use this
table to fill `defectClass`, `learningLane`, and the resulting action type.

| Scan disposition | Typical defectClass | learningLane | Resulting CVF action |
| --- | --- | --- | --- |
| `ACCEPT_NO_ACTION` | `RULE_GAP` or `N/A` | `GOVERNANCE_CONTROL_PLANE` or `N/A` | Close finding; no follow-up |
| `ACCEPT_WITH_BOUNDARY` | `UNVERIFIED_CLAIM` or `OPERATOR_SCOPE_CLARITY_GAP` | `DOCUMENTATION_ONLY_LEARNING` | Add boundary note to documentation; no roadmap |
| `DEFER_WITH_ROADMAP` | `RULE_GAP` | `GOVERNANCE_CONTROL_PLANE` | Open GC-018 + roadmap; cite `roadmapRef` |
| `DEFER_PHASED` | `MACHINE_GATE_GAP` or `RULE_GAP` | `GOVERNANCE_CONTROL_PLANE` | Open scoped work order when authorized; cite `workOrderRef` |
| `DEFER_DEMAND_GATED` | `OPERATOR_SCOPE_CLARITY_GAP` | `DOCUMENTATION_ONLY_LEARNING` | Park as future demand; no roadmap until operator requests |
| `REJECT` | `DOCUMENTATION_GAP` | `DOCUMENTATION_ONLY_LEARNING` | Record rejection reason; no follow-up |
| `BLOCKED_PENDING_DECISION` | `OPERATOR_SCOPE_CLARITY_GAP` | `GOVERNANCE_CONTROL_PLANE` | Escalate to operator; cite `f2gRef` or `roadmapRef` |

### Action Evidence Rule

Findings with `DEFER_WITH_ROADMAP`, `DEFER_PHASED`, or `BLOCKED_PENDING_DECISION`
dispositions **must** include at least one of:

- `roadmapRef` — path or description of the roadmap that will address this finding
- `workOrderRef` — path or description of the work order
- `f2gRef` — path to the completion review's `## Finding-To-Governance Learning Disposition` section

This ensures every deferred or blocked finding has a traceable follow-through path
that another agent can discover and cite when opening related work.

`PENDING`, `not yet opened`, `not yet dispatched`, and similar placeholders may
remain as parking notes, but they do not count as action evidence unless the
same finding also has an existing `f2gRef`, `roadmapRef`, or `workOrderRef`
artifact reference.

### f2gRef Format

`f2gRef` links the registry finding back to its formal Finding-To-Governance
classification in the scan's completion review:

```text
docs/reviews/<completion-review-filename>.md#finding-to-governance-learning-disposition
```

Example:

```text
docs/reviews/CVF_CI1_T2_GRAPHIFY_LEGACY_RESCAN_PILOT_COMPLETION_2026-06-02.md#finding-to-governance-learning-disposition
```

The completion review is the canonical location where `defectClass`, `learningLane`,
and `disposition` are formally recorded per the Finding-To-Governance standard.
The registry entry carries compact versions of these fields for machine-readable
cross-referencing; the completion review is the authoritative source.

---

## Allowed Status Values

| Status | Meaning |
| --- | --- |
| `NOT_STARTED` | Corpus exists but no scan has been performed |
| `PARTIALLY_SCANNED` | Broad inventory only — file list and semantic regions mapped, but no deep classification |
| `SCANNED` | Full scan with GC-047/048 evidence; no significant findings requiring action |
| `SCANNED_WITH_FINDINGS` | Full scan complete; findings have been dispositioned and recorded |
| `DEEP_CLASSIFIED` | GC-047 + GC-048 + GC-050 all PASS; finding disposition complete |
| `DEFERRED` | Scan is intentionally deferred pending operator decision or prerequisite |
| `OUT_OF_SCOPE` | Corpus explicitly excluded from CVF scan scope |

---

## Allowed Finding Dispositions

| Disposition | Meaning |
| --- | --- |
| `ACCEPT` | Finding accepted as-is; no action required |
| `ACCEPT_NO_ACTION` | Finding confirms expected state; no additional work |
| `ACCEPT_WITH_BOUNDARY` | Finding accepted with explicit claim boundary note |
| `DEFER_WITH_ROADMAP` | Finding requires future work; roadmap or parking note exists |
| `DEFER_PHASED` | Finding to be addressed in a later specific tranche |
| `DEFER_DEMAND_GATED` | Finding addressed only when operator explicitly requests it |
| `REJECT` | Finding does not apply or is invalidated |
| `BLOCKED_PENDING_DECISION` | Finding requires operator decision before disposition |

---

## Mandatory Agent Rules

### Rule 1 — Consult registry before scanning

Before any agent opens a corpus scan, it MUST:

1. Read `docs/corpus-intelligence/CVF_CORPUS_SCAN_REGISTRY.json`.
2. Check whether the target corpus path matches any `scopePaths` entry.
3. If matched with status `SCANNED` or `DEEP_CLASSIFIED` — inherit prior state;
   do NOT re-scan unless operator explicitly authorizes a re-scan.
4. If matched with status `PARTIALLY_SCANNED` — begin where the prior scan left
   off; do not restart from zero.
5. If matched with status `SCANNED_WITH_FINDINGS` — read all `findings[]` for
   that entry before starting new work on the same corpus area.

### Rule 2 — Update registry after scanning

After completing a corpus scan, the agent MUST update the registry entry source:

- Update `status`, `scanDate`, `manifestHash`, `manifestPath`, `packetPath`,
  `completionReviewPath`, `verdicts`, `semanticRegions`, `findings`.
- Add new `findings[]` entries for any findings not already recorded.
- Update `negativeSearchTerms` with any zero-result searches performed.
- Update `nextScanRecommendation`.
- Run `python governance/compat/generate_corpus_scan_registry.py --generate`.
- Commit the changed entry source and generated aggregate together.

Registry updates require the same governance gate pass as the scan itself.

### Rule 2A - Generated aggregate discipline

`docs/corpus-intelligence/CVF_CORPUS_SCAN_REGISTRY.json` is retained as the
machine-readable front door for existing guards and agents, but it is now a
generated aggregate. Direct aggregate edits are allowed only for bootstrap or
emergency repair and must be reconciled into
`docs/corpus-intelligence/registry/` before closure.

Per-entry sources may include `registryOrder` as a source-only ordering field.
The generated aggregate must not include `registryOrder`.

### Rule 3 — Add new corpus entries proactively

When a scan opens a corpus not yet in the registry, the agent MUST add a new
entry before starting work. Minimum required fields for a new entry at scan-open
time: `id`, `corpusType`, `displayName`, `scopePaths`, `status: NOT_STARTED`.
Remaining fields are filled as the scan progresses.

### Rule 4 — Cross-reference findings before implementation

Before implementing any feature that touches a domain previously scanned, the
agent MUST check registry `findings[]` for that corpus area. A finding with
`disposition: DEFER_WITH_ROADMAP` or `DEFER_PHASED` must be acknowledged and
the existing finding cited in the new work order — not rediscovered as a new gap.

### Rule 5 — Project corpora follow the same rules

This standard applies equally to CVF workspace project corpora (e.g. client
project source trees). When CVF is applied to a new project:

1. Add a `PROJECT_SOURCE` entry to the registry before scanning.
2. Record project-specific findings in the same schema.
3. Cross-reference CVF framework findings that apply to the project.

### Rule 6 — Work orders must authorize registry routing

Any work order that dispatches a corpus scan, classification, absorption,
search/filter readiness task, negative-search review, or "not found" claim must
name the registry update surface before the worker starts.

The work order must state whether the worker may:

- add a new `corpora[]` entry;
- update an existing `corpora[]` entry;
- create or update a finding packet under
  `docs/corpus-intelligence/findings/`;
- update the human companion registry.

If findings exist, the work order must require `defectClass`, `learningLane`,
`nextAction`, and action evidence (`f2gRef`, `roadmapRef`, or `workOrderRef`)
for every deferred or blocked finding. A scan report with findings only in
markdown prose is incomplete because future agents cannot reliably consume it.

---

## Negative Search Evidence Rule

Any corpus scan that claims a concept is "not found" or "not implemented" MUST
record the specific search command and zero-result evidence in
`negativeSearchTerms`. A claim of absence without a recorded search is not
valid evidence.

Format: `"<concept description> — <search command> returned no results"`

Example: `"cvf graph (CLI command) — rg 'cvf graph' --include='*.ts' in EXTENSIONS/ returned no results"`

---

## Finding Discovery Rule

When a future agent is assigned a task (e.g. "implement graph guard enforcement"),
it MUST:

1. Extract domain keywords from the task (e.g. "graph", "guard").
2. Search `CVF_CORPUS_SCAN_REGISTRY.json` for entries with matching
   `semanticRegions` or `findings[].summary`.
3. If a prior finding matches, cite it in the work order Source Verification
   table as: `prior finding F2-guard-spec-absent from corpus
   legacy-cvf-important-graphify — see CVF_CORPUS_SCAN_REGISTRY.json`.
4. Do not claim the gap as newly discovered if it is already recorded.

---

## Registry Drift Check

When any agent runs GC-047 corpus completeness on a folder that has a registry
entry, it MUST compare the GC-047 manifest file count against the registry
`fileCount`. A mismatch greater than 0 is a drift signal and must be recorded
as a finding with disposition `BLOCKED_PENDING_DECISION` until the delta is
explained.

---

## Enforcement

This standard is enforced by:

- `governance/toolkit/05_OPERATION/CVF_GC051_CORPUS_SCAN_REGISTRY_GUARD.md`
- `governance/compat/check_corpus_scan_registry.py`

The checker verifies:

1. Any changed audit/review mentioning a corpus path has a corresponding
   registry entry.
2. Any registry entry with `status: SCANNED_WITH_FINDINGS` has at least one
   `findings[]` entry with a non-empty `disposition`.
3. Any `verdicts.gc047: COMPLETE_VERIFIED` entry has a non-null 64-character
   lowercase SHA-256 `manifestHash`.
4. Any non-null `manifestHash` entry declares `hashAlgorithm: sha256` and an
   allowed `hashInput`.
5. Required fields are present for all entries.

---

## Claim Boundary

This standard claims:

- A structured, machine-readable index that prevents duplicate scanning and
  enables cross-agent finding inheritance.
- Coverage for all corpus types relevant to CVF and CVF-governed projects.

This standard does NOT claim:

- That registering a corpus replaces the actual scan evidence (GC-047/048/050
  packets are still required).
- Semantic correctness of classification (that remains reviewer responsibility).
- Production or hosted readiness of any classified corpus.
