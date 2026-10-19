#!/usr/bin/env python3
"""
Read-only validator for the optional `parentEvidence` member of a parent registry
finding (contract: docs/reference/downstream_gate_profile/
CVF_PROJECT_LEARNING_PARENT_EVIDENCE_CONTRACT.md, schema:
parent_learning_evidence.schema.json).

Conformance proves declarations, joins and local raw-byte identity only. It is not
semantic acceptance, does not authenticate actors and never writes the registry.
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import stat
from pathlib import Path
from typing import Any, Iterable

SCHEMA_VERSION = "cvf.parentLearningEvidence@1.0.0"
RECEIPT_VERSION = "cvf.learningLoopReceipt@1.0.0"
TYPED_VALID = "TYPED_STRUCTURAL_VALID"
LEGACY = "LEGACY_UNTYPED_NOT_REVALIDATED"
INVALID = "TYPED_INVALID"

TOP_KEYS = ("schemaVersion", "findingId", "source", "valueChecks", "decision", "implementation",
            "projectResolution", "returnDelivery", "projectApplication", "claimLimits")
CHECK_NAMES = ("sourceConfidence", "reusableMechanism", "existingCoverage", "incrementalValue", "boundedProof")
CHECK_KEYS = ("status", "reason", "evidence", "limits")
CHECK_STATUS = ("SUPPORTED", "INCONCLUSIVE", "NOT_ASSESSED")
REF_KEYS = ("path", "sha256", "fragment", "evidenceClass")
EVIDENCE_CLASSES = ("OBSERVED_LOCAL", "ATTRIBUTED_SOURCE", "SYNTHETIC_OFFLINE")
DECISION_KEYS = ("state", "reason", "reviewer", "owner", "f2gDisposition", "evidence")
DECISION_STATES = ("PENDING", "ACCEPT", "MERGE", "DEFER", "DECLINE")
LIFE_KEYS = ("state", "reason", "evidence")
LIFE_STATES = {
    "implementation": ("NOT_IMPLEMENTED", "IMPLEMENTED_BOUNDED"),
    "projectResolution": ("UNKNOWN", "OPEN", "RESOLVED", "PARKED_BY_OPERATOR"),
    "returnDelivery": ("NOT_RETURNED", "RETURNED", "PARKED_BY_OPERATOR"),
    "projectApplication": ("NOT_APPLIED", "APPLIED", "PARKED_BY_OPERATOR"),
}
RECEIPT_KEYS = ("schemaVersion", "kind", "findingId", "sourceProject", "control", "actor",
                "authorization", "verification", "claimLimits")
SHA_RE = re.compile(r"^[0-9a-f]{64}$")
OBSERVED_RE = re.compile(r"\b(observed|reproduced)\b", re.IGNORECASE)
REPARSE = 0x400  # FILE_ATTRIBUTE_REPARSE_POINT
PROOF_PREFIXES = ("control:", "proof-positive:", "proof-negative:")


class DuplicateKeyError(ValueError):
    pass


def _no_dupes(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    out: dict[str, Any] = {}
    for key, value in pairs:
        if key in out:
            raise DuplicateKeyError(f"duplicate JSON key `{key}`")
        out[key] = value
    return out


def _no_constant(name: str) -> Any:
    raise ValueError(f"non-standard JSON constant `{name}`")


def strict_json_loads(raw: bytes) -> Any:
    """Parse UTF-8 JSON, rejecting duplicate keys and NaN/Infinity."""
    return json.loads(raw.decode("utf-8"), object_pairs_hook=_no_dupes, parse_constant=_no_constant)


def _text(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


class _Report:
    def __init__(self, prefix: str) -> None:
        self.prefix = prefix
        self.issues: list[dict[str, str]] = []

    def add(self, field: str, code: str, message: str) -> None:
        self.issues.append({"path": f"{self.prefix}{field}", "type": code, "message": message})


def _exact(rep: _Report, field: str, value: Any, keys: Iterable[str]) -> bool:
    keys = tuple(keys)
    if not isinstance(value, dict):
        rep.add(field, "not_object", "expected a JSON object")
        return False
    unknown = sorted(set(value) - set(keys))
    missing = [k for k in keys if k not in value]
    if unknown:
        rep.add(field, "unknown_field", f"unknown field(s): {', '.join(unknown)}")
    if missing:
        rep.add(field, "missing_field", f"missing field(s): {', '.join(missing)}")
    return not unknown and not missing


def _safe_file(root: Path, rel: Any) -> tuple[Path | None, str]:
    """Resolve a repo-relative locator to an existing regular file without following links."""
    if not _text(rel):
        return None, "locator must be a nonempty string"
    if "\\" in rel or ":" in rel or rel.startswith("/") or "\x00" in rel:
        return None, "locator must be a relative POSIX path (no drive, UNC, URL or backslash)"
    parts = rel.split("/")
    if any(p in ("", ".", "..") for p in parts):
        return None, "locator contains empty, dot or parent-traversal component"
    base = root.resolve()
    cur = base
    for part in parts:
        cur = cur / part
        try:
            info = os.lstat(cur)
        except OSError as exc:
            return None, f"locator does not resolve: {exc.__class__.__name__}"
        if stat.S_ISLNK(info.st_mode) or getattr(info, "st_file_attributes", 0) & REPARSE:
            return None, "locator crosses a symlink or reparse point"
    if not stat.S_ISREG(info.st_mode):
        return None, "locator is not a regular file"
    try:
        real = Path(os.path.realpath(cur))
        real.relative_to(os.path.realpath(base))
    except ValueError:
        return None, "locator resolves outside the repository root"
    return cur, ""


def _read_pinned(rep: _Report, field: str, root: Path, ref: Any) -> bytes | None:
    """Validate an evidence reference; return its raw bytes when path, class and hash conform."""
    if not _exact(rep, field, ref, REF_KEYS):
        return None
    ok = True
    if ref["evidenceClass"] not in EVIDENCE_CLASSES:
        rep.add(field, "invalid_enum", "evidenceClass is not an allowed value")
        ok = False
    if not _text(ref["fragment"]):
        rep.add(field, "empty_fragment", "fragment must be a nonempty locator")
        ok = False
    if not isinstance(ref["sha256"], str) or not SHA_RE.match(ref["sha256"]):
        rep.add(field, "bad_sha256", "sha256 must be lowercase 64-hex")
        ok = False
    target, err = _safe_file(root, ref["path"])
    if target is None:
        rep.add(field, "unsafe_locator", err)
        return None
    try:
        raw = target.read_bytes()
    except OSError as exc:
        rep.add(field, "read_error", f"cannot read cited file: {exc.__class__.__name__}")
        return None
    if ok and hashlib.sha256(raw).hexdigest() != ref["sha256"]:
        rep.add(field, "hash_mismatch", "pinned sha256 does not match current raw bytes")
        return None
    return raw if ok else None


def _refs(rep: _Report, field: str, root: Path, items: Any) -> list[dict[str, Any]]:
    """Validate a list of references; return the refs that conform."""
    if not isinstance(items, list):
        rep.add(field, "not_list", "evidence must be a list of references")
        return []
    good = []
    for i, ref in enumerate(items):
        if _read_pinned(rep, f"{field}[{i}]", root, ref) is not None:
            good.append(ref)
    return good


def _value_checks(rep: _Report, root: Path, checks: Any) -> dict[str, str]:
    statuses: dict[str, str] = {}
    if not _exact(rep, "valueChecks", checks, CHECK_NAMES):
        return statuses
    for name in CHECK_NAMES:
        field, chk = f"valueChecks.{name}", checks[name]
        if not _exact(rep, field, chk, CHECK_KEYS):
            continue
        refs = _refs(rep, f"{field}.evidence", root, chk["evidence"])
        if chk["status"] not in CHECK_STATUS:
            rep.add(field, "invalid_enum", "status is not an allowed value")
            continue
        for key in ("reason", "limits"):
            if not _text(chk[key]):
                rep.add(field, "empty_text", f"{key} must be a concrete nonempty string")
        statuses[name] = chk["status"]
        if chk["status"] != "SUPPORTED":
            continue
        classes = {r["evidenceClass"] for r in refs}
        if not refs or not isinstance(chk["evidence"], list) or len(refs) != len(chk["evidence"]):
            rep.add(field, "supported_without_valid_evidence", "SUPPORTED needs only valid pinned references (at least one)")
        elif OBSERVED_RE.search(str(chk["reason"])) and "OBSERVED_LOCAL" not in classes:
            rep.add(field, "observed_claim_without_observed_evidence",
                    "an observed/reproduced claim needs an OBSERVED_LOCAL reference; attributed or synthetic evidence cannot support it")
    return statuses


def _decision(rep: _Report, root: Path, dec: Any, statuses: dict[str, str], dispositions: Iterable[str] | None) -> str:
    if not _exact(rep, "decision", dec, DECISION_KEYS):
        return ""
    refs = _refs(rep, "decision.evidence", root, dec["evidence"])
    state = dec["state"]
    if state not in DECISION_STATES:
        rep.add("decision", "invalid_enum", "state is not an allowed value")
        return ""
    for key in ("reason", "owner", "f2gDisposition"):
        if not _text(dec[key]):
            rep.add("decision", "empty_text", f"{key} must be a nonempty string")
    if dispositions is not None and dec["f2gDisposition"] not in dispositions:
        rep.add("decision", "invalid_f2g_disposition", "f2gDisposition is not in the F2G vocabulary")
    reviewer = dec["reviewer"]
    if state == "PENDING":
        if reviewer is not None or dec["evidence"]:
            rep.add("decision", "pending_with_review", "PENDING permits reviewer=null and no decision reference only")
        return state
    if not _text(reviewer):
        rep.add("decision", "decided_without_reviewer", f"{state} requires a reviewer identity")
    if not refs or not isinstance(dec["evidence"], list) or len(refs) != len(dec["evidence"]):
        rep.add("decision", "decided_without_reference", f"{state} requires a pinned decision reference")
    if state in ("ACCEPT", "MERGE"):
        if "OBSERVED_LOCAL" not in {r["evidenceClass"] for r in refs}:
            rep.add("decision", "decision_reference_not_observed_local", f"{state} requires a Local observed decision reference")
        weak = [n for n in CHECK_NAMES if statuses.get(n) != "SUPPORTED"]
        if weak:
            rep.add("decision", "accept_without_supported_checks", f"{state} requires all five value checks SUPPORTED; not: {', '.join(weak)}")
        if state == "ACCEPT" and dec["f2gDisposition"] == "RULE_EXISTS":
            rep.add("decision", "rule_exists_claims_new_value", "RULE_EXISTS cannot be ACCEPT; use MERGE into the existing owner")
    return state


def _life(rep: _Report, root: Path, name: str, obj: Any) -> tuple[str, list[dict[str, Any]]]:
    if not _exact(rep, name, obj, LIFE_KEYS):
        return "", []
    refs = _refs(rep, f"{name}.evidence", root, obj["evidence"])
    if obj["state"] not in LIFE_STATES[name]:
        rep.add(name, "invalid_enum", "state is not an allowed value")
        return "", refs
    if not _text(obj["reason"]):
        rep.add(name, "empty_text", "reason must be a nonempty string")
    if not isinstance(obj["evidence"], list) or len(refs) != len(obj["evidence"]):
        return obj["state"], []
    return obj["state"], refs


def _receipt(rep: _Report, root: Path, field: str, kind: str, ref: dict[str, Any], rec_ctx: dict[str, Any]) -> None:
    raw = _read_pinned(_Report(""), field, root, ref)  # ref problems already reported by _refs
    if raw is None:
        return
    try:
        data = strict_json_loads(raw)
    except (ValueError, UnicodeDecodeError) as exc:
        rep.add(field, "receipt_not_typed_json", f"receipt is not strict JSON: {exc}")
        return
    if not _exact(rep, field, data, RECEIPT_KEYS):
        return
    if data["schemaVersion"] != RECEIPT_VERSION or data["kind"] != kind:
        rep.add(field, "receipt_wrong_type", f"receipt must be {RECEIPT_VERSION} kind {kind}")
        return
    if data["findingId"] != rec_ctx["findingId"] or data["sourceProject"] != rec_ctx["sourceProject"]:
        rep.add(field, "receipt_join_mismatch", "receipt findingId/sourceProject (recipient) does not match the parent evidence")
    for key in ("actor", "claimLimits"):
        if not _text(data[key]):
            rep.add(field, "empty_text", f"receipt {key} must be a nonempty string")
    ctrl = data["control"]
    if _exact(rep, f"{field}.control", ctrl, ("path", "sha256")):
        if (ctrl["path"], ctrl["sha256"]) != rec_ctx["control"]:
            rep.add(field, "receipt_control_mismatch", "receipt control path/sha256 does not match the implementation control")
        elif _read_pinned(rep, f"{field}.control", root, {**ctrl, "fragment": "control", "evidenceClass": "OBSERVED_LOCAL"}) is None:
            return
    for key in ("authorization", "verification"):
        if _read_pinned(rep, f"{field}.{key}", root, data[key]) is None:
            return


def validate_parent_evidence(evidence: Any, finding_id: str, root: Path, locator: str = "parentEvidence",
                             dispositions: Iterable[str] | None = None) -> list[dict[str, str]]:
    """Return validation issues for one typed parentEvidence object (empty list = TYPED_STRUCTURAL_VALID)."""
    rep = _Report(f"{locator}.")
    if not _exact(rep, "", evidence, TOP_KEYS):
        return rep.issues
    if evidence["schemaVersion"] != SCHEMA_VERSION:
        rep.add("schemaVersion", "unknown_version", f"only {SCHEMA_VERSION} is admitted")
    if evidence["findingId"] != finding_id:
        rep.add("findingId", "finding_id_mismatch", "findingId must equal the enclosing finding id")
    if not _text(evidence["claimLimits"]):
        rep.add("claimLimits", "empty_text", "claimLimits must be a nonempty string")
    src = evidence["source"]
    project = src.get("sourceProject") if isinstance(src, dict) else None
    if _exact(rep, "source", src, ("sourceProject", "evidence")):
        if not _text(project):
            rep.add("source", "empty_text", "sourceProject must be a nonempty string")
        _read_pinned(rep, "source.evidence", root, src["evidence"])
    statuses = _value_checks(rep, root, evidence["valueChecks"])
    decision = _decision(rep, root, evidence["decision"], statuses, dispositions)
    impl, impl_refs = _life(rep, root, "implementation", evidence["implementation"])
    res, res_refs = _life(rep, root, "projectResolution", evidence["projectResolution"])
    ret, ret_refs = _life(rep, root, "returnDelivery", evidence["returnDelivery"])
    app, app_refs = _life(rep, root, "projectApplication", evidence["projectApplication"])
    if res == "RESOLVED" and not res_refs:
        rep.add("projectResolution", "positive_without_evidence", "RESOLVED needs source-project resolution evidence")
    control: tuple[str, str] | None = None
    if impl == "IMPLEMENTED_BOUNDED":
        if decision not in ("ACCEPT", "MERGE"):
            rep.add("implementation", "implementation_without_decision", "IMPLEMENTED_BOUNDED requires an ACCEPT/MERGE parent decision")
        frags = [r["fragment"] for r in impl_refs]
        missing = [p for p in PROOF_PREFIXES if not any(f.startswith(p) for f in frags)]
        if missing:
            rep.add("implementation", "implementation_without_proof", f"needs references with fragment prefixes: {', '.join(missing)}")
        ctl = [r for r in impl_refs if r["fragment"].startswith("control:")]
        control = (ctl[0]["path"], ctl[0]["sha256"]) if ctl else None
    if (ret == "RETURNED" or app == "APPLIED") and impl != "IMPLEMENTED_BOUNDED":
        rep.add("returnDelivery", "loopback_without_implementation", "RETURNED/APPLIED requires IMPLEMENTED_BOUNDED")
    if app == "APPLIED" and ret != "RETURNED":
        rep.add("projectApplication", "applied_without_return", "APPLIED requires RETURNED")
    if ret == "PARKED_BY_OPERATOR" and app != "PARKED_BY_OPERATOR":
        rep.add("projectApplication", "parked_positive_transition", "a parked returnDelivery requires parked projectApplication")
    for name, state, refs in (("returnDelivery", ret, ret_refs), ("projectApplication", app, app_refs)):
        if state == "PARKED_BY_OPERATOR" and evidence[name]["evidence"]:
            rep.add(name, "parked_with_receipt", "no new receipt is admitted while PARKED_BY_OPERATOR")
    ctx = {"findingId": finding_id, "sourceProject": project, "control": control}
    for name, state, positive, kind, refs in (("returnDelivery", ret, "RETURNED", "DELIVERY", ret_refs),
                                              ("projectApplication", app, "APPLIED", "APPLICATION", app_refs)):
        if state != positive:
            continue
        if len(refs) != 1 or not isinstance(evidence[name]["evidence"], list) or len(evidence[name]["evidence"]) != 1:
            rep.add(name, "receipt_count", f"{positive} requires exactly one valid {kind} receipt reference")
        elif control is None:
            rep.add(name, "receipt_without_control", "no pinned control reference to join the receipt against")
        else:
            _receipt(rep, root, f"{name}.evidence[0]", kind, refs[0], ctx)
    return rep.issues


def classify_registry(root: Path, registry_rel: str, dispositions: Iterable[str] | None = None) -> dict[str, Any]:
    """Read-only mixed-registry report: typed, legacy and invalid findings counted separately."""
    report: dict[str, Any] = {"registry": registry_rel, "typedValid": 0, "legacyUntyped": 0, "invalid": 0, "issues": [], "findings": [], "lifecycleCounts": {name: {state: 0 for state in states} for name, states in LIFE_STATES.items()}}
    if not os.path.lexists(root / registry_rel):
        return report
    target, err = _safe_file(root, registry_rel)
    if target is None:
        report["issues"].append({"path": registry_rel, "type": "registry_unreadable", "message": err})
        report["invalid"] = 1
        return report
    try:
        data = strict_json_loads(target.read_bytes())
        entries = data["entries"]
        if not isinstance(entries, list):
            raise ValueError("registry entries must be an array")
    except (OSError, ValueError, KeyError, TypeError) as exc:
        report["issues"].append({"path": registry_rel, "type": "registry_unparseable", "message": f"{exc.__class__.__name__}: {exc}"})
        report["invalid"] = 1
        return report
    for ei, entry in enumerate(entries):
        if not isinstance(entry, dict) or not isinstance(entry.get("findings"), list):
            report["invalid"] += 1
            report["issues"].append({"path": f"entries[{ei}]", "type": "registry_unparseable",
                                     "message": "entry must be an object with a findings array"})
            continue
        for fi, finding in enumerate(entry["findings"]):
            loc = f"entries[{ei}].findings[{fi}]"
            if not isinstance(finding, dict):
                report["invalid"] += 1
                report["issues"].append({"path": loc, "type": "registry_unparseable",
                                         "message": "finding must be an object"})
                report["findings"].append({"id": None, "outcome": INVALID})
                continue
            fid = finding.get("id") if isinstance(finding, dict) else None
            if not isinstance(finding, dict) or "parentEvidence" not in finding:
                promoted = isinstance(finding, dict) and (
                    finding.get("returnDelivery") == "RETURNED" or finding.get("sourceProjectApplication") == "APPLIED")
                if promoted:
                    report["invalid"] += 1
                    report["issues"].append({"path": loc, "type": "legacy_silent_promotion",
                                             "message": "untyped legacy finding claims RETURNED/APPLIED; it cannot synthesize receipts"})
                    report["findings"].append({"id": fid, "outcome": INVALID})
                else:
                    report["legacyUntyped"] += 1
                    report["findings"].append({"id": fid, "outcome": LEGACY})
                continue
            issues = validate_parent_evidence(finding["parentEvidence"], str(fid), root, f"{loc}.parentEvidence", dispositions)
            report["issues"].extend(issues)
            report["invalid" if issues else "typedValid"] += 1
            states = ({name: finding['parentEvidence'][name]['state'] for name in LIFE_STATES}
                      if not issues else {})
            report["findings"].append({"id": fid, "outcome": INVALID if issues else TYPED_VALID, "states": states})
            # Invalid declarations never contribute to positive lifecycle counts.
            if not issues:
                for name, state in states.items():
                    report['lifecycleCounts'][name][state] += 1
    return report
