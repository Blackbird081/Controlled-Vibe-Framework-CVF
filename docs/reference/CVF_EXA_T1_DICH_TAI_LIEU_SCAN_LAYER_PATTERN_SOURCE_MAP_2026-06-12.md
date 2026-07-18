# CVF EXA-T1: Dich Tai Lieu Scan Layer Pattern Source Map

Memory class: FULL_RECORD

Status: REVIEWED_PASS_BOUNDED

docType: source_map

Date: 2026-06-12

Worker: Claude

Parent work order:
`docs/work_orders/CVF_AGENT_WORK_ORDER_EXA_T1_DICH_TAI_LIEU_EXTRACTION_PATTERN_ABSORPTION_FOR_CLAUDE_2026-06-12.md`

---

## Purpose

Record a bounded, source-backed map of extraction patterns in the pinned
external repository for CVF scan-layer learning.

## Scope

This map covers the 15 files named in the processing ledger. The remaining
tracked files are declared exclusions. The map does not claim full-repository
semantic review, runtime verification, dependency fitness, or Policy_Local
readiness.

## Pre-Flight Evidence

| Check | Result |
| --- | --- |
| CVF HEAD | `e010c9d2` (descends from dispatch base `d1167f69`) |
| CVF worktree | clean (no staged or unstaged changes before artifact creation) |
| External remote | `https://github.com/nclamvn/dich-tai-lieu.git` |
| External HEAD commit | `92c5aeb3b4886b6d5a14ea4682dc5e4e1bc1a336` - MATCHES required anchor |
| Commit drift | NONE - anchor verified |
| Worker mode | WORKER_MUST_NOT_COMMIT confirmed |

---

## Corpus Completeness And Report Integrity

- Corpus task class: bounded external-source pattern absorption.
- Corpus root: `https://github.com/nclamvn/dich-tai-lieu` at `92c5aeb3b4886b6d5a14ea4682dc5e4e1bc1a336`.
- Snapshot time: 2026-06-12.
- Enumeration command: `rg --files --hidden --no-ignore` with `.git/` excluded; Codex independently reconciled the result with `git -c core.quotepath=false ls-files`.
- Manifest artifact or inline manifest: this source map.
- Manifest hash: N/A with reason: the external commit is the immutable source anchor and no separate manifest file is created.
- Processing ledger artifact or inline ledger: file-level read ledger plus exact terminal-status totals below.
- Allowed terminal statuses: READ, SKIPPED_WITH_REASON, DEFERRED, BLOCKED_UNREADABLE.
- Reconciliation: manifest=1140; ledger_terminal=1140; exclusions=1125; unresolved=0
- Unresolved files: 0
- Declared exclusions: 1091 tracked text/source files outside the bounded review set and 34 tracked binary assets.
- Unreadable or unsupported files: 34 tracked binary assets classified BLOCKED_UNREADABLE.
- Aggregation check: 15 READ + 1091 SKIPPED_WITH_REASON + 34 BLOCKED_UNREADABLE = 1140 tracked files.
- Drift check: external commit equals `92c5aeb3b4886b6d5a14ea4682dc5e4e1bc1a336`.
- Output traceability: every accepted or deferred pattern below cites a source file and symbol or line anchor.
- Adversarial verification: Codex independently checked counts, source anchors, current CVF owner surfaces, claim boundaries, and license evidence.
- Corpus verdict: PARTIAL

Reason: the authorized 15-file review set was inspected, but 1125 tracked
files were intentionally excluded. The packet is sufficient for bounded
pattern absorption, not full-repository completeness.

---

### File-Level Processing Ledger (Bounded Review Set)

The work order defines a bounded review set. The following files were READ
(source lines inspected directly):

| File path (external) | Status | Notes |
| --- | --- | --- |
| `README.md` | READ | Feature table reviewed (lines 31-35 verified) |
| `core/smart_extraction/__init__.py` | READ | Module exports verified |
| `core/smart_extraction/document_analyzer.py` | READ | 463 lines; relevant dataclasses, thresholds, analysis, and strategy sections inspected |
| `core/smart_extraction/extraction_router.py` | READ | 433 lines; result, analysis, routing, OCR, and return sections inspected |
| `core/smart_extraction/fast_text_extractor.py` | READ | 280 lines; extractor interface and result shape inspected |
| `api/services/eqs.py` | READ | 414 lines; report, weights, scoring, and recommendation sections inspected |
| `api/services/extraction_feedback.py` | READ | 298 lines; strategy, fallback, evaluation, and loop sections inspected |
| `api/services/ocr_language_support.py` | READ | 313 lines; profile, registry, detection, and lookup sections inspected |
| `api/services/provider_router.py` | READ | 362 lines; routing modes, defaults, and selection sections inspected |
| `api/services/translation_memory.py` | READ | 300 lines; service, domain filtering, and similarity sections inspected |
| `api/services/glossary_manager.py` | READ | 312 lines; data model, manager, and term dictionary sections inspected |
| `tests/unit/test_eqs.py` | READ | 372 lines; focused behavior coverage inspected |
| `tests/unit/test_extraction_feedback.py` | READ | 368 lines; focused behavior coverage inspected |
| `tests/unit/test_ocr_language_support.py` | READ | 241 lines; focused behavior coverage inspected |
| `tests/integration/test_smart_router_integration.py` | READ | 52 lines; references `core_v2`, a different module |

**Files in scope but not fully read (out-of-bounds for this wave):**

| File path | Status | Reason |
| --- | --- | --- |
| 1091 remaining text/source files | SKIPPED_WITH_REASON | Outside bounded review set defined by work order; full-repo semantic review not authorized by EXA-T1 scope |
| 34 tracked binary assets | BLOCKED_UNREADABLE | DOCX, PDF, PNG, and TTF assets were enumerated but not parsed because binary-content review was outside scope |
| `core/ocr/paddle_client.py` | DEFERRED | OCR runtime detail; execution not in scope; interface shape noted from router import |
| `ai_providers/` (8 files) | SKIPPED_WITH_REASON | Provider runtime; multi-provider fallback absorption requires separate GC-018 |
| `core/tm/` (7 files) | SKIPPED_WITH_REASON | TM runtime; covered at interface level via `api/services/translation_memory.py` |
| `core/glossary/` (10 files) | SKIPPED_WITH_REASON | Glossary runtime; covered at interface level via `api/services/glossary_manager.py` |

The aggregate rows above are category summaries, not claims that each excluded
file was semantically inspected. Two tracked `.deprecated` files are included
inside the 1091 SKIPPED_WITH_REASON total.

---

## External Repository Inventory (Bounded Review Set)

### Module Architecture Summary

| Module | Path | Role |
| --- | --- | --- |
| Smart Extraction (strategy + router) | `core/smart_extraction/` | Document analysis + strategy routing to text/OCR/vision |
| Fast Text Extractor | `core/smart_extraction/fast_text_extractor.py` | PyMuPDF-based native text extraction |
| Extraction Quality Score (EQS) | `api/services/eqs.py` | 6-signal composite quality scorer (0.0-1.0) |
| Extraction Feedback Loop | `api/services/extraction_feedback.py` | Quality-driven retry + fallback chain orchestration |
| OCR Language Support | `api/services/ocr_language_support.py` | Script detection + OCR config per language |
| Provider Router (QAPR) | `api/services/provider_router.py` | LLM provider selection (quality/cost/latency) |
| Translation Memory | `api/services/translation_memory.py` | Fuzzy TM with domain-aware matching |
| Glossary Manager | `api/services/glossary_manager.py` | CRUD glossary with JSON persistence |
| Tests (unit) | `tests/unit/test_eqs.py`, `test_extraction_feedback.py`, `test_ocr_language_support.py` | 90%+ coverage targets for the three core scan-layer services |

---

## Source Verification Table

Verifying all claims in the work order Source Verification Table from actual file reads:

| Claimed item | Source file | Verified lines | Verified symbol | Status |
| --- | --- | --- | --- | --- |
| README names Smart Extraction | `README.md` | line 32 | `Smart Extraction` | ACCEPT |
| README names translation memory and glossary | `README.md` | lines 34-35 | `Translation Memory`, `Glossary Management` | ACCEPT |
| Router records extraction page-route metrics | `core/smart_extraction/extraction_router.py` lines 38-52 | `ExtractionResult` dataclass: `content`, `total_pages`, `strategy_used`, `extraction_time`, `pages_via_text`, `pages_via_vision`, `pages_via_ocr`, `estimated_vision_time`, `time_saved`, `cost_saved`, `ocr_confidence` | `ExtractionResult` | ACCEPT |
| Router analyzes before strategy selection | `core/smart_extraction/extraction_router.py` line 118 | `analysis = self.analyzer.analyze(pdf_path)` | `self.analyzer.analyze` | ACCEPT |
| Router has OCR language route list | `core/smart_extraction/extraction_router.py` lines 134-137 | `ocr_supported_langs = {'ja', 'zh', 'zh-Hans', 'zh-Hant', 'ko', 'en', 'fr', 'de', 'es', 'vi'}` | `ocr_supported_langs` set | ACCEPT |
| Document analysis exposes page and document signals | `core/smart_extraction/document_analyzer.py` lines 33-80 | `PageAnalysis` dataclass (line 33); `DocumentAnalysis` dataclass (line 49) | `PageAnalysis`, `DocumentAnalysis` | ACCEPT |
| Document analysis thresholds exist | `core/smart_extraction/document_analyzer.py` lines 100-102 | `TEXT_COVERAGE_THRESHOLD = 0.7`, `SCANNED_THRESHOLD = 0.1`, `COMPLEX_PAGE_THRESHOLD = 0.15` | three class constants | ACCEPT |
| EQS defines six quality signals | `api/services/eqs.py` lines 5-10 (module docstring) | signals: `text_density`, `structure`, `encoding`, `language`, `completeness`, `format_integrity` | module docstring + `DEFAULT_WEIGHTS` dict | ACCEPT |
| EQS has weighted signal map | `api/services/eqs.py` lines 74-80 | `DEFAULT_WEIGHTS` dict with weights summing to 1.0 | `DEFAULT_WEIGHTS` | ACCEPT |
| Feedback loop defines strategy values | `api/services/extraction_feedback.py` lines 32-37 | `ExtractionStrategy(str, Enum)`: `TEXT`, `OCR`, `VISION`, `MANUAL_REVIEW` | `ExtractionStrategy` enum | ACCEPT |
| Feedback loop defines fallback chain | `api/services/extraction_feedback.py` lines 102-103 | `DEFAULT_FALLBACK_CHAIN = [TEXT, OCR, VISION, MANUAL_REVIEW]` | `DEFAULT_FALLBACK_CHAIN` | ACCEPT |
| OCR language support contains Vietnamese OCR config | `api/services/ocr_language_support.py` lines 122-130 | `LANGUAGE_CONFIGS["vi"] = OcrConfig(language="vi", lang_code="vie", script="latin", engine="paddleocr", notes="Vietnamese diacritics require Unicode-aware OCR")` | `LANGUAGE_CONFIGS.vi` | ACCEPT |

All 12 source verification items from the work order: **12/12 ACCEPT**.

---

## Negative Search Results (Collision Discipline)

Required negative searches executed against CVF source (`*.ts`, `*.py`):

| Token | CVF search result | Collision risk |
| --- | --- | --- |
| `ExtractionStrategy` | NO MATCH in scoped CVF source search | NONE for exact external symbol |
| `EQSReport` | NO MATCH in CVF source | NONE |
| `ExtractionFeedbackLoop` | NO MATCH in CVF source | NONE |
| `OcrLanguageSupport` | NO MATCH in CVF source | NONE |
| `SmartExtractionRouter` | NO MATCH in CVF source | NONE |
| `provider_fallback` | NO MATCH in scoped CVF source search | External provider fallback is not authorized by EXA-T1 |
| `Policy_Local mutation` | N/A with reason: authorization boundary, not a source symbol | No Policy_Local mutation authorized |

Exact external symbols do not collide. This does not prove a capability gap:
Codex owner-surface reconciliation found existing extraction quality, OCR
language mapping, scan outcome, storage boundary, and DSCP profile surfaces.

## Verification Boundary

This map proves only that the cited patterns exist at the pinned external
commit and that the bounded source set was reviewed. It does not prove full
repository understanding, runtime correctness, dependency suitability,
provider behavior, extraction accuracy, Policy_Local readiness, or production
readiness.


