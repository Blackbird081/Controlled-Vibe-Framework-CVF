# CVF LPCI2 PolicyLocal Build Control Packet

Memory class: FULL_RECORD

Status: ACTIVE

docType: reference

Date: 2026-06-03

executionBaseHead: `3ff90651`

## Purpose

Provide the mandatory build-control contract for PolicyLocal, the local-first
legal/policy corpus intelligence app. This packet turns the existing frontend
handoff into a CVF/LPCI-governed implementation target.

PolicyLocal may be a real product later. This packet prevents the product from
becoming only a nice search/chat UI by requiring citation, freshness, audit,
abstention, corpus-intelligence, and local-owner boundaries from the beginning.

## Scope / Applies To

Applies to: future PolicyLocal scaffold, frontend, API, local database,
search, chat, import, freshness, audit, and settings work.

Owner surface: PolicyLocal product implementation; CVF LPCI governance layer.

## Source Inputs

| Source | Role |
| --- | --- |
| `D:\UNG DUNG AI\TOOL AI 2026\CVF-Workspace\PolicyLocal\CLAUDE_BUILD_HANDOFF.md` | frontend build handoff and product skeleton |
| `D:\UNG DUNG AI\TOOL AI 2026\CVF-Workspace\PolicyLocal\CODEX_POLICYLOCAL_SPEC_REVIEW_2026-06-02.md` | CVF addendum identifying required boundary controls |
| `docs/reference/CVF_LPCI1_T1_CORPUS_INTAKE_SPEC_2026-06-02.md` | intake, hash, normalized path, source record boundary |
| `docs/reference/CVF_LPCI1_T2_DOMAIN_CLASSIFICATION_SPEC_2026-06-03.md` | domain classification and answer classes |
| `docs/reference/CVF_LPCI1_T3_SEARCH_FILTER_INDEX_SPEC_2026-06-03.md` | faceted search/filter model |
| `docs/reference/CVF_LPCI1_T4_RETRIEVAL_BOUNDARY_SPEC_2026-06-03.md` | citation-first retrieval and audit receipt boundary |
| `docs/reference/CVF_LPCI1_T7_TEMPLATE_PACKAGING_SPEC_2026-06-03.md` | workspace adoption, readiness checklist, Vietnamese NFC, C4/C5 test corpus |

## Build Principles

| Principle | Rule |
| --- | --- |
| Local ownership | Corpus stays local. No cloud upload by default. |
| Citation first | A substantive answer requires cited source evidence. |
| Abstain beats guessing | Missing citation, missing freshness, or ambiguous authority must produce `ESCALATE_OR_ABSTAIN`. |
| Receipts are product features | Search and chat actions must leave inspectable query receipts. |
| Freshness is bounded | The app may report local freshness state only; it must not claim latest law unless a verified update source exists. |
| Vietnamese search preserves meaning | NFC normalize but do not strip Vietnamese diacritics. |
| LLM is optional | The app must remain useful with local search; remote LLM receives selected cited excerpts only. |

## Canonical Answer Classes

PolicyLocal UI may show friendly labels, but storage, API responses, receipts,
and tests must preserve these canonical classes:

| Canonical class | UI label | Minimum evidence |
| --- | --- | --- |
| `DIRECT_CITED_ANSWER` | Trả lời có trích dẫn | at least one citation with source hash and excerpt |
| `SUMMARY_WITH_SOURCE` | Tóm tắt theo nguồn | cited source set; no uncited synthesis |
| `PROCEDURAL_GUIDANCE` | Hướng dẫn thao tác | cited policy/procedure or local app workflow |
| `ESCALATE_OR_ABSTAIN` | Không đủ căn cứ | missing citation, stale/conflicting source, or outside scope |

## Citation Boundary

Chat and search-assisted answers must not return a substantive answer unless
each selected source has:

- `sourcePath`
- `normalizedPath`
- `sourceHash`
- `fileName`
- `excerpt`
- `documentType`
- `freshnessStatus`
- `authorityLevel` or explicit `unknown`
- `effectiveDate` or explicit `unknown`

If the evidence is incomplete, the response must be downgraded to
`SUMMARY_WITH_SOURCE` or `ESCALATE_OR_ABSTAIN` according to the T4 retrieval
boundary. A missing citation must never be patched with model confidence.

## Local Database Minimum Fields

The Claude schema is accepted with this CVF minimum extension:

| Field | Requirement |
| --- | --- |
| `source_hash` | SHA-256 per file or declared manifest proxy |
| `normalized_path` | NR-05 canonical path; Vietnamese paths NFC-normalized before lowercasing |
| `answer_boundary` | canonical answer class or boundary object |
| `owner_surface` | CVF owner surface for the record |
| `evidence_pointer` | pointer to source row, page, section, or excerpt |
| `freshness_status` | local status only: effective, amended, superseded, unknown, etc. |
| `retrieval_receipt_id` | link from answer/search result to audit receipt when available |

## Search / Filter Must-Haves

Before chat work begins, search must support:

- document type;
- jurisdiction;
- authority level;
- issuing body;
- effective date range;
- freshness status;
- answer class;
- sensitivity;
- topic tags;
- negative search evidence for no-result cases.

Stage 3 fulltext search must NFC-normalize Vietnamese text and retain
diacritics. It must preserve original text for citation display.

## Audit Receipt Minimum

Each search or chat result must be able to produce an audit receipt with:

- query text and normalized query;
- filters applied;
- candidate set;
- rejected or excluded candidates;
- selected context;
- citations;
- answer class;
- freshness warnings;
- conflict warnings;
- provider/model if an LLM is used;
- prompt boundary or statement that no LLM was used.

## Future Implementation Gate Order

| Gate | Required proof before next gate |
| --- | --- |
| G1 scaffold | project compiles; no provider call; no corpus import yet |
| G2 corpus import | one TXT/MD/PDF fixture imports with `sourceHash` and `normalizedPath` |
| G3 search | search returns excerpt plus citation metadata and negative evidence |
| G4 receipt | every search result has a persisted audit receipt |
| G5 chat | chat only answers from cited excerpts; otherwise abstains |
| G6 adversarial | test cases cover missing citation, stale source, conflicting source, and Vietnamese diacritics |

## Stop Conditions

Stop before implementation if:

- a task asks for uncited legal advice;
- a task requires uploading the full corpus to a remote provider;
- a task wants chat before import, search, citation, and receipt gates pass;
- raw API keys would be logged or committed;
- the app claims latest/current legal status without a verified update source;
- a production corpus is used without GC-051 registration and source-hash proof.

## PolicyLocal Workspace Copy

This same packet is copied to:

`D:\UNG DUNG AI\TOOL AI 2026\CVF-Workspace\PolicyLocal\CVF_POLICYLOCAL_BUILD_CONTROL_PACKET_2026-06-03.md`

The workspace copy is the practical front door for future PolicyLocal build
sessions. The repo copy is the governed evidence record.

## Claim Boundary

This packet claims a build-control contract only. It does not implement
PolicyLocal, import a corpus, prove legal answer correctness, run provider
calls, or claim public/production readiness.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: packet references a private local workspace path and internal LPCI
governance artifacts. A sanitized public version may be created later.
