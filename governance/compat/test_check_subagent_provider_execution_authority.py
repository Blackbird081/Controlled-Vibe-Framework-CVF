from __future__ import annotations

import importlib.util
import subprocess
import sys
from pathlib import Path

import pytest

MODULE_PATH = Path(__file__).with_name("check_subagent_provider_execution_authority.py")
SPEC = importlib.util.spec_from_file_location("provider_authority", MODULE_PATH)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


def test_static_enforcement_invariants_are_present() -> None:
    assert MODULE.check_invariants() == []


def test_provider_dispatch_defaults_fail_closed(tmp_path: Path) -> None:
    packet = tmp_path / "TEST_WORK_ORDER.md"
    packet.write_text("worker may run a live test with an API key\n", encoding="utf-8")
    assert "missing providerExecutionAuthority" in MODULE.check_dispatch(packet)[0]


def test_forbidden_disposition_is_sufficient_without_execution() -> None:
    class Packet:
        def read_text(self, encoding: str) -> str:
            return "live test\nproviderExecutionAuthority: FORBIDDEN\n"

    assert MODULE.check_dispatch(Packet()) == []


def test_grant_disposition_requires_bounded_envelope(tmp_path: Path) -> None:
    packet = tmp_path / "TEST_DISPATCH.md"
    packet.write_text(
        "provider call\nproviderExecutionAuthority: ORCHESTRATOR_GRANT_REQUIRED\n",
        encoding="utf-8",
    )
    issues = MODULE.check_dispatch(packet)
    assert len(issues) == 5
    assert any("GrantMaxCalls" in issue for issue in issues)


@pytest.mark.parametrize("state", ["staged", "unstaged", "untracked", "committed"])
def test_real_git_changes_are_checked_without_extra_commands(tmp_path, monkeypatch, capsys, state):
    def git(*args):
        return subprocess.run(
            ["git", *args], cwd=tmp_path, capture_output=True, text=True,
            encoding="utf-8", errors="replace", check=True,
        ).stdout.strip()

    git("init", "-q")
    git("config", "user.email", "tests@example.invalid")
    git("config", "user.name", "CVF Tests")
    git("config", "core.quotepath", "false")
    packet = tmp_path / "TEST_WORK_ORDER.md"
    packet.write_text("ordinary local task\n", encoding="utf-8")
    git("add", "--", packet.name)
    git("commit", "-qm", "base")
    base = git("rev-parse", "HEAD")
    if state == "untracked":
        packet = tmp_path / "ADDED_WORK_ORDER.md"
    packet.write_text("worker may run a provider call\n", encoding="utf-8")
    if state in {"staged", "committed"}:
        git("add", "--", packet.name)
    if state == "committed":
        git("commit", "-qm", "changed")
    before = (git("rev-parse", "HEAD"), git("write-tree"), git("status", "--porcelain"))
    original_run = subprocess.run
    calls = []

    def observed_run(*args, **kwargs):
        calls.append(args[0])
        return original_run(*args, **kwargs)

    monkeypatch.setattr(MODULE, "ROOT", tmp_path)
    monkeypatch.setattr(MODULE, "check_invariants", lambda: [])
    monkeypatch.setattr(MODULE.subprocess, "run", observed_run)
    monkeypatch.setattr(sys, "argv", ["checker", "--base", base, "--head", "HEAD", "--enforce"])
    assert MODULE.main() == 1
    assert "missing providerExecutionAuthority" in capsys.readouterr().out
    assert len(calls) == 3
    monkeypatch.setattr(MODULE.subprocess, "run", original_run)
    assert before == (git("rev-parse", "HEAD"), git("write-tree"), git("status", "--porcelain"))
    packet.write_text("provider call\nproviderExecutionAuthority: FORBIDDEN\n", encoding="utf-8")
    assert MODULE.main() == 0


def test_unicode_staged_path_uses_utf8(tmp_path, monkeypatch):
    def git(*args):
        return subprocess.run(
            ["git", *args], cwd=tmp_path, capture_output=True, text=True,
            encoding="utf-8", errors="replace", check=True,
        ).stdout.strip()

    git("init", "-q")
    git("config", "user.email", "tests@example.invalid")
    git("config", "user.name", "CVF Tests")
    git("config", "core.quotepath", "false")
    git("commit", "--allow-empty", "-qm", "base")
    name = "T\u00c9ST_WORK_ORDER.md"
    (tmp_path / name).write_text("provider call\n", encoding="utf-8")
    git("add", "--", name)
    monkeypatch.setattr(MODULE, "ROOT", tmp_path)
    assert name in MODULE.changed_paths("HEAD", "HEAD")


def test_staged_change_reverted_only_in_worktree_remains_in_candidate_set(tmp_path, monkeypatch):
    def git(*args):
        subprocess.run(["git", *args], cwd=tmp_path, capture_output=True,
                       encoding="utf-8", errors="replace", check=True)

    git("init", "-q")
    git("config", "user.email", "tests@example.invalid")
    git("config", "user.name", "CVF Tests")
    packet = tmp_path / "TEST_WORK_ORDER.md"
    packet.write_text("ordinary local task\n", encoding="utf-8")
    git("add", "--", packet.name)
    git("commit", "-qm", "base")
    packet.write_text("provider call\n", encoding="utf-8")
    git("add", "--", packet.name)
    packet.write_text("ordinary local task\n", encoding="utf-8")
    monkeypatch.setattr(MODULE, "ROOT", tmp_path)
    assert packet.name in MODULE.changed_paths("HEAD", "HEAD")
