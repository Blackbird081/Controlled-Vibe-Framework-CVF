from __future__ import annotations

import hashlib
import json
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import check_dispatch_release_readiness as checker


WORK_ORDER = "docs/work_orders/CVF_AGENT_WORK_ORDER_TEST_R1_2026-09-25.md"
BASELINE = "docs/baselines/CVF_GC018_TEST_R1_2026-09-25.md"
HANDOFF = "AGENT_HANDOFF_TEST.md"
BATCH = "TEST-R1"


class Repo:
    def __init__(self, root: Path) -> None:
        self.root = root
        self.git("init", "-q")
        self.git("config", "user.email", "test@example.invalid")
        self.git("config", "user.name", "Dispatch Test")

    def git(self, *args: str) -> str:
        proc = subprocess.run(
            ["git", *args], cwd=self.root, text=True,
            stdout=subprocess.PIPE, stderr=subprocess.PIPE,
        )
        assert proc.returncode == 0, proc.stderr
        return proc.stdout.strip()

    def write(self, path: str, text: str) -> None:
        target = self.root / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(text, encoding="utf-8")

    def commit(self, message: str) -> str:
        self.git("add", "-A")
        self.git("commit", "-q", "-m", message)
        return self.git("rev-parse", "HEAD")


def _hash(repo: Repo, path: str) -> str:
    return hashlib.sha256((repo.root / path).read_bytes()).hexdigest()


def _write_packet(repo: Repo, suffix: str = "") -> str:
    repo.write(BASELINE, f"# Baseline\n\nStatus: DISPATCH_READY\n{suffix}\n")
    repo.write(WORK_ORDER, f"# Work Order\n\nStatus: DISPATCH_READY\n\nBatch ID: {BATCH}\n{suffix}\n")
    return repo.commit("material dispatch")


def _write_continuity(repo: Repo, material: str, *, marker: bool = True) -> str:
    marker_text = (
        "<!-- CVF-GC020-MATERIAL-SHA:START -->\n"
        f"{BATCH} material-SHA marker `{material[:9]}`\n"
        "<!-- CVF-GC020-MATERIAL-SHA:END -->\n"
        if marker else "# Handoff without marker\n"
    )
    next_move = (
        f"NEXT_ACTION_CLASS=EXECUTE_BOUNDED_WORK_ORDER; BATCH={BATCH}; "
        f"NEXT_STEP=EXECUTE_{WORK_ORDER}"
    )
    authority = {
        "baselinePath": BASELINE,
        "baselineSha256": _hash(repo, BASELINE),
        "workOrderPath": WORK_ORDER,
        "workOrderSha256": _hash(repo, WORK_ORDER),
    }
    bootstrap = {
        "activeHandoff": HANDOFF,
        "currentAuthority": authority,
        "nextAllowedMove": next_move,
    }
    repo.write(HANDOFF, marker_text)
    repo.write("CVF_SESSION/ACTIVE_SESSION_BOOTSTRAP_READ_MODEL.json", json.dumps(bootstrap))
    repo.write("CVF_SESSION/ACTIVE_SESSION_STATE.json", json.dumps({"currentAuthority": authority}))
    repo.write("CVF_SESSION_MEMORY.md", f"# Memory\n\n{next_move}\n")
    return repo.commit("continuity sync")


def _ready_repo(tmp_path: Path, monkeypatch) -> tuple[Repo, str, str]:
    repo = Repo(tmp_path)
    material = _write_packet(repo)
    continuity = _write_continuity(repo, material)
    monkeypatch.setattr(checker, "REPO_ROOT", tmp_path)
    return repo, material, continuity


def _rules(report: dict) -> set[str]:
    return {item["rule"] for item in report["violations"]}


def test_passes_only_after_material_and_continuity_commits(tmp_path, monkeypatch) -> None:
    _, material, _ = _ready_repo(tmp_path, monkeypatch)
    report = checker.evaluate(WORK_ORDER)
    assert report["compliant"]
    assert report["materialCommit"] == material


def test_dirty_or_untracked_packet_fails_release(tmp_path, monkeypatch) -> None:
    repo, _, _ = _ready_repo(tmp_path, monkeypatch)
    repo.write(WORK_ORDER, (repo.root / WORK_ORDER).read_text(encoding="utf-8") + "dirty\n")
    report = checker.evaluate(WORK_ORDER)
    assert not report["compliant"]
    assert "DR-02" in _rules(report)


def test_new_material_commit_without_continuity_sync_fails(tmp_path, monkeypatch) -> None:
    repo, _, _ = _ready_repo(tmp_path, monkeypatch)
    _write_packet(repo, "second material")
    report = checker.evaluate(WORK_ORDER)
    assert not report["compliant"]
    assert {"DR-02", "DR-04", "DR-05"} <= _rules(report)


def test_missing_material_sha_marker_fails(tmp_path, monkeypatch) -> None:
    repo = Repo(tmp_path)
    material = _write_packet(repo)
    _write_continuity(repo, material, marker=False)
    monkeypatch.setattr(checker, "REPO_ROOT", tmp_path)
    report = checker.evaluate(WORK_ORDER)
    assert not report["compliant"]
    assert "DR-05" in _rules(report)


def test_stale_current_authority_rejects_requested_work_order(tmp_path, monkeypatch) -> None:
    repo, _, _ = _ready_repo(tmp_path, monkeypatch)
    other = "docs/work_orders/CVF_AGENT_WORK_ORDER_OTHER_2026-09-25.md"
    repo.write(other, "# Other\n\nBatch ID: OTHER\n")
    repo.commit("other packet")
    report = checker.evaluate(other)
    assert not report["compliant"]
    assert "DR-01" in _rules(report)
