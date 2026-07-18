#!/usr/bin/env python3
"""Generate the CVF Skill Control Plane inventory read model.

The inventory reconciles ASSF registry entries, package roots, truth packets,
runtime eligibility, activation-readiness, Web projection records, and external
provider-skill authority boundaries. It is a generated read model only; it does
not open package instruction bodies, call providers, mutate lifecycle state, or
grant runtime authority.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter
from pathlib import Path
from typing import Any

HELPER_DIR = Path(__file__).resolve().parent
if str(HELPER_DIR) not in sys.path:
    sys.path.insert(0, str(HELPER_DIR))

from generate_assf_skill_index import (  # noqa: E402
    ENTRIES_DIR,
    INDEX_PATH,
    REPO_ROOT,
    load_source_entries,
    render_json,
    validate_index_matches_sources,
)

PACKAGE_ROOTS_DIR = (
    REPO_ROOT / "docs" / "reference" / "agent_system_skills" / "packages"
)
TRUTH_INDEX_PATH = (
    REPO_ROOT
    / "docs"
    / "reference"
    / "agent_system_skills"
    / "truth"
    / "generated"
    / "skill-truth-index.json"
)
WEB_SKILL_INDEX_PATH = (
    REPO_ROOT
    / "EXTENSIONS"
    / "CVF_v1.6_AGENT_PLATFORM"
    / "cvf-web"
    / "public"
    / "data"
    / "skills-index.json"
)
WEB_TEMPLATE_MAP_PATH = (
    REPO_ROOT
    / "EXTENSIONS"
    / "CVF_v1.6_AGENT_PLATFORM"
    / "cvf-web"
    / "src"
    / "data"
    / "skill-template-map.json"
)
INVENTORY_PATH = (
    REPO_ROOT
    / "docs"
    / "reference"
    / "agent_system_skills"
    / "control_plane"
    / "generated"
    / "skill-inventory.json"
)
SELECTION_PROFILES_PATH = (
    REPO_ROOT
    / "docs"
    / "reference"
    / "agent_system_skills"
    / "control_plane"
    / "source"
    / "skill-selection-profiles.json"
)

CLAIM_BOUNDARY = (
    "This inventory is a generated Skill Control Plane read model. It "
    "classifies skill surfaces for governance review only. It is not canonical "
    "certification authority, package body authority, provider runtime "
    "authority, Web runtime authority, public-sync evidence, or permission to "
    "activate, execute, commit, push, or bypass governed work-order scope."
)

_HEADER: dict[str, Any] = {
    "claimBoundary": CLAIM_BOUNDARY,
    "generatedBy": "governance/compat/generate_skill_control_plane_inventory.py",
    "inventoryId": "cvf-skill-control-plane-inventory",
    "schemaVersion": "skill-control-plane-v1",
}

_TERMINAL_EXCLUDED_STATUSES = {"DEPRECATED", "RETIRED", "REJECTED"}
_VALID_DOMAIN_GROUPS = {"engineering", "governance"}
_REQUIRED_SELECTION_LISTS = (
    "agentUseCases",
    "intendedUsers",
    "notRecommendedWhen",
    "outputGoals",
    "recommendedWhen",
    "secondaryDomains",
    "selectionKeywords",
    "specSignals",
)


def _repo_rel(path: Path) -> str:
    try:
        return path.relative_to(REPO_ROOT).as_posix()
    except ValueError:
        return path.as_posix()


def _load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _text(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()


def _upper(value: Any) -> str:
    return _text(value).upper()


def _is_concrete_path(value: Any) -> bool:
    text = _text(value)
    return bool(text) and not text.upper().startswith("N/A")


def _is_package_root_entry(entry: dict[str, Any]) -> bool:
    root = _text(entry.get("canonicalRoot")).replace("\\", "/")
    return root.startswith("docs/reference/agent_system_skills/packages/") and root.endswith(
        "/SKILL.md"
    )


def _package_root_path(entry: dict[str, Any]) -> Path | None:
    if not _is_package_root_entry(entry):
        return None
    return REPO_ROOT / _text(entry.get("canonicalRoot")).replace("\\", "/")


def _runtime_ineligibility_reasons(entry: dict[str, Any]) -> list[str]:
    reasons: list[str] = []
    if _upper(entry.get("status")) in _TERMINAL_EXCLUDED_STATUSES:
        reasons.append("TERMINAL_STATUS")
    if _upper(entry.get("certificationState")) != "CERTIFIED":
        reasons.append("CERTIFICATION_NOT_CERTIFIED")
    if _upper(entry.get("uatState")) != "PASSED":
        reasons.append("UAT_NOT_PASSED")
    if _upper(entry.get("internalAgentDisposition")) != "IMPLEMENTED":
        reasons.append("INTERNAL_DISPOSITION_NOT_IMPLEMENTED")
    package_root = _package_root_path(entry)
    if package_root is None:
        reasons.append("PACKAGE_ROOT_OUT_OF_SCOPE")
    elif not package_root.is_file():
        reasons.append("PACKAGE_ROOT_MISSING")
    return reasons


def _load_truth_by_skill(truth_index_path: Path = TRUTH_INDEX_PATH) -> dict[str, dict[str, Any]]:
    if not truth_index_path.exists():
        return {}
    raw = _load_json(truth_index_path)
    entries = raw.get("entries", []) if isinstance(raw, dict) else []
    truth: dict[str, dict[str, Any]] = {}
    for entry in entries:
        if not isinstance(entry, dict):
            continue
        skill_id = _text(entry.get("skillId"))
        if skill_id:
            truth[skill_id] = entry
    return truth


def _load_package_sources(package_roots_dir: Path = PACKAGE_ROOTS_DIR) -> dict[str, dict[str, Any]]:
    sources: dict[str, dict[str, Any]] = {}
    if not package_roots_dir.exists():
        return sources
    for source_path in sorted(package_roots_dir.glob("*/skill.source.json")):
        try:
            source = _load_json(source_path)
        except (OSError, json.JSONDecodeError):
            continue
        if not isinstance(source, dict):
            continue
        skill_id = _text(source.get("skillId"))
        if skill_id:
            sources[skill_id] = {"path": _repo_rel(source_path), "source": source}
    return sources


def _load_web_projection_items(
    web_skill_index_path: Path = WEB_SKILL_INDEX_PATH,
) -> dict[str, dict[str, Any]]:
    if not web_skill_index_path.exists():
        return {}
    raw = _load_json(web_skill_index_path)
    categories = raw.get("categories", []) if isinstance(raw, dict) else []
    by_key: dict[str, dict[str, Any]] = {}
    for category in categories:
        if not isinstance(category, dict):
            continue
        category_id = _text(category.get("id"))
        for skill in category.get("skills", []):
            if not isinstance(skill, dict):
                continue
            skill_id = _text(skill.get("id"))
            if not skill_id:
                continue
            key = skill_id
            if key in by_key:
                key = f"{category_id}/{skill_id}"
            by_key[key] = {
                "assfProjectionClass": skill.get("assfProjectionClass"),
                "canonicalRoot": skill.get("canonicalRoot"),
                "certificationState": skill.get("certificationState"),
                "domain": skill.get("domain") or category_id,
                "externalCliMcpDisposition": skill.get("externalCliMcpDisposition"),
                "frontDoorTier": skill.get("frontDoorTier"),
                "frontDoorVisible": skill.get("frontDoorVisible"),
                "id": skill_id,
                "path": skill.get("path"),
                "title": skill.get("title"),
                "uatState": skill.get("uatState"),
            }
    return by_key


def _load_template_map_count(template_map_path: Path = WEB_TEMPLATE_MAP_PATH) -> int:
    if not template_map_path.exists():
        return 0
    raw = _load_json(template_map_path)
    mapping = raw.get("templateToSkillMap", {}) if isinstance(raw, dict) else {}
    return len(mapping) if isinstance(mapping, dict) else 0


def _list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    return [_text(item) for item in value if _text(item)]


def _load_selection_profiles(
    selection_profiles_path: Path = SELECTION_PROFILES_PATH,
) -> dict[str, dict[str, Any]]:
    if not selection_profiles_path.exists():
        return {}
    raw = _load_json(selection_profiles_path)
    profiles = raw.get("profiles", []) if isinstance(raw, dict) else []
    by_skill: dict[str, dict[str, Any]] = {}
    for profile in profiles:
        if not isinstance(profile, dict):
            continue
        skill_id = _text(profile.get("skillId"))
        if skill_id:
            by_skill[skill_id] = profile
    return by_skill


def _selection_profile_violations(profile: dict[str, Any] | None) -> list[str]:
    if profile is None:
        return ["SELECTION_PROFILE_MISSING"]
    violations: list[str] = []
    if _text(profile.get("domainGroup")).lower() not in _VALID_DOMAIN_GROUPS:
        violations.append("SELECTION_PROFILE_INVALID_DOMAIN_GROUP")
    if not _text(profile.get("primaryDomain")):
        violations.append("SELECTION_PROFILE_MISSING_PRIMARY_DOMAIN")
    if not _text(profile.get("expectedOutputContribution")):
        violations.append("SELECTION_PROFILE_MISSING_OUTPUT_CONTRIBUTION")
    for field in _REQUIRED_SELECTION_LISTS:
        if not _list(profile.get(field)):
            violations.append(f"SELECTION_PROFILE_MISSING_{field.upper()}")
    return violations


def _truth_allows_activation(truth: dict[str, Any] | None) -> bool:
    return (
        isinstance(truth, dict)
        and _text(truth.get("truthStatus")).lower() == "approved"
        and _upper(truth.get("verificationMode")) == "STRICT"
        and _upper(truth.get("runtimeEligibility")) == "RUNTIME_PACKAGE_ELIGIBLE"
    )


def _activation_decision(runtime_eligible: bool, truth: dict[str, Any] | None) -> str:
    if not runtime_eligible:
        return "DENIED_NOT_RUNTIME_ELIGIBLE"
    if not _truth_allows_activation(truth):
        return "DENIED_MISSING_OR_UNAPPROVED_TRUTH_PACKET"
    return "ACTIVATION_READY"


def _status_counts(records: list[dict[str, Any]], field: str) -> dict[str, int]:
    counter: Counter[str] = Counter()
    for record in records:
        value = _text(record.get("registry", {}).get(field)) or "<missing>"
        counter[value] += 1
    return {key: counter[key] for key in sorted(counter)}


def _web_by_registry_root(web_items: dict[str, dict[str, Any]]) -> dict[str, dict[str, Any]]:
    by_root: dict[str, dict[str, Any]] = {}
    for key, item in web_items.items():
        root = _text(item.get("canonicalRoot")).replace("\\", "/")
        if root:
            by_root[root] = {"webKey": key, **item}
    return by_root


def _drift_for_record(
    *,
    entry: dict[str, Any],
    package_source: dict[str, Any] | None,
    runtime_eligible: bool,
    selection_profile: dict[str, Any] | None,
    truth: dict[str, Any] | None,
    web_item: dict[str, Any] | None,
) -> list[str]:
    drift: list[str] = []
    skill_id = _text(entry.get("skillId"))

    if _is_package_root_entry(entry):
        package_path = _package_root_path(entry)
        if package_path is None or not package_path.is_file():
            drift.append("PACKAGE_ROOT_MISSING")
        if package_source is None:
            drift.append("PACKAGE_SOURCE_JSON_MISSING")
        else:
            source = package_source["source"]
            if _text(source.get("skillId")) != skill_id:
                drift.append("PACKAGE_SOURCE_SKILL_ID_MISMATCH")
            if _upper(source.get("lifecycleState")) != _upper(entry.get("status")):
                drift.append("PACKAGE_SOURCE_LIFECYCLE_MISMATCH")
            for field in (
                "uatState",
                "certificationState",
                "internalAgentDisposition",
                "externalCliMcpDisposition",
            ):
                if field in source and _upper(source.get(field)) != _upper(entry.get(field)):
                    drift.append(f"PACKAGE_SOURCE_{field.upper()}_MISMATCH")
        drift.extend(_selection_profile_violations(selection_profile))

    if runtime_eligible and not _truth_allows_activation(truth):
        drift.append("RUNTIME_ELIGIBLE_WITHOUT_APPROVED_STRICT_TRUTH_PACKET")

    if _upper(entry.get("externalCliMcpDisposition")) == "IMPLEMENTED":
        if not _is_concrete_path(entry.get("adapterContract")):
            drift.append("CLI_MCP_IMPLEMENTED_WITHOUT_ADAPTER_CONTRACT")
        if not _is_concrete_path(entry.get("adapterEvidence")):
            drift.append("CLI_MCP_IMPLEMENTED_WITHOUT_ADAPTER_EVIDENCE")

    if web_item is not None:
        projection_class = _upper(web_item.get("assfProjectionClass"))
        if projection_class == "CERTIFIED_PACKAGE_PROJECTION":
            if _upper(entry.get("certificationState")) != "CERTIFIED":
                drift.append("WEB_CERTIFIED_PROJECTION_WITHOUT_REGISTRY_CERTIFICATION")
            if _upper(entry.get("uatState")) != "PASSED":
                drift.append("WEB_CERTIFIED_PROJECTION_WITHOUT_REGISTRY_UAT_PASS")
        web_cert = _text(web_item.get("certificationState"))
        if web_cert and _upper(web_cert) != _upper(entry.get("certificationState")):
            drift.append("WEB_CERTIFICATION_STATE_MISMATCH")
        web_uat = _text(web_item.get("uatState"))
        if web_uat and _upper(web_uat) != _upper(entry.get("uatState")):
            drift.append("WEB_UAT_STATE_MISMATCH")

    return drift


def _taxonomy_for(
    *,
    entry: dict[str, Any],
    package_source: dict[str, Any] | None,
    runtime_eligible: bool,
    activation_decision: str,
    web_item: dict[str, Any] | None,
    selection_profile: dict[str, Any] | None,
) -> list[str]:
    taxonomy = ["ASSF_REGISTRY_ENTRY"]
    if _is_package_root_entry(entry) or package_source is not None:
        taxonomy.append("ASSF_PACKAGE_ROOT")
    if runtime_eligible:
        taxonomy.append("RUNTIME_ELIGIBLE_PACKAGE")
    if activation_decision == "ACTIVATION_READY":
        taxonomy.append("ACTIVE_RESOLVER_READY_PACKAGE")
    if _upper(entry.get("externalCliMcpDisposition")) == "IMPLEMENTED":
        taxonomy.append("CLI_MCP_ADAPTER_PACKAGE")
    if _upper(entry.get("status")) == "ACTIVE":
        taxonomy.append("ACTIVE_SOURCE_PACKAGE")
    if web_item is not None:
        taxonomy.append("WEB_PROJECTION_CATALOG_ITEM")
    if selection_profile is not None:
        taxonomy.append("SPEC_SELECTION_PROFILE")
    return taxonomy


def _selection_read_model(profile: dict[str, Any] | None) -> dict[str, Any]:
    if profile is None:
        return {
            "agentUseCases": [],
            "domainGroup": None,
            "expectedOutputContribution": None,
            "intendedUsers": [],
            "notRecommendedWhen": [],
            "outputGoals": [],
            "primaryDomain": None,
            "recommendedWhen": [],
            "secondaryDomains": [],
            "selectionKeywords": [],
            "selectionPriority": None,
            "specSignals": [],
        }
    return {
        "agentUseCases": _list(profile.get("agentUseCases")),
        "domainGroup": _text(profile.get("domainGroup")),
        "expectedOutputContribution": _text(profile.get("expectedOutputContribution")),
        "intendedUsers": _list(profile.get("intendedUsers")),
        "notRecommendedWhen": _list(profile.get("notRecommendedWhen")),
        "outputGoals": _list(profile.get("outputGoals")),
        "primaryDomain": _text(profile.get("primaryDomain")),
        "recommendedWhen": _list(profile.get("recommendedWhen")),
        "secondaryDomains": _list(profile.get("secondaryDomains")),
        "selectionKeywords": _list(profile.get("selectionKeywords")),
        "selectionPriority": profile.get("selectionPriority"),
        "specSignals": _list(profile.get("specSignals")),
    }


def build_inventory(
    *,
    entries_dir: Path = ENTRIES_DIR,
    index_path: Path = INDEX_PATH,
    package_roots_dir: Path = PACKAGE_ROOTS_DIR,
    truth_index_path: Path = TRUTH_INDEX_PATH,
    selection_profiles_path: Path = SELECTION_PROFILES_PATH,
    web_skill_index_path: Path = WEB_SKILL_INDEX_PATH,
    web_template_map_path: Path = WEB_TEMPLATE_MAP_PATH,
) -> dict[str, Any]:
    """Build the Skill Control Plane inventory from current source surfaces."""
    entries = sorted(
        load_source_entries(entries_dir),
        key=lambda e: (e.get("registryOrder", 10**9), _text(e.get("skillId"))),
    )
    package_sources = _load_package_sources(package_roots_dir)
    selection_profiles = _load_selection_profiles(selection_profiles_path)
    truth_by_skill = _load_truth_by_skill(truth_index_path)
    web_items = _load_web_projection_items(web_skill_index_path)
    web_by_root = _web_by_registry_root(web_items)

    records: list[dict[str, Any]] = []
    seen_web_keys: set[str] = set()
    drift_counts: Counter[str] = Counter()

    for entry in entries:
        skill_id = _text(entry.get("skillId"))
        package_source = package_sources.get(skill_id)
        selection_profile = selection_profiles.get(skill_id)
        truth = truth_by_skill.get(skill_id)
        reasons = _runtime_ineligibility_reasons(entry)
        runtime_eligible = not reasons
        activation_decision = _activation_decision(runtime_eligible, truth)
        registry_root = _text(entry.get("canonicalRoot")).replace("\\", "/")
        web_item = web_by_root.get(registry_root)
        if web_item is not None:
            seen_web_keys.add(_text(web_item.get("webKey")))
        drift = _drift_for_record(
            entry=entry,
            package_source=package_source,
            runtime_eligible=runtime_eligible,
            selection_profile=selection_profile,
            truth=truth,
            web_item=web_item,
        )
        drift_counts.update(drift)
        record = {
            "activation": {
                "decision": activation_decision,
                "truthPacketRequired": runtime_eligible,
            },
            "cliMcp": {
                "adapterContract": entry.get("adapterContract"),
                "adapterEvidence": entry.get("adapterEvidence"),
                "disposition": entry.get("externalCliMcpDisposition"),
            },
            "drift": {"violations": drift},
            "packageRoot": {
                "exists": (_package_root_path(entry) or Path()).is_file()
                if _is_package_root_entry(entry)
                else False,
                "rootPath": entry.get("canonicalRoot") if _is_package_root_entry(entry) else None,
                "sourceJsonPath": package_source.get("path") if package_source else None,
                "sourceLifecycleState": (
                    package_source.get("source", {}).get("lifecycleState")
                    if package_source
                    else None
                ),
            },
            "registry": {
                "approvalState": entry.get("approvalState"),
                "candidateState": entry.get("candidateState"),
                "canonicalRoot": entry.get("canonicalRoot"),
                "certificationState": entry.get("certificationState"),
                "internalAgentDisposition": entry.get("internalAgentDisposition"),
                "name": entry.get("name"),
                "reviewArtifacts": entry.get("reviewArtifacts", []),
                "skillId": skill_id,
                "status": entry.get("status"),
                "uatState": entry.get("uatState"),
            },
            "runtime": {
                "eligible": runtime_eligible,
                "ineligibilityReasons": reasons,
            },
            "skillId": skill_id,
            "taxonomy": _taxonomy_for(
                entry=entry,
                package_source=package_source,
                runtime_eligible=runtime_eligible,
                activation_decision=activation_decision,
                web_item=web_item,
                selection_profile=selection_profile,
            ),
            "selection": _selection_read_model(selection_profile),
            "truth": {
                "exists": truth is not None,
                "runtimeEligibility": truth.get("runtimeEligibility") if truth else None,
                "truthStatus": truth.get("truthStatus") if truth else None,
                "verificationMode": truth.get("verificationMode") if truth else None,
            },
            "webProjection": {
                "present": web_item is not None,
                "assfProjectionClass": web_item.get("assfProjectionClass") if web_item else None,
                "certificationState": web_item.get("certificationState") if web_item else None,
                "domain": web_item.get("domain") if web_item else None,
                "webKey": web_item.get("webKey") if web_item else None,
            },
        }
        records.append(record)

    web_projection_only: list[dict[str, Any]] = []
    for key, item in sorted(web_items.items()):
        if key in seen_web_keys:
            continue
        web_projection_only.append(
            {
                "assfProjectionClass": item.get("assfProjectionClass")
                or "PRESENTATION_CATALOG_ITEM",
                "authorityClass": "PRESENTATION_PROJECTION_CATALOG_ITEM",
                "canonicalRoot": item.get("canonicalRoot"),
                "certificationState": item.get("certificationState"),
                "domain": item.get("domain"),
                "id": item.get("id"),
                "title": item.get("title"),
                "webKey": key,
            }
        )

    taxonomy_counts: Counter[str] = Counter()
    for record in records:
        taxonomy_counts.update(record["taxonomy"])
    domain_counts: Counter[str] = Counter()
    for record in records:
        primary_domain = _text(record.get("selection", {}).get("primaryDomain"))
        if primary_domain:
            domain_counts[primary_domain] += 1

    known_package_skills = {
        _text(record.get("skillId"))
        for record in records
        if "ASSF_PACKAGE_ROOT" in record.get("taxonomy", [])
    }
    for skill_id in sorted(set(selection_profiles) - known_package_skills):
        drift_counts.update(["SELECTION_PROFILE_WITHOUT_PACKAGE_ROOT"])

    inventory: dict[str, Any] = dict(_HEADER)
    inventory["sourcePaths"] = {
        "assfGeneratedIndex": _repo_rel(index_path),
        "assfRegistryEntries": _repo_rel(entries_dir),
        "packageRoots": _repo_rel(package_roots_dir),
        "selectionProfiles": _repo_rel(selection_profiles_path),
        "skillTruthIndex": _repo_rel(truth_index_path),
        "webSkillIndex": _repo_rel(web_skill_index_path),
        "webTemplateMap": _repo_rel(web_template_map_path),
    }
    inventory["taxonomy"] = {
        "activeResolverPackages": {
            "authority": "read-only activation-readiness decision",
            "token": "ACTIVE_RESOLVER_READY_PACKAGE",
        },
        "assfPackageRoots": {
            "authority": "governed package body candidates",
            "token": "ASSF_PACKAGE_ROOT",
        },
        "assfRegistryEntries": {
            "authority": "canonical metadata source",
            "token": "ASSF_REGISTRY_ENTRY",
        },
        "cliMcpAdapterPackages": {
            "authority": "bounded adapter envelope only",
            "token": "CLI_MCP_ADAPTER_PACKAGE",
        },
        "codexProviderSkills": {
            "authority": "external/provider runtime skills; non-CVF authority",
            "token": "EXTERNAL_PROVIDER_RUNTIME_SKILL",
        },
        "publicProdPackages": {
            "authority": "public/prod package claim; none granted by this inventory",
            "token": "PUBLIC_PROD_PACKAGE",
        },
        "runtimeEligiblePackages": {
            "authority": "bounded internal loader packages",
            "token": "RUNTIME_ELIGIBLE_PACKAGE",
        },
        "webLibraryCatalogItems": {
            "authority": "presentation/projection/catalog item",
            "token": "WEB_PROJECTION_CATALOG_ITEM",
        },
        "specSelectionProfiles": {
            "authority": "spec-to-skill selection guidance only",
            "token": "SPEC_SELECTION_PROFILE",
        },
    }
    inventory["summary"] = {
        "activeResolverReadyPackages": taxonomy_counts.get("ACTIVE_RESOLVER_READY_PACKAGE", 0),
        "activeSourcePackages": taxonomy_counts.get("ACTIVE_SOURCE_PACKAGE", 0),
        "assfRegistryEntries": len(records),
        "cliMcpAdapterPackages": taxonomy_counts.get("CLI_MCP_ADAPTER_PACKAGE", 0),
        "crossSurfaceDriftViolationCount": sum(drift_counts.values()),
        "externalProviderRuntimeSkillMappings": 0,
        "packageRoots": taxonomy_counts.get("ASSF_PACKAGE_ROOT", 0),
        "publicProdPackages": 0,
        "runtimeEligiblePackages": taxonomy_counts.get("RUNTIME_ELIGIBLE_PACKAGE", 0),
        "selectionProfiledPackages": taxonomy_counts.get("SPEC_SELECTION_PROFILE", 0),
        "templateMapEntries": _load_template_map_count(web_template_map_path),
        "webProjectionItems": len(web_items),
        "webProjectionOnlyItems": len(web_projection_only),
    }
    inventory["domainCounts"] = {key: domain_counts[key] for key in sorted(domain_counts)}
    inventory["statusCounts"] = {
        "candidateState": _status_counts(records, "candidateState"),
        "certificationState": _status_counts(records, "certificationState"),
        "internalAgentDisposition": _status_counts(records, "internalAgentDisposition"),
        "status": _status_counts(records, "status"),
        "uatState": _status_counts(records, "uatState"),
    }
    inventory["driftSummary"] = {key: drift_counts[key] for key in sorted(drift_counts)}
    inventory["records"] = records
    inventory["webProjectionOnlyRecords"] = web_projection_only
    return inventory


def validate_inventory_matches_sources(
    *,
    inventory_path: Path = INVENTORY_PATH,
    entries_dir: Path = ENTRIES_DIR,
    index_path: Path = INDEX_PATH,
    package_roots_dir: Path = PACKAGE_ROOTS_DIR,
    truth_index_path: Path = TRUTH_INDEX_PATH,
    selection_profiles_path: Path = SELECTION_PROFILES_PATH,
    web_skill_index_path: Path = WEB_SKILL_INDEX_PATH,
    web_template_map_path: Path = WEB_TEMPLATE_MAP_PATH,
) -> list[str]:
    """Return drift violations; empty list means generated inventory is valid."""
    violations = validate_index_matches_sources(index_path=index_path, entries_dir=entries_dir)
    try:
        expected = build_inventory(
            entries_dir=entries_dir,
            index_path=index_path,
            package_roots_dir=package_roots_dir,
            truth_index_path=truth_index_path,
            selection_profiles_path=selection_profiles_path,
            web_skill_index_path=web_skill_index_path,
            web_template_map_path=web_template_map_path,
        )
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        return [*violations, f"skill control plane source load failed: {exc}"]

    drift_summary = expected.get("driftSummary", {})
    if isinstance(drift_summary, dict) and drift_summary:
        for key, count in sorted(drift_summary.items()):
            violations.append(f"cross-surface drift {key}: {count}")

    if not inventory_path.exists():
        violations.append(
            f"generated skill control plane inventory not found at {_repo_rel(inventory_path)}; "
            "run `python governance/compat/generate_skill_control_plane_inventory.py --generate`"
        )
        return violations

    try:
        current = _load_json(inventory_path)
    except (OSError, json.JSONDecodeError) as exc:
        return [*violations, f"generated skill control plane inventory load failed: {exc}"]

    if current != expected:
        violations.append(
            "docs/reference/agent_system_skills/control_plane/generated/skill-inventory.json "
            "drifted from source surfaces; run "
            "`python governance/compat/generate_skill_control_plane_inventory.py --generate`"
        )
    return violations


def _normalized_terms(text: str) -> set[str]:
    return {term for term in re.split(r"[^a-z0-9]+", text.lower()) if term}


def _phrase_hits(spec_text: str, phrases: list[str]) -> list[str]:
    normalized = " ".join(sorted(_normalized_terms(spec_text)))
    lowered = spec_text.lower()
    spec_terms = _normalized_terms(spec_text)
    hits: list[str] = []
    for phrase in phrases:
        p = phrase.lower().strip()
        if not p:
            continue
        phrase_terms = _normalized_terms(p)
        if len(phrase_terms) == 1 and len(next(iter(phrase_terms))) <= 3:
            if phrase_terms.issubset(spec_terms):
                hits.append(phrase)
            continue
        if re.search(rf"(?<![a-z0-9]){re.escape(p)}(?![a-z0-9])", lowered):
            hits.append(phrase)
            continue
        words = phrase_terms
        if words and words.issubset(_normalized_terms(normalized)):
            hits.append(phrase)
    return hits


def recommend_skills_for_spec(
    spec_text: str,
    inventory: dict[str, Any] | None = None,
    *,
    top: int = 5,
    runtime_only: bool = False,
) -> list[dict[str, Any]]:
    """Return deterministic package-skill recommendations for a spec string."""
    inventory = inventory or build_inventory()
    recommendations: list[dict[str, Any]] = []
    for record in inventory.get("records", []):
        if not isinstance(record, dict):
            continue
        if "ASSF_PACKAGE_ROOT" not in record.get("taxonomy", []):
            continue
        runtime = record.get("runtime", {})
        if runtime_only and not runtime.get("eligible"):
            continue
        selection = record.get("selection", {})
        if not _text(selection.get("primaryDomain")):
            continue
        keyword_hits = _phrase_hits(spec_text, _list(selection.get("selectionKeywords")))
        signal_hits = _phrase_hits(spec_text, _list(selection.get("specSignals")))
        goal_hits = _phrase_hits(spec_text, _list(selection.get("outputGoals")))
        domain_hits = _phrase_hits(
            spec_text,
            [
                _text(selection.get("primaryDomain")).replace("-", " "),
                *[domain.replace("-", " ") for domain in _list(selection.get("secondaryDomains"))],
            ],
        )
        score = (
            len(keyword_hits) * 5
            + len(signal_hits) * 3
            + len(goal_hits) * 2
            + len(domain_hits) * 2
        )
        if score == 0:
            continue
        priority = selection.get("selectionPriority")
        try:
            priority_int = int(priority)
        except (TypeError, ValueError):
            priority_int = 0
        score += max(priority_int, 0) / 100
        if runtime.get("eligible"):
            score += 0.5
        recommendations.append(
            {
                "activationDecision": record.get("activation", {}).get("decision"),
                "domainGroup": selection.get("domainGroup"),
                "matchedGoals": goal_hits,
                "matchedKeywords": keyword_hits,
                "matchedSignals": signal_hits,
                "primaryDomain": selection.get("primaryDomain"),
                "recommendedWhen": selection.get("recommendedWhen", []),
                "runtimeEligible": bool(runtime.get("eligible")),
                "score": round(score, 2),
                "secondaryDomains": selection.get("secondaryDomains", []),
                "skillId": record.get("skillId"),
            }
        )
    recommendations.sort(
        key=lambda item: (
            -float(item["score"]),
            str(item.get("primaryDomain")),
            str(item.get("skillId")),
        )
    )
    return recommendations[:top]


def generate_inventory(inventory_path: Path = INVENTORY_PATH) -> None:
    inventory = build_inventory()
    inventory_path.parent.mkdir(parents=True, exist_ok=True)
    inventory_path.write_text(render_json(inventory), encoding="utf-8")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Generate or validate the CVF Skill Control Plane inventory"
    )
    action = parser.add_mutually_exclusive_group(required=True)
    action.add_argument("--generate", action="store_true")
    action.add_argument("--check", action="store_true")
    parser.add_argument("--inventory-path", type=Path, default=INVENTORY_PATH)
    args = parser.parse_args(argv)

    if args.generate:
        generate_inventory(args.inventory_path)
        print(f"Generated {_repo_rel(args.inventory_path)}")
        return 0

    violations = validate_inventory_matches_sources(inventory_path=args.inventory_path)
    if violations:
        print("Skill Control Plane inventory violations:")
        for violation in violations:
            print(f"  - {violation}")
        return 1
    print("Skill Control Plane inventory matches source surfaces.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
