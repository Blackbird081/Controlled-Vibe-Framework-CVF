#!/usr/bin/env python3
"""Offline consistency validator for the bounded S2-R1 manual record profile."""

from __future__ import annotations

import argparse
import datetime as _datetime
import hashlib
import json
import math
import re
import sys
from pathlib import Path
from typing import Any


PROFILE_VERSION = "cvf.model-selection-manual-record@0.1.0"
MAX_INPUT_BYTES = 1024 * 1024
MAX_DEPTH = 32
ID_RE = re.compile(r"[A-Za-z0-9][A-Za-z0-9._:-]{0,127}\Z")
SHA_RE = re.compile(r"[0-9a-f]{64}\Z")
IDENTITY_FIELDS = (
    "providerProduct", "model", "snapshot", "channel", "effort",
    "harnessVersion", "toolProfile", "role",
)
UNITS = ("MONEY", "TOKENS", "QUOTA", "WALL_SECONDS", "WORKER_SECONDS", "HUMAN_SECONDS")
EVIDENCE_CLASSES = (
    "OFFICIAL_TECHNICAL_REPORT", "OFFICIAL_MODEL_OR_SYSTEM_CARD",
    "ORIGINAL_BENCHMARK_METHOD", "PROVIDER_REPORTED_EVALUATION",
    "INDEPENDENT_PUBLISHER_EVALUATION", "LOCAL_REVIEWED_OUTCOME",
    "OFFICIAL_TARIFF", "MEASURED_BILLING",
)
ENUMS = {
    "role": ("WORKER", "REVIEWER"),
    "choiceKind": ("EXPLICIT_ASSIGNMENT", "DELEGATED"),
    "requestedBasis": ("OPERATOR_REPORTED", "OFFICIAL_CATALOG"),
    "observedBasis": ("UNRESOLVED", "VERIFIED_RUNTIME"),
    "contextDisposition": ("PASS", "PENDING", "HOLD"),
    "availability": ("AVAILABLE", "UNAVAILABLE", "UNKNOWN"),
    "evidenceClass": EVIDENCE_CLASSES,
    "claimKind": ("POSITIVE_QUALITY", "METHODOLOGY_ONLY", "COST_ONLY"),
    "configurationMatch": ("EXACT", "PARTIAL", "NONTRANSFERABLE"),
    "taskApplicability": ("RELEVANT", "NOT_RELEVANT", "UNKNOWN"),
    "freshness": ("CURRENT_FOR_DECISION", "STALE", "CONFLICTING", "UNRESOLVED"),
    "selectionDisposition": ("SELECT", "HOLD_NO_ELIGIBLE_CANDIDATE", "HOLD_EVIDENCE", "HOLD_OPERATOR_CONSTRAINT"),
    "operatorAssignmentDisposition": ("HONORED", "HONORED_WITH_EVIDENCE_GAP", "BLOCKED", "NOT_APPLICABLE"),
    "qualityDisposition": ("SUPPORTED", "PROVISIONAL", "INSUFFICIENT"),
    "admissionDisposition": ("PASS", "PENDING", "HOLD"),
    "presentSourceDisposition": ("ACTIVE", "RETRACTED", "SUPERSEDED", "UNKNOWN"),
    "applicability": ("EXACT", "PARTIAL", "NONTRANSFERABLE"),
    "evidenceUse": ("CITED", "ACTION_VERIFIED", "NO_CHANGE_REASONED"),
    "stage": ("ORCHESTRATION", "PREPARATION", "EXECUTION", "REVIEW", "REWORK"),
    "unit": UNITS,
}


def _ptr(base: str, part: str | int) -> str:
    escaped = str(part).replace("~", "~0").replace("/", "~1")
    return f"{base}/{escaped}"


def _diag(code: str, pointer: str, message: str) -> dict[str, str]:
    return {"code": code, "pointer": pointer, "message": message}


def _json_tree_issue(value: Any) -> tuple[str, str, str] | None:
    """Return the first unsupported/cyclic/deep JSON location using an iterative walk."""
    active: set[int] = set()
    stack: list[tuple[Any, str, int, bool]] = [(value, "", 1, False)]
    while stack:
        item, pointer, depth, leaving = stack.pop()
        is_container = type(item) in (dict, list)
        if leaving:
            active.discard(id(item))
            continue
        if is_container:
            if depth > MAX_DEPTH:
                return "SHAPE", pointer, "record exceeds the maximum container depth of 32"
            ident = id(item)
            if ident in active:
                return "SHAPE", pointer, "record contains a cyclic container"
            active.add(ident)
            stack.append((item, pointer, depth, True))
            if type(item) is dict:
                pairs = list(item.items())
                for key, child in reversed(pairs):
                    if type(key) is not str:
                        return "TYPE", pointer, "object keys must be strings"
                    key_ptr = _ptr(pointer, key)
                    try:
                        key.encode("utf-8")
                    except UnicodeEncodeError:
                        return "FORMAT", key_ptr, "string is not valid UTF-8"
                    stack.append((child, key_ptr, depth + 1, False))
            else:
                for index in range(len(item) - 1, -1, -1):
                    stack.append((item[index], _ptr(pointer, index), depth + 1, False))
        elif item is None or type(item) in (bool, int):
            continue
        elif type(item) is float:
            if not math.isfinite(item):
                return "NONFINITE_NUMBER", pointer, "numbers must be finite"
        elif type(item) is str:
            try:
                item.encode("utf-8")
            except UnicodeEncodeError:
                return "FORMAT", pointer, "string is not valid UTF-8"
        else:
            return "TYPE", pointer, "value is not representable as strict JSON"
    return None


def _digest(value: Any) -> str:
    encoded = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


class _Validator:
    def __init__(self, record: Any) -> None:
        self.record = record
        self.errors: list[dict[str, str]] = []

    def add(self, code: str, pointer: str, message: str) -> None:
        self.errors.append(_diag(code, pointer, message))

    def obj(self, value: Any, keys: tuple[str, ...], pointer: str) -> dict[str, Any] | None:
        if type(value) is not dict:
            self.add("TYPE", pointer, "expected an object")
            return None
        actual = set(value)
        expected = set(keys)
        if actual != expected:
            missing = sorted(expected - actual)
            extra = sorted(actual - expected)
            detail = []
            if missing:
                detail.append("missing fields: " + ", ".join(missing))
            if extra:
                detail.append("unsupported fields: " + ", ".join(extra))
            self.add("SHAPE", pointer, "; ".join(detail) or "object shape is invalid")
            return None
        return value

    def string(self, value: Any, pointer: str, *, nullable: bool = False, nonempty: bool = True) -> bool:
        if nullable and value is None:
            return True
        if type(value) is not str:
            self.add("TYPE", pointer, "expected a string" if not nullable else "expected a string or null")
            return False
        try:
            value.encode("utf-8")
        except UnicodeEncodeError:
            self.add("FORMAT", pointer, "string is not valid UTF-8")
            return False
        if nonempty and not value.strip():
            self.add("FORMAT", pointer, "string must be nonempty after whitespace trimming")
            return False
        return True

    def enum(self, value: Any, name: str, pointer: str, *, nullable: bool = False) -> bool:
        if nullable and value is None:
            return True
        if type(value) is not str:
            self.add("TYPE", pointer, "expected an enum string" if not nullable else "expected an enum string or null")
            return False
        values = ENUMS[name]
        if value not in values:
            self.add("ENUM", pointer, "value is not in the closed enum")
            return False
        return True

    def id(self, value: Any, pointer: str, *, nullable: bool = False) -> bool:
        if nullable and value is None:
            return True
        if not self.string(value, pointer):
            return False
        if not ID_RE.fullmatch(value):
            self.add("FORMAT", pointer, "identifier does not match the bounded ID format")
            return False
        return True

    def sha(self, value: Any, pointer: str) -> bool:
        if not self.string(value, pointer):
            return False
        if not SHA_RE.fullmatch(value):
            self.add("FORMAT", pointer, "expected a lower-case SHA-256 digest")
            return False
        return True

    def timestamp(self, value: Any, pointer: str) -> bool:
        if not self.string(value, pointer):
            return False
        try:
            # fromisoformat also accepts arbitrary Unicode date/time separators.
            if not re.match(r"(?:[0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{8}|[0-9]{4}-?W[0-9]{2}(?:-?[1-7])?)[Tt]", value):
                raise ValueError("ISO date/time separator is required")
            parsed = _datetime.datetime.fromisoformat(value[:-1] + "+00:00" if value.endswith("Z") else value)
            if parsed.tzinfo is None or parsed.utcoffset() is None:
                raise ValueError("timezone is required")
        except (ValueError, OverflowError):
            self.add("FORMAT", pointer, "expected a valid timezone-aware ISO-8601 timestamp")
            return False
        return True

    def bool(self, value: Any, pointer: str) -> bool:
        if type(value) is not bool:
            self.add("TYPE", pointer, "expected a boolean")
            return False
        return True

    def number(self, value: Any, pointer: str, *, nullable: bool = False) -> bool:
        if nullable and value is None:
            return True
        if type(value) not in (int, float):
            self.add("TYPE", pointer, "expected a finite number" if not nullable else "expected a finite number or null")
            return False
        if type(value) is float and not math.isfinite(value):
            self.add("FORMAT", pointer, "number must be finite")
            return False
        if value < 0:
            self.add("FORMAT", pointer, "measurement or limit must be nonnegative")
            return False
        return True

    def array(self, value: Any, pointer: str) -> list[Any] | None:
        if type(value) is not list:
            self.add("TYPE", pointer, "expected an array")
            return None
        return value

    def ref(self, value: Any, pointer: str) -> bool:
        item = self.obj(value, ("locator", "sha256"), pointer)
        if item is None:
            return False
        ok1 = self.string(item["locator"], _ptr(pointer, "locator"))
        ok2 = self.sha(item["sha256"], _ptr(pointer, "sha256"))
        return ok1 and ok2

    def identity(self, value: Any, pointer: str, *, requested: bool = False) -> dict[str, Any] | None:
        fields = IDENTITY_FIELDS + ("unknownReason",)
        item = self.obj(value, fields, pointer)
        if item is None:
            return None
        for field in IDENTITY_FIELDS:
            field_ptr = _ptr(pointer, field)
            if field == "role":
                self.enum(item[field], "role", field_ptr, nullable=True)
            else:
                self.string(item[field], field_ptr, nullable=True)
        self.string(item["unknownReason"], _ptr(pointer, "unknownReason"), nullable=True)
        unknown = any(item[field] is None for field in IDENTITY_FIELDS)
        if unknown and (type(item["unknownReason"]) is not str or not item["unknownReason"].strip()):
            self.add("IDENTITY_BASIS", _ptr(pointer, "unknownReason"), "unknown identity dimensions require a reason")
        if not unknown and item["unknownReason"] is not None:
            self.add("IDENTITY_BASIS", _ptr(pointer, "unknownReason"), "fully known identity requires a null unknownReason")
        return item

    def digest_family(self, record: dict[str, Any], selection: dict[str, Any]) -> None:
        digests = self.obj(selection.get("frozenDigests"), ("task", "candidates", "evidence"), "/selection/frozenDigests")
        if digests is None:
            return
        for name in ("task", "candidates", "evidence"):
            path = f"/selection/frozenDigests/{name}"
            if self.sha(digests[name], path):
                try:
                    actual = _digest(record[name])
                except (TypeError, ValueError, UnicodeEncodeError, RecursionError):
                    continue
                if digests[name] != actual:
                    self.add("FREEZE_DRIFT", path, "declared freeze digest does not match the current record value")

    def run(self) -> list[dict[str, str]]:
        tree_issue = _json_tree_issue(self.record)
        if tree_issue:
            self.add(tree_issue[0], tree_issue[1], tree_issue[2])
            return self.sorted_errors()
        top = ("profileVersion", "recordId", "task", "candidates", "evidence", "selection", "admission", "cost", "learningLinks")
        record = self.obj(self.record, top, "")
        if record is None:
            return self.sorted_errors()
        if record["profileVersion"] != PROFILE_VERSION:
            self.add("ENUM", "/profileVersion", "profileVersion is not the supported literal")
        self.id(record["recordId"], "/recordId")

        task = self.task(record["task"])
        candidates = self.candidates(record["candidates"], task)
        evidence = self.evidence(record["evidence"], candidates)
        selection = self.selection(record["selection"])
        if selection is not None:
            self.digest_family(record, selection)
        admission = self.admission(record["admission"])
        cost = self.cost(record["cost"], admission, selection)
        learning = self.learning(record["learningLinks"], selection)
        self.cross_validate(record, task, candidates, evidence, selection, admission, cost, learning)
        return self.sorted_errors()

    def task(self, value: Any) -> dict[str, Any] | None:
        keys = ("taskId", "artifact", "surface", "role", "outcome", "acceptanceFloor", "choiceAuthority", "choiceKind", "assignedCandidateId", "provisionalAllowed")
        item = self.obj(value, keys, "/task")
        if item is None:
            return None
        self.id(item["taskId"], "/task/taskId")
        self.ref(item["artifact"], "/task/artifact")
        if item["surface"] != "AGENT_SEAT":
            self.add("ENUM", "/task/surface", "surface must be AGENT_SEAT")
        self.enum(item["role"], "role", "/task/role")
        self.string(item["outcome"], "/task/outcome")
        self.ref(item["acceptanceFloor"], "/task/acceptanceFloor")
        self.ref(item["choiceAuthority"], "/task/choiceAuthority")
        self.enum(item["choiceKind"], "choiceKind", "/task/choiceKind")
        self.id(item["assignedCandidateId"], "/task/assignedCandidateId", nullable=True)
        self.bool(item["provisionalAllowed"], "/task/provisionalAllowed")
        return item

    def candidates(self, value: Any, task: dict[str, Any] | None) -> dict[str, dict[str, Any]] | None:
        rows = self.array(value, "/candidates")
        if rows is None:
            return None
        if not rows:
            self.add("SHAPE", "/candidates", "at least one candidate is required")
        found: dict[str, dict[str, Any]] = {}
        keys = ("candidateId", "requested", "requestedBasis", "observed", "observedBasis", "runtimeEvidence", "eligible", "contextDisposition", "availability")
        for index, raw in enumerate(rows):
            pointer = _ptr("/candidates", index)
            item = self.obj(raw, keys, pointer)
            if item is None:
                continue
            id_ok = self.id(item["candidateId"], _ptr(pointer, "candidateId"))
            requested = self.identity(item["requested"], _ptr(pointer, "requested"), requested=True)
            self.enum(item["requestedBasis"], "requestedBasis", _ptr(pointer, "requestedBasis"))
            observed = self.identity(item["observed"], _ptr(pointer, "observed"))
            self.enum(item["observedBasis"], "observedBasis", _ptr(pointer, "observedBasis"))
            self.ref(item["runtimeEvidence"], _ptr(pointer, "runtimeEvidence")) if item["runtimeEvidence"] is not None else None
            self.bool(item["eligible"], _ptr(pointer, "eligible"))
            self.enum(item["contextDisposition"], "contextDisposition", _ptr(pointer, "contextDisposition"))
            self.enum(item["availability"], "availability", _ptr(pointer, "availability"))
            if requested:
                if not isinstance(requested.get("model"), str) or not requested["model"].strip():
                    self.add("IDENTITY_BASIS", _ptr(_ptr(pointer, "requested"), "model"), "requested model or alias is required")
                if task and requested.get("role") != task.get("role"):
                    self.add("IDENTITY_BASIS", _ptr(_ptr(pointer, "requested"), "role"), "requested role must equal task role")
            if observed and item["observedBasis"] == "UNRESOLVED":
                if any(observed.get(field) is not None for field in IDENTITY_FIELDS) or item["runtimeEvidence"] is not None:
                    self.add("IDENTITY_BASIS", _ptr(pointer, "observed"), "UNRESOLVED identity requires all dimensions and runtimeEvidence to be null")
            if observed and item["observedBasis"] == "VERIFIED_RUNTIME":
                if item["runtimeEvidence"] is None or not isinstance(observed.get("model"), str) or not observed["model"].strip():
                    self.add("IDENTITY_BASIS", _ptr(pointer, "observedBasis"), "VERIFIED_RUNTIME requires a source ref and observed model")
            if id_ok:
                cid = item["candidateId"]
                if cid in found:
                    self.add("DUPLICATE_ID", _ptr(pointer, "candidateId"), "candidateId is duplicated")
                else:
                    found[cid] = item
        return found

    def evidence(self, value: Any, candidates: dict[str, dict[str, Any]] | None) -> dict[str, dict[str, Any]] | None:
        rows = self.array(value, "/evidence")
        if rows is None:
            return None
        found: dict[str, dict[str, Any]] = {}
        keys = ("evidenceId", "candidateId", "evidenceClass", "claimKind", "source", "retrievedAt", "configurationMatch", "taskApplicability", "freshness", "testedConfiguration", "limitations")
        for index, raw in enumerate(rows):
            pointer = _ptr("/evidence", index)
            item = self.obj(raw, keys, pointer)
            if item is None:
                continue
            id_ok = self.id(item["evidenceId"], _ptr(pointer, "evidenceId"))
            self.id(item["candidateId"], _ptr(pointer, "candidateId"))
            if candidates is not None and isinstance(item["candidateId"], str) and item["candidateId"] not in candidates:
                self.add("DANGLING_REF", _ptr(pointer, "candidateId"), "evidence candidateId does not resolve")
            for field, enum_name in (("evidenceClass", "evidenceClass"), ("claimKind", "claimKind"), ("configurationMatch", "configurationMatch"), ("taskApplicability", "taskApplicability"), ("freshness", "freshness")):
                self.enum(item[field], enum_name, _ptr(pointer, field))
            self.ref(item["source"], _ptr(pointer, "source"))
            self.timestamp(item["retrievedAt"], _ptr(pointer, "retrievedAt"))
            tested = self.identity(item["testedConfiguration"], _ptr(pointer, "testedConfiguration"))
            self.string(item["limitations"], _ptr(pointer, "limitations"))
            if tested and item["configurationMatch"] == "EXACT" and candidates and isinstance(item["candidateId"], str):
                candidate = candidates.get(item["candidateId"])
                requested = candidate.get("requested") if candidate else None
                if type(requested) is not dict or any(requested.get(field) is None or tested.get(field) is None or requested.get(field) != tested.get(field) for field in IDENTITY_FIELDS):
                    self.add("EXACT_MATCH", _ptr(pointer, "configurationMatch"), "EXACT requires all eight known identity dimensions to match")
            if id_ok:
                eid = item["evidenceId"]
                if eid in found:
                    self.add("DUPLICATE_ID", _ptr(pointer, "evidenceId"), "evidenceId is duplicated")
                else:
                    found[eid] = item
        return found

    def selection(self, value: Any) -> dict[str, Any] | None:
        keys = ("decisionId", "owner", "decidedAt", "disposition", "selectedCandidateId", "operatorAssignmentDisposition", "qualityDisposition", "evidenceIds", "rationale", "executionAuthorized", "frozenDigests")
        item = self.obj(value, keys, "/selection")
        if item is None:
            return None
        self.id(item["decisionId"], "/selection/decisionId")
        if item["owner"] != "LOCAL":
            self.add("ENUM", "/selection/owner", "selection owner must be LOCAL")
        self.timestamp(item["decidedAt"], "/selection/decidedAt")
        self.enum(item["disposition"], "selectionDisposition", "/selection/disposition")
        self.id(item["selectedCandidateId"], "/selection/selectedCandidateId", nullable=True)
        self.enum(item["operatorAssignmentDisposition"], "operatorAssignmentDisposition", "/selection/operatorAssignmentDisposition")
        self.enum(item["qualityDisposition"], "qualityDisposition", "/selection/qualityDisposition")
        ids = self.array(item["evidenceIds"], "/selection/evidenceIds")
        if ids is not None:
            seen: set[str] = set()
            for index, evidence_id in enumerate(ids):
                if self.id(evidence_id, _ptr("/selection/evidenceIds", index)):
                    if evidence_id in seen:
                        self.add("DUPLICATE_ID", _ptr("/selection/evidenceIds", index), "selection evidence ID is repeated")
                    seen.add(evidence_id)
        self.string(item["rationale"], "/selection/rationale")
        if item["executionAuthorized"] is not False:
            self.add("SELECTION_INVARIANT", "/selection/executionAuthorized", "executionAuthorized must be the literal false")
        return item

    def admission(self, value: Any) -> dict[str, Any] | None:
        fields = ("disposition", "authorityDisposition", "methodDisposition", "contextDisposition", "budgetDisposition", "availabilityDisposition")
        keys = fields + ("refs", "reason")
        item = self.obj(value, keys, "/admission")
        if item is None:
            return None
        for field in fields:
            enum_name = "admissionDisposition" if field == "disposition" else "contextDisposition"
            self.enum(item[field], enum_name, _ptr("/admission", field))
        refs = self.array(item["refs"], "/admission/refs")
        if refs is not None:
            for index, ref in enumerate(refs):
                self.ref(ref, _ptr("/admission/refs", index))
        self.string(item["reason"], "/admission/reason")
        return item

    def cost(self, value: Any, admission: dict[str, Any] | None, selection: dict[str, Any] | None) -> dict[str, Any] | None:
        item = self.obj(value, ("stages", "hardCaps"), "/cost")
        if item is None:
            return None
        stages = self.array(item["stages"], "/cost/stages")
        caps = self.array(item["hardCaps"], "/cost/hardCaps")
        stage_keys: set[tuple[Any, ...]] = set()
        stage_rows: set[tuple[Any, ...]] = set()
        if stages is not None:
            fields = ("stage", "unit", "amount", "currency", "window", "unknownReason")
            for index, raw in enumerate(stages):
                pointer = _ptr("/cost/stages", index)
                row = self.obj(raw, fields, pointer)
                if row is None:
                    continue
                stage_valid = self.enum(row["stage"], "stage", _ptr(pointer, "stage"))
                unit_valid = self.enum(row["unit"], "unit", _ptr(pointer, "unit"))
                self.number(row["amount"], _ptr(pointer, "amount"), nullable=True)
                self.string(row["currency"], _ptr(pointer, "currency"), nullable=True)
                self.string(row["window"], _ptr(pointer, "window"))
                self.string(row["unknownReason"], _ptr(pointer, "unknownReason"), nullable=True)
                if row["amount"] is None:
                    if type(row["unknownReason"]) is not str or not row["unknownReason"].strip():
                        self.add("COST_UNITS", _ptr(pointer, "unknownReason"), "unknown amount requires a reason")
                elif row["unknownReason"] is not None:
                    self.add("COST_UNITS", _ptr(pointer, "unknownReason"), "known amount requires null unknownReason")
                if row["unit"] == "MONEY":
                    if row["amount"] is not None and (type(row["currency"]) is not str or not row["currency"].strip()):
                        self.add("COST_UNITS", _ptr(pointer, "currency"), "known money amount requires currency")
                elif row["currency"] is not None:
                    self.add("COST_UNITS", _ptr(pointer, "currency"), "non-money units require null currency")
                safe_key = stage_valid and unit_valid and type(row["currency"]) in (str, type(None)) and type(row["window"]) is str
                if safe_key:
                    key = (row["stage"], row["unit"], row["currency"], row["window"])
                    if key in stage_keys:
                        self.add("COST_UNITS", pointer, "stage/unit/currency/window combination is duplicated")
                    stage_keys.add(key)
                    stage_rows.add((row["unit"], row["currency"], row["window"]))
        over_limit = False
        null_bound = False
        cap_keys: set[tuple[Any, ...]] = set()
        if caps is not None:
            fields = ("unit", "limit", "currency", "window", "bound", "boundReason")
            for index, raw in enumerate(caps):
                pointer = _ptr("/cost/hardCaps", index)
                row = self.obj(raw, fields, pointer)
                if row is None:
                    continue
                unit_valid = self.enum(row["unit"], "unit", _ptr(pointer, "unit"))
                self.number(row["limit"], _ptr(pointer, "limit"))
                self.string(row["currency"], _ptr(pointer, "currency"), nullable=True)
                self.string(row["window"], _ptr(pointer, "window"))
                self.number(row["bound"], _ptr(pointer, "bound"), nullable=True)
                self.string(row["boundReason"], _ptr(pointer, "boundReason"))
                if row["unit"] == "MONEY":
                    if type(row["currency"]) is not str or not row["currency"].strip():
                        self.add("COST_UNITS", _ptr(pointer, "currency"), "money cap requires currency")
                elif row["currency"] is not None:
                    self.add("COST_UNITS", _ptr(pointer, "currency"), "non-money cap requires null currency")
                safe_key = unit_valid and type(row["currency"]) in (str, type(None)) and type(row["window"]) is str
                if safe_key:
                    key = (row["unit"], row["currency"], row["window"])
                    if key in cap_keys:
                        self.add("COST_UNITS", pointer, "unit/currency/window cap is duplicated")
                    cap_keys.add(key)
                if row["bound"] is None:
                    null_bound = True
                else:
                    if safe_key and (row["unit"], row["currency"], row["window"]) not in stage_rows:
                        self.add("COST_UNITS", _ptr(pointer, "bound"), "supplied bound needs a matching stage unit/currency/window")
                if type(row["bound"]) in (int, float) and type(row["limit"]) in (int, float) and row["bound"] > row["limit"]:
                        over_limit = True
        if admission and caps is not None:
            budget = admission.get("budgetDisposition")
            if null_bound and budget == "PASS":
                self.add("COST_BOUND", "/admission/budgetDisposition", "a null cap bound cannot support budget PASS")
            if over_limit and budget != "HOLD":
                self.add("COST_BOUND", "/admission/budgetDisposition", "an over-limit bound requires budget HOLD")
        return item

    def learning(self, value: Any, selection: dict[str, Any] | None) -> dict[str, dict[str, Any]] | None:
        rows = self.array(value, "/learningLinks")
        if rows is None:
            return None
        found: dict[str, dict[str, Any]] = {}
        keys = ("linkId", "laterDecisionId", "branch", "source", "presentSourceDisposition", "currentCheckAt", "applicability", "applicabilityReason", "evidenceUse", "actionOrReason", "verification")
        for index, raw in enumerate(rows):
            pointer = _ptr("/learningLinks", index)
            row = self.obj(raw, keys, pointer)
            if row is None:
                continue
            id_ok = self.id(row["linkId"], _ptr(pointer, "linkId"))
            self.id(row["laterDecisionId"], _ptr(pointer, "laterDecisionId"))
            if selection is not None and row["laterDecisionId"] != selection.get("decisionId"):
                self.add("DANGLING_REF", _ptr(pointer, "laterDecisionId"), "laterDecisionId must equal the current decisionId")
            if row["branch"] != "LOCAL_OBSERVATION":
                self.add("LEARNING_INVARIANT", _ptr(pointer, "branch"), "only LOCAL_OBSERVATION is supported by this profile")
            self.ref(row["source"], _ptr(pointer, "source"))
            self.enum(row["presentSourceDisposition"], "presentSourceDisposition", _ptr(pointer, "presentSourceDisposition"))
            self.timestamp(row["currentCheckAt"], _ptr(pointer, "currentCheckAt"))
            self.enum(row["applicability"], "applicability", _ptr(pointer, "applicability"))
            self.string(row["applicabilityReason"], _ptr(pointer, "applicabilityReason"))
            self.enum(row["evidenceUse"], "evidenceUse", _ptr(pointer, "evidenceUse"))
            self.string(row["actionOrReason"], _ptr(pointer, "actionOrReason"), nullable=True)
            self.ref(row["verification"], _ptr(pointer, "verification")) if row["verification"] is not None else None
            if row["evidenceUse"] in ("ACTION_VERIFIED", "NO_CHANGE_REASONED"):
                if row["presentSourceDisposition"] != "ACTIVE" or row["applicability"] not in ("EXACT", "PARTIAL") or not isinstance(row["actionOrReason"], str) or not row["actionOrReason"].strip() or row["verification"] is None:
                    self.add("LEARNING_INVARIANT", pointer, "verified learning use requires active source, applicable scope, action/reason and verification ref")
            if id_ok:
                lid = row["linkId"]
                if lid in found:
                    self.add("DUPLICATE_ID", _ptr(pointer, "linkId"), "linkId is duplicated")
                else:
                    found[lid] = row
        return found

    def cross_validate(self, record: dict[str, Any], task: dict[str, Any] | None, candidates: dict[str, dict[str, Any]] | None, evidence: dict[str, dict[str, Any]] | None, selection: dict[str, Any] | None, admission: dict[str, Any] | None, cost: dict[str, Any] | None, learning: dict[str, dict[str, Any]] | None) -> None:
        if candidates is None or selection is None:
            return
        disposition = selection.get("disposition")
        selected_id = selection.get("selectedCandidateId")
        assigned_id = task.get("assignedCandidateId") if task else None
        selected = candidates.get(selected_id) if isinstance(selected_id, str) else None
        if disposition == "SELECT":
            if not selected:
                self.add("DANGLING_REF", "/selection/selectedCandidateId", "SELECT must reference a declared candidate")
            else:
                if selected.get("eligible") is not True:
                    self.add("SELECTION_INVARIANT", "/selection/selectedCandidateId", "SELECT requires an eligible candidate")
                if selected.get("availability") == "UNAVAILABLE" or selected.get("contextDisposition") == "HOLD":
                    self.add("SELECTION_INVARIANT", "/selection/disposition", "known unavailability or context HOLD prevents SELECT")
        elif selected_id is not None:
            self.add("SELECTION_INVARIANT", "/selection/selectedCandidateId", "hold dispositions require a null selectedCandidateId")
        if disposition == "HOLD_NO_ELIGIBLE_CANDIDATE" and any(row.get("eligible") is True for row in candidates.values()):
            self.add("SELECTION_INVARIANT", "/selection/disposition", "HOLD_NO_ELIGIBLE_CANDIDATE requires no eligible candidates")
        if task:
            kind = task.get("choiceKind")
            assignment = candidates.get(assigned_id) if isinstance(assigned_id, str) else None
            if kind == "EXPLICIT_ASSIGNMENT":
                if not assignment:
                    self.add("DANGLING_REF", "/task/assignedCandidateId", "EXPLICIT_ASSIGNMENT requires a declared assigned candidate")
                if disposition == "SELECT" and selected_id != assigned_id:
                    self.add("SELECTION_INVARIANT", "/selection/selectedCandidateId", "explicit SELECT must equal the assigned candidate")
                if disposition != "SELECT" and selection.get("operatorAssignmentDisposition") != "BLOCKED":
                    self.add("SELECTION_INVARIANT", "/selection/operatorAssignmentDisposition", "explicit holds require BLOCKED assignment disposition")
                if disposition == "SELECT":
                    expected = "HONORED_WITH_EVIDENCE_GAP" if selection.get("qualityDisposition") == "INSUFFICIENT" else "HONORED"
                    if selection.get("operatorAssignmentDisposition") != expected:
                        self.add("SELECTION_INVARIANT", "/selection/operatorAssignmentDisposition", "explicit assignment disposition does not match the quality branch")
                if assignment and (assignment.get("availability") == "UNAVAILABLE" or assignment.get("contextDisposition") == "HOLD") and disposition != "HOLD_OPERATOR_CONSTRAINT":
                    self.add("SELECTION_INVARIANT", "/selection/disposition", "an explicit assignment conflict requires HOLD_OPERATOR_CONSTRAINT")
            elif kind == "DELEGATED":
                if assigned_id is not None:
                    self.add("SELECTION_INVARIANT", "/task/assignedCandidateId", "DELEGATED requires a null assignedCandidateId")
                if selection.get("operatorAssignmentDisposition") != "NOT_APPLICABLE":
                    self.add("SELECTION_INVARIANT", "/selection/operatorAssignmentDisposition", "DELEGATED requires NOT_APPLICABLE assignment disposition")
                if disposition == "SELECT" and selection.get("qualityDisposition") == "INSUFFICIENT":
                    self.add("DELEGATED_EVIDENCE", "/selection/qualityDisposition", "delegated SELECT cannot claim INSUFFICIENT quality")
        if evidence is not None:
            selected_evidence_ids = selection.get("evidenceIds") if type(selection.get("evidenceIds")) is list else []
            for evidence_id in selected_evidence_ids:
                if not isinstance(evidence_id, str):
                    continue  # The field validator already retained its TYPE diagnostic.
                row = evidence.get(evidence_id)
                if not row:
                    self.add("DANGLING_REF", "/selection/evidenceIds", "selection evidence ID does not resolve")
            referenced = [evidence[eid] for eid in selected_evidence_ids if isinstance(eid, str) and eid in evidence]
            if selected and disposition == "SELECT":
                conflicts = [row for row in referenced if row.get("candidateId") == selected_id and row.get("claimKind") == "POSITIVE_QUALITY" and row.get("freshness") == "CONFLICTING"]
                quality = selection.get("qualityDisposition")
                if conflicts and (task is None or task.get("choiceKind") == "DELEGATED" or quality in ("SUPPORTED", "PROVISIONAL")):
                    self.add("DELEGATED_EVIDENCE", "/selection/evidenceIds", "conflicting positive-quality evidence cannot support this selection quality")
                if quality in ("SUPPORTED", "PROVISIONAL"):
                    support = [row for row in referenced if row.get("candidateId") == selected_id and row.get("claimKind") == "POSITIVE_QUALITY" and row.get("evidenceClass") not in ("OFFICIAL_TARIFF", "MEASURED_BILLING") and row.get("taskApplicability") == "RELEVANT" and row.get("freshness") == "CURRENT_FOR_DECISION" and row.get("configurationMatch") in ("EXACT", "PARTIAL")]
                    if not support:
                        self.add("DELEGATED_EVIDENCE", "/selection/evidenceIds", "SUPPORTED or PROVISIONAL requires relevant current positive-quality evidence")
                if quality == "PROVISIONAL" and not (task and task.get("provisionalAllowed") is True):
                    self.add("DELEGATED_EVIDENCE", "/selection/qualityDisposition", "PROVISIONAL requires provisionalAllowed=true")
        if admission is not None:
            components = [admission.get(name) for name in ("authorityDisposition", "methodDisposition", "contextDisposition", "budgetDisposition", "availabilityDisposition")]
            holds = any(component == "HOLD" for component in components)
            if holds and admission.get("disposition") != "HOLD":
                self.add("ADMISSION_INVARIANT", "/admission/disposition", "any HOLD component requires overall Admission HOLD")
            if admission.get("disposition") == "HOLD" and not holds:
                self.add("ADMISSION_INVARIANT", "/admission/disposition", "overall Admission HOLD requires a HOLD component")
            if holds and disposition != "HOLD_OPERATOR_CONSTRAINT":
                self.add("ADMISSION_INVARIANT", "/selection/disposition", "an admission HOLD component requires HOLD_OPERATOR_CONSTRAINT")
            if admission.get("disposition") == "PASS":
                if disposition != "SELECT" or not admission.get("refs") or any(component != "PASS" for component in components):
                    self.add("ADMISSION_INVARIANT", "/admission/disposition", "Admission PASS requires SELECT, refs and all five component PASS values")
                if not selected or selected.get("availability") != "AVAILABLE" or selected.get("contextDisposition") != "PASS":
                    self.add("ADMISSION_INVARIANT", "/admission/disposition", "Admission PASS requires selected availability AVAILABLE and context PASS")
            if selected and admission.get("contextDisposition") == "PASS" and selected.get("contextDisposition") != "PASS":
                self.add("ADMISSION_INVARIANT", "/admission/contextDisposition", "selected context PENDING or HOLD cannot be represented as PASS")
            if selected and admission.get("availabilityDisposition") == "PASS" and selected.get("availability") != "AVAILABLE":
                self.add("ADMISSION_INVARIANT", "/admission/availabilityDisposition", "selected UNKNOWN or UNAVAILABLE cannot be represented as PASS")

    def sorted_errors(self) -> list[dict[str, str]]:
        return sorted(self.errors, key=lambda error: (error["pointer"], error["code"]))


def validate_record(record: Any) -> list[dict[str, str]]:
    """Return bounded-profile diagnostics without throwing for malformed records."""
    try:
        return _Validator(record).run()
    except (TypeError, KeyError, IndexError, ValueError, OverflowError, RecursionError):
        return [_diag("SHAPE", "", "record could not be validated safely")]


class _DuplicateKey(ValueError):
    pass


def _pairs_without_duplicates(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            raise _DuplicateKey
        result[key] = value
    return result


def _input_error(code: str, message: str) -> dict[str, str]:
    return {"profileVersion": PROFILE_VERSION, "disposition": "INPUT_ERROR", "executionAuthorized": False, "errors": [_diag(code, "", message)]}


def _load_input(path: str) -> tuple[Any | None, dict[str, str] | None]:
    try:
        raw = Path(path).read_bytes()
    except OSError:
        return None, _input_error("INPUT_IO", "could not read the explicitly supplied input file")
    if len(raw) > MAX_INPUT_BYTES:
        return None, _input_error("INPUT_SIZE", "input exceeds the 1 MiB limit")
    try:
        decoded = raw.decode("utf-8", errors="strict")
    except UnicodeDecodeError:
        return None, _input_error("INPUT_ENCODING", "input is not valid UTF-8")
    try:
        value = json.loads(decoded, object_pairs_hook=_pairs_without_duplicates, parse_constant=lambda _value: (_ for _ in ()).throw(ArithmeticError()))
    except _DuplicateKey:
        return None, _input_error("DUPLICATE_KEY", "JSON object contains a duplicate key")
    except ArithmeticError:
        return None, _input_error("NONFINITE_NUMBER", "JSON contains a non-finite number")
    except (json.JSONDecodeError, RecursionError, ValueError):
        return None, _input_error("INPUT_JSON", "input is not valid strict JSON")
    tree_issue = _json_tree_issue(value)
    if tree_issue and tree_issue[0] == "NONFINITE_NUMBER":
        return None, _input_error("NONFINITE_NUMBER", "JSON contains a non-finite number")
    if tree_issue and tree_issue[0] == "FORMAT" and "UTF-8" in tree_issue[2]:
        return None, _input_error("INPUT_ENCODING", "JSON contains a string that is not valid UTF-8")
    return value, None


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Validate one offline S2-R1 manual record.")
    parser.add_argument("--input", required=True, help="explicit UTF-8 JSON input file")
    args = parser.parse_args(argv)
    record, input_error = _load_input(args.input)
    if input_error is not None:
        result = input_error
        code = 2
    else:
        errors = validate_record(record)
        result = {
            "profileVersion": PROFILE_VERSION,
            "disposition": "INVALID_RECORD" if errors else "VALID_RECORD_ONLY",
            "executionAuthorized": False,
            "errors": errors,
        }
        code = 1 if errors else 0
    print(json.dumps(result, ensure_ascii=False, separators=(",", ":")))
    return code


if __name__ == "__main__":
    sys.exit(main())
