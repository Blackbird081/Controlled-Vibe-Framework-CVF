# CVF External Agent Round-Trip Kit

docType: reference

Memory class: PUBLIC_REFERENCE

Status: CURRENT PUBLIC GUIDE

protocolVersion: 1.1.0
projectionOf: cvf.external-agent-round-trip
compatibleWith: cvf.external-agent-portable-packet@1.x
updatedAt: 2026-08-23
representation: PUBLIC_COMPACT_PROJECTION

Use this guide when an external agent will review CVF, design a capability,
write code, or create a repository/folder that may later be selectively
absorbed into CVF.

## Purpose

Give an external agent one reusable operating and return protocol. The operator
may provide this guide, the public CVF repository link, and a short task
objective without repeating the governance, provenance, evidence, and
return-shape requirements in every prompt.

This guide is public context, not CVF execution authority. External output
remains non-authoritative until independently reviewed and promoted through a
governed CVF owner surface.

## Scope

This guide applies to external review, design, implementation, repository
creation, and source-pack preparation performed from the public CVF surface.
It does not expose private provenance or authorize direct changes to CVF.

## Representation relationship

This guide is the public compact projection of
`cvf.external-agent-round-trip`, optimized for discovery from one repository
link. A portable expanded representation may instead be supplied as these four
files:

- `CVF_EXTERNAL_AGENT_BOOTSTRAP_INSTRUCTIONS.md`
- `CVF_CONTEXT_BRIEF.md`
- `CVF_CURRENT_PUBLIC_SNAPSHOT.md`
- `CVF_EXTERNAL_AGENT_RETURN_CONTRACT.md`

When all four portable files are supplied, their bootstrap is the startup
entrypoint and their specialized content provides the richer refreshable
context. When only the public repository is supplied, use this compact guide.
Neither representation overrides current CVF source, an explicit operator
instruction, or a more restrictive safety or claim boundary.

Compatibility requires the same protocol major version. If metadata is
missing, major versions differ, or the representations materially disagree,
report `PROTOCOL_REPRESENTATION_DRIFT`, reverify public source, and use the
narrower authority and claim boundary until reconciled.

The stable portable representation remains four files. It may also contain
generated supplements: `CVF_PUBLIC_OWNER_SURFACE_INDEX.json`, a packet refresh
receipt, and one `CVF_EXTERNAL_AGENT_TASK_CAPSULE.json` bound to an exact task
and upstream commit. Never reuse a task capsule for another repository.

## Automatic startup instruction

When this guide is supplied:

1. derive the task objective from the user's current request and supplied
   source material;
2. record the public repository URL, branch or exact commit, and review date;
3. read `README.md`, this guide,
   `docs/guides/external-agent-review-guide.md`, and the task-specific public
   source paths;
4. verify current public source instead of relying on model memory or a stale
   summary;
5. proceed directly when the desired outcome is clear; ask only when a missing
   decision would materially change scope, architecture, license treatment, or
   an external/destructive effect.

Public repository:

`https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git`

## Working mode

Select and report one primary mode:

| Mode | Use when | Default boundary |
|---|---|---|
| `REVIEW_ONLY` | Evaluate CVF, another repository, design, or artifact | Read-only findings |
| `DESIGN_ONLY` | Produce architecture, contracts, schemas, or implementation plan | Design artifacts only |
| `BUILD_NEW_REPOSITORY` | Create a new standalone repo/folder | Write only in the named output root |
| `EXTEND_SUPPLIED_REPOSITORY` | Implement in a supplied repo | Modify only task-relevant paths |
| `SOURCE_PACK_PREPARATION` | Prepare a source pack for later CVF intake | Provenance-rich candidate; no authority promotion |

If a request only asks for explanation, review, or diagnosis, do not infer
permission to mutate an existing repository.

## Default authority envelope

Unless the operator explicitly changes it:

```text
local task work inside the supplied or named root: allowed
read-only public source verification: allowed
commit or history rewrite: not authorized
push or pull request: not authorized
publication or package release: not authorized
deployment or hosted infrastructure: not authorized
provider/API invocation: not authorized
credential use or paid quota: not authorized
destructive filesystem action: not authorized
private provenance access: not authorized unless explicitly supplied
```

If an external effect is explicitly authorized, record its exact target,
result, secret-safe evidence, and rollback/recovery boundary.

## CVF interpretation rules

Preserve the seven distinct control decisions:

```text
INTAKE -> DESIGN -> SPEC -> WORK ORDER -> BUILD -> REVIEW -> FREEZE
```

Do not treat:

- design as a testable specification;
- specification as execution permission;
- implementation as independent acceptance;
- package presence, route names, UI state, or receipts as authority;
- mock behavior as live governance proof;
- private/local evidence as public export or production proof.

Keep capability states distinct:

```text
discovered != admitted != assigned != distributed != authorized
!= invoked != accepted != frozen
```

## Source, provenance, and license rules

For every material source:

- record repository URL and pinned commit/version when available;
- cite paths, symbols, or sections for source-backed claims;
- record license and usage type;
- distinguish copied content, adaptation, reference-only use, operator
  requirement, operator-agent co-design, and novel synthesis;
- never treat an external README, chat, model memory, or this guide as CVF
  source of truth;
- do not copy code when reuse rights are unclear.

The public CVF repository declares `CC BY-NC-ND 4.0`. Treat it as context and
reference unless the operator explicitly supplies additional rights.

## Owner and overlap discipline

Before proposing a new registry, runtime, checker, credential owner, truth
owner, receipt owner, or lifecycle owner:

1. inspect relevant current CVF owner surfaces;
2. identify which owner could hold the value;
3. state the concrete novelty or gap;
4. prefer enrichment/adaptation over duplication;
5. keep an unresolved owner gap explicit instead of inventing authority.

Use `docs/reference/CVF_EXTERNAL_AGENT_OWNER_SURFACE_INDEX.json` as a bounded
discovery aid. Reverify every listed path at the exact public commit; the index
does not prove that a path is the complete or current owner for the task.

## Gate A before design or code

Before design or implementation, report Gate A (`SOURCE_OWNER_OVERLAP`) with
immutable upstream identity and commit, immutable source links, structured
license evidence, the CVF owner checked, overlap/novelty disposition, and one
result: `PASS`, `RETURN_FOR_REPAIR`, or `BLOCKED`. Only `PASS` opens Gate B.

## Implementation rules

For coding tasks:

- preserve unrelated user changes;
- isolate pure contracts from external effects;
- inject time, randomness, transport, storage, and provider clients when
  deterministic testing matters;
- fail closed on missing identity, integrity, scope, owner, authority, or
  expiry;
- add positive, negative, malformed-input, authority-widening, secret/redaction,
  replay/expiry, dependency-failure, and regression tests where applicable;
- document dependencies, setup, persistence, retries, idempotency, rollback,
  and limitations;
- return no raw secrets or raw chain-of-thought;
- make no claim stronger than the executed evidence.

Gate B (`DESIGN_CODE_TEST`) requires executed negative semantic evidence where
applicable. Positive examples and schema validation alone are insufficient;
test invalid cross-field states, malformed input, authority widening, and
source/license inconsistency.

For design-only work, supply interfaces, invariants, negative cases, owner
mapping, evidence plan, and implementation boundary without implying that the
design has been built.

## Required return artifacts

For a generated or modified repository/folder, return these root artifacts:

| Artifact | Required content |
|---|---|
| `README.md` | Purpose, setup, architecture, usage, limitations, and authority statement |
| `EXTERNAL_AGENT_RETURN_MANIFEST.json` | Machine-readable task, source, inventory, test, and claim metadata |
| `SOURCE_MANIFEST.md` | Sources, commits/versions, paths/concepts, licenses, and usage types |
| `DECISION_LOG.md` | Decisions, alternatives, owner mapping, boundaries, and unresolved questions |
| `TEST_EVIDENCE.md` | Exact commands, environment, results, failures, skips, and live/mock boundary |
| `CLAIM_BOUNDARY.md` | Proven, implemented-not-accepted, unproven, deferred, and external-effect claims |
| `FILE_INVENTORY.sha256` | SHA-256 inventory excluding the inventory file itself |

If an artifact is genuinely inapplicable, keep it and state the reason.

## Required authority markers

The root README/report and JSON manifest must identify the output as:

```text
artifactClass: PROVENANCE_BACKED_DERIVED_SYNTHESIS_CANDIDATE
authorityStatus: NON_AUTHORITATIVE_UNTIL_REVIEWED
```

The return is not CVF source of truth, execution authority, runtime proof,
public release evidence, or production-readiness proof.

## Origin classes

Classify material components with:

- `UPSTREAM_REPOSITORY_BACKED`
- `CVF_PUBLIC_DERIVED`
- `OPERATOR_REQUIREMENT`
- `OPERATOR_AGENT_CO_DESIGNED`
- `NOVEL_SYNTHESIS`
- `MIXED_ORIGIN`
- `ORIGIN_UNRESOLVED`

Upstream claims require URL, commit/version, path, and symbol/section evidence.
Co-designed or novel material requires concise rationale, invariants,
alternatives, intended owner, and validation plan.

## File inventory recipe

1. Enumerate regular files recursively, including hidden files.
2. Exclude `.git/`, transient caches, build output, dependency vendor folders,
   raw secrets, and `FILE_INVENTORY.sha256` itself.
3. Normalize root-relative paths with `/` separators.
4. Sort by ordinal/code-point order.
5. Write lowercase SHA-256, two spaces, then normalized path.
6. Encode UTF-8 without BOM, LF line endings, with one trailing LF.
7. Record every exclusion in `EXTERNAL_AGENT_RETURN_MANIFEST.json`.

## Minimum JSON shape

`EXTERNAL_AGENT_RETURN_MANIFEST.json` must be valid JSON and include at least
this populated shape (replace the illustrative values with real evidence):

```json
{
  "schema": "cvf.externalAgentReturn.v1",
  "artifactClass": "PROVENANCE_BACKED_DERIVED_SYNTHESIS_CANDIDATE",
  "authorityStatus": "NON_AUTHORITATIVE_UNTIL_REVIEWED",
  "task": {"title": "example", "objective": "example", "date": "2026-08-23", "nonGoals": []},
  "cvfPublicSource": {"repository": "https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git", "commit": "0000000000000000000000000000000000000000", "pathsRead": ["README.md"]},
  "sources": [{"id": "SRC-001", "repository": "https://github.com/owner/repository.git", "commit": "0000000000000000000000000000000000000000", "immutableReference": "https://github.com/owner/repository/blob/0000000000000000000000000000000000000000/README.md", "licenseExpression": "NOASSERTION", "licenseSource": "https://github.com/owner/repository/blob/0000000000000000000000000000000000000000/LICENSE", "usageType": "REFERENCE_ONLY", "ownerSurface": "OWNER_SURFACE_NOT_FOUND", "overlapDisposition": "OWNER_SURFACE_NOT_FOUND"}],
  "origins": [],
  "files": [],
  "excludedPaths": [],
  "dependencies": [],
  "verification": {"commands": [{"command": "exact command", "executed": true, "result": "PASS", "testClass": "negative"}], "passed": 1, "failed": 0, "skipped": 0, "liveCalls": 0},
  "externalEffects": [],
  "secretsReturned": false,
  "knownLimitations": [],
  "unresolvedQuestions": [],
  "suggestedAbsorptionCandidates": []
}
```

Every `sources` row requires an exact commit, immutable source reference,
license expression, immutable license source, usage type, checked owner
surface, and overlap disposition. `verification.commands` must use structured
records and include executed negative semantic evidence when applicable.

Suggested absorption candidates are advisory. CVF independently decides
`ABSORB`, `ADAPT`, `DEFER`, `REJECT`, `BLOCK`, or `NO_NEW_VALUE` after source,
owner, overlap, and evidence review.

## Verification report

Record every command with environment, result, evidence class, and notes.
Separate static inspection, build/typecheck/lint, unit/integration tests,
manual review, mock behavior, and live/provider behavior.

Never turn an unexecuted command into PASS. Report failures, partial runs,
skips, environmental blockers, provider call count, and missing credentials.

## Final response shape

```text
Mode:
Outcome:
Output root:
Public CVF commit reviewed:
Verification:
External effects:
Top limitations:
Suggested absorption candidates:
Secrets returned: no
```

## CVF-side round trip

```text
public CVF context + short operator objective
-> external review/design/build
-> provenance-rich candidate repository
-> CVF integrity and source verification
-> manifest and terminal processing ledger
-> owner/overlap/value reconciliation
-> ABSORB / ADAPT / DEFER / REJECT / BLOCK / NO_NEW_VALUE
-> separately authorized CVF-native implementation
-> independent review and closure
```

The structured return shape accelerates intake. It never skips CVF's
independent semantic review or grants direct import, runtime, provider,
publication, deployment, or production authority.

## Claim boundary

This public guide supplies reusable context and return instructions only. It
does not grant private provenance access, approve licenses, authorize external
effects, validate an external return, prove absorption completeness, or make
external output canonical.
