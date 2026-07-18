from pathlib import Path

import check_execute_route_step_sequence as guard


def _entry(order: int, name: str, pattern: str, selector: str = "first", line: int = 0) -> dict:
    return {
        "order": order,
        "stepName": name,
        "callPattern": pattern,
        "selector": selector,
        "confirmedLine": line,
    }


def _standard_entries() -> list[dict]:
    return [
        _entry(1, "resolveExecutionCVFRole", "resolveExecutionCVFRole("),
        _entry(2, "evaluateExecutionActorRoleGate", "evaluateExecutionActorRoleGate("),
        _entry(3, "checkRoleOutputPermission", "checkRoleOutputPermission("),
        _entry(4, "evaluateEnforcement", "evaluateEnforcement("),
        _entry(5, "routeWebProvider", "routeWebProvider("),
        _entry(6, "buildEvidenceReceipt", "buildEvidenceReceipt(", "last"),
        _entry(7, "buildRouteAuditMemoryCapture", "buildRouteAuditMemoryCapture("),
        _entry(8, "appendAuditEvent_final", "appendAuditEvent(", "last"),
    ]


def _fixture(order: list[str] | None = None) -> str:
    calls = {
        "role": "const role = resolveExecutionCVFRole(session);",
        "gate": "const gate = evaluateExecutionActorRoleGate(templateId, role);",
        "permission": "const permission = checkRoleOutputPermission(role);",
        "enforcement": "const enforcement = evaluateEnforcement({});",
        "provider": "const routed = routeWebProvider({});",
        "receipt": "const receipt = buildEvidenceReceipt({});",
        "memory": "const memory = buildRouteAuditMemoryCapture({});",
        "audit": "await appendAuditEvent({});",
    }
    keys = order or ["role", "gate", "permission", "enforcement", "provider", "receipt", "memory", "audit"]
    return "\n".join(calls[key] for key in keys) + "\n"


def test_current_route_passes():
    report = guard.run_check(guard.REPO_ROOT / guard.DEFAULT_ROUTE_PATH, guard.REPO_ROOT / guard.DEFAULT_REGISTRY_PATH)

    assert report["compliant"] is True
    assert report["violationCount"] == 0
    assert [step["selectedLine"] for step in report["steps"]] == [336, 348, 350, 375, 564, 858, 927, 944]


def test_missing_step():
    report = guard.run_check(
        Path("route.ts"),
        Path("registry.json"),
        route_text=_fixture(["role", "gate", "permission", "enforcement", "receipt", "memory", "audit"]),
        registry_entries=_standard_entries(),
    )

    missing = [item for item in report["violations"] if item["rule"] == "missing_step"]
    assert len(missing) == 1
    assert missing[0]["stepName"] == "routeWebProvider"


def test_swapped_steps():
    report = guard.run_check(
        Path("route.ts"),
        Path("registry.json"),
        route_text=_fixture(["role", "gate", "enforcement", "permission", "provider", "receipt", "memory", "audit"]),
        registry_entries=_standard_entries(),
    )

    order_violations = [item for item in report["violations"] if item["rule"] == "order"]
    assert len(order_violations) == 1
    assert order_violations[0]["stepName"] == "evaluateEnforcement"


def test_selector_first_skips_import():
    text = "\n".join(
        [
            "import { resolveExecutionCVFRole( } from './bad-example';",
            "// resolveExecutionCVFRole(",
            "const role = resolveExecutionCVFRole(session);",
        ]
    )

    report = guard.run_check(
        Path("route.ts"),
        Path("registry.json"),
        route_text=text,
        registry_entries=[_entry(1, "resolveExecutionCVFRole", "resolveExecutionCVFRole(", "first", 3)],
    )

    assert report["compliant"] is True
    assert report["steps"][0]["selectedLine"] == 3


def test_selector_last_uses_final_success_path():
    text = "\n".join(
        [
            "const earlyReceipt = buildEvidenceReceipt({ error: true });",
            "await appendAuditEvent({ error: true });",
            "const finalReceipt = buildEvidenceReceipt({ success: true });",
            "await appendAuditEvent({ success: true });",
        ]
    )
    entries = [
        _entry(1, "buildEvidenceReceipt", "buildEvidenceReceipt(", "last", 3),
        _entry(2, "appendAuditEvent_final", "appendAuditEvent(", "last", 4),
    ]

    report = guard.run_check(Path("route.ts"), Path("registry.json"), route_text=text, registry_entries=entries)

    assert report["compliant"] is True
    assert [step["selectedLine"] for step in report["steps"]] == [3, 4]
