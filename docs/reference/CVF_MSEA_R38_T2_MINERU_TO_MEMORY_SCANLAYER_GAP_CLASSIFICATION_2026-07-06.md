# CVF MSEA R38 T2 - MinerU To Memory ScanLayer Gap Classification

Memory class: reference-audit

docType: reference

Status: ACTIVE_REFERENCE

Created: 2026-07-06

rawMemoryReleased: false

## Purpose

This reference classifies every remaining gap in the MinerU-to-memory/
scanlayer chain named by T1, by authority type and value, so the operator's
system-chain question is answered without deepening any low-value or
use-case/legal lane.

## Scope / Applies To

Applies only to the gaps surfaced by
`docs/reference/CVF_MSEA_R38_T1_MINERU_TO_MEMORY_SCANLAYER_CURRENT_CHAIN_MAP_2026-07-06.md`.
Does not apply to any new capability not already named in T1's chain map.

## Gap Classification

| Gap | Source evidence | Authority needed | Value |
| --- | --- | --- | --- |
| Production memory/RAG route release | `mineru-memory-rag-route-release.ts` line 33-34 holds `MEMORY_RAG_ROUTE_RELEASE_NOT_PRODUCTION_AUTHORIZED_BY_T22`; R34-T2 line 55-56 names a fresh memory-owner GC-018 as the missing authority | Fresh memory-owner GC-018 and explicit production-persistence decision | High if opened, but only when an operator names it as the priority lane; R28-T23 already reached this exact decision point once and did not authorize it |
| File-backed persistence | R35-T2 lines 73-74 confirms `createFileBackedDurableMemoryStore` exists in source with no authorized caller | Fresh persistence/privacy/provenance proof packet | Medium; blocked on the same operator-priority gate as the memory/RAG route, not on missing source |
| Provider/live proof | No source surface in T1 executes a provider or live MinerU run | Fresh live-diagnostic proof packet per `docs/reference/CVF_LIVE_RUN_DIAGNOSTIC_STANDARD_2026-05-24.md` | Medium; only valuable once a production route is actually being released, not before |
| Scan-layer integration into the TypeScript chain | `scan_route_decision.py` and `scan_outcome_report.py` are Python-only; the internal harness (`mineru-internal-system-chain-harness.ts` line 38-39) records the Python bridge as not wired, and no cited source calls the scan-layer modules from the TypeScript chain | A bridge extension packet mapping scan-layer output into the same fixture-to-invocation path already used for the receipt writer | Low-to-Medium; the receipt-writer bridge already proves the pattern, so a scan-layer bridge is incremental, not foundational |
| Private-output policy | No cited source reads or releases private/generated MinerU output content | A dedicated private-output policy packet, separate from this audit | Held; `docs/reference/CVF_MSEA_R30_T3_MINERU_PRIVATE_OUTPUT_POLICY_RELEASE_DECISION_2026-07-05.md` line 40 already recorded `R30_PRIVATE_OUTPUT_POLICY_NOT_RELEASED` and no new source changes that |
| Public/runtime claim | No cited source exposes a public route, hosted endpoint, or runtime wrapper | A public-readiness packet after production route release, not before | No current value; opening this before the memory/RAG route gate is a sequencing error |
| Use-case/legal workflow | No cited source implements any use-case or legal-document workflow | A separate operator-selected roadmap, per the R38 work order's Forbidden Scope | No current value under this packet; explicitly out of scope |

## No-Lane-Deepening Rule

Do not open a work order for the public/runtime claim gap, the use-case/legal
workflow gap, or the provider/live proof gap from this packet. Each requires
a fresh source-verified packet with an operator-named priority, per R34-T2's
prior finding that no single held lane is more source-ready than the others.
Opening one without an explicit operator selection would substitute worker
judgment for the operator's stated need to choose one narrow lane at a time.

## Claim Boundary

This reference classifies gaps using only the source and closure evidence
cited in T1 and in the R30/R34/R35 artifacts referenced above. It does not
authorize opening any of the listed gaps, does not claim production
readiness for any lane, and does not itself constitute a work order.
