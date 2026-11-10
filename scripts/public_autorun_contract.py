"""Public autorun projection contract; never import or execute candidate code."""
from __future__ import annotations

import ast
import hashlib
from pathlib import Path

WRAPPER = "governance/compat/run_agent_autorun_workflow_gate.py"
PRIVATE_CATALOG = "governance/compat/agent_autorun_command_catalog.py"
RUNNER = "scripts/lib/downstream_governance/cvf_downstream_gate_runner.py"
TEMPLATE = "public_projection/run_agent_autorun_workflow_gate.py.template"
WRAPPER_SHA256 = "fee326c44aad1a0c35169020d22684ec0ba85d531b856cab8e562cd3b303f760"
# Static import closure of the tracked public governance/compat bundle,
# plus the known direct test consumer entering from current provenance.
# Keep supported shared checkers; withdraw only private API clients and tests.
WITHDRAWN_PATHS = frozenset("governance/compat/" + name + ".py" for name in (
    "agent_autorun_command_catalog",
    "agent_automation_machine_verification_readout",
    "mfrp_actual_seam_replay",
    "mfrp_shadow_canary",
    "mfrp_shadow_canary_autocollect",
    "mfrp_shadow_canary_core",
    "run_agent_automation_assist",
    "run_dispatch_packet_author_fast_gate",
    "test_agent_automation_machine_verification_readout",
    "test_agent_autorun_machine_verification",
    "test_build_dispatch_evidence_scaffold",
    "test_build_dispatch_packet_scaffold",
    "test_check_gate_to_role_closeability",
    "test_check_preapproval_feasibility",
    "test_check_semantic_convergence_control",
    "test_mfrp_actual_seam_replay",
    "test_mfrp_shadow_canary",
    "test_mfrp_shadow_canary_autocollect",
    "test_mfrp_shadow_canary_core",
    "test_run_agent_autorun_workflow_gate",
    "test_run_dispatch_packet_author_fast_gate",
))
PRIVATE_MODULES = {Path(path).stem for path in WITHDRAWN_PATHS} | {Path(WRAPPER).stem}


def main() -> None:
    import argparse
    import json
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project", type=Path)
    parser.add_argument("--owned-paths", action="store_true")
    args = parser.parse_args()
    if args.owned_paths:
        print(json.dumps(sorted(WITHDRAWN_PATHS | {WRAPPER})))
    elif args.project:
        print(emit_public_autorun(args.project.resolve()))
    else:
        parser.error("select --project or --owned-paths")


def _safe_file(root: Path, path: str) -> Path:
    target = root / path
    target.resolve(strict=True).relative_to(root.resolve())
    cursor = root
    for part in Path(path).parts:
        cursor = cursor / part
        if cursor.is_symlink() or bool(getattr(cursor.lstat(), "st_file_attributes", 0) & 0x400):
            raise ValueError("link/reparse dependency")
    if not target.is_file():
        raise ValueError("dependency is not a file")
    return target


def _canonical(raw: bytes) -> bytes:
    return raw.replace(b"\r\n", b"\n")


def emit_public_autorun(root: Path) -> str:
    """Replace compatibility path and withdraw exact files in an owned projection.

    Validate all deletion targets before the first mutation. No recursive
    removal, directory deletion, symlink traversal or private-root discovery.
    The caller must supply its admitted public projection root.
    """
    carrier = _safe_file(root, "AGENTS.md").read_text(encoding="utf-8-sig")
    if not carrier.startswith("# CVF Public Core Agent Instructions\n"):
        raise ValueError("autorun withdrawal requires the public Core carrier")
    raw = _canonical((Path(__file__).parent / TEMPLATE).read_bytes())
    if hashlib.sha256(raw).hexdigest() != WRAPPER_SHA256:
        raise ValueError("public autorun template drift requires contract review")
    target = _safe_file(root, WRAPPER)
    obsolete = []
    for path in sorted(WITHDRAWN_PATHS):
        candidate = root / path
        if candidate.exists() or candidate.is_symlink():
            obsolete.append(_safe_file(root, path))
    target.write_bytes(raw)
    for candidate in obsolete:
        candidate.unlink()
    return WRAPPER


def autorun_dependency_violations(root: Path, candidate_paths: set[str], baseline_paths: set[str] | None = None) -> list[dict[str, str]]:
    """Accept an explicit unsupported wrapper, reject private API residue.

    Exact source identity catches incompatible imports, main signatures and
    accidental success paths without trusting candidate-defined functions.
    Candidate membership is required: ambient untracked dependencies do not count.
    """
    markers = {WRAPPER, PRIVATE_CATALOG}
    if not markers.intersection(candidate_paths | (baseline_paths or set())):
        return []
    issues = []

    def issue(code: str, detail: str) -> None:
        issues.append({"code": code, "detail": detail})

    for path in candidate_paths:
        if path.casefold() in {item.casefold() for item in WITHDRAWN_PATHS}:
            issue("PRIVATE_AUTORUN_CATALOG_EXPORTED" if path.casefold() == PRIVATE_CATALOG.casefold() else "WITHDRAWN_PRIVATE_AUTORUN_BUNDLE_EXPORTED", path)
    try:
        if WRAPPER not in candidate_paths:
            raise ValueError("compatibility entrypoint removed")
        raw = _canonical(_safe_file(root, WRAPPER).read_bytes())
        if hashlib.sha256(raw).hexdigest() != WRAPPER_SHA256:
            raise ValueError("unsupported public wrapper source/signature drift")
    except (OSError, ValueError) as exc:
        issue("INVALID_PUBLIC_AUTORUN_WRAPPER", f"{WRAPPER}: {exc}")

    try:
        if RUNNER not in candidate_paths:
            raise ValueError("redirect target absent from candidate")
        tree = ast.parse(_safe_file(root, RUNNER).read_text(encoding="utf-8-sig"))
        # The redirect is documentation only. Confirm its CLI shape statically;
        # never run a downstream gate as part of public projection validation.
        calls = [node for node in ast.walk(tree) if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute)]
        declared = {(node.func.attr, node.args[0].value) for node in calls if node.args and isinstance(node.args[0], ast.Constant) and isinstance(node.args[0].value, str)}
        if not {("add_parser", "run"), ("add_argument", "--phase"), ("add_argument", "--project-root")}.issubset(declared):
            raise ValueError("redirect runner CLI contract changed")
    except (OSError, ValueError, SyntaxError, UnicodeError) as exc:
        issue("INVALID_PUBLIC_AUTORUN_REDIRECT", f"{RUNNER}: {exc}")

    for path in sorted(candidate_paths):
        if path == WRAPPER or not path.startswith("governance/compat/") or not path.endswith(".py"):
            continue
        try:
            tree = ast.parse(_safe_file(root, path).read_text(encoding="utf-8-sig"))
            for node in ast.walk(tree):
                if isinstance(node, (ast.List, ast.Tuple)):
                    python_command = any(
                        isinstance(value, ast.Attribute) and isinstance(value.value, ast.Name)
                        and value.value.id == "sys" and value.attr == "executable"
                        or isinstance(value, ast.Constant) and value.value in ("python", "python3", "python.exe", "python3.exe")
                        for value in node.elts
                    )
                    if python_command and any(
                        isinstance(value, ast.Constant) and isinstance(value.value, str)
                        and value.value.replace("\\", "/").removeprefix("./") in WITHDRAWN_PATHS
                        for value in node.elts
                    ):
                        issue("WITHDRAWN_PRIVATE_AUTORUN_COMMAND_EXPORTED", f"{path}:{node.lineno}")
                names = []
                if isinstance(node, ast.Import):
                    names = [alias.name for alias in node.names]
                elif isinstance(node, ast.ImportFrom):
                    names = [node.module or "", *[alias.name for alias in node.names]]
                if any(name.split(".")[-1] in PRIVATE_MODULES for name in names):
                    issue("PRIVATE_AUTORUN_API_CONSUMER_EXPORTED", f"{path}:{node.lineno}")
                    break
        except (OSError, ValueError, SyntaxError, UnicodeError) as exc:
            issue("UNREADABLE_PUBLIC_AUTORUN_CONSUMER", f"{path}: {exc}")
    return issues


if __name__ == "__main__":
    main()
