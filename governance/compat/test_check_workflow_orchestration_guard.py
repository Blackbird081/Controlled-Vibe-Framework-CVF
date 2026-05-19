import json
import subprocess
import sys
from pathlib import Path

import check_workflow_orchestration_guard as guard


def _reader(files: dict[str, str]):
    return lambda path: files.get(path, "")


def test_compliant_fixture():
    commands = {
        ".github/workflows/cvf-static-ci.yml": [
            "python scripts/run_cvf_static_ci_gate.py --json",
        ],
        "governance/compat/run_local_governance_hook_chain.py": [
            "check_workflow_orchestration_guard.py",
        ],
    }
    files = {
        ".github/workflows/cvf-static-ci.yml": "run: python scripts/run_cvf_static_ci_gate.py --json",
        "governance/compat/run_local_governance_hook_chain.py": "check_workflow_orchestration_guard.py",
    }

    report = guard.run_check(commands, _reader(files), {})

    assert report["compliant"] is True
    assert report["violationCount"] == 0


def test_missing_workflow_file():
    commands = {".github/workflows/missing.yml": ["python scripts/missing.py"]}

    report = guard.run_check(commands, _reader({}), {})

    assert report["compliant"] is False
    assert report["violations"] == [
        {
            "path": ".github/workflows/missing.yml",
            "issue": "required workflow or runner file is missing",
        }
    ]


def test_missing_fragment():
    commands = {".github/workflows/cvf-static-ci.yml": ["python scripts/run_cvf_static_ci_gate.py --json"]}
    files = {".github/workflows/cvf-static-ci.yml": "run: python scripts/other.py"}

    report = guard.run_check(commands, _reader(files), {})

    assert report["compliant"] is False
    assert report["violations"][0]["path"] == ".github/workflows/cvf-static-ci.yml"
    assert "missing canonical command fragment" in report["violations"][0]["issue"]


def test_fragmented_static_marker():
    report = guard.run_check(
        {},
        _reader({}),
        {".github/workflows/cvf-web-ci.yml": "run: npx vitest run src/lib/skill-template-map.test.ts"},
    )

    assert report["compliant"] is False
    assert report["violations"][0]["path"] == ".github/workflows/cvf-web-ci.yml"
    assert "static governance test list is duplicated" in report["violations"][0]["issue"]


def test_path_normalization():
    assert guard._fragment_present(
        "python governance\\compat\\run_local_governance_hook_chain.py --hook pre-commit",
        "python governance/compat/run_local_governance_hook_chain.py --hook pre-commit",
    )


def test_json_output_mode():
    script = Path(guard.__file__).resolve()
    proc = subprocess.run(
        [sys.executable, str(script), "--json"],
        cwd=guard.REPO_ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=True,
    )

    payload = json.loads(proc.stdout)
    assert isinstance(payload["compliant"], bool)
