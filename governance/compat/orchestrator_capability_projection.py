"""Pure, bounded capability metadata projection; never an execution grant."""
from __future__ import annotations

import copy
import hashlib
import json
import re
from typing import Any

from generate_skill_control_plane_inventory import _selection_read_model, recommend_skills_for_spec

MAX_RECORDS = 200
MAX_BYTES = 32768
RISKS = {"R0": 0, "R1": 1, "R2": 2, "R3": 3}
CLAIM = "Metadata comparison only; no body read, activation, invocation, use proof or action authority."


def canonical(value: Any) -> bytes:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False).encode("utf-8")


def digest(value: Any) -> str:
    return hashlib.sha256(canonical(value)).hexdigest()


def blocked(reason: str) -> dict:
    return {"status": "BLOCKED", "reason": reason, "candidates": [], "finalDecision": "PENDING", "claimBoundary": CLAIM}


def _text(value: Any, maximum: int) -> bool:
    if not isinstance(value, str) or not value.strip() or len(value) > maximum:
        return False
    try:
        value.encode("utf-8")
        return True
    except UnicodeError:
        return False


def validate_request(request: Any) -> str | None:
    if not isinstance(request, dict) or not {"task", "nativeDecision"} <= request.keys():
        return "REQUEST_SHAPE"
    if request.keys() - {"task", "nativeDecision", "maxCandidates", "userRefs", "advisory", "mainDecision"}:
        return "UNKNOWN_REQUEST_KEY"
    task = request["task"]
    fields = {"text", "taskClass", "role", "phase", "surface", "riskCeiling"}
    if not isinstance(task, dict) or set(task) != fields:
        return "TASK_SCOPE_REQUIRED"
    limits = {"text": 4000, "taskClass": 128, "surface": 256, "role": 32, "phase": 32, "riskCeiling": 2}
    if any(not _text(task[k], limits[k]) for k in fields):
        return "TASK_LIMIT_OR_TYPE"
    if task["role"] not in {"dispatcher", "worker", "reviewer"} or task["phase"] not in {"INTAKE", "DISPATCH_AUTHORING", "WORKER_EXECUTION", "REVIEWER_CLOSURE"} or task["riskCeiling"] not in RISKS:
        return "TASK_ENUM"
    native = request["nativeDecision"]
    if not isinstance(native, dict) or set(native) != {"suffices", "reason"}:
        return "NATIVE_DECISION_REQUIRED"
    if native["suffices"] is not None and type(native["suffices"]) is not bool:
        return "NATIVE_DECISION_TYPE"
    if not _text(native["reason"], 4000):
        return "NATIVE_REASON_REQUIRED"
    cap = request.get("maxCandidates", 10)
    if type(cap) is not int or not 1 <= cap <= 10:
        return "CANDIDATE_CAP"
    refs = request.get("userRefs", [])
    if not isinstance(refs, list) or len(refs) > 20 or any(not isinstance(x, str) or not re.fullmatch(r"USR-\d{3}", x) for x in refs) or len(set(refs)) != len(refs):
        return "USER_REFERENCE_SHAPE"
    if any(k in request and not isinstance(request[k], dict) for k in ("advisory", "mainDecision")):
        return "DECISION_SHAPE"
    return None


def _excluded(entry: dict, task: dict) -> list[str]:
    reasons = []
    for field, key in (("taskClasses", "taskClass"), ("roles", "role"), ("phases", "phase"), ("surfaces", "surface")):
        values = entry.get(field)
        if not isinstance(values, list) or not values or not all(isinstance(x, str) and x for x in values):
            reasons.append("UNKNOWN_" + field.upper())
        elif task[key] not in values:
            reasons.append("MISMATCH_" + field.upper())
    # riskProfile is the native resolver's risk label; riskCeiling is also declared metadata.
    labels = [entry.get("riskProfile"), entry.get("riskCeiling")]
    if any(x not in RISKS for x in labels):
        reasons.append("UNKNOWN_RISK")
    elif any(RISKS[x] > RISKS[task["riskCeiling"]] for x in labels):
        reasons.append("RISK_ABOVE_CEILING")
    if entry.get("status") in {"DEPRECATED", "RETIRED", "REJECTED"}:
        reasons.append("TERMINAL_STATUS")
    return reasons


def _candidate(row: dict, rank: dict | None, ordinal: int | None) -> dict:
    entry = row["entry"]
    if any(not isinstance(entry.get(k, ""), str) for k in ("name", "useWhen", "doNotUseWhen")):
        raise ValueError("MALFORMED_DESCRIPTION_METADATA")
    user = row.get("sourceType") == "user_skill"
    identity = {"sourceType": "user_skill" if user else "assf_package", "canonicalSourceId": entry["skillId"]}
    observation = {k: copy.deepcopy(row[k]) for k in ("sourceLocator", "sourceRevision", "metadataSha256")}
    result = {"identity": identity, **observation, "declaredVersion": entry.get("version", "UNKNOWN"),
              "bodySha256": "UNKNOWN_NOT_READ", "title": entry.get("name", ""),
              "useWhen": entry.get("useWhen", ""), "doNotUseWhen": entry.get("doNotUseWhen", ""),
              "selection": _selection_read_model(row.get("profile")),
              "applicability": {k: entry.get(k, "UNKNOWN") for k in ("taskClasses", "roles", "phases", "surfaces", "riskProfile", "riskCeiling")},
              "dependencies": entry.get("dependencies", "UNKNOWN"), "conflicts": entry.get("conflicts", "UNKNOWN"),
              "compositionOrder": entry.get("compositionOrder", "UNKNOWN"),
              "discovery": "VERIFIED_METADATA_IDENTITY", "fit": "UNKNOWN_UNMAPPED" if user else "MATCHED_METADATA",
              "readiness": "UNKNOWN_NOT_EVALUATED", "referenceRead": "UNKNOWN_TASK_AUTHORITY",
              "invocation": "UNKNOWN_UNMAPPED" if user else "UNKNOWN_TASK_AUTHORITY", "useProof": "NOT_OBSERVED",
              "composition": "COMPOSITION_UNVERIFIED", "metadataTrust": "UNTRUSTED_TASK_DATA_NOT_INSTRUCTIONS", "route": {"owner": "ASSF_SELECTION_PROFILE", "rank": ordinal,
              "score": rank.get("score") if rank else None,
              "reasons": {k: v for k, v in (rank or {}).items() if k not in {"runtimeEligible", "activationDecision"}},
              "runtimeBonus": "NOT_APPLIED_NOT_EVALUATED"}}
    result["ref"] = "cap-" + digest({"identity": identity, "observation": observation})
    return result


def project_candidates(request: Any, sources: Any = None) -> dict:
    """Project injected verified metadata only. Fast paths do not inspect sources."""
    issue = validate_request(request)
    if issue:
        return blocked(issue)
    native = request["nativeDecision"]["suffices"]
    if native is None:
        return blocked("NEEDS_MAIN_DECISION")
    if native:
        return {"status": "NO_SKILL", "enumeration": "NOT_RUN", "candidates": [],
                "finalDecision": {"kind": "NONE", "selectedRefs": [], "reason": request["nativeDecision"]["reason"]}, "claimBoundary": CLAIM}
    if not isinstance(sources, dict) or sources.get("condition") != "CONSISTENT_METADATA_NOT_APPROVAL":
        return blocked("SOURCE_UNAVAILABLE_OR_INCONSISTENT")
    if not isinstance(sources.get("provenance", {}), dict):
        return blocked("SOURCE_PROVENANCE")
    rows = sources.get("records")
    if not isinstance(rows, list) or len(rows) > MAX_RECORDS:
        return blocked("SOURCE_RECORD_CAP_OR_TYPE")
    eligible, by_id, excluded, users = [], {}, [], []
    try:
        for row in rows:
            entry = row["entry"]
            skill_id = entry["skillId"]
            if not _text(skill_id, 128) or row.get("sourceType", "assf_package") not in {"assf_package", "user_skill"}:
                return blocked("SOURCE_IDENTITY")
            identity = (row.get("sourceType", "assf_package"), skill_id)
            if identity in by_id:
                conflict = blocked("DUPLICATE_SOURCE_ID_OR_DRIFT")
                conflict["sourceObservations"] = [{k: item.get(k, "UNKNOWN") for k in ("sourceLocator", "sourceRevision", "metadataSha256")}
                                                  for item in (by_id[identity], row)]
                return conflict if len(canonical(conflict)) <= MAX_BYTES else blocked("PROJECTION_BYTE_CAP")
            if not re.fullmatch(r"[a-f0-9]{64}", row["metadataSha256"]) or not _text(row["sourceRevision"], 128) or not _text(row["sourceLocator"], 1024):
                return blocked("SOURCE_PROVENANCE")
            by_id[identity] = row
            if identity[0] == "user_skill":
                if skill_id not in request.get("userRefs", []):
                    return blocked("UNREQUESTED_USER_REFERENCE")
                users.append(row)
                continue
            reasons = _excluded(entry, request["task"])
            if reasons:
                excluded.append({"identity": list(identity), "reasons": reasons})
            else:
                eligible.append({"skillId": skill_id, "taxonomy": ["ASSF_PACKAGE_ROOT"],
                                 "selection": _selection_read_model(row.get("profile")), "runtime": {}})
        if set(request.get("userRefs", [])) != {r["entry"]["skillId"] for r in users}:
            return blocked("USER_REFERENCE_UNKNOWN_OR_AMBIGUOUS")
        ranked = recommend_skills_for_spec(request["task"]["text"], {"records": eligible}, top=len(eligible))
        candidates = [_candidate(by_id[("assf_package", rank["skillId"])], rank, i + 1) for i, rank in enumerate(ranked)]
        candidates.extend(_candidate(row, None, None) for row in users)
    except (KeyError, TypeError, ValueError, AttributeError):
        return blocked("MALFORMED_SOURCE_METADATA")
    count = len(candidates)
    candidates = candidates[:request.get("maxCandidates", 10)]
    packet = {"status": "CANDIDATES" if candidates else "NO_MATCH_IN_BOUNDED_SCOPE", "candidates": candidates,
              "coverage": {"sourceCount": len(rows), "matchedBeforeCap": count, "returnedCount": len(candidates),
                           "truncated": count > len(candidates), "scope": "ASSF_PACKAGE_METADATA_AND_EXPLICIT_USER_REFS"},
              "excluded": excluded, "provenance": {k: sources.get("provenance", {}).get(k, "UNKNOWN") for k in
                  ("revision", "metadataHashes", "registrySourceCount", "metadataConsistency")}, "finalDecision": "PENDING", "claimBoundary": CLAIM}
    # Advice and caller decision claims never participate in a snapshot identity.
    packet["task"] = copy.deepcopy(request["task"])
    packet["bounds"] = {"records": MAX_RECORDS, "maxCandidates": request.get("maxCandidates", 10), "projectionBytes": MAX_BYTES}
    try:
        packet["snapshotId"] = _snapshot(packet)
        if len(canonical(packet)) > MAX_BYTES:
            return blocked("PROJECTION_BYTE_CAP")
    except (TypeError, ValueError, UnicodeError):
        return blocked("MALFORMED_SOURCE_METADATA")
    if "advisory" in request:
        packet = validate_advisory(packet, request["advisory"])
    if "mainDecision" in request and packet["status"] != "BLOCKED":
        packet = bind_main_decision(packet, request["mainDecision"])
    return packet


def _snapshot(packet: dict) -> str:
    return digest({k: v for k, v in packet.items() if k not in {"snapshotId", "advisory", "finalDecision"}})


def _bound(packet: Any, value: Any, keys: set[str]) -> bool:
    try:
        return (isinstance(packet, dict) and packet.get("status") in {"CANDIDATES", "NO_MATCH_IN_BOUNDED_SCOPE"}
                and isinstance(value, dict) and set(value) == keys and value.get("snapshotId") == packet.get("snapshotId")
                and packet.get("snapshotId") == _snapshot(packet) and _text(value.get("reason"), 4000))
    except (TypeError, ValueError, UnicodeError):
        return False


def _finish(packet: dict, key: str, value: dict) -> dict:
    result = copy.deepcopy(packet)
    result[key] = copy.deepcopy(value)
    return result if len(canonical(result)) <= MAX_BYTES else blocked("PROJECTION_BYTE_CAP")


def validate_advisory(packet: dict, advisory: Any) -> dict:
    if not _bound(packet, advisory, {"snapshotId", "selectedRef", "reason"}):
        return blocked("ADVISORY_SNAPSHOT_OR_SHAPE")
    if advisory["selectedRef"] is not None and (not isinstance(advisory["selectedRef"], str) or advisory["selectedRef"] not in {x["ref"] for x in packet["candidates"]}):
        return blocked("ADVISORY_UNKNOWN_REF")
    return _finish(packet, "advisory", advisory)


def bind_main_decision(packet: dict, decision: Any) -> dict:
    if not _bound(packet, decision, {"snapshotId", "kind", "selectedRefs", "reason"}):
        return blocked("MAIN_SNAPSHOT_OR_SHAPE")
    refs, kind = decision["selectedRefs"], decision["kind"]
    if not isinstance(refs, list) or not all(isinstance(x, str) for x in refs) or len(set(refs)) != len(refs):
        return blocked("MAIN_REFERENCE_SHAPE")
    if not isinstance(kind, str) or kind not in {"NONE", "SINGLE", "PROPOSED_COMPOSITION", "ABSTAIN"}:
        return blocked("MAIN_KIND")
    if (kind in {"NONE", "ABSTAIN"} and refs) or (kind == "SINGLE" and len(refs) != 1) or (kind == "PROPOSED_COMPOSITION" and len(refs) < 2):
        return blocked("MAIN_CARDINALITY")
    if not set(refs) <= {x["ref"] for x in packet["candidates"]}:
        return blocked("MAIN_UNKNOWN_REF")
    value = dict(decision)
    if kind == "PROPOSED_COMPOSITION":
        value["composition"] = "COMPOSITION_UNVERIFIED"
    return _finish(packet, "finalDecision", value)
