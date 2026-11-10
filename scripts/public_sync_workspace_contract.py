"""Validate declared WorkspaceKit dependencies in an admitted public candidate."""
from __future__ import annotations

import json
from pathlib import Path, PurePosixPath
import re

PROFILE_DIR = "scripts/lib/downstream_governance/"
PROFILE = PROFILE_DIR + "cvf_downstream_gate_profile.json"
ENTRYPOINTS = ("scripts/new-cvf-workspace.ps1", "scripts/check_cvf_workspace_agent_enforcement.ps1")
PROFILE_PS = PROFILE_DIR + "CvfDownstreamGateProfile.ps1"


def _path(value: object, *, basename: bool = False) -> str:
    if not isinstance(value, str) or not value or value != value.strip():
        raise ValueError("dependency path must be a nonempty string")
    normalized = value.replace("\\", "/")
    parts = normalized.split("/")
    if (any(ord(c) < 32 or c in ':<>"|?*' for c in normalized) or normalized.startswith("/") or
            any(part in {"", ".", ".."} or part.endswith((".", " ")) for part in parts) or
            (basename and len(parts) != 1)):
        raise ValueError(f"unsafe dependency path: {value!r}")
    if PurePosixPath(normalized).as_posix() != normalized:
        raise ValueError(f"noncanonical dependency path: {value!r}")
    return normalized


def _unique_object(pairs: list[tuple[str, object]]) -> dict:
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError(f"duplicate JSON key: {key}")
        result[key] = value
    return result


def _literal_array(text: str, variable: str) -> list[str]:
    # This is a declaration parser, never a PowerShell evaluator. Reject a
    # changed contract syntax rather than guessing which dynamic paths it adds.
    matches = list(re.finditer(r"(?m)^\s*\$" + re.escape(variable) + r"\s*=\s*@\(\s*\n(.*?)^\s*\)([^\n]*)$", text, re.S | re.M))
    if len(matches) != 1:
        raise ValueError(f"expected one literal ${variable} array")
    match = matches[0]
    tail = match.group(2).strip()
    if tail not in {"", "+ $Script:CvfGateProfileCoreFiles"}:
        raise ValueError(f"unsupported ${variable} array suffix")
    paths = []
    for line in match.group(1).splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        item = re.fullmatch(r"\s*(['\"])([^'\"$`]+)\1\s*,?\s*(?:#.*)?", line)
        if not item:
            raise ValueError(f"nonliteral ${variable} dependency: {line.strip()}")
        paths.append(_path(item.group(2)))
    if not paths or len({p.casefold() for p in paths}) != len(paths):
        raise ValueError(f"empty or duplicate ${variable} dependency")
    return paths


def workspace_dependency_violations(root: Path, candidate_paths: set[str], baseline_paths: set[str] | None = None) -> list[dict[str, str]]:
    """Require membership and actual files; ignored ambient files prove nothing."""
    markers = {PROFILE, *ENTRYPOINTS}
    if not markers.intersection(candidate_paths | (baseline_paths or set())):
        return []  # A generic non-WorkspaceKit projection has no such contract.
    issues = []
    checked = set()

    def require(path: str) -> bool:
        if path in checked:
            return not any(i["detail"] == path for i in issues)
        checked.add(path)
        target = root / path
        valid = path in candidate_paths
        try:
            target.resolve(strict=True).relative_to(root.resolve())
            cursor = root
            for part in PurePosixPath(path).parts:
                cursor = cursor / part
                if cursor.is_symlink() or bool(getattr(cursor.lstat(), "st_file_attributes", 0) & 0x400):
                    valid = False
            valid = valid and target.is_file()
        except (OSError, ValueError):
            valid = False
        if not valid:
            issues.append({"code": "MISSING_DECLARED_WORKSPACE_DEPENDENCY", "detail": path})
        return valid

    if not require(PROFILE):
        return issues
    try:
        profile = json.loads((root / PROFILE).read_text(encoding="utf-8"), object_pairs_hook=_unique_object)
        if not isinstance(profile, dict):
            raise ValueError("gate profile must be an object")
        installed, sources = profile.get("installedFiles"), profile.get("coreSources", {})
        if not isinstance(installed, list) or not installed or not isinstance(sources, dict):
            raise ValueError("invalid installedFiles/coreSources contract")
        names = [_path(item, basename=True) for item in installed]
        if len({name.casefold() for name in names}) != len(names):
            raise ValueError("duplicate installed destination")
        if set(sources) - set(names):
            raise ValueError("coreSources key is not an installed destination")
        for name in names:
            require(_path(sources[name]) if name in sources else PROFILE_DIR + name)
        if require(PROFILE_PS):
            for path in _literal_array((root / PROFILE_PS).read_text(encoding="utf-8"), "Script:CvfGateProfileCoreFiles"):
                require(path)
        for entrypoint in ENTRYPOINTS:
            if require(entrypoint):
                for path in _literal_array((root / entrypoint).read_text(encoding="utf-8"), "requiredPublicCoreFiles"):
                    require(path)
    except (OSError, UnicodeError, ValueError) as exc:
        issues.append({"code": "INVALID_WORKSPACE_KIT_CONTRACT", "detail": str(exc)})
    return issues
