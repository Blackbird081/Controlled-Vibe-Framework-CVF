"""Core candidate admission adapter for the shared portable coverage validator."""
import importlib.util
import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]


def _validator():
    source = REPO_ROOT / "scripts/lib/downstream_governance/cvf_milestone_coverage.py"
    spec = importlib.util.spec_from_file_location("cvf_core_milestone_coverage", source)
    if spec is None or spec.loader is None:
        raise RuntimeError("COV_VALIDATOR_UNAVAILABLE")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def validate_milestone_coverage(root: Path, path: str, value: str | None = None) -> list[str]:
    module = _validator()
    return module.validate_file(root, path) if value is None else module.validate_text(root, path, value)


def collect_coverage_violations(root: Path, changed) -> list[dict]:
    module = _validator()
    candidates, violations = set(changed), []
    bootstrap = root / "CVF_SESSION/ACTIVE_SESSION_BOOTSTRAP_READ_MODEL.json"
    if bootstrap.is_file():
        try:
            state = json.loads(bootstrap.read_text(encoding="utf-8"))
            active = state.get("currentAuthority", {}).get("workOrderPath")
            if active is not None:
                if not isinstance(active, str) or not active.startswith("docs/work_orders/") or "/archive/" in active:
                    raise ValueError("active work order must be a non-archived work-order path")
                value = module.read_file(root, active).decode("utf-8-sig")
                if module.TAG in value:
                    candidates.add(active)
        except (ValueError, OSError, UnicodeError, AttributeError) as exc:
            violations.append({"path": str(bootstrap), "issues": ["COV_ACTIVE_INPUT_INVALID:" + type(exc).__name__]})
    for path in sorted(candidates):
        if not path.endswith(".md") or "/archive/" in path or not (root / path).is_file():
            continue
        issues = module.validate_file(root, path)
        if issues:
            violations.append({"path": path, "issues": issues})
    return violations
