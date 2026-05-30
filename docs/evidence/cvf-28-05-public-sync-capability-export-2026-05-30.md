# CVF 28.05 Public-Sync Capability Export

Memory class: PUBLIC_EVIDENCE_SUMMARY

Status: CURRENT

Date: 2026-05-30

Public-sync commit: this public-sync commit

## Purpose

Record the public-safe export boundary for the Delta, WCE, EL, PM, LHW15, and
LHW16 waves. This packet gives public readers a compact evidence route without
publishing private session handoffs, raw IDE histories, operator-only logs, or
ignored internal roadmap/review/baseline folders as the product surface.

## Scope / Target / Owner Boundary

Scope: public-sync catalog and evidence publication for CVF 28.05 capability
summaries.

Target repository: `https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git`

Owner boundary: public documentation and public reference/evidence artifacts
only. Private provenance handoffs, internal reviews, hidden IDE histories,
ignored baselines, and raw operator/provider transcripts remain outside this
public artifact.

Runtime-source boundary: Delta/WCE/EL/PM source and tests are not claimed as a
public-build-ready export in this batch. They require a later runtime-source
sync wave that can update the public code subset without breaking public
workspace verification.

## Source / Predecessor Evidence

Predecessor evidence comes from the private provenance wave closures reported
for Delta, WCE, EL, PM, LHW15, and LHW16, plus the public-safe reference and
provider-method evidence files listed below. This packet is the public catalog
boundary for those claims, not a replacement for private audit provenance.

## Exported Artifact Set

| Wave | Public exported artifacts | Public claim |
| --- | --- | --- |
| Delta D1/D2/D3 | Delta public boundary specs and this curated public evidence summary | Additive advisory pipeline-chain readout and local MCP/CLI bridge capability boundary; runtime source/test export requires a separate public runtime-source sync wave |
| WCE W1/W2/W3 | MA1 CLI serialization connector spec and this curated public evidence summary | Local CLI workflow-chain execution, MA1 packet serialization, and per-role provider-map payload boundary; runtime source/test export requires a separate public runtime-source sync wave |
| EL-2/EL-3 | EL public evidence record where available and this curated public evidence summary | Additive advisory readout boundary on governed `/api/execute` ALLOW responses; runtime source/test export requires a separate public runtime-source sync wave |
| PM-1/PM-2/PM-3 | provider-method public evidence records and this curated public evidence summary | Bounded provider-method capability proof for named methods/providers; no governed-route or release-quality claim from direct provider scripts alone |
| LHW15 | three connector specs for runtime trend, workflow resume, and context packaging advisories | Documentation-only connector standards; no runtime execution claim |
| LHW16 | three connector specs for database-action proof, MCP approval proof, and code-intelligence adapter boundary advisories | Documentation-only connector standards; no database/MCP/code-intelligence runtime execution claim |

## Public Artifact Paths

Delta/WCE/EL/PM public evidence and boundary records:

- `docs/reference/CVF_DELTA_D2_MCP_WRITE_TOOLS_SECURITY_BOUNDARY_2026-05-29.md`
- `docs/reference/CVF_DELTA_D3_SANDBOX_BOUNDARY_SPEC_2026-05-29.md`
- `docs/reference/CVF_WCE_W2_MA1_CLI_SERIALIZATION_CONNECTOR_SPEC_2026-05-29.md`
- `docs/reference/evidence/execution-layer/CVF_EL2_WORKER_TIMEOUT_EVIDENCE_2026-05-29.md`
- `docs/reference/evidence/provider-methods/json-mode/CVF_PM1_JSON_MODE_DEEPSEEK_CHAT_EVIDENCE_2026-05-29.md`
- `docs/reference/evidence/provider-methods/json-mode/CVF_PM1_JSON_MODE_GPT4O_EVIDENCE_2026-05-29.md`
- `docs/reference/evidence/provider-methods/streaming/CVF_PM2_STREAMING_QWEN_TURBO_EVIDENCE_2026-05-29.md`
- `docs/reference/evidence/provider-methods/tool-call/CVF_PM3_TOOL_CALL_BOUNDARY_RECORD_2026-05-29.md`

LHW15/LHW16 connector specs:

- `docs/reference/CVF_LHW15_T1_RUNTIME_OBSERVABILITY_TREND_ADVISORY_CONNECTOR_SPEC_2026-05-30.md`
- `docs/reference/CVF_LHW15_T2_WORKFLOW_RESUME_RECOVERY_ADVISORY_CONNECTOR_SPEC_2026-05-30.md`
- `docs/reference/CVF_LHW15_T3_CONTEXT_PROFILE_PACKAGING_ADVISORY_CONNECTOR_SPEC_2026-05-30.md`
- `docs/reference/CVF_LHW16_T1_DATABASE_ACTION_PROOF_ADVISORY_CONNECTOR_SPEC_2026-05-30.md`
- `docs/reference/CVF_LHW16_T2_MCP_APPROVAL_PROOF_ADVISORY_CONNECTOR_SPEC_2026-05-30.md`
- `docs/reference/CVF_LHW16_T3_CODE_INTELLIGENCE_ADAPTER_BOUNDARY_CONNECTOR_SPEC_2026-05-30.md`

## Verification Basis

The public-sync batch exports reference specs, provider-method evidence records,
and a curated evidence summary. It does not re-run hidden IDE sessions,
reconstruct private agent histories, or claim that runtime source/test files
have been published as a build-clean public artifact set.

Expected local verification commands for this batch:

```bash
python governance/compat/check_docs_governance_compat.py
python governance/compat/check_markdown_structural_completeness.py
git diff --check
```

A separate public runtime-source sync wave is required before the catalog may
claim that Delta/WCE/EL/PM implementation source and tests are public-build
ready. During this batch, direct source sync attempts exposed public-sync
runtime dependency lag, so the source/test export was not committed.

## Public Claim Boundary

This export may claim:

- additive advisory readouts on selected governed `/api/execute` responses;
- local MCP write/submit tooling and a whitelisted in-process CLI bridge;
- local CLI workflow chaining, MA1 packet serialization, and per-role provider
  payload routing support;
- bounded provider-method capability proof for named methods and providers;
- LHW15/LHW16 documentation-only connector standards.

This export does not claim:

- production readiness, hosted readiness, or freeze release;
- public-build-ready runtime source/test export for Delta/WCE/EL/PM;
- universal provider parity or cost optimization;
- autonomous multi-provider scheduling across IDE extensions;
- arbitrary shell execution through MCP;
- database action execution, MCP approval execution, or live code-intelligence
  adapter execution for LHW16;
- end-user SSE delivery for streaming;
- that ignored internal roadmaps, reviews, baselines, handoffs, or raw private
  provenance logs are public product artifacts.

## Public Export Disposition

Disposition: `EXPORTED`

Public-sync remote: `https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git`

Export boundary: public reference specs, provider-method evidence records, and
curated evidence summary. Runtime source/test export for Delta/WCE/EL/PM is
blocked until a separate public runtime-source sync wave can publish a
build-clean source set. Internal roadmaps, reviews, baselines, and session
handoffs remain private provenance or ignored local artifacts unless separately
curated into public evidence.

## Decision

Publish this as the public catalog evidence boundary for the CVF 28.05
Delta/WCE/EL/PM/LHW15/LHW16 export batch. Internal roadmaps, reviews,
baselines, and session handoffs remain outside the public product surface.
