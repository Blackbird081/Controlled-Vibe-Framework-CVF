#!/usr/bin/env python3
"""CLI readout for the CVF Skill Control Plane inventory."""

from __future__ import annotations

import argparse
import json
import hashlib
import os
import re
import subprocess
import sys
from pathlib import Path
from typing import Any

HELPER_DIR = Path(__file__).resolve().parent
if str(HELPER_DIR) not in sys.path:
    sys.path.insert(0, str(HELPER_DIR))

from generate_skill_control_plane_inventory import build_inventory  # noqa: E402
from generate_skill_control_plane_inventory import recommend_skills_for_spec  # noqa: E402
from generate_skill_control_plane_inventory import ENTRIES_DIR, INDEX_PATH, REPO_ROOT, SELECTION_PROFILES_PATH  # noqa: E402
from orchestrator_capability_projection import blocked, project_candidates, validate_request  # noqa: E402

USER_REGISTRY = REPO_ROOT / "governance/skill-library/registry/user-skills"
METADATA_LIMIT = 2 * 1024 * 1024


def _unique_object(pairs: list) -> dict:
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError("DUPLICATE_JSON_KEY")
        result[key] = value
    return result


def _bounded_bytes(path: Path, limit: int, *, metadata: bool = False) -> bytes:
    if metadata:
        path.absolute().relative_to(REPO_ROOT)
        if path.resolve() != path.absolute():
            raise ValueError("REDIRECTED_METADATA")
        for part in (path, *path.parents):
            if part == REPO_ROOT:
                break
            if part.is_symlink() or (hasattr(part, "is_junction") and part.is_junction()):
                raise ValueError("REDIRECTED_METADATA")
    with path.open("rb") as stream:
        before = os.fstat(stream.fileno())
        if before.st_size > limit:
            raise ValueError("FILE_BYTE_CAP")
        raw = stream.read(limit + 1)
        after = os.fstat(stream.fileno())
    if len(raw) > limit or (before.st_size, before.st_mtime_ns) != (after.st_size, after.st_mtime_ns):
        raise ValueError("FILE_CHANGED_OR_OVERSIZE")
    return raw


def _json_bytes(raw: bytes) -> Any:
    return json.loads(raw.decode("utf-8"), object_pairs_hook=_unique_object,
                      parse_constant=lambda _: (_ for _ in ()).throw(ValueError("NONFINITE_JSON")))


def _metadata_sources(user_refs: list[str]) -> dict:
    """Read only fixed metadata owners. Never follow a package/body/source link."""
    observed: dict[Path, bytes] = {}

    def read(path: Path) -> bytes:
        raw = _bounded_bytes(path, METADATA_LIMIT, metadata=True)
        observed[path] = raw
        return raw

    index = _json_bytes(read(INDEX_PATH))
    entries = index.get("skills") if isinstance(index, dict) else None
    profiles_raw = _json_bytes(read(SELECTION_PROFILES_PATH))
    profiles = profiles_raw.get("profiles") if isinstance(profiles_raw, dict) else None
    paths = sorted(ENTRIES_DIR.glob("*.json"))
    if not isinstance(entries, list) or not isinstance(profiles, list) or max(len(paths), len(entries), len(profiles)) + len(user_refs) > 200:
        raise ValueError("SOURCE_RECORD_CAP_OR_TYPE")
    by_id, profile_map, registry = {}, {}, {}
    for entry in entries:
        if not isinstance(entry, dict) or not isinstance(entry.get("skillId"), str) or not entry["skillId"] or entry["skillId"] in by_id:
            raise ValueError("DUPLICATE_OR_INVALID_INDEX_ID")
        by_id[entry["skillId"]] = entry
    for path in paths:
        entry = _json_bytes(read(path))
        if not isinstance(entry, dict) or not isinstance(entry.get("skillId"), str) or entry["skillId"] in registry:
            raise ValueError("DUPLICATE_OR_INVALID_REGISTRY_ID")
        registry[entry["skillId"]] = (path, entry)
    if set(registry) != set(by_id):
        raise ValueError("INDEX_REGISTRY_ID_DRIFT")
    for skill_id, (_, entry) in registry.items():
        if {k: v for k, v in entry.items() if k != "registryOrder"} != by_id[skill_id]:
            raise ValueError("INDEX_REGISTRY_METADATA_DRIFT")
    for profile in profiles:
        if not isinstance(profile, dict) or not isinstance(profile.get("skillId"), str) or profile["skillId"] in profile_map or profile["skillId"] not in by_id:
            raise ValueError("PROFILE_BINDING_DRIFT")
        profile_map[profile["skillId"]] = profile
    rows = []
    for skill_id, entry in by_id.items():
        if not str(entry.get("canonicalRoot", "")).startswith("docs/reference/agent_system_skills/packages/"):
            continue
        if skill_id not in profile_map:
            raise ValueError("MISSING_PACKAGE_PROFILE")
        path = registry[skill_id][0]
        rows.append({"sourceType": "assf_package", "entry": entry, "profile": profile_map[skill_id], "sourceLocator": path.relative_to(REPO_ROOT).as_posix(),
                     "metadataSha256": hashlib.sha256(observed[path]).hexdigest()})
    if user_refs:
        listing = read(USER_REGISTRY / "INDEX.md").decode("utf-8")
        # Only exact registry-owned basename links can establish identity.
        links = re.findall(r"\[[^\]\n]+\]\(\./(USR-\d{3}_[A-Za-z0-9_.-]+\.gov\.md)\)", listing)
        for skill_id in user_refs:
            matches = [x for x in links if x.startswith(skill_id + "_")]
            if len(matches) != 1:
                raise ValueError("USER_REFERENCE_UNKNOWN_OR_AMBIGUOUS")
            path = USER_REGISTRY / matches[0]
            raw = read(path)
            metadata = raw.decode("utf-8")
            title = re.findall(r"(?m)^# " + re.escape(skill_id) + r": ([^\n]+)$", metadata)
            if len(title) != 1 or not re.search(r"> \*\*Type:\*\* User Skill\s*$", metadata, re.M):
                raise ValueError("USER_REGISTRY_IDENTITY_DRIFT")
            rows.append({"sourceType": "user_skill", "entry": {"skillId": skill_id, "name": title[0], "version": "UNKNOWN"},
                         "profile": None, "sourceLocator": path.relative_to(REPO_ROOT).as_posix(), "metadataSha256": hashlib.sha256(raw).hexdigest()})
    relative_paths = sorted(path.relative_to(REPO_ROOT).as_posix() for path in observed)
    revision = subprocess.run(["git", "rev-parse", "HEAD"], cwd=REPO_ROOT, capture_output=True, text=True, timeout=5, check=True).stdout.strip()
    dirty = subprocess.run(["git", "status", "--porcelain", "--untracked-files=all", "--", *relative_paths], cwd=REPO_ROOT, capture_output=True, text=True, timeout=5, check=True).stdout
    if not re.fullmatch(r"[a-f0-9]{40}", revision) or dirty.strip():
        raise ValueError("METADATA_DIRTY_OR_REVISION_UNAVAILABLE")
    # Detect mutations during the multi-file read independently of Git status.
    if paths != sorted(ENTRIES_DIR.glob("*.json")) or any(_bounded_bytes(path, METADATA_LIMIT, metadata=True) != raw for path, raw in observed.items()):
        raise ValueError("METADATA_CHANGED_DURING_READ")
    for row in rows:
        row["sourceRevision"] = revision
    hashes = {path.relative_to(REPO_ROOT).as_posix(): hashlib.sha256(raw).hexdigest() for path, raw in observed.items()}
    return {"records": rows, "condition": "CONSISTENT_METADATA_NOT_APPROVAL",
            "provenance": {"revision": revision, "metadataHashes": hashes, "registrySourceCount": len(entries), "metadataConsistency": "MATCH_NOT_APPROVAL"}}


def _orchestrator_readout(path: Path) -> int:
    try:
        request = _json_bytes(_bounded_bytes(path, 32768))
    except (OSError, UnicodeError, ValueError):
        print("ERROR: INVALID_OR_UNREADABLE_ORCHESTRATOR_REQUEST", file=sys.stderr)
        return 2
    issue = validate_request(request)
    if issue or request["nativeDecision"]["suffices"] is not False:
        packet = project_candidates(request)
    else:
        try:
            packet = project_candidates(request, _metadata_sources(request.get("userRefs", [])))
        except (OSError, UnicodeError, ValueError, TypeError, subprocess.SubprocessError):
            packet = blocked("METADATA_SOURCE_UNAVAILABLE_OR_INCONSISTENT")
    print(json.dumps(packet, ensure_ascii=True, indent=2, sort_keys=True))
    return 0


def _matching_records(inventory: dict[str, Any], skill_id: str | None) -> list[dict[str, Any]]:
    records = [record for record in inventory.get("records", []) if isinstance(record, dict)]
    if skill_id is None:
        return records
    return [record for record in records if record.get("skillId") == skill_id]


def _human_summary(inventory: dict[str, Any], records: list[dict[str, Any]]) -> str:
    lines = ["CVF Skill Control Plane inventory"]
    summary = inventory.get("summary", {})
    if isinstance(summary, dict):
        lines.extend(
            [
                f"ASSF registry entries: {summary.get('assfRegistryEntries', 0)}",
                f"Package roots: {summary.get('packageRoots', 0)}",
                f"Runtime eligible packages: {summary.get('runtimeEligiblePackages', 0)}",
                f"Activation-ready packages: {summary.get('activeResolverReadyPackages', 0)}",
                f"CLI/MCP adapter packages: {summary.get('cliMcpAdapterPackages', 0)}",
                f"Selection-profiled packages: {summary.get('selectionProfiledPackages', 0)}",
                f"Web projection items: {summary.get('webProjectionItems', 0)}",
                f"Cross-surface drift violations: {summary.get('crossSurfaceDriftViolationCount', 0)}",
            ]
        )
    lines.append(f"Returned records: {len(records)}")
    for record in records:
        registry = record.get("registry", {})
        runtime = record.get("runtime", {})
        activation = record.get("activation", {})
        web = record.get("webProjection", {})
        drift = record.get("drift", {})
        lines.append(
            "- "
            f"{record.get('skillId')} | "
            f"taxonomy={','.join(record.get('taxonomy', []))} | "
            f"domain={record.get('selection', {}).get('primaryDomain') or 'none'} | "
            f"status={registry.get('status')} | "
            f"cert={registry.get('certificationState')} | "
            f"runtimeEligible={str(runtime.get('eligible')).lower()} | "
            f"activation={activation.get('decision')} | "
            f"web={web.get('assfProjectionClass') if web.get('present') else 'none'} | "
            f"drift={','.join(drift.get('violations', [])) or 'none'}"
        )
    return "\n".join(lines)


def _human_recommendations(recommendations: list[dict[str, Any]]) -> str:
    lines = ["CVF Skill Selection Recommendations"]
    lines.append(f"Returned recommendations: {len(recommendations)}")
    for item in recommendations:
        hits = sorted(
            set(item.get("matchedKeywords", []))
            | set(item.get("matchedSignals", []))
            | set(item.get("matchedGoals", []))
        )
        lines.append(
            "- "
            f"{item.get('skillId')} | "
            f"score={item.get('score')} | "
            f"domain={item.get('primaryDomain')} | "
            f"runtimeEligible={str(item.get('runtimeEligible')).lower()} | "
            f"activation={item.get('activationDecision')} | "
            f"matched={', '.join(hits) if hits else 'none'}"
        )
    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Read the generated-source Skill Control Plane inventory surfaces "
            "and answer where a skill sits in the lifecycle."
        )
    )
    parser.add_argument("--skill-id", default=None)
    parser.add_argument("--summary-only", action="store_true")
    parser.add_argument("--spec-text", default=None)
    parser.add_argument("--spec-file", type=Path, default=None)
    parser.add_argument("--top", type=int, default=5)
    parser.add_argument("--runtime-only", action="store_true")
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--orchestrator-request", type=Path, default=None)
    args = parser.parse_args(argv)

    if args.orchestrator_request is not None:
        supplied = argv if argv is not None else sys.argv[1:]
        incompatible = {"--skill-id", "--summary-only", "--spec-text", "--spec-file", "--top", "--runtime-only"}
        if not args.json or any(token.split("=", 1)[0] in incompatible for token in supplied):
            parser.error("--orchestrator-request requires --json and excludes legacy filters")
        return _orchestrator_readout(args.orchestrator_request)

    try:
        inventory = build_inventory()
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    spec_text = args.spec_text
    if args.spec_file is not None:
        try:
            spec_text = args.spec_file.read_text(encoding="utf-8")
        except OSError as exc:
            print(f"ERROR: {exc}", file=sys.stderr)
            return 1

    if spec_text:
        recommendations = recommend_skills_for_spec(
            spec_text,
            inventory,
            top=args.top,
            runtime_only=args.runtime_only,
        )
        if args.json:
            print(
                json.dumps(
                    {
                        "claimBoundary": inventory.get("claimBoundary"),
                        "recommendations": recommendations,
                        "selectionMode": "SPEC_TEXT_DETERMINISTIC_KEYWORD_MATCH",
                    },
                    ensure_ascii=False,
                    indent=2,
                    sort_keys=True,
                )
            )
        else:
            print(_human_recommendations(recommendations))
        return 0

    records = [] if args.summary_only else _matching_records(inventory, args.skill_id)
    if args.json:
        payload = dict(inventory)
        if args.summary_only or args.skill_id is not None:
            payload["records"] = records
        print(json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True))
    else:
        print(_human_summary(inventory, records))
    return 0


if __name__ == "__main__":
    sys.exit(main())
