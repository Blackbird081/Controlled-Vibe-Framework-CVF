"""Tests for Skill Control Plane inventory generation and drift checks."""

from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

_HERE = Path(__file__).resolve().parent
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))

from generate_assf_skill_index import generate_index
from generate_skill_control_plane_inventory import (
    _activation_decision,
    build_inventory,
    recommend_skills_for_spec,
    validate_inventory_matches_sources,
)


def _write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def _entry(skill_id: str, *, cert: str = "NOT_STARTED", uat: str = "NOT_STARTED") -> dict[str, object]:
    return {
        "registryOrder": 1,
        "skillId": skill_id,
        "name": skill_id,
        "status": "CANDIDATE",
        "canonicalRoot": f"docs/reference/agent_system_skills/registry/entries/{skill_id}.json",
        "certificationState": cert,
        "uatState": uat,
        "internalAgentDisposition": "CANDIDATE",
        "externalCliMcpDisposition": "DEFERRED_WITH_REASON",
    }


def _web_payload(skill_id: str, *, cert: str = "CERTIFIED", uat: str = "PASSED") -> dict[str, object]:
    return {
        "categories": [
            {
                "id": "agent_system_skills",
                "name": "Agent System Skills",
                "skills": [
                    {
                        "id": skill_id,
                        "title": skill_id,
                        "domain": "Agent System Skills",
                        "path": f"docs/reference/agent_system_skills/registry/entries/{skill_id}.json",
                        "assfProjectionClass": "CERTIFIED_PACKAGE_PROJECTION",
                        "canonicalRoot": f"docs/reference/agent_system_skills/registry/entries/{skill_id}.json",
                        "certificationState": cert,
                        "uatState": uat,
                    }
                ],
            }
        ]
    }


def _package_entry(skill_id: str, *, status: str = "PROPOSED") -> dict[str, object]:
    entry = _entry(skill_id)
    entry["status"] = status
    entry["canonicalRoot"] = f"docs/reference/agent_system_skills/packages/{skill_id}/SKILL.md"
    return entry


def _package_source(skill_id: str, *, lifecycle: str = "PROPOSED") -> dict[str, object]:
    return {
        "skillId": skill_id,
        "lifecycleState": lifecycle,
    }


def _selection_profiles(*skill_ids: str) -> dict[str, object]:
    return {
        "schemaVersion": "skill-selection-profiles-v1",
        "profiles": [
            {
                "agentUseCases": ["harden auth"],
                "domainGroup": "engineering",
                "expectedOutputContribution": "Security hardening guidance.",
                "intendedUsers": ["worker"],
                "notRecommendedWhen": ["no security surface"],
                "outputGoals": ["security hardening"],
                "primaryDomain": "security-hardening",
                "recommendedWhen": ["spec mentions auth or secrets"],
                "secondaryDomains": ["risk-control"],
                "selectionKeywords": ["auth", "secrets", "security"],
                "selectionPriority": 80,
                "skillId": skill_id,
                "specSignals": ["threat model"],
            }
            for skill_id in skill_ids
        ],
    }


class SkillControlPlaneInventoryTests(unittest.TestCase):
    def test_web_certified_projection_passes_when_registry_certified(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            entries_dir = root / "entries"
            index_path = root / "skill-index.json"
            truth_path = root / "truth-index.json"
            web_path = root / "skills-index.json"
            template_path = root / "skill-template-map.json"
            selection_path = root / "skill-selection-profiles.json"
            _write_json(entries_dir / "skill-one.json", _entry("skill-one", cert="CERTIFIED", uat="PASSED"))
            _write_json(truth_path, {"entries": []})
            _write_json(web_path, _web_payload("skill-one"))
            _write_json(template_path, {"templateToSkillMap": {}})
            _write_json(selection_path, {"schemaVersion": "skill-selection-profiles-v1", "profiles": []})
            generate_index(index_path, entries_dir)

            inventory = build_inventory(
                entries_dir=entries_dir,
                index_path=index_path,
                package_roots_dir=root / "packages",
                truth_index_path=truth_path,
                selection_profiles_path=selection_path,
                web_skill_index_path=web_path,
                web_template_map_path=template_path,
            )

            self.assertEqual(inventory["summary"]["crossSurfaceDriftViolationCount"], 0)
            self.assertEqual(inventory["records"][0]["webProjection"]["assfProjectionClass"], "CERTIFIED_PACKAGE_PROJECTION")

    def test_web_certified_projection_fails_without_registry_certification(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            entries_dir = root / "entries"
            index_path = root / "skill-index.json"
            truth_path = root / "truth-index.json"
            web_path = root / "skills-index.json"
            template_path = root / "skill-template-map.json"
            selection_path = root / "skill-selection-profiles.json"
            _write_json(entries_dir / "skill-one.json", _entry("skill-one"))
            _write_json(truth_path, {"entries": []})
            _write_json(web_path, _web_payload("skill-one"))
            _write_json(template_path, {"templateToSkillMap": {}})
            _write_json(selection_path, {"schemaVersion": "skill-selection-profiles-v1", "profiles": []})
            generate_index(index_path, entries_dir)

            inventory = build_inventory(
                entries_dir=entries_dir,
                index_path=index_path,
                package_roots_dir=root / "packages",
                truth_index_path=truth_path,
                selection_profiles_path=selection_path,
                web_skill_index_path=web_path,
                web_template_map_path=template_path,
            )

            self.assertIn(
                "WEB_CERTIFIED_PROJECTION_WITHOUT_REGISTRY_CERTIFICATION",
                inventory["records"][0]["drift"]["violations"],
            )

    def test_missing_generated_inventory_is_reported(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            entries_dir = root / "entries"
            index_path = root / "skill-index.json"
            truth_path = root / "truth-index.json"
            web_path = root / "skills-index.json"
            template_path = root / "skill-template-map.json"
            selection_path = root / "skill-selection-profiles.json"
            _write_json(entries_dir / "skill-one.json", _entry("skill-one"))
            _write_json(truth_path, {"entries": []})
            _write_json(web_path, {"categories": []})
            _write_json(template_path, {"templateToSkillMap": {}})
            _write_json(selection_path, {"schemaVersion": "skill-selection-profiles-v1", "profiles": []})
            generate_index(index_path, entries_dir)

            violations = validate_inventory_matches_sources(
                inventory_path=root / "missing.json",
                entries_dir=entries_dir,
                index_path=index_path,
                package_roots_dir=root / "packages",
                truth_index_path=truth_path,
                selection_profiles_path=selection_path,
                web_skill_index_path=web_path,
                web_template_map_path=template_path,
            )

            self.assertTrue(any("not found" in v for v in violations))

    def test_package_root_without_selection_profile_is_reported(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            entries_dir = root / "entries"
            packages_dir = root / "packages"
            index_path = root / "skill-index.json"
            truth_path = root / "truth-index.json"
            web_path = root / "skills-index.json"
            template_path = root / "skill-template-map.json"
            selection_path = root / "skill-selection-profiles.json"
            skill_id = "skill-one"
            _write_json(entries_dir / "skill-one.json", _package_entry(skill_id))
            (packages_dir / skill_id).mkdir(parents=True)
            (packages_dir / skill_id / "SKILL.md").write_text("# Skill\n", encoding="utf-8")
            _write_json(packages_dir / skill_id / "skill.source.json", _package_source(skill_id))
            _write_json(truth_path, {"entries": []})
            _write_json(web_path, {"categories": []})
            _write_json(template_path, {"templateToSkillMap": {}})
            _write_json(selection_path, {"schemaVersion": "skill-selection-profiles-v1", "profiles": []})
            generate_index(index_path, entries_dir)

            inventory = build_inventory(
                entries_dir=entries_dir,
                index_path=index_path,
                package_roots_dir=packages_dir,
                truth_index_path=truth_path,
                selection_profiles_path=selection_path,
                web_skill_index_path=web_path,
                web_template_map_path=template_path,
            )

            self.assertIn(
                "SELECTION_PROFILE_MISSING",
                inventory["records"][0]["drift"]["violations"],
            )

    def _build_lifecycle_fixture_inventory_with_truth(
        self, status: str, *, truth_status: str = "approved"
    ) -> dict[str, object]:
        # Mirrors _build_lifecycle_fixture_inventory but also seeds an
        # approved STRICT runtime-eligible truth packet, so the activation
        # decision's own status gate (independent of the drift predicate) can
        # be exercised across the full lifecycle state matrix.
        real_skill_id = "cvf-engineering-test-evidence-audit"
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            entries_dir = root / "entries"
            index_path = root / "skill-index.json"
            truth_path = root / "truth-index.json"
            web_path = root / "skills-index.json"
            template_path = root / "skill-template-map.json"
            selection_path = root / "skill-selection-profiles.json"
            entry = _package_entry(real_skill_id, status=status)
            entry["canonicalRoot"] = (
                f"docs/reference/agent_system_skills/packages/{real_skill_id}/SKILL.md"
            )
            entry["certificationState"] = "CERTIFIED"
            entry["uatState"] = "PASSED"
            entry["internalAgentDisposition"] = "IMPLEMENTED"
            _write_json(entries_dir / f"{real_skill_id}.json", entry)
            _write_json(
                truth_path,
                {
                    "entries": [
                        {
                            "skillId": real_skill_id,
                            "truthStatus": truth_status,
                            "verificationMode": "STRICT",
                            "runtimeEligibility": "RUNTIME_PACKAGE_ELIGIBLE",
                        }
                    ]
                },
            )
            _write_json(web_path, {"categories": []})
            _write_json(template_path, {"templateToSkillMap": {}})
            _write_json(selection_path, _selection_profiles(real_skill_id))
            generate_index(index_path, entries_dir)

            return build_inventory(
                entries_dir=entries_dir,
                index_path=index_path,
                truth_index_path=truth_path,
                selection_profiles_path=selection_path,
                web_skill_index_path=web_path,
                web_template_map_path=template_path,
            )

    def test_approved_with_approved_truth_is_denied_source_not_active(self) -> None:
        inventory = self._build_lifecycle_fixture_inventory_with_truth("APPROVED")
        record = inventory["records"][0]

        self.assertTrue(record["runtime"]["eligible"])
        self.assertEqual(record["truth"]["truthStatus"], "approved")
        self.assertEqual(
            record["activation"]["decision"],
            "DENIED_SOURCE_NOT_ACTIVE",
        )
        self.assertNotIn("ACTIVE_RESOLVER_READY_PACKAGE", record["taxonomy"])

    def test_active_with_approved_truth_is_activation_ready(self) -> None:
        inventory = self._build_lifecycle_fixture_inventory_with_truth("ACTIVE")
        record = inventory["records"][0]

        self.assertTrue(record["runtime"]["eligible"])
        self.assertEqual(
            record["activation"]["decision"],
            "ACTIVATION_READY",
        )
        self.assertIn("ACTIVE_RESOLVER_READY_PACKAGE", record["taxonomy"])

    def _build_lifecycle_fixture_inventory(self, status: str) -> dict[str, object]:
        # _package_root_path in the generator under test resolves canonicalRoot
        # against the module-level REPO_ROOT rather than the fixture's
        # package_roots_dir, so a runtime-eligible fixture must reuse an
        # existing real package root's canonicalRoot to satisfy the
        # PACKAGE_ROOT_MISSING check. Only the registry entry and package
        # source fields below are read by build_inventory for this test; no
        # real registry/package-source file is read or mutated.
        real_skill_id = "cvf-engineering-test-evidence-audit"
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            entries_dir = root / "entries"
            index_path = root / "skill-index.json"
            truth_path = root / "truth-index.json"
            web_path = root / "skills-index.json"
            template_path = root / "skill-template-map.json"
            selection_path = root / "skill-selection-profiles.json"
            entry = _package_entry(real_skill_id, status=status)
            entry["canonicalRoot"] = (
                f"docs/reference/agent_system_skills/packages/{real_skill_id}/SKILL.md"
            )
            entry["certificationState"] = "CERTIFIED"
            entry["uatState"] = "PASSED"
            entry["internalAgentDisposition"] = "IMPLEMENTED"
            _write_json(entries_dir / f"{real_skill_id}.json", entry)
            _write_json(truth_path, {"entries": []})
            _write_json(web_path, {"categories": []})
            _write_json(template_path, {"templateToSkillMap": {}})
            _write_json(selection_path, _selection_profiles(real_skill_id))
            generate_index(index_path, entries_dir)

            return build_inventory(
                entries_dir=entries_dir,
                index_path=index_path,
                truth_index_path=truth_path,
                selection_profiles_path=selection_path,
                web_skill_index_path=web_path,
                web_template_map_path=template_path,
            )

    def test_approved_runtime_eligible_without_truth_is_activation_denied_not_drift(self) -> None:
        inventory = self._build_lifecycle_fixture_inventory("APPROVED")
        record = inventory["records"][0]

        self.assertTrue(record["runtime"]["eligible"])
        self.assertEqual(
            record["activation"]["decision"],
            "DENIED_MISSING_TRUTH_PACKET",
        )
        self.assertNotIn(
            "RUNTIME_ELIGIBLE_WITHOUT_APPROVED_STRICT_TRUTH_PACKET",
            record["drift"]["violations"],
        )

    def test_active_runtime_eligible_without_truth_retains_hard_drift(self) -> None:
        inventory = self._build_lifecycle_fixture_inventory("ACTIVE")
        record = inventory["records"][0]

        self.assertTrue(record["runtime"]["eligible"])
        self.assertEqual(
            record["activation"]["decision"],
            "DENIED_MISSING_TRUTH_PACKET",
        )
        self.assertIn(
            "RUNTIME_ELIGIBLE_WITHOUT_APPROVED_STRICT_TRUTH_PACKET",
            record["drift"]["violations"],
        )

    def test_activation_decision_matrix_uses_canonical_priority_and_tokens(self) -> None:
        approved_truth = {
            "truthStatus": "approved",
            "verificationMode": "STRICT",
            "runtimeEligibility": "RUNTIME_PACKAGE_ELIGIBLE",
        }
        invalid_truth = {
            "truthStatus": "pending",
            "verificationMode": "RELAXED",
            "runtimeEligibility": "NOT_RUNTIME_PACKAGE_ELIGIBLE",
        }
        cases = (
            (False, "ACTIVE", None, "DENIED_NOT_RUNTIME_ELIGIBLE"),
            (True, "APPROVED", None, "DENIED_MISSING_TRUTH_PACKET"),
            (True, "APPROVED", invalid_truth, "DENIED_TRUTH_NOT_APPROVED"),
            (True, "APPROVED", approved_truth, "DENIED_SOURCE_NOT_ACTIVE"),
            (True, "ACTIVE", None, "DENIED_MISSING_TRUTH_PACKET"),
            (True, "ACTIVE", invalid_truth, "DENIED_TRUTH_NOT_APPROVED"),
            (True, "ACTIVE", approved_truth, "ACTIVATION_READY"),
        )
        for eligible, status, truth, expected in cases:
            with self.subTest(eligible=eligible, status=status, expected=expected):
                self.assertEqual(_activation_decision(eligible, status, truth), expected)

    def test_spec_recommendation_uses_selection_keywords(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            entries_dir = root / "entries"
            packages_dir = root / "packages"
            index_path = root / "skill-index.json"
            truth_path = root / "truth-index.json"
            web_path = root / "skills-index.json"
            template_path = root / "skill-template-map.json"
            selection_path = root / "skill-selection-profiles.json"
            skill_id = "security-skill"
            _write_json(entries_dir / "security-skill.json", _package_entry(skill_id))
            (packages_dir / skill_id).mkdir(parents=True)
            (packages_dir / skill_id / "SKILL.md").write_text("# Skill\n", encoding="utf-8")
            _write_json(packages_dir / skill_id / "skill.source.json", _package_source(skill_id))
            _write_json(truth_path, {"entries": []})
            _write_json(web_path, {"categories": []})
            _write_json(template_path, {"templateToSkillMap": {}})
            _write_json(selection_path, _selection_profiles(skill_id))
            generate_index(index_path, entries_dir)

            inventory = build_inventory(
                entries_dir=entries_dir,
                index_path=index_path,
                package_roots_dir=packages_dir,
                truth_index_path=truth_path,
                selection_profiles_path=selection_path,
                web_skill_index_path=web_path,
                web_template_map_path=template_path,
            )
            recommendations = recommend_skills_for_spec(
                "Need to harden auth and secrets handling",
                inventory,
            )

            self.assertEqual(recommendations[0]["skillId"], skill_id)
            self.assertEqual(recommendations[0]["primaryDomain"], "security-hardening")


if __name__ == "__main__":
    unittest.main()
