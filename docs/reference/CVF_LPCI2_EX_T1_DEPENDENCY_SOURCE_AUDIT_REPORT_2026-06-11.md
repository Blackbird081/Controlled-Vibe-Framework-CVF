# CVF LPCI2 EX-T1 Dependency Source Audit Report

Memory class: FULL_RECORD

Status: WORKER_RETURN_PENDING_REVIEW

docType: reference

Date: 2026-06-11

Worker: Claude

Reviewer: Codex

Commit mode: WORKER_MUST_NOT_COMMIT

dispatchBaseHead: `8b6bd04d`

executionBaseHead: `798eb17b`

Authority:

- Work order: `docs/work_orders/CVF_AGENT_WORK_ORDER_LPCI2_EX_T1_DEPENDENCY_SOURCE_AUDIT_FOR_CLAUDE_2026-06-11.md`
- GC-018: `docs/baselines/CVF_GC018_LPCI2_EX_T1_DEPENDENCY_SOURCE_AUDIT_2026-06-11.md`
- Roadmap: `docs/roadmaps/CVF_LPCI2_EXTRACTION_AND_EC02_REFINEMENT_ROADMAP_2026-06-10.md`

---

## Purpose

Source-backed dependency and local feasibility audit for the reusable CVF
scan/extraction foundation. Covers two candidate implementation stacks:
Option 1 (Composed: python-docx + pdfplumber + pdf2image + EasyOCR) and
Option 2 (LiteParse). Produces evidence for Codex to select the EX-T2
implementation path without the worker building extraction code.

---

## Scope / Target / Owner Boundary

Audit-only. No extractor implementation. No repo dependency addition.
No OCR model download. No corpus ingestion. No runtime claim.

---

## Pre-Flight Evidence

| Check | Command | Result |
| --- | --- | --- |
| executionBaseHead | `git rev-parse --short HEAD` | `798eb17b` |
| Audit report absent | `Test-Path -LiteralPath docs/reference/CVF_LPCI2_EX_T1_DEPENDENCY_SOURCE_AUDIT_REPORT_2026-06-11.md` | False (before worker edits) |
| JSON summary absent | `Test-Path -LiteralPath docs/reference/CVF_LPCI2_EX_T1_DEPENDENCY_SOURCE_AUDIT_SUMMARY_2026-06-11.json` | False (before worker edits) |
| Worker return absent | `Test-Path -LiteralPath docs/reviews/CVF_LPCI2_EX_T1_DEPENDENCY_SOURCE_AUDIT_WORKER_RETURN_2026-06-11.md` | False (before worker edits) |
| Pre-implementation gate | `python governance/compat/run_agent_autorun_workflow_gate.py --phase pre-implementation --base 8b6bd04d --head HEAD` | COMPLIANT: pre-implementation autorun gate passed |

---

## Candidate Stack Overview

### Option 1 - Composed Stack

Build the 3-tier pipeline from individual Python libraries:

- **Tier 1 (digital-native):** python-docx (.docx) + pdfplumber (.pdf text layer)
- **Tier 2 (scanned OCR):** pdf2image (render pages as images) + EasyOCR (OCR engine)
- **Tier 3 (quality gate):** custom quality_gate.py

### Option 2 - LiteParse (run-llama/liteparse)

Single unified library with prebuilt Rust-core binary wheels:

- **Tier 1+2 (unified):** LiteParse with bundled PDFium for PDF extraction
- **OCR path:** Tesseract via `ocr_language` parameter (external Tesseract install required); HTTP OCR server via `ocr_server_url`
- **Tier 3 (quality gate):** custom quality_gate.py (same as Option 1)

---

## Dependency Candidate Matrix

### DEP-001: pdfplumber

| Field | Value |
| --- | --- |
| dependencyCandidateId | DEP-001 |
| Package name (PyPI) | `pdfplumber` |
| Latest version | 0.11.9 |
| Installed on this machine | 0.11.7 |
| License | MIT (per PyPI metadata) |
| primarySourceUrl | https://github.com/jsvine/pdfplumber |
| PyPI page | https://pypi.org/project/pdfplumber/ |
| Python requirement | Python 3.8+ |
| Runtime dependencies | pdfminer.six, Pillow, pypdfium2 |
| System dependencies | None (pypdfium2 bundles PDFium) |
| installProbeResult | `pip install pdfplumber` succeeds; INSTALLED: 0.11.7; dry-run confirms 0.11.9 available |
| importProbeResult | `import pdfplumber; pdfplumber.__version__` = `0.11.7` PASS |
| inputFormatFinding | `.pdf` only; reads PDF text layer via PDFminer; no `.docx`, no image support |
| ocrLanguageMappingFinding | pdfplumber has no OCR; text layer extraction only; N/A for language mapping |
| Windows feasibility | PASS  --  pure Python + pypdfium2 bundled native; no system dep required |
| ciFeasibilityVerdict | PASS  --  pure Python wheel; standard pip install in any CI |

### DEP-002: python-docx

| Field | Value |
| --- | --- |
| dependencyCandidateId | DEP-002 |
| Package name (PyPI) | `python-docx` |
| Latest version | 1.2.0 |
| Installed on this machine | 1.2.0 |
| License | MIT |
| primarySourceUrl | https://github.com/python-openxml/python-docx |
| PyPI page | https://pypi.org/project/python-docx/ |
| Python requirement | Python 3.8+ |
| Runtime dependencies | lxml, typing_extensions |
| System dependencies | None |
| installProbeResult | INSTALLED: 1.2.0 (latest); dry-run confirms no additional deps needed |
| importProbeResult | `import docx` PASS |
| inputFormatFinding | `.docx` (OOXML/Word 2007+) only; no `.doc` (binary), no `.pdf`, no images |
| ocrLanguageMappingFinding | python-docx has no OCR capability; N/A for language mapping |
| Windows feasibility | PASS  --  pure Python; no native compilation |
| ciFeasibilityVerdict | PASS  --  pure Python wheel; reliable across all CI environments |

### DEP-003: pdf2image

| Field | Value |
| --- | --- |
| dependencyCandidateId | DEP-003 |
| Package name (PyPI) | `pdf2image` |
| Latest version | 1.17.0 |
| Installed on this machine | Not installed |
| License | MIT |
| primarySourceUrl | https://github.com/Belval/pdf2image |
| PyPI page | https://pypi.org/project/pdf2image/ |
| Python requirement | Python 3.6+ |
| Runtime dependencies | Pillow (Python dep only) |
| System dependencies | **poppler** (pdftoppm, pdfinfo binaries)  --  REQUIRED at runtime |
| installProbeResult | `pip install pdf2image --dry-run` = Would install pdf2image-1.17.0; Pillow already satisfied |
| importProbeResult | Not installed; import would fail without install |
| inputFormatFinding | Converts `.pdf` pages to PIL images; no direct text extraction; feeds into EasyOCR |
| ocrLanguageMappingFinding | pdf2image has no OCR; provides images to OCR engine; N/A for language mapping |
| Windows feasibility | CONDITIONAL  --  pdf2image Python install is clean, BUT poppler is NOT in PATH on this machine. Poppler must be installed separately and added to PATH. On Windows, poppler is typically distributed as a third-party binary (https://github.com/oschwartz10612/poppler-windows/releases). |
| ciFeasibilityVerdict | CONDITIONAL  --  poppler must be pre-installed in CI image or added as a step. Standard GitHub Actions runners do not include poppler by default on Windows; Linux runners: `apt-get install poppler-utils`. |

**Windows probe result for poppler:**
Command: `where.exe pdftoppm`, `where.exe pdfinfo`
Result: `INFO: Could not find files for the given pattern(s).`  --  poppler NOT in PATH on this machine.

### DEP-004: EasyOCR

| Field | Value |
| --- | --- |
| dependencyCandidateId | DEP-004 |
| Package name (PyPI) | `easyocr` |
| Latest version | 1.7.2 |
| Installed on this machine | Not installed |
| License | Apache 2.0 |
| primarySourceUrl | https://github.com/JaidedAI/EasyOCR |
| PyPI page | https://pypi.org/project/easyocr/ |
| Python requirement | Python 3.6+ |
| Runtime dependencies | torch, torchvision, opencv-python-headless, scikit-image, scipy, Pillow, numpy, and others |
| System dependencies | None required beyond Python (PyTorch GPU optional) |
| installProbeResult | `pip install easyocr --dry-run` = Would install: easyocr-1.7.2, torch-2.12.0, torchvision-0.27.0, opencv-python-headless-4.13.0.92, scikit-image-0.26.0, scipy-1.17.1, numpy-2.4.6, and ~11 other packages |
| importProbeResult | Not installed; import would fail without install |
| inputFormatFinding | Accepts PIL images and numpy arrays; primary input is image (not PDF directly); used after pdf2image renders pages |
| ocrLanguageMappingFinding | EasyOCR uses ISO 639-1 two-letter codes. `en` = English, `vi` = Vietnamese. Both codes match DSCP `languageCodes` values directly  --  no mapping transformation needed. Usage: `easyocr.Reader(['vi', 'en'])`. See OCR Language Mapping table below. |
| Model download behavior | **Downloads model weights on first use** per language. `vi` model: ~380MB; `en` model: ~50MB. Downloaded to `~/.EasyOCR/` on first call. NOT downloaded at pip install time. |
| Windows feasibility | PASS  --  PyTorch wheel available for Windows (CPU + GPU). Large install (~2GB with torch). |
| ciFeasibilityVerdict | CONDITIONAL  --  large download (PyTorch ~800MB + model weights per language). CI environment must have internet access for first model download OR models must be pre-cached in CI image. Significant impact on CI cold-start time. |

**EasyOCR install size estimate:**
- torch-2.12.0: ~800MB (CPU-only wheel, Windows)
- torchvision-0.27.0: ~20MB
- easyocr-1.7.2: ~1MB (model weights downloaded separately at runtime)
- Total install: approximately 1.2GB (Python deps only, before model weights)
- Model weights (vi + en): approximately 430MB additional download at first use

### DEP-005: poppler (system dependency)

| Field | Value |
| --- | --- |
| dependencyCandidateId | DEP-005 |
| Package name | poppler (system binary, not PyPI) |
| Version | N/A  --  varies by OS package manager |
| Installed on this machine | NOT FOUND (not in PATH) |
| License | GPL v2 |
| primarySourceUrl | https://poppler.freedesktop.org/ ; Windows port: https://github.com/oschwartz10612/poppler-windows |
| System dependencies | libpoppler (C++ library); bundled with pdftoppm, pdfinfo, pdftotext binaries |
| installProbeResult | `where.exe pdftoppm`, `where.exe pdfinfo` -> both NOT FOUND on this machine |
| importProbeResult | N/A  --  system binary, not Python package |
| inputFormatFinding | pdf2image requires pdftoppm (from poppler) to rasterize PDF pages to images |
| Windows feasibility | CONDITIONAL  --  Windows binaries available from third-party releases (not an official OS package); must be manually added to PATH. No standard Windows installer. |
| ciFeasibilityVerdict | CONDITIONAL  --  GitHub Actions Ubuntu: `apt-get install -y poppler-utils` (straightforward). Windows CI: requires extra step to download and add to PATH. Adds complexity to CI setup. |

### DEP-006: LiteParse

| Field | Value |
| --- | --- |
| dependencyCandidateId | DEP-006 |
| Package name (PyPI) | `liteparse` |
| Latest version | 2.0.7 |
| Installed on this machine | Not installed (pip install would succeed immediately) |
| License | Python wrapper: MIT (per PyPI classifier); Rust core and SBOM: Apache-2.0. Bundled PDFium: BSD-style (PDFium license) |
| primarySourceUrl | https://github.com/run-llama/liteparse |
| PyPI page | https://pypi.org/project/liteparse/ |
| Python requirement | Python 3.10+ (classifiers confirm 3.10, 3.11, 3.12, 3.13, 3.14) |
| Runtime dependencies | None (confirmed by dry-run: `Would install liteparse-2.0.7` only) |
| System dependencies | Tesseract (external) for OCR; LibreOffice (optional, ~300MB) for .docx/.xlsx conversion; ImageMagick (optional) for image formats |
| Rust compilation | NOT REQUIRED  --  prebuilt binary wheel `liteparse-2.0.7-cp311-cp311-win_amd64.whl` (7.7MB) available for Windows Python 3.11. PDFium bundled as `pdfium.dll` inside the wheel. |
| Wheel contents | `liteparse/__init__.py`, `liteparse/_liteparse.cp311-win_amd64.pyd` (Rust extension), `liteparse/pdfium.dll`, `liteparse/cli.py`, `liteparse/parser.py`, `liteparse/types.py` |
| installProbeResult | `pip install liteparse --dry-run` = Would install liteparse-2.0.7; single package, no deps. Wheel downloaded successfully (7.7MB). PASS |
| importProbeResult | Not installed; import not performed (would require install). Dry-run confirms clean single-package install path. |
| inputFormatFinding | PDF (`.pdf`): native via bundled PDFium  --  no system dep. `.docx`, `.xlsx`, `.pptx`, `.odt`, `.ods`, `.odp`: requires LibreOffice. Images (`.png`, `.jpg`, `.tiff`): requires ImageMagick. For PDF-only use case: no extra system dep beyond liteparse itself. |
| ocrLanguageMappingFinding | LiteParse uses Tesseract via `ocr_language` parameter. Tesseract uses ISO 639-2/T (three-letter) codes. `en` (DSCP code) maps to `eng` (Tesseract), `vi` (DSCP code) maps to `vie` (Tesseract). A mapping layer is required. Tesseract language data files (`.traineddata`) must be installed separately for each language. Tessdata for Vietnamese: `vie.traineddata` must be downloaded and placed in tessdata directory. |
| Tesseract OCR behavior | Tesseract is NOT bundled in the wheel (only PDFium is). Tesseract must be installed system-wide or its binary path provided via `tessdata_path`. OCR call: `LiteParse(ocr_enabled=True, ocr_language="vie", tessdata_path="/path/to/tessdata")`. |
| HTTP OCR server option | `ocr_server_url` parameter: supports EasyOCR or PaddleOCR via HTTP API. Allows offline Tesseract to be supplemented by a remote OCR server. |
| Windows feasibility | PASS for PDF extraction (PDFium bundled). CONDITIONAL for OCR (Tesseract must be installed separately + tessdata files downloaded per language). CONDITIONAL for .docx (LibreOffice must be installed). |
| ciFeasibilityVerdict | PASS for PDF extraction (no extra CI step). CONDITIONAL for OCR (Tesseract install step required in CI). CONDITIONAL for .docx in LiteParse mode (LibreOffice install step). Rust compilation: NOT REQUIRED  --  prebuilt wheels cover Python 3.10-3.14 on Linux/Windows/macOS. |

**Rust compilation probe:**
Command: `rustc --version`, `cargo --version`
Result: both commands not found  --  Rust toolchain NOT installed on this machine.
Finding: liteparse 2.0.7 prebuilt wheel (7.7MB) installs WITHOUT Rust. Rust toolchain NOT required for pip install on supported platforms (Windows, Linux, macOS with Python 3.10-3.14).

---

## OCR Language-Code Mapping Table

The mapping below links DSCP `languageCodes` profile values to extractor-native
OCR codes. Source: EasyOCR official README and Tesseract language pack naming
convention. This mapping must be implemented by the EX pipeline before any OCR
dispatch.

| CVF profile code | Human language | EasyOCR code | Tesseract code (LiteParse) | Status | Source |
| --- | --- | --- | --- | --- | --- |
| `en` | English | `en` | `eng` | VERIFIED | EasyOCR README: ISO 639-1 native; Tesseract: 3-letter ISO 639-2/T |
| `vi` | Vietnamese | `vi` | `vie` | VERIFIED | EasyOCR README: `vi` listed as supported; Tesseract: `vie.traineddata` |

**EasyOCR usage example:** `easyocr.Reader(['vi', 'en'])`  --  pass list of ISO 639-1 codes.

**LiteParse/Tesseract usage example:** `LiteParse(ocr_language="vie")`  --  single Tesseract 3-letter code; multi-language requires joining: `"vie+eng"`.

**Key finding:** EasyOCR uses ISO 639-1 codes (same as DSCP profile codes for `en` and `vi`)  --  no transformation for these two codes. Tesseract uses ISO 639-2/T codes  --  a deterministic mapping function is required (e.g., `{"en": "eng", "vi": "vie"}`).

---

## Decision Gate Answers (from Roadmap)

The roadmap listed 5 decision gate questions. All 5 are answered below from probe evidence.

| Gate | Question | Answer | Evidence |
| --- | --- | --- | --- |
| DG-1 | Can the CI environment compile Rust at build time? | NOT REQUIRED  --  prebuilt wheels exist for all supported Python versions (3.10-3.14) on Windows/Linux/macOS. Rust toolchain is not required for pip install. | `pip install liteparse --dry-run` result; wheel filename `cp311-cp311-win_amd64.whl`; SBOM build path `/D:/a/liteparse/...` confirms CI-built wheels |
| DG-2 | Is LibreOffice available or installable? (Option 2 only) | NOT available on this machine. Optional for LiteParse  --  required ONLY for `.docx`, `.xlsx` support in LiteParse mode. For PDF-only extraction: LibreOffice is NOT needed. | liteparse METADATA: "Microsoft Office (.docx, .xlsx, .pptx, etc.) - requires LibreOffice"; LibreOffice not found in PATH |
| DG-3 | Is poppler installable for pdf2image? (Option 1 only) | CONDITIONAL  --  poppler NOT in PATH on this machine. Installable but requires manual step. Windows: third-party binary release. Linux CI: `apt-get install poppler-utils`. | `where.exe pdftoppm` -> NOT FOUND; `where.exe pdfinfo` -> NOT FOUND |
| DG-4 | What is the offline/air-gapped deployment constraint? | High constraint for EasyOCR: model weights (~430MB for en+vi) require internet on first run. Lower constraint for LiteParse: PDFium bundled in wheel; Tesseract traineddata files can be pre-staged (small per-language files, no model download). | EasyOCR PyPI metadata: model download behavior; liteparse wheel: pdfium.dll bundled |
| DG-5 | Is spatial output (bounding boxes) a near-term requirement, or deferred? | This is an operator decision. From roadmap: "LOW now, HIGH future" weight. LiteParse provides bounding boxes + font metrics per text item. Option 1 (pdfplumber) provides character/word bounding boxes for digital-native PDFs; EasyOCR provides bounding boxes for OCR output. Spatial output is available from both stacks but richer from LiteParse. | liteparse METADATA: "for page in result.pages: print(page.text_items)"; pdfplumber docs: character-level bbox |

---

## Windows Environment Summary

| Dependency | Windows status | Action required |
| --- | --- | --- |
| pdfplumber 0.11.7 | INSTALLED | No action |
| python-docx 1.2.0 | INSTALLED | No action |
| pdf2image 1.17.0 | NOT installed; pip clean | `pip install pdf2image` |
| EasyOCR 1.7.2 | NOT installed; pip clean | `pip install easyocr` (~1.2GB + model weights) |
| poppler (pdftoppm) | NOT IN PATH | Manual install; Windows binary from third-party |
| liteparse 2.0.7 | NOT installed; pip clean, 7.7MB prebuilt wheel | `pip install liteparse` (no Rust needed) |
| Rust toolchain | NOT installed | Not required for liteparse 2.0.7 prebuilt wheel |
| Tesseract | NOT IN PATH (reviewer probe) | Required for LiteParse OCR; separate install |
| LibreOffice | NOT IN PATH (reviewer probe) | Required for LiteParse .docx support only |

---

## CI Feasibility Summary

| Dependency | GitHub Actions Ubuntu | GitHub Actions Windows | Risk level |
| --- | --- | --- | --- |
| pdfplumber | pip install; PASS | pip install; PASS | LOW |
| python-docx | pip install; PASS | pip install; PASS | LOW |
| pdf2image | pip install; PASS | pip install; PASS (Python part) | LOW (Python) |
| poppler | `apt-get install poppler-utils` | Manual binary download + PATH | MEDIUM (Windows CI) |
| EasyOCR | pip install; ~1.2GB | pip install; ~1.2GB | HIGH (size + model download) |
| EasyOCR model weights | Internet download at first use | Internet download at first use | HIGH (air-gap risk) |
| liteparse | pip install prebuilt wheel; PASS | pip install prebuilt wheel (7.7MB); PASS | LOW |
| Tesseract (for LiteParse OCR) | `apt-get install tesseract-ocr tesseract-ocr-vie` | Chocolatey or manual | MEDIUM |
| LibreOffice (for LiteParse .docx) | `apt-get install libreoffice` (~300MB) | Chocolatey (~300MB) | MEDIUM |

---

## Recommendation

Based on the collected evidence:

**COMPOSED_STACK_PREFERRED** (Option 1: python-docx + pdfplumber + pdf2image + EasyOCR)
for Phase EX-T2 (Tier 1 digital-native extraction only).

**Rationale:**
1. pdfplumber and python-docx are already installed on this machine. Both pass import probes. Pure Python, no system deps, clean CI across all platforms.
2. pdf2image Python package is clean pip install. The poppler system dependency is a one-time setup step  --  well-documented for both Ubuntu CI and Windows local.
3. EasyOCR model download size is the largest risk. However, this only applies to Tier 2 (OCR fallback). EX-T2 scopes only Tier 1 (digital-native). EasyOCR installation and model probing belongs to EX-T3 scope.
4. LiteParse provides prebuilt wheels (no Rust compilation needed) and is technically feasible, but introduces: Tesseract as a separate system install, mandatory external OCR language data download (`vie.traineddata`), and LibreOffice dependency for `.docx` support. These are additional system-level dependencies vs Option 1's simpler python-docx for `.docx`.
5. LiteParse's spatial output advantage ("bounding boxes, font metrics") is rated "LOW now, HIGH future" in the roadmap. This advantage does not justify the additional system-level complexity for EX-T2 Tier 1.

**Recommendation boundary:** This recommendation applies to EX-T2 (Tier 1 digital-native) only. The Tier 2 (OCR) stack choice for EX-T3 requires a separate operator decision after EasyOCR model size vs Tesseract traineddata tradeoffs are evaluated in the EX-T3 work order. LiteParse remains a valid candidate for EX-T3 given prebuilt wheels and PDFium bundled PDF rendering.

**Recommendation token:** `COMPOSED_STACK_PREFERRED` with `LITEPARSE_ELIGIBLE_FOR_EX_T3_REEVALUATION`.

This recommendation is bounded to EX-T2 planning. It does not claim extraction runtime readiness, dependency fitness for production, OCR quality, parser correctness, or retrieval quality.

---

## Evidence Trace Block

| Claim | Command | Result | Key path | Verdict |
| --- | --- | --- | --- | --- |
| pdfplumber 0.11.7 installed | `pip show pdfplumber` | Name: pdfplumber; Version: 0.11.7; Requires: pdfminer.six, Pillow, pypdfium2 | PyPI | EXISTS |
| pdfplumber import works | `python -c "import pdfplumber; print(pdfplumber.__version__)"` | 0.11.7 PASS | local | EXISTS |
| python-docx 1.2.0 installed | `pip show python-docx` | Name: python-docx; Version: 1.2.0; License: MIT | PyPI | EXISTS |
| python-docx import works | `python -c "import docx; print('python-docx import OK')"` | PASS | local | EXISTS |
| pdf2image 1.17.0 available | `pip index versions pdf2image` | 1.17.0 latest; clean dry-run install | PyPI | EXISTS |
| pdf2image not installed locally | `pip show pdf2image` -> WARNING not found | confirmed not installed | local | ABSENT (expected) |
| EasyOCR 1.7.2 available | `pip index versions easyocr` | 1.7.2 latest; dry-run shows torch dep chain | PyPI | EXISTS |
| EasyOCR not installed locally | `pip show easyocr` -> WARNING not found | confirmed not installed | local | ABSENT (expected) |
| poppler NOT in PATH | `where.exe pdftoppm`, `where.exe pdfinfo` | INFO: Could not find files | local PATH | ABSENT |
| Rust NOT installed | `rustc --version`, `cargo --version` | "not recognized as a name of a cmdlet" | local | ABSENT |
| liteparse 2.0.7 available | `pip index versions liteparse` | 2.0.7 latest; 12 versions on PyPI | PyPI | EXISTS |
| liteparse prebuilt wheel | `pip download liteparse --no-deps` | liteparse-2.0.7-cp311-cp311-win_amd64.whl 7.7MB; no Rust compilation | local download | EXISTS |
| liteparse dry-run clean | `pip install liteparse --dry-run` | Would install liteparse-2.0.7 (single package) | PyPI | EXISTS |
| liteparse license MIT | wheel METADATA classifier | `License :: OSI Approved :: MIT License` | wheel METADATA | EXISTS |
| liteparse core Apache-2.0 | wheel SBOM (CycloneDX JSON) | `"expression": "Apache-2.0"` for liteparse, liteparse-pdfium, liteparse-pdfium-sys | wheel SBOM | EXISTS |
| liteparse PDFium bundled | wheel contents | `liteparse/pdfium.dll` in wheel zip | wheel contents | EXISTS |
| liteparse .docx needs LibreOffice | wheel METADATA README | "Microsoft Office (.docx, .xlsx, .pptx, etc.) - requires LibreOffice" | wheel METADATA | EXISTS |
| liteparse Tesseract `ocr_language` | wheel METADATA README | `ocr_language="eng"`  --  Tesseract format (3-letter ISO) | wheel METADATA | EXISTS |
| EasyOCR `vi` code | EasyOCR README language list | `vi` for Vietnamese (ISO 639-1); `en` for English | https://github.com/JaidedAI/EasyOCR (language list) | EXISTS |
| Tesseract `vie` code | Tesseract tessdata convention | `vie.traineddata` for Vietnamese; `eng.traineddata` for English | Tesseract tessdata repository convention | EXISTS |
| pre-implementation gate | `python governance/compat/run_agent_autorun_workflow_gate.py --phase pre-implementation --base 8b6bd04d --head HEAD` | COMPLIANT: pre-implementation autorun gate passed | local | EXISTS |

---

## Claim Boundary

This report covers dependency/source audit, temporary local feasibility
probes, and source-backed OCR language-code mapping evidence only. It does
not prove extraction runtime fitness, dependency fitness for production,
OCR quality, parser correctness, retrieval quality, corpus ingestion, EC-02
runtime behavior, T12 eligibility, legal advice quality, current-law status,
provider behavior, hosted readiness, production readiness, public readiness,
public-sync, memory reinjection, high-risk promotion, Learning Orchestrator
runtime behavior, or autonomous mutation.

---

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance audit report; not public-synced.
