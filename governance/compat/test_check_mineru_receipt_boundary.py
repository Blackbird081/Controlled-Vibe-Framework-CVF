from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().with_name("check_mineru_receipt_boundary.py")
SPEC = importlib.util.spec_from_file_location("check_mineru_receipt_boundary", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


VALID_SHA = "sha256:" + ("a" * 64)


def _valid_receipt(**overrides: object) -> dict[str, object]:
    receipt: dict[str, object] = {
        "receiptId": "msea-r28-t1:receipt-001",
        "sourceInputSlot": "candidate-group-a-private-input",
        "inputSha256": VALID_SHA,
        "outputFileNames": ["layout.pdf", "model.json"],
        "outputContentRead": False,
        "privateOutputClass": "PRIVATE_GENERATED_OUTPUT",
        "privateOutputDisposition": "RECEIPT_METADATA_ALLOWED",
        "downstreamRelease": "HELD_PENDING_RECEIPT_CHECKER_AND_MEMORY_ROUTE",
        "claimBoundary": "This receipt records caller-supplied MinerU metadata only.",
        "receiptVersion": "cvf.mineruMetadataReceipt.r28t5.v2",
        "qualityReportRef": "msea-r28-t5:quality-report-001",
        "sourcePointer": "msea-r28-t5:source-pointer-001",
    }
    receipt.update(overrides)
    return receipt


class LoadCandidateReceiptTests(unittest.TestCase):
    def test_non_json_text_is_not_a_receipt(self) -> None:
        self.assertIsNone(MODULE._load_candidate_receipt("some/path.json", "not json"))

    def test_json_array_is_not_a_receipt(self) -> None:
        self.assertIsNone(MODULE._load_candidate_receipt("some/path.json", "[1, 2, 3]"))

    def test_json_object_without_receipt_version_is_not_a_receipt(self) -> None:
        text = '{"foo": "bar"}'
        self.assertIsNone(MODULE._load_candidate_receipt("some/path.json", text))

    def test_json_object_with_unrelated_receipt_version_is_not_a_receipt(self) -> None:
        text = '{"receiptVersion": "some.other.receipt.v1"}'
        self.assertIsNone(MODULE._load_candidate_receipt("some/path.json", text))

    def test_json_object_with_mineru_receipt_version_is_a_receipt(self) -> None:
        import json

        text = json.dumps(_valid_receipt())
        payload = MODULE._load_candidate_receipt("some/path.json", text)
        self.assertIsNotNone(payload)
        assert payload is not None
        self.assertEqual(payload["receiptId"], "msea-r28-t1:receipt-001")


class ValidateReceiptTests(unittest.TestCase):
    def test_valid_receipt_has_no_violations(self) -> None:
        violations = MODULE._validate_receipt("receipt.json", _valid_receipt())
        self.assertEqual(violations, [])

    def test_missing_required_field_is_flagged(self) -> None:
        receipt = _valid_receipt()
        del receipt["claimBoundary"]
        violations = MODULE._validate_receipt("receipt.json", receipt)
        self.assertEqual(len(violations), 1)
        self.assertEqual(violations[0]["type"], "MISSING_REQUIRED_RECEIPT_FIELD")
        self.assertIn("claimBoundary", violations[0]["message"])

    def test_invalid_private_output_class_is_flagged(self) -> None:
        receipt = _valid_receipt(privateOutputClass="SOMETHING_ELSE")
        violations = MODULE._validate_receipt("receipt.json", receipt)
        types = [v["type"] for v in violations]
        self.assertIn("INVALID_PRIVATE_OUTPUT_CLASS", types)

    def test_invalid_private_output_disposition_is_flagged(self) -> None:
        receipt = _valid_receipt(privateOutputDisposition="PRIVATE_GENERATED_OUTPUT")
        violations = MODULE._validate_receipt("receipt.json", receipt)
        types = [v["type"] for v in violations]
        self.assertIn("INVALID_PRIVATE_OUTPUT_DISPOSITION", types)

    def test_output_content_read_true_is_flagged(self) -> None:
        receipt = _valid_receipt(outputContentRead=True)
        violations = MODULE._validate_receipt("receipt.json", receipt)
        types = [v["type"] for v in violations]
        self.assertIn("OUTPUT_CONTENT_READ_TRUE_WITHOUT_AUTHORITY", types)

    def test_disallowed_output_file_name_is_flagged(self) -> None:
        receipt = _valid_receipt(outputFileNames=["full_text.txt"])
        violations = MODULE._validate_receipt("receipt.json", receipt)
        types = [v["type"] for v in violations]
        self.assertIn("OUTPUT_FILE_NAME_NOT_METADATA_ONLY", types)

    def test_path_traversal_output_file_name_is_flagged(self) -> None:
        receipt = _valid_receipt(outputFileNames=["../layout.pdf"])
        violations = MODULE._validate_receipt("receipt.json", receipt)
        types = [v["type"] for v in violations]
        self.assertIn("OUTPUT_FILE_NAME_NOT_METADATA_ONLY", types)

    def test_empty_output_file_names_is_flagged(self) -> None:
        receipt = _valid_receipt(outputFileNames=[])
        violations = MODULE._validate_receipt("receipt.json", receipt)
        types = [v["type"] for v in violations]
        self.assertIn("OUTPUT_FILE_NAME_NOT_METADATA_ONLY", types)

    def test_unauthorized_downstream_release_is_flagged(self) -> None:
        receipt = _valid_receipt(downstreamRelease="MEMORY_WRITE_AUTHORIZED")
        violations = MODULE._validate_receipt("receipt.json", receipt)
        types = [v["type"] for v in violations]
        self.assertIn("DOWNSTREAM_RELEASE_CLAIMS_UNAUTHORIZED_ROUTE", types)

    def test_unsafe_source_slot_is_flagged(self) -> None:
        receipt = _valid_receipt(sourceInputSlot="raw:full-document-name.pdf")
        violations = MODULE._validate_receipt("receipt.json", receipt)
        types = [v["type"] for v in violations]
        self.assertIn("SOURCE_SLOT_EXPOSES_SENSITIVE_DETAIL", types)

    def test_free_form_source_slot_is_flagged(self) -> None:
        receipt = _valid_receipt(sourceInputSlot="this has spaces and punctuation!")
        violations = MODULE._validate_receipt("receipt.json", receipt)
        types = [v["type"] for v in violations]
        self.assertIn("SOURCE_SLOT_EXPOSES_SENSITIVE_DETAIL", types)

    def test_malformed_sha256_is_flagged(self) -> None:
        receipt = _valid_receipt(inputSha256="sha256:NOTLOWERHEX")
        violations = MODULE._validate_receipt("receipt.json", receipt)
        types = [v["type"] for v in violations]
        self.assertIn("MISSING_REQUIRED_RECEIPT_FIELD", types)

    def test_missing_quality_report_ref_value_is_flagged(self) -> None:
        receipt = _valid_receipt(qualityReportRef="")
        violations = MODULE._validate_receipt("receipt.json", receipt)
        types = [v["type"] for v in violations]
        self.assertIn("QUALITY_OR_SOURCE_POINTER_MISSING", types)

    def test_raw_content_quality_report_ref_is_flagged(self) -> None:
        receipt = _valid_receipt(qualityReportRef="raw:quality-notes")
        violations = MODULE._validate_receipt("receipt.json", receipt)
        types = [v["type"] for v in violations]
        self.assertIn("QUALITY_OR_SOURCE_POINTER_MISSING", types)

    def test_missing_source_pointer_value_is_flagged(self) -> None:
        receipt = _valid_receipt(sourcePointer="")
        violations = MODULE._validate_receipt("receipt.json", receipt)
        types = [v["type"] for v in violations]
        self.assertIn("QUALITY_OR_SOURCE_POINTER_MISSING", types)

    def test_raw_content_source_pointer_is_flagged(self) -> None:
        receipt = _valid_receipt(sourcePointer="content:full-document-text")
        violations = MODULE._validate_receipt("receipt.json", receipt)
        types = [v["type"] for v in violations]
        self.assertIn("QUALITY_OR_SOURCE_POINTER_MISSING", types)

    def test_missing_quality_and_source_pointer_fields_reports_required_field_gap(self) -> None:
        receipt = _valid_receipt()
        del receipt["qualityReportRef"]
        del receipt["sourcePointer"]
        violations = MODULE._validate_receipt("receipt.json", receipt)
        self.assertEqual(len(violations), 1)
        self.assertEqual(violations[0]["type"], "MISSING_REQUIRED_RECEIPT_FIELD")
        self.assertIn("qualityReportRef", violations[0]["message"])
        self.assertIn("sourcePointer", violations[0]["message"])


class ClassifyApplicabilityTests(unittest.TestCase):
    def test_non_json_changed_path_is_ignored(self) -> None:
        result = MODULE._classify({"docs/reviews/SOME_REVIEW.md": ["A"]})
        self.assertEqual(result["fileCount"], 0)
        self.assertEqual(result["receiptsChecked"], 0)
        self.assertTrue(result["compliant"])

    def test_json_path_that_does_not_exist_is_not_checked(self) -> None:
        result = MODULE._classify({"governance/compat/does-not-exist-receipt.json": ["A"]})
        self.assertEqual(result["fileCount"], 1)
        self.assertEqual(result["receiptsChecked"], 0)
        self.assertTrue(result["compliant"])


if __name__ == "__main__":
    unittest.main()
