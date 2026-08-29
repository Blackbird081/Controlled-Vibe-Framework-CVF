from __future__ import annotations

import importlib.util
from pathlib import Path

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
