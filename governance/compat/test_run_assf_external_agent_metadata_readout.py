"""Focused tests for run_assf_external_agent_metadata_readout.py."""

from __future__ import annotations

import builtins
import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


MODULE_PATH = Path(__file__).resolve().with_name(
    "run_assf_external_agent_metadata_readout.py"
)
SPEC = importlib.util.spec_from_file_location(
    "run_assf_external_agent_metadata_readout", MODULE_PATH
)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


def _write_index(root: Path) -> Path:
    index_path = root / "skill-index.json"
    index_path.write_text(
        json.dumps(
            {
                "claimBoundary": "metadata-only",
                "skills": [
                    {
                        "adapterContract": "N/A with reason: not implemented",
                        "adapterEvidence": "N/A with reason: no adapter",
                        "authorityCeiling": "read-only inspection",
                        "canonicalRoot": "docs/reference/example.json",
                        "capabilityBoundary": "no activation",
                        "candidateState": "CANDIDATE",
                        "certificationState": "CERTIFIED",
                        "externalCliMcpDisposition": "DEFERRED_WITH_REASON",
                        "externalMutationBoundary": "no external mutation",
                        "license": "CVF_PRIVATE_GOVERNED",
                        "name": "Example Skill",
                        "originLane": "ASSF-T2",
                        "reviewArtifacts": ["docs/reviews/example.md"],
                        "riskCeiling": "R0",
                        "riskProfile": "R0",
                        "skillId": "example-skill",
                        "sourceArtifacts": ["docs/baselines/example.md"],
                        "status": "ACTIVE",
                        "uatState": "PASSED",
                        "version": "0.1.0",
                        "purpose": "must not leak",
                        "triggerPatterns": ["must not leak"],
                    }
                ],
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    return index_path


class MetadataReadoutTests(unittest.TestCase):
    def test_readout_uses_only_allowlisted_skill_fields(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            packet = MODULE.build_metadata_readout(index_path=_write_index(Path(tmp)))
        payload = packet.to_dict()
        self.assertEqual(payload["adapterImplementation"], "NOT_IMPLEMENTED")
        item = payload["items"][0]
        self.assertEqual(set(item), set(MODULE.ALLOWED_SKILL_FIELDS))
        self.assertNotIn("purpose", item)
        self.assertNotIn("triggerPatterns", item)
        self.assertNotIn("status", item)

    def test_claim_boundary_denies_adapter_and_execution(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            payload = MODULE.build_metadata_readout(
                index_path=_write_index(Path(tmp))
            ).to_dict()
        boundary = payload["claimBoundary"]
        self.assertIn("does not implement CLI/MCP adapter behavior", boundary)
        self.assertIn("execute package instruction bodies", boundary)
        self.assertIn("mutate ASSF registry or generated-index sources", boundary)

    def test_skill_id_filter_and_truncation(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            index_path = _write_index(Path(tmp))
            packet = MODULE.build_metadata_readout(
                index_path=index_path, skill_id="example-skill", max_results=1
            )
            missing = MODULE.build_metadata_readout(
                index_path=index_path, skill_id="missing", max_results=1
            )
        self.assertEqual(packet.total_candidates, 1)
        self.assertFalse(packet.truncated)
        self.assertEqual(missing.total_candidates, 0)
        self.assertEqual(missing.items, ())

    def test_cli_json_output(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            index_path = _write_index(Path(tmp))
            with patch("builtins.print") as mocked_print:
                rc = MODULE.main(["--index-path", str(index_path), "--json"])
        self.assertEqual(rc, 0)
        output = mocked_print.call_args.args[0]
        payload = json.loads(output)
        self.assertEqual(payload["items"][0]["skillId"], "example-skill")
        self.assertEqual(payload["adapterImplementation"], "NOT_IMPLEMENTED")

    def test_human_output_names_not_implemented_adapter(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            text = MODULE.build_metadata_readout(
                index_path=_write_index(Path(tmp))
            ).to_human_text()
        self.assertIn("Adapter implementation: NOT_IMPLEMENTED", text)
        self.assertIn("externalCliMcpDisposition=DEFERRED_WITH_REASON", text)

    def test_no_filesystem_write_or_instruction_body_open(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            index_path = _write_index(Path(tmp))
            opened_paths: list[str] = []
            original_open = builtins.open

            def guarded_open(file, mode="r", *args, **kwargs):
                path_text = str(file)
                opened_paths.append(path_text)
                if any(flag in str(mode) for flag in ("w", "a", "+")):
                    raise AssertionError(f"write attempted: {file}")
                if path_text.endswith("SKILL.md"):
                    raise AssertionError(f"instruction body opened: {file}")
                return original_open(file, mode, *args, **kwargs)

            with patch("builtins.open", side_effect=guarded_open):
                packet = MODULE.build_metadata_readout(index_path=index_path)

        self.assertEqual(packet.total_candidates, 1)
        self.assertTrue(all(not path.endswith("SKILL.md") for path in opened_paths))

    def test_invalid_max_results_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(ValueError):
                MODULE.build_metadata_readout(
                    index_path=_write_index(Path(tmp)), max_results=0
                )


if __name__ == "__main__":
    unittest.main()
