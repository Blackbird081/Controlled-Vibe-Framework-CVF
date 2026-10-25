"""Enterprise pack profile scope, native checks, and invocation isolation."""

import contextlib
import io
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import check_enterprise_evidence_pack as gate


PATH_NAMES = (
    "PACK_PATH", "MAP_PATH", "TEMPLATE_PATH", "MANIFEST_PATH", "TRACE_PATH",
    "TEST_LOG_PATH", "ADR_PATH", "RUNTIME_MANIFEST_PATH", "RUNTIME_LOG_PATH",
)
PRIVATE_NAMES = ("TRACE_PATH", "TEST_LOG_PATH", "RUNTIME_MANIFEST_PATH", "RUNTIME_LOG_PATH")


class EnterpriseEvidenceProfileTests(unittest.TestCase):
    def setUp(self):
        self.stack = contextlib.ExitStack()
        self.addCleanup(self.stack.close)
        directory = self.stack.enter_context(tempfile.TemporaryDirectory(prefix="cvf-enterprise-profile-test-"))
        self.root = Path(directory)
        original_root = gate.REPO_ROOT
        self.stack.enter_context(patch.object(gate, "REPO_ROOT", self.root))
        self.paths = {}
        for name in PATH_NAMES:
            path = self.root / getattr(gate, name).relative_to(original_root)
            path.parent.mkdir(parents=True, exist_ok=True)
            self.paths[name] = path
            self.stack.enter_context(patch.object(gate, name, path))
        self.required = [self.paths[name] for name in PATH_NAMES]
        self.stack.enter_context(patch.object(gate, "REQUIRED_CANONICAL", self.required))
        self.private = frozenset(self.paths[name] for name in PRIVATE_NAMES)
        self.stack.enter_context(patch.object(gate, "PRIVATE_EVIDENCE_CANONICAL", self.private))
        for path in self.required:
            path.write_text("Synthetic canonical artifact\n", encoding="utf-8")
        self.template = "\n".join(gate.REQUIRED_TEMPLATE_MARKERS) + "\n"
        self.paths["TEMPLATE_PATH"].write_text(self.template, encoding="utf-8")

    def public_surface(self):
        source = self.root / "governance/toolkit/05_OPERATION/CVF_PUBLIC_CORE_AGENTS.md"
        source.parent.mkdir(parents=True, exist_ok=True)
        source.write_text("Exact public carrier\n", encoding="utf-8")
        (self.root / "AGENTS.md").write_text("Exact public carrier\n", encoding="utf-8")

    def remove_private(self):
        for path in self.private:
            path.unlink()

    def invoke(self, arguments):
        output = io.StringIO()
        with patch.object(sys, "argv", ["check_enterprise_evidence_pack.py", *arguments]), \
             contextlib.redirect_stdout(output):
            result = gate.main()
        return result, json.loads(output.getvalue())

    def test_private_default_preserves_all_nine_required_paths(self):
        report = gate.build_report(None)
        self.assertTrue(report["compliant"])
        self.assertEqual(len(report["canonicalFilesChecked"]), 9)
        self.remove_private()
        report = gate.build_report(None)
        self.assertFalse(report["compliant"])
        self.assertEqual({v["path"] for v in report["violations"]}, {p.relative_to(self.root).as_posix() for p in self.private})
        self.assertEqual(report["violationCount"], 4)

    def test_private_packet_field_checks_remain_unchanged(self):
        packet = self.root / "docs/reviews/synthetic-packet.md"
        packet.write_text("Incomplete synthetic packet\n", encoding="utf-8")
        report = gate.build_report(packet.relative_to(self.root).as_posix())
        self.assertEqual(len([v for v in report["violations"] if v["type"] == "packet_field_missing"]), len(gate.REQUIRED_PACKET_FIELDS))
        packet.write_text("\n".join(gate.REQUIRED_PACKET_FIELDS), encoding="utf-8")
        self.assertTrue(gate.build_report(packet.relative_to(self.root).as_posix())["compliant"])

    def test_public_checks_five_normative_owners_without_private_evidence(self):
        self.public_surface()
        self.remove_private()
        report = gate.build_report(None, "public")
        self.assertTrue(report["compliant"])
        self.assertEqual(len(report["canonicalFilesChecked"]), 5)
        self.assertEqual(len(report["privateEvidencePresenceNotApplicable"]), 4)
        self.assertIsNone(report["packetChecked"])
        self.assertIn("NOT_PACKET_OR_RELEASE_READINESS", report["claimBoundary"])

    def test_each_missing_public_normative_owner_fails(self):
        self.public_surface()
        self.remove_private()
        for path in [p for p in self.required if p not in self.private]:
            with self.subTest(path=path.name):
                before = path.read_bytes()
                path.unlink()
                report = gate.build_report(None, "public")
                self.assertFalse(report["compliant"])
                self.assertIn(path.relative_to(self.root).as_posix(), [v["path"] for v in report["violations"] if v["type"] == "required_file_missing"])
                path.write_bytes(before)

    def test_each_required_template_section_is_still_checked_in_public(self):
        self.public_surface()
        self.remove_private()
        for marker in gate.REQUIRED_TEMPLATE_MARKERS:
            with self.subTest(marker=marker):
                self.paths["TEMPLATE_PATH"].write_text(self.template.replace(marker, ""), encoding="utf-8")
                report = gate.build_report(None, "public")
                self.assertFalse(report["compliant"])
                self.assertTrue(any(v["type"] == "template_marker_missing" and marker in v["message"] for v in report["violations"]))
        self.paths["TEMPLATE_PATH"].write_text(self.template, encoding="utf-8")

    def test_public_packet_is_rejected_without_reading_or_claiming_it(self):
        self.public_surface()
        with patch.object(gate, "_check_packet", side_effect=AssertionError("Private packet must not be read")) as packet_check:
            for packet in ("docs/reviews/synthetic-packet.md", ""):
                report = gate.build_report(packet, "public")
                self.assertFalse(report["compliant"])
                self.assertIn("public_packet_unsupported", [v["type"] for v in report["violations"]])
                self.assertIsNone(report["packetChecked"])
            packet_check.assert_not_called()
        self.assertEqual(self.invoke(["--profile", "public", "--packet", "docs/reviews/synthetic-packet.md", "--json"])[0], 2)

    def test_public_carrier_must_exist_and_match_exact_bytes(self):
        self.assertIn("public_profile_mismatch", [v["type"] for v in gate.build_report(None, "public")["violations"]])
        self.public_surface()
        (self.root / "AGENTS.md").write_text("Private or modified carrier\n", encoding="utf-8")
        self.assertEqual(self.invoke(["--profile", "public", "--json"])[0], 2)
        self.public_surface()
        self.assertTrue(gate.build_report(None, "public")["compliant"])

    def test_repeated_public_then_private_main_has_no_scope_leak(self):
        self.public_surface()
        self.remove_private()
        result, public = self.invoke(["--profile", "public", "--enforce", "--json"])
        self.assertEqual(result, 0)
        self.assertEqual(len(public["canonicalFilesChecked"]), 5)
        result, private = self.invoke(["--enforce", "--json"])
        self.assertEqual(result, 2)
        self.assertEqual(len(private["canonicalFilesChecked"]), 9)
        self.assertEqual(private["violationCount"], 4)
        self.assertEqual(len(gate.REQUIRED_CANONICAL), 9)


if __name__ == "__main__":
    unittest.main()
