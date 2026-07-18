import json
from pathlib import Path

import check_governed_pack_contract as guard


def _write_pack(root: Path, name: str, *, template_id: str = "sample_pack", workflow: str | None = None, schema: dict | None = None) -> Path:
    pack = root / name
    pack.mkdir(parents=True)
    (pack / "workflow.spec.md").write_text(
        workflow or "# Workflow Spec\n\n## Workflow\n\n1. Intake\n",
        encoding="utf-8",
    )
    (pack / "execution.policy.json").write_text(json.dumps({"templateId": template_id}), encoding="utf-8")
    (pack / "receipt.schema.json").write_text(
        json.dumps(
            schema
            or {
                "$schema": "https://json-schema.org/draft/2020-12/schema",
                "type": "object",
                "properties": {"stepTraces": {"type": "array"}},
            }
        ),
        encoding="utf-8",
    )
    return pack


def _write_templates(root: Path, template_id: str = "sample_pack") -> None:
    root.mkdir(parents=True)
    (root / "sample.ts").write_text(f"export const t = [{{ id: '{template_id}' }}];\n", encoding="utf-8")


def test_all_existing_packs_pass():
    report = guard.run_check(guard.REPO_ROOT / guard.DEFAULT_PACKS_ROOT, guard.REPO_ROOT / guard.DEFAULT_TEMPLATES_ROOT)

    assert report["compliant"] is True
    assert report["packCount"] == 3
    assert report["violationCount"] == 0


def test_missing_workflow_spec(tmp_path):
    packs = tmp_path / "packs"
    templates = tmp_path / "templates"
    _write_templates(templates)
    pack = _write_pack(packs, "broken")
    (pack / "workflow.spec.md").unlink()

    report = guard.run_check(packs, templates)

    assert any(item["rule"] == "A" for item in report["violations"])


def test_missing_templateid(tmp_path):
    packs = tmp_path / "packs"
    templates = tmp_path / "templates"
    _write_templates(templates, "other")
    _write_pack(packs, "broken", template_id="missing_template")

    report = guard.run_check(packs, templates)

    assert any(item["rule"] == "B" and "templateId not found" in item["issue"] for item in report["violations"])


def test_missing_workflow_section(tmp_path):
    packs = tmp_path / "packs"
    templates = tmp_path / "templates"
    _write_templates(templates)
    _write_pack(packs, "broken", workflow="# Workflow Spec\n\n## Purpose\n\nNo workflow.\n")

    report = guard.run_check(packs, templates)

    assert any(item["rule"] == "C" for item in report["violations"])


def test_missing_steptraces(tmp_path):
    packs = tmp_path / "packs"
    templates = tmp_path / "templates"
    _write_templates(templates)
    _write_pack(
        packs,
        "broken",
        schema={
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "type": "object",
            "properties": {},
        },
    )

    report = guard.run_check(packs, templates)

    assert any(item["rule"] == "D" and "stepTraces" in item["issue"] for item in report["violations"])
