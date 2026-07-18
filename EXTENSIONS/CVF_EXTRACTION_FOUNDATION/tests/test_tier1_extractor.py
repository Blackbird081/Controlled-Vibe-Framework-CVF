"""
CVF Extraction Foundation - Tier 1 Extractor Tests

Tranche: LPCI2 EX-T2
Authorization: docs/baselines/CVF_GC018_LPCI2_EX_T2_TIER1_DIGITAL_NATIVE_EXTRACTOR_2026-06-11.md
All tests are deterministic and local. No network calls, no corpus files,
no OCR model download, no provider calls.
"""

from __future__ import annotations

import io
import os
import sys
import tempfile
from pathlib import Path

import pytest

# Ensure src/ is on the path regardless of how pytest is invoked.
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from tier1_extractor import (  # noqa: E402
    MIN_CHARS_PER_PAGE,
    Tier1ExtractorInput,
    Tier1ExtractorResult,
    UnsupportedFileTypeError,
    extract_docx,
    extract_pdf_text_layer,
    extract_tier1,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def make_docx_file(tmp_path: Path, paragraphs: list[str], filename: str = "test.docx") -> str:
    """Create a .docx file in tmp_path with the given paragraphs; return path string."""
    from docx import Document

    doc = Document()
    for para in paragraphs:
        doc.add_paragraph(para)
    p = tmp_path / filename
    doc.save(str(p))
    return str(p)


def make_pdf_file(tmp_path: Path, text_per_page: list[str], filename: str = "test.pdf") -> str:
    """
    Create a minimal multi-page PDF using reportlab if available, otherwise
    write a raw single-page PDF structure using pdfplumber-compatible bytes.

    Falls back to a temp file approach that pdfplumber can parse.
    """
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.pdfgen import canvas as rl_canvas

        p = tmp_path / filename
        c = rl_canvas.Canvas(str(p), pagesize=letter)
        for page_text in text_per_page:
            c.drawString(72, 720, page_text)
            c.showPage()
        c.save()
        return str(p)
    except ImportError:
        pass

    # Fallback: create a minimal valid PDF with one page (pdfplumber-compatible).
    # This only produces a single-page PDF regardless of text_per_page length.
    # Used when reportlab is not available. Sufficient for char_count tests.
    combined = " ".join(text_per_page)
    # Escape special PDF string chars
    safe = combined.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
    content_stream = f"BT /F1 12 Tf 72 720 Td ({safe}) Tj ET".encode()
    stream_len = len(content_stream)

    pdf_parts = []
    pdf_parts.append(b"%PDF-1.4\n")
    offsets = {}

    def write_obj(num: int, data: bytes) -> None:
        offsets[num] = sum(len(p) for p in pdf_parts)
        pdf_parts.append(f"{num} 0 obj\n".encode())
        pdf_parts.append(data)
        pdf_parts.append(b"\nendobj\n")

    write_obj(1, b"<< /Type /Catalog /Pages 2 0 R >>")
    write_obj(2, b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>")
    write_obj(
        3,
        (
            b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]\n"
            b"/Contents 4 0 R\n"
            b"/Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> >>"
        ),
    )
    write_obj(
        4,
        f"<< /Length {stream_len} >>\nstream\n".encode()
        + content_stream
        + b"\nendstream",
    )

    xref_offset = sum(len(p) for p in pdf_parts)
    xref = f"xref\n0 5\n0000000000 65535 f \n"
    for i in range(1, 5):
        xref += f"{offsets[i]:010d} 00000 n \n"
    trailer = f"trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF\n"
    pdf_parts.append(xref.encode())
    pdf_parts.append(trailer.encode())

    p = tmp_path / filename
    p.write_bytes(b"".join(pdf_parts))
    return str(p)


# ---------------------------------------------------------------------------
# Tests: extract_docx
# ---------------------------------------------------------------------------


class TestExtractDocx:
    def test_basic_text_extracted(self, tmp_path: Path) -> None:
        """extract_docx returns the paragraph text from a .docx file."""
        path = make_docx_file(tmp_path, ["Hello CVF EX-T2 extraction test."])
        result = extract_docx(Tier1ExtractorInput(file_path=path, language_codes=["en"]))
        assert result.extraction_method == "python-docx"
        assert result.status == "OK"
        assert result.total_char_count > 0
        assert len(result.pages) == 1
        assert "Hello CVF EX-T2" in result.pages[0].text

    def test_multi_paragraph_char_count(self, tmp_path: Path) -> None:
        """extract_docx char_count reflects total text length across paragraphs."""
        paras = ["First paragraph.", "Second paragraph.", "Third paragraph."]
        path = make_docx_file(tmp_path, paras)
        result = extract_docx(Tier1ExtractorInput(file_path=path, language_codes=["vi", "en"]))
        expected_text = "\n".join(paras)
        assert result.total_char_count == len(expected_text)
        assert result.avg_chars_per_page == float(len(expected_text))

    def test_language_codes_passthrough_no_detection(self, tmp_path: Path) -> None:
        """language_codes in result matches input; no detection logic applied."""
        path = make_docx_file(tmp_path, ["Noi dung van ban tieng Viet va English."])
        result = extract_docx(Tier1ExtractorInput(file_path=path, language_codes=["vi", "en"]))
        assert result.language_codes == ["vi", "en"]

    def test_empty_document_sets_empty_status(self, tmp_path: Path) -> None:
        """Empty .docx (no paragraph text) has status EMPTY and below_min_chars_flag True."""
        path = make_docx_file(tmp_path, [""])
        result = extract_docx(Tier1ExtractorInput(file_path=path, language_codes=["en"]))
        assert result.status == "EMPTY"
        assert result.below_min_chars_flag is True

    def test_below_min_chars_flag_short_text(self, tmp_path: Path) -> None:
        """below_min_chars_flag is True when avg chars per page < MIN_CHARS_PER_PAGE (100)."""
        short_text = "A" * (MIN_CHARS_PER_PAGE - 1)
        path = make_docx_file(tmp_path, [short_text])
        result = extract_docx(Tier1ExtractorInput(file_path=path, language_codes=["en"]))
        assert result.below_min_chars_flag is True

    def test_below_min_chars_flag_sufficient_text(self, tmp_path: Path) -> None:
        """below_min_chars_flag is False when avg chars per page >= MIN_CHARS_PER_PAGE."""
        sufficient_text = "A" * MIN_CHARS_PER_PAGE
        path = make_docx_file(tmp_path, [sufficient_text])
        result = extract_docx(Tier1ExtractorInput(file_path=path, language_codes=["en"]))
        assert result.below_min_chars_flag is False

    def test_empty_language_codes_allowed(self, tmp_path: Path) -> None:
        """language_codes=[] is valid; result carries empty list."""
        path = make_docx_file(tmp_path, ["Some content."])
        result = extract_docx(Tier1ExtractorInput(file_path=path, language_codes=[]))
        assert result.language_codes == []


# ---------------------------------------------------------------------------
# Tests: extract_pdf_text_layer
# ---------------------------------------------------------------------------


class TestExtractPdfTextLayer:
    def test_basic_pdf_text_extracted(self, tmp_path: Path) -> None:
        """extract_pdf_text_layer returns text from a digital-native PDF."""
        path = make_pdf_file(tmp_path, ["CVF EX-T2 PDF extraction test"])
        result = extract_pdf_text_layer(
            Tier1ExtractorInput(file_path=path, language_codes=["en"])
        )
        assert result.extraction_method == "pdfplumber"
        assert len(result.pages) >= 1
        assert any("CVF EX-T2 PDF extraction test" in page.text for page in result.pages)
        assert result.total_char_count >= len("CVF EX-T2 PDF extraction test")
        assert result.avg_chars_per_page >= 0.0

    def test_language_codes_passthrough(self, tmp_path: Path) -> None:
        """language_codes in PDF result matches input; never inferred from text."""
        path = make_pdf_file(tmp_path, ["Content here"])
        result = extract_pdf_text_layer(
            Tier1ExtractorInput(file_path=path, language_codes=["vi", "en"])
        )
        assert result.language_codes == ["vi", "en"]

    def test_below_min_chars_flag_logic(self, tmp_path: Path) -> None:
        """below_min_chars_flag reflects avg_chars_per_page vs MIN_CHARS_PER_PAGE."""
        path = make_pdf_file(tmp_path, ["x"])
        result = extract_pdf_text_layer(
            Tier1ExtractorInput(file_path=path, language_codes=["en"])
        )
        # The flag must agree with the computed average.
        expected_flag = result.avg_chars_per_page < MIN_CHARS_PER_PAGE
        assert result.below_min_chars_flag is expected_flag

    def test_page_results_have_required_fields(self, tmp_path: Path) -> None:
        """Each Tier1PageResult has page_num, text, char_count, extraction_method."""
        path = make_pdf_file(tmp_path, ["Page content"])
        result = extract_pdf_text_layer(
            Tier1ExtractorInput(file_path=path, language_codes=["en"])
        )
        for page in result.pages:
            assert hasattr(page, "page_num")
            assert hasattr(page, "text")
            assert hasattr(page, "char_count")
            assert hasattr(page, "extraction_method")
            assert page.extraction_method == "pdfplumber"
            assert page.char_count == len(page.text)


# ---------------------------------------------------------------------------
# Tests: extract_tier1 dispatcher
# ---------------------------------------------------------------------------


class TestExtractTier1Dispatcher:
    def test_routes_docx_to_extract_docx(self, tmp_path: Path) -> None:
        """extract_tier1 routes .docx extension to extract_docx."""
        path = make_docx_file(tmp_path, ["Dispatcher test content."])
        result = extract_tier1(Tier1ExtractorInput(file_path=path, language_codes=["en"]))
        assert result.extraction_method == "python-docx"

    def test_routes_pdf_to_extract_pdf_text_layer(self, tmp_path: Path) -> None:
        """extract_tier1 routes .pdf extension to extract_pdf_text_layer."""
        path = make_pdf_file(tmp_path, ["PDF dispatcher test"])
        result = extract_tier1(Tier1ExtractorInput(file_path=path, language_codes=["en"]))
        assert result.extraction_method == "pdfplumber"

    def test_raises_for_txt_extension(self, tmp_path: Path) -> None:
        """extract_tier1 raises UnsupportedFileTypeError for .txt files."""
        fake_txt = str(tmp_path / "doc.txt")
        Path(fake_txt).write_text("some text", encoding="utf-8")
        with pytest.raises(UnsupportedFileTypeError):
            extract_tier1(Tier1ExtractorInput(file_path=fake_txt, language_codes=["en"]))

    def test_raises_for_png_extension(self, tmp_path: Path) -> None:
        """extract_tier1 raises UnsupportedFileTypeError for .png files (OCR-dependent)."""
        fake_png = str(tmp_path / "scan.png")
        Path(fake_png).write_bytes(b"\x89PNG\r\n\x1a\n")
        with pytest.raises(UnsupportedFileTypeError):
            extract_tier1(Tier1ExtractorInput(file_path=fake_png, language_codes=["vi"]))

    def test_raises_for_doc_extension(self, tmp_path: Path) -> None:
        """extract_tier1 raises UnsupportedFileTypeError for .doc (binary Word) files."""
        fake_doc = str(tmp_path / "legacy.doc")
        Path(fake_doc).write_bytes(b"\xd0\xcf\x11\xe0")
        with pytest.raises(UnsupportedFileTypeError):
            extract_tier1(Tier1ExtractorInput(file_path=fake_doc, language_codes=["en"]))

    def test_extension_matching_case_insensitive(self, tmp_path: Path) -> None:
        """extract_tier1 routes .DOCX (uppercase) the same as .docx."""
        # python-docx works regardless of extension case; rename after creation.
        src = make_docx_file(tmp_path, ["Case test content."], filename="lower.docx")
        upper_path = str(tmp_path / "upper.DOCX")
        os.rename(src, upper_path)
        result = extract_tier1(Tier1ExtractorInput(file_path=upper_path, language_codes=["en"]))
        assert result.extraction_method == "python-docx"


# ---------------------------------------------------------------------------
# Tests: MIN_CHARS_PER_PAGE constant
# ---------------------------------------------------------------------------


class TestMinCharsConstant:
    def test_min_chars_per_page_is_100(self) -> None:
        """MIN_CHARS_PER_PAGE must equal 100 per roadmap Quality Gates table line 459."""
        assert MIN_CHARS_PER_PAGE == 100

    def test_boundary_exactly_at_threshold(self, tmp_path: Path) -> None:
        """below_min_chars_flag is False when avg chars per page == MIN_CHARS_PER_PAGE exactly."""
        exact_text = "B" * MIN_CHARS_PER_PAGE
        path = make_docx_file(tmp_path, [exact_text])
        result = extract_docx(Tier1ExtractorInput(file_path=path, language_codes=["en"]))
        # avg_chars_per_page == 100 => flag is False (not below threshold)
        assert result.below_min_chars_flag is False

    def test_boundary_one_below_threshold(self, tmp_path: Path) -> None:
        """below_min_chars_flag is True when avg chars per page == MIN_CHARS_PER_PAGE - 1."""
        short_text = "C" * (MIN_CHARS_PER_PAGE - 1)
        path = make_docx_file(tmp_path, [short_text])
        result = extract_docx(Tier1ExtractorInput(file_path=path, language_codes=["en"]))
        assert result.below_min_chars_flag is True


# ---------------------------------------------------------------------------
# Tests: No OCR or Tier 2 symbols in source module
# ---------------------------------------------------------------------------


class TestNoOcrInSource:
    def test_no_ocr_import_in_source(self) -> None:
        """Source module must not import OCR or Tier 2 packages."""
        source_path = Path(__file__).parent.parent / "src" / "tier1_extractor.py"
        source_text = source_path.read_text(encoding="utf-8")
        forbidden = ["easyocr", "pdf2image", "tesseract", "paddleocr", "pytesseract"]
        for token in forbidden:
            assert token not in source_text.lower(), (
                f"Tier 1 source must not reference '{token}' (Tier 2 OCR scope is EX-T3)"
            )
