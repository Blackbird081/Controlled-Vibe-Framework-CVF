"""
CVF Extraction Foundation - EX-T3 through EX-T7 local pipeline.

Claim boundary: deterministic local extraction pipeline contracts only. This
module does not install OCR dependencies, download OCR models, mutate corpus
records, call providers, or perform legal/current-status evaluation.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from hashlib import sha256
from statistics import mean
from typing import Callable, Literal

from tier1_extractor import MIN_CHARS_PER_PAGE, Tier1ExtractorResult, Tier1PageResult

OCR_CONFIDENCE_THRESHOLD: float = 0.75
PAGE_COVERAGE_THRESHOLD: float = 0.80
DEFAULT_CHUNK_MAX_CHARS: int = 512

OcrEngineName = Literal["easyocr", "tesseract"]
ExtractionTier = Literal["TIER1_DIGITAL", "TIER2_OCR"]
ExtractionAuthorityLevel = Literal["EXTRACTED_TEXT"]
RebuildClass = Literal["TIER1_CHAR_OFFSET", "TIER2_PAGE_REOCR"]
ChunkingStrategy = Literal["fixed-window-chars", "sentence-boundary-chars"]
ExtractionStatus = Literal[
    "PASS",
    "NEEDS_TIER2_OCR",
    "OCR_LOW_CONFIDENCE",
    "PARTIAL_EXTRACTION",
    "EMPTY",
]

_EASYOCR_LANGUAGE_MAP = {"en": "en", "vi": "vi"}
_TESSERACT_LANGUAGE_MAP = {"en": "eng", "vi": "vie"}


class UnsupportedOcrLanguageError(ValueError):
    """Raised when a profile language lacks a governed OCR mapping."""


class OcrDependencyUnavailableError(RuntimeError):
    """Raised when OCR execution is requested without an OCR engine adapter."""


@dataclass(frozen=True)
class OcrLanguageMapping:
    """Extractor-native language codes derived from DSCP profile language codes."""

    engine: OcrEngineName
    profile_language_codes: list[str]
    ocr_language_codes: list[str]
    joined_code: str


@dataclass(frozen=True)
class Tier2OcrPageInput:
    """A rendered page handle supplied by a caller-owned renderer."""

    page_num: int
    image_ref: str


@dataclass(frozen=True)
class Tier2OcrPageResult:
    """Per-page OCR output with confidence captured by the OCR adapter."""

    page_num: int
    text: str
    char_count: int
    confidence: float
    extraction_method: str


@dataclass(frozen=True)
class Tier2OcrExtractorInput:
    """Tier 2 OCR request using a caller-supplied OCR adapter."""

    pages: list[Tier2OcrPageInput]
    language_codes: list[str]
    engine: OcrEngineName = "easyocr"


@dataclass(frozen=True)
class Tier2OcrExtractorResult:
    """Tier 2 OCR result with confidence and language mapping evidence."""

    status: str
    pages: list[Tier2OcrPageResult]
    total_char_count: int
    avg_chars_per_page: float
    mean_confidence: float | None
    below_min_chars_flag: bool
    language_codes: list[str]
    ocr_language_codes: list[str]
    extraction_method: str


@dataclass(frozen=True)
class ExtractionQualityReport:
    """Tier 3 quality gate result for an extraction output."""

    status: ExtractionStatus
    quality_flags: list[ExtractionStatus]
    page_count: int
    pages_with_output: int
    page_coverage_ratio: float
    total_char_count: int
    avg_chars_per_page: float
    mean_ocr_confidence: float | None
    thresholds: dict[str, float]
    raw_ocr_retained: bool = False


@dataclass(frozen=True)
class ExtractionChunk:
    """Governed chunk schema produced after extraction quality evaluation."""

    chunk_id: str
    source_artifact_id: str
    source_hash: str
    page_start: int
    page_end: int
    text: str
    char_count: int
    extraction_tier: ExtractionTier
    extraction_method: str
    quality_flags: list[ExtractionStatus]
    language_codes: list[str]
    extraction_status: ExtractionStatus
    authority_level: ExtractionAuthorityLevel = "EXTRACTED_TEXT"
    rebuild_class: RebuildClass = "TIER1_CHAR_OFFSET"
    char_start: int | None = None
    char_end: int | None = None
    provenance: dict[str, str] = field(default_factory=dict)


@dataclass(frozen=True)
class ExtractionDscpDescriptorInput:
    """Python-side descriptor shape handed to the DSCP profile/descriptor layer."""

    artifact_id: str
    source_hash: str
    artifact_role: str
    content_class: str
    governance_gates: dict[str, object]
    metadata: dict[str, str]


@dataclass(frozen=True)
class ExtractionStorageBoundary:
    """Canonical output surface of the CVF extraction pipeline."""

    descriptor_inputs: list[ExtractionDscpDescriptorInput]
    quality_report: ExtractionQualityReport
    chunk_count: int
    raw_ocr_retained: bool
    boundary_sha256: str


def map_ocr_language_codes(
    language_codes: list[str],
    engine: OcrEngineName = "easyocr",
) -> OcrLanguageMapping:
    """Map DSCP profile language codes to extractor-native OCR language codes."""

    mapping = _EASYOCR_LANGUAGE_MAP if engine == "easyocr" else _TESSERACT_LANGUAGE_MAP
    ocr_codes: list[str] = []
    for code in language_codes:
        try:
            ocr_codes.append(mapping[code])
        except KeyError as exc:
            raise UnsupportedOcrLanguageError(
                f"No governed {engine} OCR mapping for profile language code '{code}'"
            ) from exc

    joiner = "," if engine == "easyocr" else "+"
    return OcrLanguageMapping(
        engine=engine,
        profile_language_codes=list(language_codes),
        ocr_language_codes=ocr_codes,
        joined_code=joiner.join(ocr_codes),
    )


def extract_tier2_ocr(
    input: Tier2OcrExtractorInput,
    ocr_engine: Callable[[Tier2OcrPageInput, OcrLanguageMapping], tuple[str, float]] | None,
) -> Tier2OcrExtractorResult:
    """
    Execute Tier 2 through a caller-supplied OCR adapter.

    The adapter boundary is explicit so this module can be tested without
    installing OCR libraries or downloading models. Passing None is a hard stop.
    """

    if ocr_engine is None:
        raise OcrDependencyUnavailableError(
            "Tier 2 OCR requires a caller-supplied OCR adapter; no OCR model is bundled."
        )

    language_mapping = map_ocr_language_codes(input.language_codes, input.engine)
    page_results: list[Tier2OcrPageResult] = []
    for page in input.pages:
        text, confidence = ocr_engine(page, language_mapping)
        page_results.append(
            Tier2OcrPageResult(
                page_num=page.page_num,
                text=text,
                char_count=len(text),
                confidence=confidence,
                extraction_method=f"{input.engine}-adapter",
            )
        )

    total = sum(page.char_count for page in page_results)
    page_count = len(page_results)
    avg = total / page_count if page_count else 0.0
    confidences = [page.confidence for page in page_results]
    mean_conf = mean(confidences) if confidences else None
    return Tier2OcrExtractorResult(
        status="EMPTY" if total == 0 else "OK",
        pages=page_results,
        total_char_count=total,
        avg_chars_per_page=avg,
        mean_confidence=mean_conf,
        below_min_chars_flag=avg < MIN_CHARS_PER_PAGE,
        language_codes=list(input.language_codes),
        ocr_language_codes=language_mapping.ocr_language_codes,
        extraction_method=f"{input.engine}-adapter",
    )


def evaluate_extraction_quality(
    pages: list[Tier1PageResult] | list[Tier2OcrPageResult],
    mean_ocr_confidence: float | None = None,
) -> ExtractionQualityReport:
    """Evaluate EX-T4 quality gates over extracted page results."""

    page_count = len(pages)
    pages_with_output = sum(1 for page in pages if page.char_count > 0)
    total = sum(page.char_count for page in pages)
    coverage = pages_with_output / page_count if page_count else 0.0
    avg = total / page_count if page_count else 0.0

    flags: list[ExtractionStatus] = []
    if total == 0:
        flags.append("EMPTY")
    if avg < MIN_CHARS_PER_PAGE:
        flags.append("NEEDS_TIER2_OCR")
    if coverage < PAGE_COVERAGE_THRESHOLD:
        flags.append("PARTIAL_EXTRACTION")
    if mean_ocr_confidence is not None and mean_ocr_confidence < OCR_CONFIDENCE_THRESHOLD:
        flags.append("OCR_LOW_CONFIDENCE")

    return ExtractionQualityReport(
        status="PASS" if not flags else flags[0],
        quality_flags=flags,
        page_count=page_count,
        pages_with_output=pages_with_output,
        page_coverage_ratio=coverage,
        total_char_count=total,
        avg_chars_per_page=avg,
        mean_ocr_confidence=mean_ocr_confidence,
        thresholds={
            "MIN_CHARS_PER_PAGE": float(MIN_CHARS_PER_PAGE),
            "OCR_CONFIDENCE": OCR_CONFIDENCE_THRESHOLD,
            "PAGE_COVERAGE": PAGE_COVERAGE_THRESHOLD,
        },
    )


def _fixed_window_spans(text: str, max_chars: int, start: int = 0) -> list[tuple[int, int]]:
    """Return deterministic character windows for one page-local text span."""

    return [
        (offset, min(offset + max_chars, start + len(text)))
        for offset in range(start, start + len(text), max_chars)
    ]


def _trim_span(text: str, start: int, end: int) -> tuple[int, int] | None:
    while start < end and text[start].isspace():
        start += 1
    while end > start and text[end - 1].isspace():
        end -= 1
    if start >= end:
        return None
    return (start, end)


def _sentence_spans(text: str) -> list[tuple[int, int]]:
    spans: list[tuple[int, int]] = []
    span_start = 0
    for index, char in enumerate(text):
        if char in ".!?;:\n":
            trimmed = _trim_span(text, span_start, index + 1)
            if trimmed is not None:
                spans.append(trimmed)
            span_start = index + 1

    trimmed_tail = _trim_span(text, span_start, len(text))
    if trimmed_tail is not None:
        spans.append(trimmed_tail)
    return spans


def _sentence_boundary_spans(text: str, max_chars: int) -> list[tuple[int, int]]:
    """Return sentence-preferred spans with fixed-window fallback for long spans."""

    sentence_spans = _sentence_spans(text)
    if not sentence_spans:
        return _fixed_window_spans(text, max_chars)

    chunks: list[tuple[int, int]] = []
    current_start: int | None = None
    current_end: int | None = None

    for sentence_start, sentence_end in sentence_spans:
        if sentence_end - sentence_start > max_chars:
            if current_start is not None and current_end is not None:
                chunks.append((current_start, current_end))
                current_start = None
                current_end = None
            sentence_text = text[sentence_start:sentence_end]
            chunks.extend(_fixed_window_spans(sentence_text, max_chars, sentence_start))
            continue

        if current_start is None or current_end is None:
            current_start = sentence_start
            current_end = sentence_end
            continue

        candidate_len = sentence_end - current_start
        if candidate_len <= max_chars:
            current_end = sentence_end
            continue

        chunks.append((current_start, current_end))
        current_start = sentence_start
        current_end = sentence_end

    if current_start is not None and current_end is not None:
        chunks.append((current_start, current_end))

    return chunks


def _page_chunk_spans(
    text: str,
    max_chars: int,
    strategy: ChunkingStrategy,
) -> list[tuple[int, int]]:
    if max_chars <= 0:
        raise ValueError("max_chars must be positive")
    if strategy == "fixed-window-chars":
        return _fixed_window_spans(text, max_chars)
    if strategy == "sentence-boundary-chars":
        return _sentence_boundary_spans(text, max_chars)
    raise ValueError(f"Unsupported chunking strategy: {strategy}")


def _rebuild_class_for_tier(extraction_tier: ExtractionTier) -> RebuildClass:
    if extraction_tier == "TIER1_DIGITAL":
        return "TIER1_CHAR_OFFSET"
    return "TIER2_PAGE_REOCR"


def chunk_extracted_pages(
    *,
    source_artifact_id: str,
    source_hash: str,
    pages: list[Tier1PageResult] | list[Tier2OcrPageResult],
    extraction_tier: ExtractionTier,
    language_codes: list[str],
    quality_report: ExtractionQualityReport,
    max_chars: int = DEFAULT_CHUNK_MAX_CHARS,
    strategy: ChunkingStrategy = "fixed-window-chars",
) -> list[ExtractionChunk]:
    """Create governed chunks without language inference."""

    chunks: list[ExtractionChunk] = []
    rebuild_class = _rebuild_class_for_tier(extraction_tier)
    for page in pages:
        text = page.text
        if not text:
            continue
        for start, end in _page_chunk_spans(text, max_chars, strategy):
            chunk_text = text[start:end]
            seed = (
                f"{source_artifact_id}:{page.page_num}:{strategy}:"
                f"{start}:{end}:{sha256(chunk_text.encode('utf-8')).hexdigest()}"
            )
            chunk_id = f"chunk-{sha256(seed.encode('utf-8')).hexdigest()[:16]}"
            chunks.append(
                ExtractionChunk(
                    chunk_id=chunk_id,
                    source_artifact_id=source_artifact_id,
                    source_hash=source_hash,
                    page_start=page.page_num,
                    page_end=page.page_num,
                    text=chunk_text,
                    char_count=len(chunk_text),
                    extraction_tier=extraction_tier,
                    extraction_method=page.extraction_method,
                    quality_flags=list(quality_report.quality_flags),
                    language_codes=list(language_codes),
                    extraction_status=quality_report.status,
                    rebuild_class=rebuild_class,
                    char_start=start,
                    char_end=end,
                    provenance={
                        "chunkingStrategy": strategy,
                        "maxChars": str(max_chars),
                        "charStart": str(start),
                        "charEnd": str(end),
                    },
                )
            )
    return chunks


def build_extraction_storage_boundary(
    descriptor_inputs: list[ExtractionDscpDescriptorInput],
    quality_report: ExtractionQualityReport,
) -> ExtractionStorageBoundary:
    """Wrap descriptor inputs into the canonical extraction output boundary."""

    digest_input = "".join(
        f"{descriptor.artifact_id}:{descriptor.source_hash}"
        for descriptor in descriptor_inputs
    )
    return ExtractionStorageBoundary(
        descriptor_inputs=descriptor_inputs,
        quality_report=quality_report,
        chunk_count=len(descriptor_inputs),
        raw_ocr_retained=quality_report.raw_ocr_retained,
        boundary_sha256=sha256(digest_input.encode("utf-8")).hexdigest(),
    )


def build_extraction_dscp_descriptor_inputs(
    chunks: list[ExtractionChunk],
    *,
    domain_family: str,
    domain_profile_id: str,
) -> list[ExtractionDscpDescriptorInput]:
    """
    Build descriptor-shaped records for downstream DSCP profile application.

    This function prepares the handoff surface only; it does not apply a domain
    profile, build a receipt, call a provider, or release raw content.
    """

    descriptors: list[ExtractionDscpDescriptorInput] = []
    for chunk in chunks:
        metadata = {
            "sourceArtifactId": chunk.source_artifact_id,
            "domainFamily": domain_family,
            "domainProfileId": domain_profile_id,
            "languageCodes": ",".join(chunk.language_codes),
            "extractionTier": chunk.extraction_tier,
            "extractionMethod": chunk.extraction_method,
            "qualityFlags": ",".join(chunk.quality_flags),
            "pageStart": str(chunk.page_start),
            "pageEnd": str(chunk.page_end),
            "rawContentReleased": "false",
            "authorityLevel": chunk.authority_level,
            "rebuildClass": chunk.rebuild_class,
        }
        if chunk.char_start is not None and chunk.char_end is not None:
            metadata["charStart"] = str(chunk.char_start)
            metadata["charEnd"] = str(chunk.char_end)

        descriptors.append(
            ExtractionDscpDescriptorInput(
                artifact_id=chunk.chunk_id,
                source_hash=chunk.source_hash,
                artifact_role="corpus_candidate",
                content_class="extracted_chunk",
                governance_gates={
                    "freshnessGate": "UNKNOWN",
                    "classificationGate": "CONDITIONAL",
                    "eligibilityGate": (
                        "CONDITIONAL" if chunk.extraction_status == "PASS" else "NO"
                    ),
                    "customGates": {
                        "extractionStatus": chunk.extraction_status,
                    },
                },
                metadata=metadata,
            )
        )
    return descriptors
