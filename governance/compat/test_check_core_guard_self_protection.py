from __future__ import annotations

import importlib.util
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().with_name("check_core_guard_self_protection.py")
SPEC = importlib.util.spec_from_file_location("check_core_guard_self_protection", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(MODULE)


def _handoff_auth_text() -> str:
    return """
## Core Guard Self-Protection Authorization

Authorized guard-maintenance scope: session sync only.

Protected paths:

- `CVF_SESSION_MEMORY.md`
- `CVF_SESSION/ACTIVE_SESSION_STATE.json`

Operator authorization: operator requested session-sync guard hardening.

Rollback boundary: revert only the session-sync update.
"""


def test_active_handoff_can_authorize_session_sync_protected_paths(monkeypatch) -> None:
    handoff = "AGENT_HANDOFF_V15_2026-05-29.md"
    changed = {
        "CVF_SESSION_MEMORY.md": {"M"},
        "CVF_SESSION/ACTIVE_SESSION_STATE.json": {"M"},
        handoff: {"M"},
    }
    texts = {
        handoff: _handoff_auth_text(),
        "CVF_SESSION_MEMORY.md": "",
        "CVF_SESSION/ACTIVE_SESSION_STATE.json": "{}",
    }

    monkeypatch.setattr(MODULE, "_get_changed", lambda base, head: changed)
    monkeypatch.setattr(MODULE, "_get_scope_firewall_paths", lambda base, head: set(changed))
    monkeypatch.setattr(MODULE, "_read", lambda path: texts.get(path, ""))

    report = MODULE._run_check("base", "head", 40, 10)

    assert report["compliant"]
    assert report["authorizationDocs"] == [handoff]


def test_archive_handoff_cannot_authorize_session_sync_protected_paths(monkeypatch) -> None:
    handoff = "CVF_SESSION/handoffs/archive/AGENT_HANDOFF.md"
    changed = {
        "CVF_SESSION_MEMORY.md": {"M"},
        "CVF_SESSION/ACTIVE_SESSION_STATE.json": {"M"},
        handoff: {"M"},
    }
    texts = {handoff: _handoff_auth_text()}

    monkeypatch.setattr(MODULE, "_get_changed", lambda base, head: changed)
    monkeypatch.setattr(MODULE, "_get_scope_firewall_paths", lambda base, head: set(changed))
    monkeypatch.setattr(MODULE, "_read", lambda path: texts.get(path, ""))

    report = MODULE._run_check("base", "head", 40, 10)

    assert not report["compliant"]
    assert report["authorizationDocs"] == []
