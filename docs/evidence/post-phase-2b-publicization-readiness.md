# Post Phase 2.B Publicization Readiness

Memory class: POINTER_RECORD

Status: PUBLIC-SAFE BOUNDED EVIDENCE SUMMARY - 2026-05-21

## Purpose

Summarize the public-safe evidence boundary after the private provenance
repository closed Phase 2.B runtime coherence, one live governance proof, and
two narrow repeatability evidence windows across two provider lanes.

This file is a curated public evidence summary. Raw provenance packets and
operator environment details remain private.

## Scope

In scope:

- Bounded Phase 2.B internal coherence summary.
- One governed `/api/execute` live proof summary.
- Narrow repeatability evidence across Alibaba and DeepSeek, including a
  second-window proof.
- Public claim boundaries.

Out of scope:

- Raw private proof packets.
- API keys or operator environment details.
- Broad provider stability.
- Production/hosted readiness.
- Maika child-data/photo/vision proof.
- Persistence/database readiness.
- Kernel-owner replacement or freeze release.

## Evidence

Private provenance proof recorded:

| Evidence | Result | Public-safe boundary |
| --- | --- | --- |
| Runtime coherence graph | PASS | Internal deterministic Phase 2.B coherence graph, checksum `fnv1a32:5d3d2dac`. |
| Live governed route proof | PASS | One Alibaba `qwen-turbo` `/api/execute` proof with live evidence receipt. |
| Mandatory release gate | PASS | Seven checks passed on 2026-05-21, including live governance E2E. |
| Initial narrow provider repeatability | PASS `4/4` | Two Alibaba + two DeepSeek governed `/api/execute` journeys. |
| Second-window provider repeatability | PASS `6/6` | Three Alibaba + three DeepSeek governed `/api/execute` journeys. |

Provider repeatability details:

| Provider | Model | Journeys | Result | Boundary |
| --- | --- | --- | --- | --- |
| Alibaba/DashScope | `qwen-turbo` | 2 initial + 3 second-window | PASS `5/5` | Governed `/api/execute` route only. |
| DeepSeek | `deepseek-chat` | 2 initial + 3 second-window | PASS `5/5` | Governed `/api/execute` route only. |

Every repeatability journey required:

- HTTP 200;
- `success=true`;
- live evidence mode;
- governance receipt present;
- route id `/api/execute`;
- provider routing `ALLOW`;
- no mock fallback;
- no raw key output.

## Decision

Public catalog language may say:

> CVF has bounded Phase 2.B internal coherence evidence and narrow
> two-window, two-provider governed `/api/execute` repeatability evidence
> across Alibaba `qwen-turbo` and DeepSeek `deepseek-chat`.

## Claim Boundary

This file does not claim:

- broad provider stability;
- universal provider parity;
- production/hosted readiness;
- database or persistence readiness;
- Maika child-data/photo/vision proof;
- kernel-owner replacement;
- global freeze lift.
