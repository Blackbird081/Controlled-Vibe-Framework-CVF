"""
Focused tests for EX-T3 through EX-T7 extraction foundation contracts.

No OCR package install, model download, provider call, external corpus read, or
legal/current-status claim is performed.
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from extraction_pipeline import (  # noqa: E402
    DEFAULT_CHUNK_MAX_CHARS,
    OCR_CONFIDENCE_THRESHOLD,
    PAGE_COVERAGE_THRESHOLD,
    OcrDependencyUnavailableError,
    Tier2OcrExtractorInput,
    Tier2OcrPageInput,
    Tier2OcrPageResult,
    UnsupportedOcrLanguageError,
    build_extraction_dscp_descriptor_inputs,
    build_extraction_storage_boundary,
    chunk_extracted_pages,
    evaluate_extraction_quality,
    extract_tier2_ocr,
    map_ocr_language_codes,
)
from tier1_extractor import MIN_CHARS_PER_PAGE, Tier1PageResult  # noqa: E402


def test_easyocr_language_mapping_passes_profile_codes_through() -> None:
    mapping = map_ocr_language_codes(["vi", "en"], "easyocr")
    assert mapping.ocr_language_codes == ["vi", "en"]
    assert mapping.joined_code == "vi,en"


def test_tesseract_language_mapping_uses_traineddata_codes() -> None:
    mapping = map_ocr_language_codes(["vi", "en"], "tesseract")
    assert mapping.ocr_language_codes == ["vie", "eng"]
    assert mapping.joined_code == "vie+eng"


def test_unsupported_ocr_language_blocks_mapping() -> None:
    with pytest.raises(UnsupportedOcrLanguageError):
        map_ocr_language_codes(["fr"], "easyocr")


def test_tier2_requires_explicit_ocr_adapter() -> None:
    request = Tier2OcrExtractorInput(
        pages=[Tier2OcrPageInput(page_num=1, image_ref="page-1.png")],
        language_codes=["en"],
    )
    with pytest.raises(OcrDependencyUnavailableError):
        extract_tier2_ocr(request, None)


def test_tier2_captures_text_confidence_and_language_mapping() -> None:
    request = Tier2OcrExtractorInput(
        pages=[
            Tier2OcrPageInput(page_num=1, image_ref="page-1.png"),
            Tier2OcrPageInput(page_num=2, image_ref="page-2.png"),
        ],
        language_codes=["vi", "en"],
        engine="easyocr",
    )

    def deterministic_ocr(page: Tier2OcrPageInput, mapping) -> tuple[str, float]:
        return (f"{page.image_ref}:{mapping.joined_code}", 0.91)

    result = extract_tier2_ocr(request, deterministic_ocr)
    assert result.status == "OK"
    assert result.ocr_language_codes == ["vi", "en"]
    assert result.mean_confidence == pytest.approx(0.91)
    assert [page.confidence for page in result.pages] == [0.91, 0.91]


def test_quality_gate_passes_sufficient_text() -> None:
    pages = [
        Tier1PageResult(
            page_num=1,
            text="A" * MIN_CHARS_PER_PAGE,
            char_count=MIN_CHARS_PER_PAGE,
            extraction_method="pdfplumber",
        )
    ]
    report = evaluate_extraction_quality(pages)
    assert report.status == "PASS"
    assert report.quality_flags == []
    assert report.thresholds["OCR_CONFIDENCE"] == OCR_CONFIDENCE_THRESHOLD
    assert report.thresholds["PAGE_COVERAGE"] == PAGE_COVERAGE_THRESHOLD
    assert report.raw_ocr_retained is False


def test_quality_gate_flags_short_and_partial_output() -> None:
    pages = [
        Tier1PageResult(page_num=1, text="", char_count=0, extraction_method="pdfplumber"),
        Tier1PageResult(page_num=2, text="x", char_count=1, extraction_method="pdfplumber"),
    ]
    report = evaluate_extraction_quality(pages)
    assert report.status == "NEEDS_TIER2_OCR"
    assert "PARTIAL_EXTRACTION" in report.quality_flags
    assert report.page_coverage_ratio == pytest.approx(0.5)


def test_quality_gate_flags_low_ocr_confidence() -> None:
    pages = [
        Tier1PageResult(
            page_num=1,
            text="B" * MIN_CHARS_PER_PAGE,
            char_count=MIN_CHARS_PER_PAGE,
            extraction_method="easyocr-adapter",
        )
    ]
    report = evaluate_extraction_quality(pages, mean_ocr_confidence=0.5)
    assert "OCR_LOW_CONFIDENCE" in report.quality_flags


def test_chunking_uses_fixed_windows_and_preserves_language_codes() -> None:
    text = "C" * (DEFAULT_CHUNK_MAX_CHARS + 10)
    pages = [
        Tier1PageResult(
            page_num=3,
            text=text,
            char_count=len(text),
            extraction_method="pdfplumber",
        )
    ]
    quality = evaluate_extraction_quality(pages)
    chunks = chunk_extracted_pages(
        source_artifact_id="artifact-1",
        source_hash="sha256:test",
        pages=pages,
        extraction_tier="TIER1_DIGITAL",
        language_codes=["vi", "en"],
        quality_report=quality,
    )
    assert len(chunks) == 2
    assert chunks[0].char_count == DEFAULT_CHUNK_MAX_CHARS
    assert chunks[1].char_count == 10
    assert chunks[0].language_codes == ["vi", "en"]
    assert chunks[0].provenance["chunkingStrategy"] == "fixed-window-chars"
    assert chunks[0].char_start == 0
    assert chunks[0].char_end == DEFAULT_CHUNK_MAX_CHARS


def test_sentence_boundary_chunking_preserves_sentence_edges() -> None:
    text = "First sentence. Second sentence. Third sentence."
    pages = [
        Tier1PageResult(
            page_num=1,
            text=text,
            char_count=len(text),
            extraction_method="pdfplumber",
        )
    ]
    quality = evaluate_extraction_quality(pages)
    chunks = chunk_extracted_pages(
        source_artifact_id="artifact-sentence",
        source_hash="sha256:sentence",
        pages=pages,
        extraction_tier="TIER1_DIGITAL",
        language_codes=["en"],
        quality_report=quality,
        max_chars=34,
        strategy="sentence-boundary-chars",
    )
    assert [chunk.text for chunk in chunks] == [
        "First sentence. Second sentence.",
        "Third sentence.",
    ]
    assert all(chunk.char_count <= 34 for chunk in chunks)
    assert chunks[0].char_start == 0
    assert chunks[0].char_end == len("First sentence. Second sentence.")
    assert chunks[0].provenance["chunkingStrategy"] == "sentence-boundary-chars"


def test_sentence_boundary_chunking_falls_back_for_long_sentence() -> None:
    text = "A" * 70 + "."
    pages = [
        Tier1PageResult(
            page_num=2,
            text=text,
            char_count=len(text),
            extraction_method="pdfplumber",
        )
    ]
    quality = evaluate_extraction_quality(pages)
    chunks = chunk_extracted_pages(
        source_artifact_id="artifact-long",
        source_hash="sha256:long",
        pages=pages,
        extraction_tier="TIER1_DIGITAL",
        language_codes=["en"],
        quality_report=quality,
        max_chars=25,
        strategy="sentence-boundary-chars",
    )
    assert [chunk.char_count for chunk in chunks] == [25, 25, 21]
    assert chunks[-1].text.endswith(".")
    assert chunks[0].char_start == 0
    assert chunks[-1].char_end == len(text)


def test_sentence_boundary_chunking_is_deterministic() -> None:
    pages = [
        Tier1PageResult(
            page_num=5,
            text="Alpha. Beta. Gamma.",
            char_count=20,
            extraction_method="pdfplumber",
        )
    ]
    quality = evaluate_extraction_quality(pages)
    first = chunk_extracted_pages(
        source_artifact_id="artifact-deterministic",
        source_hash="sha256:deterministic",
        pages=pages,
        extraction_tier="TIER1_DIGITAL",
        language_codes=["en"],
        quality_report=quality,
        max_chars=12,
        strategy="sentence-boundary-chars",
    )
    second = chunk_extracted_pages(
        source_artifact_id="artifact-deterministic",
        source_hash="sha256:deterministic",
        pages=pages,
        extraction_tier="TIER1_DIGITAL",
        language_codes=["en"],
        quality_report=quality,
        max_chars=12,
        strategy="sentence-boundary-chars",
    )
    assert [chunk.chunk_id for chunk in first] == [chunk.chunk_id for chunk in second]
    assert [chunk.text for chunk in first] == [chunk.text for chunk in second]


def test_dscp_descriptor_handoff_does_not_release_raw_content() -> None:
    pages = [
        Tier1PageResult(
            page_num=1,
            text="D" * MIN_CHARS_PER_PAGE,
            char_count=MIN_CHARS_PER_PAGE,
            extraction_method="python-docx",
        )
    ]
    quality = evaluate_extraction_quality(pages)
    chunks = chunk_extracted_pages(
        source_artifact_id="artifact-2",
        source_hash="sha256:source",
        pages=pages,
        extraction_tier="TIER1_DIGITAL",
        language_codes=["en"],
        quality_report=quality,
    )
    descriptors = build_extraction_dscp_descriptor_inputs(
        chunks,
        domain_family="legal_policy",
        domain_profile_id="policylocal.vi.v1",
    )
    descriptor = descriptors[0]
    assert descriptor.artifact_role == "corpus_candidate"
    assert descriptor.content_class == "extracted_chunk"
    assert descriptor.governance_gates["customGates"] == {"extractionStatus": "PASS"}
    assert descriptor.metadata["rawContentReleased"] == "false"
    assert descriptor.metadata["authorityLevel"] == "EXTRACTED_TEXT"
    assert descriptor.metadata["rebuildClass"] == "TIER1_CHAR_OFFSET"
    assert descriptor.metadata["domainFamily"] == "legal_policy"
    assert descriptor.metadata["charStart"] == "0"
    assert descriptor.metadata["charEnd"] == str(MIN_CHARS_PER_PAGE)


def test_tier1_chunks_carry_extracted_text_authority_and_char_offset_rebuild() -> None:
    pages = [
        Tier1PageResult(
            page_num=1,
            text="E" * MIN_CHARS_PER_PAGE,
            char_count=MIN_CHARS_PER_PAGE,
            extraction_method="pdfplumber",
        )
    ]
    quality = evaluate_extraction_quality(pages)
    chunks = chunk_extracted_pages(
        source_artifact_id="artifact-tier1",
        source_hash="sha256:tier1",
        pages=pages,
        extraction_tier="TIER1_DIGITAL",
        language_codes=["en"],
        quality_report=quality,
    )
    assert chunks[0].authority_level == "EXTRACTED_TEXT"
    assert chunks[0].rebuild_class == "TIER1_CHAR_OFFSET"


def test_tier2_chunks_use_page_reocr_rebuild_class() -> None:
    pages = [
        Tier2OcrPageResult(
            page_num=1,
            text="F" * MIN_CHARS_PER_PAGE,
            char_count=MIN_CHARS_PER_PAGE,
            confidence=0.91,
            extraction_method="easyocr-adapter",
        )
    ]
    quality = evaluate_extraction_quality(pages, mean_ocr_confidence=0.91)
    chunks = chunk_extracted_pages(
        source_artifact_id="artifact-tier2",
        source_hash="sha256:tier2",
        pages=pages,
        extraction_tier="TIER2_OCR",
        language_codes=["vi"],
        quality_report=quality,
    )
    descriptors = build_extraction_dscp_descriptor_inputs(
        chunks,
        domain_family="legal_policy",
        domain_profile_id="policylocal.vi.v1",
    )
    assert chunks[0].authority_level == "EXTRACTED_TEXT"
    assert chunks[0].rebuild_class == "TIER2_PAGE_REOCR"
    assert descriptors[0].metadata["authorityLevel"] == "EXTRACTED_TEXT"
    assert descriptors[0].metadata["rebuildClass"] == "TIER2_PAGE_REOCR"


def test_extraction_storage_boundary_is_deterministic_and_counts_chunks() -> None:
    pages = [
        Tier1PageResult(
            page_num=1,
            text="G" * MIN_CHARS_PER_PAGE,
            char_count=MIN_CHARS_PER_PAGE,
            extraction_method="python-docx",
        )
    ]
    quality = evaluate_extraction_quality(pages)
    chunks = chunk_extracted_pages(
        source_artifact_id="artifact-boundary",
        source_hash="sha256:boundary",
        pages=pages,
        extraction_tier="TIER1_DIGITAL",
        language_codes=["en"],
        quality_report=quality,
    )
    descriptors = build_extraction_dscp_descriptor_inputs(
        chunks,
        domain_family="technical_project",
        domain_profile_id="technical.local.v1",
    )
    first = build_extraction_storage_boundary(descriptors, quality)
    second = build_extraction_storage_boundary(descriptors, quality)
    assert first.boundary_sha256 == second.boundary_sha256
    assert first.chunk_count == len(descriptors)
    assert first.raw_ocr_retained is False
    assert first.quality_report is quality
    assert first.descriptor_inputs == descriptors
