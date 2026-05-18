# CVF Technical Product Catalog

Memory class: POINTER_RECORD
Status: PUBLIC-CATALOG DRAFT

## Purpose

This catalog gives users, developers, and agents a compact technical map of
Controlled Vibe Framework (CVF). It separates what is already proven from what
is intentionally bounded or still roadmap work.

## Scope

This is a public orientation document. It links only to public repository
surfaces and does not expose private provenance or legacy reference folders.

Catalog reconciliation model:

- This public-sync file is the customer-facing derivative.
- The provenance copy at the same relative path is the annotated internal
  source copy.
- The two files may differ in annotation density, but they must not disagree
  on product claims or claim boundaries.

## Owner

Owner surface: public/product orientation and claim-boundary documentation.

## Requirements

This catalog must separate proven, bounded, and roadmap capabilities; link only
to public repository surfaces; and preserve the mandatory live-governance-proof
boundary.

## What CVF Is

CVF is a governance-first control framework for AI-assisted execution.

It places a governed control plane between user intent, agent/runtime actions,
provider calls, policy checks, and evidence receipts. Its practical purpose is
to make AI work safer, more auditable, and more repeatable for both developers
and non-coders.

The core operating loop is:

```text
INTAKE -> DESIGN -> BUILD -> REVIEW -> FREEZE
```

## Product Catalog

| Capability | Current status | What to verify |
|---|---|---|
| Governance control plane | proven and active | `ARCHITECTURE.md`, `GOVERNANCE.md`, `governance/toolkit/05_OPERATION/CVF_AUDIT_PROTOCOL.md` |
| Live governance proof | mandatory for release claims | `scripts/run_cvf_release_gate_bundle.py`, `docs/evidence/latest-release-gate.md` |
| Non-coder governed path | proven on bounded provider lanes | `docs/reference/CVF_PUBLIC_NONCODER_VALUE_STATEMENT_2026-04-17.md`, `docs/evidence/web-governance-path.md` |
| Provider lanes | certified only where evidence exists | `docs/evidence/provider-lanes.md` |
| Knowledge-backed execution | proven in bounded execute path | `docs/evidence/cvf-16-5-runtime-absorption.md`, `docs/evidence/web-governance-path.md` |
| Deliverable packs and evidence export | implemented in web product path | `README.md`, `docs/evidence/web-governance-path.md` |
| External asset/capability governance | partially productized | `docs/evidence/web-governance-path.md`, `docs/reference/CVF_PUBLIC_STRUCTURE_OVERVIEW.md` |
| Role and agent governance | partially absorbed | `governance/toolkit/03_CONTROL/CVF_AGENT_REGISTRY.md`, `governance/toolkit/05_OPERATION/CVF_AGENT_HANDOFF_GUARD.md` |
| Memory and continuity | partially absorbed | `docs/reference/CVF_PUBLIC_STRUCTURE_OVERVIEW.md`, `governance/toolkit/05_OPERATION/CVF_MEMORY_GOVERNANCE_GUARD.md` |
| Provider method breadth | demand-gated | provider evidence and roadmap docs; no universal provider-method parity claim |
| Operational observability | partially absorbed | `docs/evidence/`, runtime and operations docs |
| Tool/MCP/database action governance | roadmap | current tool guards exist, but full action taxonomy is not claimed |
| Async workers/subagents | roadmap | sandbox concepts exist, but canonical async lifecycle is not claimed |
| Graph/code-intelligence context | roadmap | no full graph-native context resolver claim yet |

## What Users Can Expect

CVF gives users a governed AI path that records decisions and evidence instead
of treating AI output as an untracked chat transcript.

For non-coders, CVF is strongest where the request enters a trusted form or
bounded governed workflow. For developers, CVF is strongest where phase,
guard, policy, and evidence contracts are respected by the repository workflow.

## What Developers Can Verify

Start here:

- `README.md`
- `ARCHITECTURE.md`
- `docs/GET_STARTED.md`
- `docs/evidence/README.md`
- `docs/evidence/latest-release-gate.md`
- `docs/evidence/provider-lanes.md`
- `docs/evidence/web-governance-path.md`

Release-quality governance proof uses:

```bash
python scripts/run_cvf_release_gate_bundle.py --json
```

Mock-only UI checks are not sufficient for claims that CVF controls AI or
provider behavior.

## Verification

Readers can verify the public claims through the linked architecture, evidence,
provider-lane, and release-gate files in this repository.

Codex reconciliation check:

- `START_HERE.md` and `docs/INDEX.md` were removed from this catalog because
  they were not present in the public-sync clone at reconciliation time.
- Directory-only references were replaced with concrete file paths where a
  stable public file was available.

Claude N-1 correction (2026-05-18):

- Codex's first reconciliation round added `docs/audits/alibaba-canary/INDEX.md`
  and `docs/audits/deepseek-canary/INDEX.md` to the Provider lanes row. Those
  two paths exist in the provenance repository but **do not exist in this
  public-sync clone** (`docs/audits/` is empty here). The two paths were
  removed; the Provider lanes row now points only at the verified
  `docs/evidence/provider-lanes.md`.
- Lesson for Codex: when Model B (public-sync = customer-facing derivative)
  is chosen, every public-sync catalog path must be `Test-Path`-verified
  **on the public-sync filesystem**, not on the provenance repository.
  Copying provenance paths into public-sync without re-verification reproduces
  the same C-1 failure mode the matrix correction was meant to retire.

Verification command run in public-sync (Claude re-verified after N-1 fix):

```powershell
Test-Path README.md
Test-Path ARCHITECTURE.md
Test-Path docs/GET_STARTED.md
Test-Path docs/evidence/README.md
Test-Path docs/evidence/latest-release-gate.md
Test-Path docs/evidence/provider-lanes.md
Test-Path docs/evidence/web-governance-path.md
Test-Path docs/reference/CVF_PUBLIC_NONCODER_VALUE_STATEMENT_2026-04-17.md
Test-Path GOVERNANCE.md
Test-Path governance/toolkit/05_OPERATION/CVF_AUDIT_PROTOCOL.md
Test-Path docs/evidence/cvf-16-5-runtime-absorption.md
Test-Path docs/reference/CVF_PUBLIC_STRUCTURE_OVERVIEW.md
Test-Path governance/toolkit/03_CONTROL/CVF_AGENT_REGISTRY.md
Test-Path governance/toolkit/05_OPERATION/CVF_AGENT_HANDOFF_GUARD.md
Test-Path governance/toolkit/05_OPERATION/CVF_MEMORY_GOVERNANCE_GUARD.md
```

Result after N-1 fix: 15/15 PASS in public-sync. The two removed paths
(`docs/audits/alibaba-canary/INDEX.md`,
`docs/audits/deepseek-canary/INDEX.md`) returned False before removal and
are no longer cited.

## What Agents Must Respect

Agents using CVF should treat the repository as a governed workspace, not a
free-form coding sandbox.

Required posture:

- read the front-door instructions before changing files;
- preserve provenance/public repository boundaries;
- do not print or commit API keys;
- do not claim governance behavior without live proof;
- record gaps instead of silently absorbing broad legacy concepts;
- use roadmap and approval gates for substantial continuation.

## Claim Boundary

CVF may claim:

- governance-first AI control framework;
- bounded live non-coder value;
- evidence-backed provider lanes where receipts exist;
- governed knowledge-backed execution in the proven path;
- public auditability through docs, evidence packets, guards, and release gates.

CVF must not claim yet:

- complete Agent OS status;
- full universal provider parity;
- full external capability marketplace readiness;
- full legacy repository absorption;
- unrestricted autonomous self-improvement;
- complete role-permission, memory-reinjection, async-worker, graph-context,
  database-action, or provider-method coverage.

## Final Clause

This catalog is deliberately conservative. It is useful for evaluation because
it separates proven product behavior from roadmap ambition.
