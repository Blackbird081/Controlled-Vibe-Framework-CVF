"""
Focused unit tests for check_index_classification.py

Covers:
- Missing required INDEX metadata fields (acceptance criterion 1)
- Retroactive rewrite claim (acceptance criterion 2)
- Provider/private memory authority misuse (acceptance criterion 3)
- Forbidden runtime/expansion claim (acceptance criterion 4)
- Valid INDEX artifact passes without violations (acceptance criterion 5)
- Standard marker validation
- Invalid INDEX type value
- Binding citation check
- Applicable artifact detection
"""

import sys
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT))

from governance.compat.check_index_classification import (
    _is_applicable,
    _validate_binding,
    _validate_index_artifact,
    _validate_standard,
    AUTORUN_PATH,
    HOOK_CHAIN_PATH,
    REQUIRED_METADATA_FIELDS,
    THIS_SCRIPT_PATH,
    VALID_INDEX_TYPES,
)


VALID_ARTIFACT_PATH = "docs/reviews/test_index_artifact.md"

FULL_VALID_CONTENT = """\
# Test INDEX Artifact

INDEX type: IDX-2 PLANE_OWNER_MAP
Source authority: docs/work_orders/CVF_WO_TEST_2026-06-21.md
Status: ACTIVE
Date: 2026-06-21
Human-reviewable: YES
Claim boundary: Cross-reference only; does not assert runtime authority.
Public Export Disposition: DEFERRED_PRIVATE_ONLY
"""


class TestApplicableDetection(unittest.TestCase):

    def test_applicable_with_index_type_declaration(self) -> None:
        text = "INDEX type: IDX-2 PLANE_OWNER_MAP\nSource authority: x\n"
        self.assertTrue(_is_applicable(VALID_ARTIFACT_PATH, text))

    def test_not_applicable_without_index_type(self) -> None:
        text = "Memory class: FULL_RECORD\nStatus: ACTIVE\n"
        self.assertFalse(_is_applicable(VALID_ARTIFACT_PATH, text))

    def test_not_applicable_table_row_only(self) -> None:
        text = "| INDEX type | YES | One of IDX-1 through IDX-6 |\n"
        self.assertFalse(_is_applicable(VALID_ARTIFACT_PATH, text))

    def test_not_applicable_wrong_prefix(self) -> None:
        text = "INDEX type: IDX-2 PLANE_OWNER_MAP\n"
        self.assertFalse(_is_applicable("EXTENSIONS/foo/bar.md", text))

    def test_not_applicable_archive_path(self) -> None:
        text = "INDEX type: IDX-2 PLANE_OWNER_MAP\n"
        self.assertFalse(_is_applicable("docs/reviews/archive/old.md", text))

    def test_not_applicable_non_md(self) -> None:
        text = "INDEX type: IDX-2 PLANE_OWNER_MAP\n"
        self.assertFalse(_is_applicable("docs/reviews/test.json", text))


class TestMissingMetadataFields(unittest.TestCase):

    def test_all_fields_present_passes(self) -> None:
        violations = _validate_index_artifact(VALID_ARTIFACT_PATH, FULL_VALID_CONTENT)
        field_violations = [v for v in violations
                            if v["type"] == "missing_required_metadata_field"]
        self.assertEqual(field_violations, [])

    def test_missing_source_authority(self) -> None:
        text = (
            "INDEX type: IDX-2 PLANE_OWNER_MAP\n"
            "Status: ACTIVE\n"
            "Date: 2026-06-21\n"
            "Human-reviewable: YES\n"
            "Claim boundary: cross-reference only\n"
            "Public Export Disposition: DEFERRED_PRIVATE_ONLY\n"
        )
        violations = _validate_index_artifact(VALID_ARTIFACT_PATH, text)
        types = [v["type"] for v in violations]
        self.assertIn("missing_required_metadata_field", types)
        messages = " ".join(v["message"] for v in violations)
        self.assertIn("Source authority:", messages)

    def test_missing_claim_boundary(self) -> None:
        text = (
            "INDEX type: IDX-2 PLANE_OWNER_MAP\n"
            "Source authority: docs/work_orders/test.md\n"
            "Status: ACTIVE\n"
            "Date: 2026-06-21\n"
            "Human-reviewable: YES\n"
            "Public Export Disposition: DEFERRED_PRIVATE_ONLY\n"
        )
        violations = _validate_index_artifact(VALID_ARTIFACT_PATH, text)
        types = [v["type"] for v in violations]
        self.assertIn("missing_required_metadata_field", types)
        messages = " ".join(v["message"] for v in violations)
        self.assertIn("Claim boundary:", messages)

    def test_missing_public_export_disposition(self) -> None:
        text = (
            "INDEX type: IDX-2 PLANE_OWNER_MAP\n"
            "Source authority: docs/work_orders/test.md\n"
            "Status: ACTIVE\n"
            "Date: 2026-06-21\n"
            "Human-reviewable: YES\n"
            "Claim boundary: cross-reference only\n"
        )
        violations = _validate_index_artifact(VALID_ARTIFACT_PATH, text)
        types = [v["type"] for v in violations]
        self.assertIn("missing_required_metadata_field", types)
        messages = " ".join(v["message"] for v in violations)
        self.assertIn("Public Export Disposition:", messages)

    def test_all_required_fields_listed(self) -> None:
        for field in REQUIRED_METADATA_FIELDS:
            with self.subTest(field=field):
                text = "\n".join(
                    f"{f} value"
                    for f in REQUIRED_METADATA_FIELDS
                    if f != field
                ) + "\n"
                violations = _validate_index_artifact(VALID_ARTIFACT_PATH, text)
                messages = " ".join(v["message"] for v in violations)
                self.assertIn(field, messages,
                              f"Expected missing field `{field}` to be reported")


class TestRetroactiveRewriteClaim(unittest.TestCase):

    def test_retroactive_rewrite_detected(self) -> None:
        text = FULL_VALID_CONTENT + (
            "\nThis artifact retroactively rewrites all historical CVF classification records.\n"
        )
        violations = _validate_index_artifact(VALID_ARTIFACT_PATH, text)
        types = [v["type"] for v in violations]
        self.assertIn("retroactive_rewrite_claim", types)

    def test_retroactively_reclassify_detected(self) -> None:
        text = FULL_VALID_CONTENT + (
            "\nWe retroactively reclassify all prior INDEX assignments.\n"
        )
        violations = _validate_index_artifact(VALID_ARTIFACT_PATH, text)
        types = [v["type"] for v in violations]
        self.assertIn("retroactive_rewrite_claim", types)

    def test_retroactively_relabel_detected(self) -> None:
        text = FULL_VALID_CONTENT + (
            "\nThis will retroactively relabel historical CVF documents.\n"
        )
        violations = _validate_index_artifact(VALID_ARTIFACT_PATH, text)
        types = [v["type"] for v in violations]
        self.assertIn("retroactive_rewrite_claim", types)

    def test_no_false_positive_on_forward_only_explanation(self) -> None:
        text = FULL_VALID_CONTENT + (
            "\nretroactive classification being documentary only; artifacts not edited.\n"
        )
        violations = _validate_index_artifact(VALID_ARTIFACT_PATH, text)
        types = [v["type"] for v in violations]
        self.assertNotIn("retroactive_rewrite_claim", types)

    def test_no_false_positive_on_clean_artifact(self) -> None:
        violations = _validate_index_artifact(VALID_ARTIFACT_PATH, FULL_VALID_CONTENT)
        types = [v["type"] for v in violations]
        self.assertNotIn("retroactive_rewrite_claim", types)


class TestProviderPrivateAuthority(unittest.TestCase):

    def test_claude_md_without_marker_detected(self) -> None:
        text = FULL_VALID_CONTENT + "\nSource authority: CLAUDE.md\n"
        violations = _validate_index_artifact(VALID_ARTIFACT_PATH, text)
        types = [v["type"] for v in violations]
        self.assertIn("provider_private_authority_misuse", types)

    def test_memory_md_without_marker_detected(self) -> None:
        text = FULL_VALID_CONTENT + "\nSee MEMORY.md for details.\n"
        violations = _validate_index_artifact(VALID_ARTIFACT_PATH, text)
        types = [v["type"] for v in violations]
        self.assertIn("provider_private_authority_misuse", types)

    def test_claude_md_with_not_cvf_source_passes(self) -> None:
        text = FULL_VALID_CONTENT + "\nCLAUDE.md -- NOT_CVF_SOURCE; provider-private boundary\n"
        violations = _validate_index_artifact(VALID_ARTIFACT_PATH, text)
        types = [v["type"] for v in violations]
        self.assertNotIn("provider_private_authority_misuse", types)

    def test_claude_md_with_idx7_marker_passes(self) -> None:
        text = FULL_VALID_CONTENT + "\nCLAUDE.md IDX-7 PROVIDER_PRIVATE_MEMORY_INDEX\n"
        violations = _validate_index_artifact(VALID_ARTIFACT_PATH, text)
        types = [v["type"] for v in violations]
        self.assertNotIn("provider_private_authority_misuse", types)

    def test_no_provider_private_on_clean_artifact(self) -> None:
        violations = _validate_index_artifact(VALID_ARTIFACT_PATH, FULL_VALID_CONTENT)
        types = [v["type"] for v in violations]
        self.assertNotIn("provider_private_authority_misuse", types)


class TestForbiddenExpansionClaim(unittest.TestCase):

    def test_enforces_runtime_detected(self) -> None:
        text = FULL_VALID_CONTENT + "\nThis INDEX artifact enforces runtime policy decisions.\n"
        violations = _validate_index_artifact(VALID_ARTIFACT_PATH, text)
        types = [v["type"] for v in violations]
        self.assertIn("forbidden_expansion_claim", types)

    def test_runtime_enforcement_detected(self) -> None:
        text = FULL_VALID_CONTENT + "\nRuntime enforcement is provided by this index.\n"
        violations = _validate_index_artifact(VALID_ARTIFACT_PATH, text)
        types = [v["type"] for v in violations]
        self.assertIn("forbidden_expansion_claim", types)

    def test_vector_db_enforcement_detected(self) -> None:
        text = FULL_VALID_CONTENT + "\nvector DB enforcement applies here.\n"
        violations = _validate_index_artifact(VALID_ARTIFACT_PATH, text)
        types = [v["type"] for v in violations]
        self.assertIn("forbidden_expansion_claim", types)

    def test_graph_persistence_enforcement_detected(self) -> None:
        text = FULL_VALID_CONTENT + "\ngraph persistence enforcement is managed here.\n"
        violations = _validate_index_artifact(VALID_ARTIFACT_PATH, text)
        types = [v["type"] for v in violations]
        self.assertIn("forbidden_expansion_claim", types)

    def test_no_forbidden_expansion_on_clean_artifact(self) -> None:
        violations = _validate_index_artifact(VALID_ARTIFACT_PATH, FULL_VALID_CONTENT)
        types = [v["type"] for v in violations]
        self.assertNotIn("forbidden_expansion_claim", types)

    def test_advisory_language_is_not_forbidden(self) -> None:
        text = FULL_VALID_CONTENT + "\nRuntime authority: ADVISORY ONLY - navigation and cross-reference layer only.\n"
        violations = _validate_index_artifact(VALID_ARTIFACT_PATH, text)
        types = [v["type"] for v in violations]
        self.assertNotIn("forbidden_expansion_claim", types)


class TestInvalidIndexType(unittest.TestCase):

    def test_idx7_is_invalid_cvf_type(self) -> None:
        text = FULL_VALID_CONTENT.replace("IDX-2 PLANE_OWNER_MAP", "IDX-7 PROVIDER_PRIVATE_MEMORY_INDEX")
        violations = _validate_index_artifact(VALID_ARTIFACT_PATH, text)
        types = [v["type"] for v in violations]
        self.assertIn("invalid_index_type", types)

    def test_unknown_type_is_invalid(self) -> None:
        text = FULL_VALID_CONTENT.replace("IDX-2 PLANE_OWNER_MAP", "IDX-99 CUSTOM_TYPE")
        violations = _validate_index_artifact(VALID_ARTIFACT_PATH, text)
        types = [v["type"] for v in violations]
        self.assertIn("invalid_index_type", types)

    def test_idx10_does_not_match_idx1_prefix(self) -> None:
        text = FULL_VALID_CONTENT.replace("IDX-2 PLANE_OWNER_MAP", "IDX-10 PREFIX_COLLISION")
        violations = _validate_index_artifact(VALID_ARTIFACT_PATH, text)
        types = [v["type"] for v in violations]
        self.assertIn("invalid_index_type", types)

    def test_all_valid_types_pass(self) -> None:
        for valid_type in VALID_INDEX_TYPES:
            with self.subTest(idx_type=valid_type):
                text = FULL_VALID_CONTENT.replace("IDX-2 PLANE_OWNER_MAP", f"{valid_type} SOME_NAME")
                violations = _validate_index_artifact(VALID_ARTIFACT_PATH, text)
                types = [v["type"] for v in violations]
                self.assertNotIn("invalid_index_type", types,
                                 f"Expected {valid_type} to be valid but got invalid_index_type")


class TestStandardValidation(unittest.TestCase):

    def test_standard_missing_active_forward_only(self) -> None:
        text = "Some standard content without the required status marker."
        violations = _validate_standard("docs/reference/CVF_INDEX_CLASSIFICATION_STANDARD_2026-06-21.md", text)
        types = [v["type"] for v in violations]
        self.assertIn("standard_marker_missing", types)
        messages = " ".join(v["message"] for v in violations)
        self.assertIn("ACTIVE_FORWARD_ONLY", messages)

    def test_standard_missing_required_metadata_section(self) -> None:
        text = "Status: ACTIVE_FORWARD_ONLY\n"
        violations = _validate_standard("docs/reference/CVF_INDEX_CLASSIFICATION_STANDARD_2026-06-21.md", text)
        types = [v["type"] for v in violations]
        self.assertIn("standard_marker_missing", types)
        messages = " ".join(v["message"] for v in violations)
        self.assertIn("Required Metadata Per INDEX Artifact", messages)

    def test_standard_missing_forward_only_rules(self) -> None:
        text = "Status: ACTIVE_FORWARD_ONLY\n## Required Metadata Per INDEX Artifact\n"
        violations = _validate_standard("docs/reference/CVF_INDEX_CLASSIFICATION_STANDARD_2026-06-21.md", text)
        messages = " ".join(v["message"] for v in violations)
        self.assertIn("Forward-Only Application Rules", messages)

    def test_standard_missing_idx_labels(self) -> None:
        text = (
            "Status: ACTIVE_FORWARD_ONLY\n"
            "## Required Metadata Per INDEX Artifact\n"
            "Forward-Only Application Rules\n"
            "IDX-1\nIDX-2\nIDX-3\n"
        )
        violations = _validate_standard("docs/reference/CVF_INDEX_CLASSIFICATION_STANDARD_2026-06-21.md", text)
        types = [v["type"] for v in violations]
        self.assertIn("standard_marker_missing", types)
        messages = " ".join(v["message"] for v in violations)
        self.assertIn("IDX-4", messages)


class TestBindingCheck(unittest.TestCase):

    def test_missing_citation_in_autorun(self) -> None:
        text = "# Autorun gate\n# No checker citation here.\n"
        violations = _validate_binding(AUTORUN_PATH, text)
        self.assertTrue(violations)
        self.assertEqual(violations[0]["type"], "binding_missing")

    def test_present_citation_passes(self) -> None:
        text = f"# Autorun gate\n# Uses {THIS_SCRIPT_PATH}\n"
        violations = _validate_binding(AUTORUN_PATH, text)
        self.assertEqual(violations, [])

    def test_missing_citation_in_hook_chain(self) -> None:
        text = "# Hook chain\n# No checker citation here.\n"
        violations = _validate_binding(HOOK_CHAIN_PATH, text)
        self.assertTrue(violations)
        self.assertEqual(violations[0]["type"], "binding_missing")


class TestValidArtifactEndToEnd(unittest.TestCase):

    def test_fully_valid_artifact_produces_no_violations(self) -> None:
        violations = _validate_index_artifact(VALID_ARTIFACT_PATH, FULL_VALID_CONTENT)
        self.assertEqual(violations, [],
                         f"Expected no violations but got: {violations}")

    def test_multiple_valid_types_each_clean(self) -> None:
        for valid_type in VALID_INDEX_TYPES:
            with self.subTest(idx_type=valid_type):
                text = FULL_VALID_CONTENT.replace("IDX-2 PLANE_OWNER_MAP", f"{valid_type} EXAMPLE")
                violations = _validate_index_artifact(VALID_ARTIFACT_PATH, text)
                self.assertEqual(violations, [],
                                 f"Valid artifact with {valid_type} should produce no violations; got: {violations}")


if __name__ == "__main__":
    unittest.main()
