# CVF Governed Document Artifact Rendering Spec - 2026-05-16

Memory class: POINTER_RECORD

Document type: CANONICAL-CANDIDATE - CVF PRESENTATION BOUNDARY

Source lineage: normalized from CVF 16.5 `md2html` drafts and adjacent
html-artifact notes captured in `md2html/Thong_tin.md`.

## Purpose

This document defines the safe role of document artifact rendering in CVF.

Rendering can make governance material easier to review. It must not change the
meaning, evidence state, or claim boundary of the source document.

## Source Destination Map

The source bundle proposed `EXTENSIONS/CVF_DOCUMENT_ARTIFACT_RENDERER/`.

Current disposition:

- docs-only boundary accepted;
- runtime renderer deferred;
- no new UI/editor app;
- no PNG/PDF/PPTX/social export tranche;
- future implementation must map to existing docs/evidence publication surfaces
  before creating a new extension.

The source `md2html` files should be reused as fixture/spec candidates if a
future roadmap opens artifact rendering:

- `CVF_DOCUMENT_ARTIFACT_RENDERER.md`
- `CVF_ARTIFACT_RENDERING_PROTOCOL.md`
- `CVF_ARTIFACT_COMPONENT_CATALOG.md`
- `CVF_ARTIFACT_TEMPLATE_SPEC.md`
- `CVF_ARTIFACT_VERIFICATION_CHECKLIST.md`
- `CVF_ARTIFACT_RENDERING_POLICY.md`
- `CVF_ARTIFACT_RENDERING_ADAPTER.md`

## Core Rule

Rendered artifact is presentation. Source document and CVF governance remain
authority.

Priority order:

```text
CVF doctrine
> source document
> verification receipt
> rendered artifact
```

## Accepted Inputs

- governance review;
- provider proof;
- evidence receipt;
- implementation plan;
- release gate summary;
- benchmark summary;
- handoff packet;
- public-facing evidence summary after sensitivity review.

## Rendering Protocol

```text
resolve source document
-> classify document type and sensitivity
-> select approved template and components
-> render self-contained HTML
-> run artifact verification
-> attach provenance metadata
-> store or export as governed artifact candidate
```

## Approved Component Families

- table of contents;
- metadata panel;
- callout;
- risk box;
- decision card;
- timeline;
- Mermaid diagram when allowed;
- comparison table;
- evidence receipt block;
- approval block;
- limitation block.

Agents must not invent new components for governed artifacts unless a future
component catalog update approves them.

## Template Requirements

Rendered artifacts should use:

- single-file HTML for first tranche;
- no remote CSS;
- no tracking;
- no analytics beacon;
- no credential collection;
- stable heading IDs;
- visible CVF metadata header;
- provenance block;
- visible failed checks and limitations;
- sandboxed preview if rendered inside a UI.

External JavaScript is denied by default. Mermaid or similar rendering support
requires explicit allowlist and verification.

## Meaning Preservation

Renderer must not:

- rewrite governance decisions;
- soften restrictions;
- exaggerate capability;
- remove limitations;
- hide uncertainty;
- invent audit evidence;
- downgrade risk;
- upgrade provider status;
- hide rejected approval or failed checks.

Provider claim states must remain bounded:

- `live-tested`
- `evidence-backed`
- `adapter-ready`
- `planned`
- `unsupported`
- `unknown`

Forbidden upgrades include `planned -> evidence-backed` and
`adapter-ready -> live-tested`.

## Verification Checklist

An artifact is not governed unless these checks pass or are explicitly marked
not applicable:

- source path recorded;
- source hash or commit recorded when available;
- no unresolved placeholder;
- no hidden external network call;
- no raw secret;
- no invented evidence;
- failed checks remain visible;
- risk levels preserved;
- approval states preserved;
- TOC links valid;
- Mermaid syntax valid when used;
- sandbox policy documented when previewed.

## Export Boundary

Accepted first output: HTML.

Deferred:

- PNG;
- PDF;
- PPTX;
- social-platform exports;
- clipboard-rich export;
- live editor app.

Those exports may be useful later, but they widen the attack and claim surface.

## Runtime Boundary

This spec does not implement a renderer. Future implementation requires a
bounded roadmap, source/HTML fixtures, secret-scan coverage, artifact
verification tests, and live governance proof if artifact generation is claimed
as governed CVF behavior.
