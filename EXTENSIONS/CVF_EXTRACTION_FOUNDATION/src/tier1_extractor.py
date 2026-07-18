"""
CVF Extraction Foundation - Tier 1 Digital-Native Extractor

Tranche: LPCI2 EX-T2
Authorization: docs/baselines/CVF_GC018_LPCI2_EX_T2_TIER1_DIGITAL_NATIVE_EXTRACTOR_2026-06-11.md
Claim boundary: Tier 1 digital-native extraction only. No OCR, no Tier 2/3 fallback,
no DSCP wire-in. Language-transparent: language_codes copied from caller input,
never inferred from content.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import List

# Roadmap Quality Gates table, line 459:
# MIN_CHARS threshold = 100 chars/page average.
# Below this threshold, Tier 2 OCR escalation is signalled via below_min_chars_flag.
MIN_CHARS_PER_PAGE: int = 100


class UnsupportedFileTypeError(Exception):
    """Raised when extract_tier1 receives a file extension other than .docx or .pdf."""


@dataclass
class Tier1ExtractorInput:
    """Input to the Tier 1 extractor."""
    # Absolute or relative path to the source file (.docx or .pdf).
    file_path: str
    # ISO 639-1 language codes from the DscpDomainProfile (never inferred from content).
    language_codes: List[str] = field(default_factory=list)


@dataclass
class Tier1PageResult:
    """Per-page extraction result."""
    page_num: int
    text: str
    char_count: int
    extraction_method: str


@dataclass
class Tier1ExtractorResult:
    """Full extraction result for a single document."""
    # Overall status: "OK" or "EMPTY" (no text extracted from any page).
    status: str
    # Per-page results.
    pages: List[Tier1PageResult]
    # Sum of char_count across all pages.
    total_char_count: int
    # Average chars per page (0.0 if no pages).
    avg_chars_per_page: float
    # True when avg_chars_per_page < MIN_CHARS_PER_PAGE; signals Tier 2 escalation needed.
    below_min_chars_flag: bool
    # Language codes copied from Tier1ExtractorInput (never inferred from content).
    language_codes: List[str]
    # "python-docx" or "pdfplumber"
    extraction_method: str


def extract_docx(input: Tier1ExtractorInput) -> Tier1ExtractorResult:
    """
    Extract text from a .docx file using python-docx.

    python-docx does not expose page-level boundaries, so the entire document
    is returned as a single logical page (page_num=1). The char_count reflects
    the full document text length. Callers needing page-level splits should use
    the PDF path or await a future EX tranche that maps paragraph runs to pages.
    """
    from docx import Document  # noqa: PLC0415 -- imported here to keep top-level clean

    doc = Document(input.file_path)
    full_text = "\n".join(para.text for para in doc.paragraphs)
    char_count = len(full_text)
    pages = [
        Tier1PageResult(
            page_num=1,
            text=full_text,
            char_count=char_count,
            extraction_method="python-docx",
        )
    ]
    total = char_count
    avg = float(total)
    status = "EMPTY" if total == 0 else "OK"
    return Tier1ExtractorResult(
        status=status,
        pages=pages,
        total_char_count=total,
        avg_chars_per_page=avg,
        below_min_chars_flag=avg < MIN_CHARS_PER_PAGE,
        language_codes=list(input.language_codes),
        extraction_method="python-docx",
    )


def extract_pdf_text_layer(input: Tier1ExtractorInput) -> Tier1ExtractorResult:
    """
    Extract text from the digital text layer of a .pdf using pdfplumber.

    Returns one Tier1PageResult per PDF page. Pages with no extractable text
    (scanned pages) will have char_count=0. If avg_chars_per_page < MIN_CHARS_PER_PAGE,
    below_min_chars_flag is set True to signal that Tier 2 OCR escalation is needed.
    """
    import pdfplumber  # noqa: PLC0415

    pages: List[Tier1PageResult] = []
    with pdfplumber.open(input.file_path) as pdf:
        for i, page in enumerate(pdf.pages, start=1):
            raw = page.extract_text() or ""
            pages.append(
                Tier1PageResult(
                    page_num=i,
                    text=raw,
                    char_count=len(raw),
                    extraction_method="pdfplumber",
                )
            )

    total = sum(p.char_count for p in pages)
    page_count = len(pages)
    avg = total / page_count if page_count > 0 else 0.0
    status = "EMPTY" if total == 0 else "OK"
    return Tier1ExtractorResult(
        status=status,
        pages=pages,
        total_char_count=total,
        avg_chars_per_page=avg,
        below_min_chars_flag=avg < MIN_CHARS_PER_PAGE,
        language_codes=list(input.language_codes),
        extraction_method="pdfplumber",
    )


def extract_tier1(input: Tier1ExtractorInput) -> Tier1ExtractorResult:
    """
    Dispatcher: route to extract_docx or extract_pdf_text_layer by file extension.

    Raises UnsupportedFileTypeError for any extension other than .docx or .pdf.
    Extension matching is case-insensitive.
    """
    import os

    ext = os.path.splitext(input.file_path)[1].lower()
    if ext == ".docx":
        return extract_docx(input)
    elif ext == ".pdf":
        return extract_pdf_text_layer(input)
    else:
        raise UnsupportedFileTypeError(
            f"Unsupported file type '{ext}'. "
            "Tier 1 extractor accepts .docx and .pdf only. "
            "OCR-dependent formats (.png, .jpg, .tiff, scanned .pdf) require Tier 2 (EX-T3)."
        )
