"""Tests for CVF Web Skill Control Plane projection drift checks."""

from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

_HERE = Path(__file__).resolve().parent
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))

from check_cvf_web_skill_control_plane_projection import check_projection


def _write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def _inventory(skill_id: str) -> dict[str, object]:
    return {
        "summary": {
            "runtimeEligiblePackages": 1,
        },
        "records": [
            {
                "skillId": skill_id,
                "runtime": {
                    "eligible": True,
                },
            }
        ],
    }


def _projection(skill_id: str) -> dict[str, object]:
    return {
        "dashboardContract": (
            "Read-only projection. It is not runtime authority, activation authority, "
            "or provider authority."
        ),
        "summary": {
            "runtimeEligiblePackages": 1,
            "projectedRuntimePackages": 1,
        },
        "runtimePackages": [
            {
                "skillId": skill_id,
            }
        ],
    }


def _web_index(skill_id: str, *, runtime_flag: bool = True) -> dict[str, object]:
    return {
        "meta": {
            "runtimePackageProjections": 1,
            "skillControlPlaneProjection": "public/data/assf-skill-control-plane.json",
        },
        "categories": [
            {
                "id": "agent_system_skills",
                "skills": [
                    {
                        "id": skill_id,
                        "assfProjectionClass": "CERTIFIED_PACKAGE_PROJECTION",
                        "runtimePackageProjection": runtime_flag,
                    }
                ],
            }
        ],
    }


class CvfWebSkillControlPlaneProjectionTests(unittest.TestCase):
    def test_aligned_projection_passes(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            skill_id = "package-one"
            inventory_path = root / "skill-inventory.json"
            web_projection_path = root / "assf-skill-control-plane.json"
            web_index_path = root / "skills-index.json"
            _write_json(inventory_path, _inventory(skill_id))
            _write_json(web_projection_path, _projection(skill_id))
            _write_json(web_index_path, _web_index(skill_id))

            violations = check_projection(
                inventory_path=inventory_path,
                web_index_path=web_index_path,
                web_control_plane_path=web_projection_path,
            )

            self.assertEqual(violations, [])

    def test_runtime_package_missing_from_web_index_is_reported(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            skill_id = "package-one"
            inventory_path = root / "skill-inventory.json"
            web_projection_path = root / "assf-skill-control-plane.json"
            web_index_path = root / "skills-index.json"
            _write_json(inventory_path, _inventory(skill_id))
            _write_json(web_projection_path, _projection(skill_id))
            _write_json(web_index_path, _web_index(skill_id, runtime_flag=False))

            violations = check_projection(
                inventory_path=inventory_path,
                web_index_path=web_index_path,
                web_control_plane_path=web_projection_path,
            )

            self.assertTrue(any("missing runtime Web projection flags" in item for item in violations))


if __name__ == "__main__":
    unittest.main()
