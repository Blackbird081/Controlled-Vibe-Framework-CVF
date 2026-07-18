# CVF Product Requirement Governance Reference Front Door

Memory class: POINTER_RECORD

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-06-28

## Purpose

Provide the stable CVF-owned front door for Product Requirement Governance
after PRG-T1 promotion from the operator-provided external package.

This folder owns documentation contracts for turning product intent into
traceable requirement artifacts before SPEC and Work Order authoring.

## Scope / Target / Owner Boundary

Target: product requirement artifact shape, metadata discipline, validation
split, review lane boundary, decision/evidence traceability, and product to
SPEC to Work Order handoff discipline.

Owner boundary: this reference folder is documentation authority only. It does
not create a product-management application, runtime validator, generated
registry, provider proof, public artifact, package certification, or direct
implementation path.

## Active References

| Reference | Role |
|---|---|
| `CVF_PRG_PRODUCT_REQUIREMENT_CONTRACT.md` | Canonical PRG contract promoted from the external package and adapted into CVF form |

## External Knowledge Intake Routing

| Field | Value |
|---|---|
| Chain map | `docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md` |
| Input type | operator-provided external comparison, critique, or recommendation |
| Chain map route | operator-provided package plus PRG-T0 roadmap -> adapt selected primitives -> promote into CVF-owned reference surface |
| Matching local-view guard | `governance/compat/check_external_knowledge_intake_routing.py` |
| Owner surface | `docs/reference/product_requirement_governance/` |
| Disposition | ADAPT selected package primitives into CVF-owned reference contract |
| Claim boundary | external package content remains source input only; this folder owns only the adapted CVF contract |

## Design Control Gate

Accepted design:

- adapt useful package content into CVF headings, status language, source
  boundaries, and claim boundaries;
- keep product requirement governance upstream of SPEC and Work Order;
- preserve deterministic validation and reviewer judgment as separate lanes;
- keep external repo code, Claude-specific skill format, hooks, and
  orchestrator material outside CVF authority.

Rejected design:

- direct copy of AGPL source code from the external repository;
- direct promotion of the root package folder as canonical authority;
- product requirement artifacts bypassing SPEC or Work Order gates;
- critique or LLM review acting as validation, approval, or freeze authority.

## Dual Agent Surface Matrix

| Consumer class | Interface or owner surface | Authority and risk boundary | Evidence | Adapter boundary | Disposition |
|---|---|---|---|---|---|
| `INTERNAL_AGENT` | `docs/reference/product_requirement_governance/` | agents may read this as a CVF reference contract but cannot treat it as runtime validation or implementation authority | PRG-T1 baseline, work order, and completion review | N/A with reason: internal documentation reference only | `CONTRACT_ONLY` |
| `EXTERNAL_AGENT_CLI_MCP` | future public-safe or adapter readout of PRG concepts | no external adapter, MCP tool, or public readout is implemented by PRG-T1 | this README records deferred external posture | separate GC-018/source-verified work order required before any adapter or public surface | `DEFERRED_WITH_REASON` |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: PRG-T1 is private provenance reference promotion. Public-safe PRG
summary or external adapter surface requires a separate public-sync decision.

## Claim Boundary

This folder is a documentation reference surface only. It does not implement
validators, mutate runtime/source, authorize provider/live proof, create public
claims, certify a package, replace SPEC or Work Order, or make the original
root package folder canonical.
