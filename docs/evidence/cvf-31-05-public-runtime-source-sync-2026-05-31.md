# CVF 31.05 Public Runtime Source Sync

Memory class: PUBLIC_EVIDENCE_SUMMARY

Status: CURRENT

Date: 2026-05-31

Public-sync commit: this public-sync commit

## Purpose

Record the public runtime-source subset exported after the private provenance
Learning Plane activation and public-sync quality-hardening work. This packet
exists so future agents do not have to infer whether the source was exported,
left private, or blocked by dependency drift.

## Scope / Target / Owner Boundary

Scope: public-sync runtime-source subset for additive advisory readouts,
Learning Plane/finding-to-learning intake, provider-method support contracts,
and the governed file-size guard hardening needed to keep route changes
maintainable.

Target repository: `https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git`

Owner boundary: selected source, tests, guard code, and public evidence only.
Private handoffs, raw provider transcripts, internal session state, hidden IDE
history, operator-only notes, and `.private_reference/` material remain outside
this public artifact.

## Source / Predecessor Evidence

Predecessor evidence is the private provenance RT1/RT2/RT3/RW1 Learning Plane
activation sequence and the public-sync quality-hardening closure. The relevant
private receipts and completion artifacts remain in provenance; this public
packet exports only the curated source subset and public claim boundary.

## Exported Runtime Source Set

The public-sync subset now includes:

- `/api/execute` response readout extraction and route wiring:
  `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/execute/route.ts`
  and `route-response-readouts.ts`
- Learning Plane readout route:
  `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/learning-plane/readout/`
- Finding-to-learning bridge:
  `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/finding-to-learning-bridge.ts`
- Advisory readout helpers for pipeline chain, worker timeout, reviewer
  deadlock, context budget, orchestrator feedback, Learning Plane readout,
  spec-first mediation, English freeze, and VI5 language readout.
- Learning Plane foundation additions for context budget guard, adaptation
  policy, truth calibration, reputation routing, simulation, learning-signal
  intake, memory lifecycle, durable memory, and graph authority/storage.
- Model Gateway provider-method and vision support contracts.
- Governed file-size guard hardening:
  `governance/compat/check_governed_file_size.py` and
  `governance/compat/test_check_governed_file_size.py`

## Classification

This is a `runtime-source subset export`.

It does not reclassify `CVF_v1.6_AGENT_PLATFORM` as a full public package. The
extension remains enterprise-private by default, with this specific source
subset recorded as publicly exported. Future agents must not treat this packet
as permission to export hidden session files, private provenance docs, complete
enterprise UI surfaces, raw environment files, or unrelated runtime modules.

## Verification Basis

Commands run from the public-sync clone:

```bash
npm run check
npm run lint -- --quiet
npm run build
npx vitest run src/app/api/learning-plane/readout/route.test.ts src/lib/finding-to-learning-bridge.test.ts src/app/api/execute/route.test.ts --reporter=dot
python governance/compat/test_check_governed_file_size.py
python governance/compat/check_governed_file_size.py --enforce
python governance/compat/check_public_export_disposition.py --base d06e7e34a --head HEAD --enforce
python governance/compat/check_docs_governance_compat.py --base d06e7e34a --head HEAD --enforce
python governance/compat/check_markdown_structural_completeness.py --base d06e7e34a --head HEAD --enforce
git diff --check
```

Live-governance proof remains bounded to the private provenance receipts
already recorded for RT1/RT3/RW1. This public-source sync does not create a new
hosted release claim by itself.

## Agent Follow-Up Rule

When a future agent closes private provenance work that changes a public-facing
claim, route surface, guard, or catalog row, the agent must do one of the
following before claiming public sync is complete:

1. export the public-safe source/docs subset from the public-sync clone and cite
   the public commit and paths;
2. mark the work `DEFERRED_PRIVATE_ONLY` with a concrete reason; or
3. mark the work `BLOCKED_MISSING_PUBLIC_ARTIFACTS` with the next action.

The agent must not silently leave public GitHub stale after a public-facing
claim changes.

## Public Export Disposition

Disposition: `EXPORTED`

Public-sync remote: `https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git`

Public-sync commit: this public-sync commit

Public artifact paths:

- `docs/evidence/cvf-31-05-public-runtime-source-sync-2026-05-31.md`
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/execute/route-response-readouts.ts`
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/learning-plane/readout/route.ts`
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/finding-to-learning-bridge.ts`
- `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/learning-signal-intake-bridge.ts`
- `EXTENSIONS/CVF_MODEL_GATEWAY/src/vision-runtime-adapter.ts`
- `governance/compat/check_governed_file_size.py`

Public catalog paths:

- `docs/reference/CVF_TECHNICAL_PRODUCT_CATALOG_2026-05-18.md`

## Claim Boundary

This packet proves that the named public-sync source subset exists and passes
the verification stated above. It does not prove production readiness, hosted
freshness, universal provider parity, cost optimization, autonomous rule
mutation, autonomous memory reinjection, or full private enterprise source
publication.

## Decision

Publish this runtime-source subset to public GitHub as the bounded public sync
for Learning Plane readouts, finding-to-learning intake, provider-method support
contracts, and route maintainability guard hardening. Keep the remaining
enterprise app/session/provenance surfaces private unless a later public export
batch names and verifies them explicitly.
