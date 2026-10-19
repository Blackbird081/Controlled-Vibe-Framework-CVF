#!/usr/bin/env python3
"""Offline consistency validator for the locked ReviewedOutcomeLink profile."""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import math
import re
import sys
from pathlib import Path
from typing import Any

try:
    from governance.compat.model_selection_manual_record import validate_record
except ModuleNotFoundError as exc:
    # The documented direct-file CLI puts governance/compat, not the repo root,
    # at sys.path[0]. Fall back only for that direct invocation layout.
    if exc.name != "governance":
        raise
    from model_selection_manual_record import validate_record


PROFILE_VERSION = "cvf.model-selection-reviewed-outcome@0.1.0"
DECISION_VERSION = "cvf.model-selection-manual-record@0.1.0"
MAX_INPUT_BYTES = 1024 * 1024
MAX_DEPTH = 32
ID_RE = re.compile(r"[A-Za-z0-9][A-Za-z0-9._:-]{0,127}\Z")
SHA_RE = re.compile(r"[0-9a-f]{64}\Z")
TIME_RE = re.compile(r"[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\.[0-9]+)?(?:Z|[+-][0-9]{2}:[0-9]{2})\Z")
IDENTITY_FIELDS = ("providerProduct", "model", "snapshot", "channel", "effort", "harnessVersion", "toolProfile", "role")
UNITS = ("MONEY", "TOKENS", "QUOTA", "WALL_SECONDS", "WORKER_SECONDS", "HUMAN_SECONDS")
ENUMS = {
    "basis": ("ORIGINAL_RECORD", "RETROSPECTIVE_PROJECTION"),
    "attemptStatus": ("COMPLETED", "FAILED", "BLOCKED", "ABANDONED"),
    "observedBasis": ("UNRESOLVED", "VERIFIED_RUNTIME"),
    "configurationDisposition": ("UNKNOWN", "PARTIAL", "MATCH", "DEVIATION"),
    "firstDisposition": ("PENDING_REVIEW", "ACCEPTED_UNREPAIRED", "REJECTED", "BLOCKED", "FAILED", "ABANDONED", "NO_RETURN"),
    "repairKind": ("REPAIR", "ASSISTANCE"),
    "repairPhase": ("WORKER_PRE_RETURN", "LOCAL_REVIEW", "CLOSURE_PACKAGING"),
    "reviewDisposition": ("PENDING", "ACCEPTED_BOUNDED", "REJECTED", "HOLD"),
    "technicalDisposition": ("ACCEPTED_BOUNDED", "REJECTED", "HOLD", "PENDING_REVIEW"),
    "procedureDisposition": ("PASS", "FAIL", "UNKNOWN"),
    "stage": ("ORCHESTRATION", "PREPARATION", "EXECUTION", "REVIEW", "REWORK"),
    "unit": UNITS,
    "measureBasis": ("MEASURED", "ESTIMATED", "UNKNOWN"),
    "deviationKind": ("CONFIGURATION", "PROCEDURE", "OTHER"),
    "role": ("WORKER", "REVIEWER"),
}


def _ptr(base: str, part: str | int) -> str:
    return base + "/" + str(part).replace("~", "~0").replace("/", "~1")


def _diag(code: str, pointer: str, message: str) -> dict[str, str]:
    return {"code": code, "pointer": pointer, "message": message}


def _tree_issue(value: Any) -> tuple[str, str, str] | None:
    active: set[int] = set()
    stack: list[tuple[Any, str, int, bool]] = [(value, "", 1, False)]
    while stack:
        item, pointer, depth, leaving = stack.pop()
        if leaving:
            active.discard(id(item))
            continue
        if type(item) in (dict, list):
            if depth > MAX_DEPTH:
                return "SHAPE", pointer, "record exceeds the maximum container depth of 32"
            ident = id(item)
            if ident in active:
                return "SHAPE", pointer, "record contains a cyclic container"
            active.add(ident)
            stack.append((item, pointer, depth, True))
            if type(item) is dict:
                for key, child in reversed(list(item.items())):
                    if type(key) is not str:
                        return "TYPE", pointer, "object keys must be strings"
                    try:
                        key.encode("utf-8")
                    except UnicodeEncodeError:
                        return "FORMAT", _ptr(pointer, key), "string is not valid UTF-8"
                    stack.append((child, _ptr(pointer, key), depth + 1, False))
            else:
                for index in range(len(item) - 1, -1, -1):
                    stack.append((item[index], _ptr(pointer, index), depth + 1, False))
        elif item is None or type(item) in (str, bool, int):
            if type(item) is str:
                try:
                    item.encode("utf-8")
                except UnicodeEncodeError:
                    return "FORMAT", pointer, "string is not valid UTF-8"
        elif type(item) is float:
            if not math.isfinite(item):
                return "NONFINITE_NUMBER", pointer, "numbers must be finite"
        else:
            return "TYPE", pointer, "value is not representable as strict JSON"
    return None


def _canonical_digest(value: Any) -> str:
    raw = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def _normalize_actor(value: str) -> str:
    value = value.strip()
    value = re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", value)
    return re.sub(r"[\s_-]+", "_", value).upper()


def _time_value(value: str) -> dt.datetime:
    if not TIME_RE.fullmatch(value):
        raise ValueError("timestamp is outside the locked format")
    if not value.endswith("Z") and int(value[-2:]) > 59:
        raise ValueError("offset minutes are outside the clock range")
    return dt.datetime.fromisoformat(value[:-1] + "+00:00" if value.endswith("Z") else value)


class _V:
    def __init__(self, record: Any) -> None:
        self.record = record
        self.errors: list[dict[str, str]] = []

    def add(self, code: str, path: str, message: str) -> None:
        self.errors.append(_diag(code, path, message))

    def obj(self, value: Any, fields: tuple[str, ...], path: str) -> dict[str, Any] | None:
        if type(value) is not dict:
            self.add("TYPE", path, "expected an object")
            return None
        expected, actual = set(fields), set(value)
        if expected != actual:
            bits = []
            missing, extra = sorted(expected - actual), sorted(actual - expected)
            if missing:
                bits.append("missing fields: " + ", ".join(missing))
            if extra:
                bits.append("unsupported fields: " + ", ".join(extra))
            self.add("SHAPE", path, "; ".join(bits))
            return None
        return value

    def string(self, value: Any, path: str, *, nullable: bool = False) -> bool:
        if nullable and value is None:
            return True
        if type(value) is not str:
            self.add("TYPE", path, "expected a string" if not nullable else "expected a string or null")
            return False
        if not value.strip():
            self.add("FORMAT", path, "string must be nonempty after trimming")
            return False
        return True

    def enum(self, value: Any, name: str, path: str, *, nullable: bool = False) -> bool:
        if nullable and value is None:
            return True
        if type(value) is not str:
            self.add("TYPE", path, "expected an enum string")
            return False
        if value not in ENUMS[name]:
            self.add("ENUM", path, "value is not in the closed enum")
            return False
        return True

    def ident(self, value: Any, path: str, *, nullable: bool = False) -> bool:
        if nullable and value is None:
            return True
        if not self.string(value, path):
            return False
        if not ID_RE.fullmatch(value):
            self.add("FORMAT", path, "identifier does not match the bounded ID format")
            return False
        return True

    def sha(self, value: Any, path: str) -> bool:
        if not self.string(value, path):
            return False
        if not SHA_RE.fullmatch(value):
            self.add("FORMAT", path, "expected a lower-case SHA-256 digest")
            return False
        return True

    def timestamp(self, value: Any, path: str, *, nullable: bool = False) -> dt.datetime | None:
        if nullable and value is None:
            return None
        if not self.string(value, path):
            return None
        try:
            if not TIME_RE.fullmatch(value):
                raise ValueError
            parsed = _time_value(value)
            if parsed.tzinfo is None or parsed.utcoffset() is None:
                raise ValueError
            return parsed
        except (ValueError, OverflowError):
            self.add("FORMAT", path, "expected a valid timezone-aware timestamp with literal T and seconds")
            return None

    def number(self, value: Any, path: str, *, nullable: bool = False) -> bool:
        if nullable and value is None:
            return True
        if type(value) not in (int, float):
            self.add("TYPE", path, "expected a finite nonnegative number")
            return False
        if type(value) is float and not math.isfinite(value):
            self.add("FORMAT", path, "number must be finite")
            return False
        if value < 0:
            self.add("FORMAT", path, "number must be nonnegative")
            return False
        return True

    def array(self, value: Any, path: str) -> list[Any] | None:
        if type(value) is not list:
            self.add("TYPE", path, "expected an array")
            return None
        return value

    def ref(self, value: Any, path: str) -> dict[str, Any] | None:
        item = self.obj(value, ("locator", "sha256"), path)
        if item is None:
            return None
        self.string(item["locator"], _ptr(path, "locator"))
        self.sha(item["sha256"], _ptr(path, "sha256"))
        return item

    def identity(self, value: Any, path: str) -> dict[str, Any] | None:
        item = self.obj(value, IDENTITY_FIELDS + ("unknownReason",), path)
        if item is None:
            return None
        for name in IDENTITY_FIELDS:
            p = _ptr(path, name)
            if name == "role":
                self.enum(item[name], "role", p, nullable=True)
            else:
                self.string(item[name], p, nullable=True)
        self.string(item["unknownReason"], _ptr(path, "unknownReason"), nullable=True)
        unknown = any(item[name] is None for name in IDENTITY_FIELDS)
        reason = item["unknownReason"]
        if unknown and (type(reason) is not str or not reason.strip()):
            self.add("IDENTITY_BASIS", _ptr(path, "unknownReason"), "unknown identity dimensions require a reason")
        if not unknown and reason is not None:
            self.add("IDENTITY_BASIS", _ptr(path, "unknownReason"), "fully known identity requires a null reason")
        return item

    def measure(self, value: Any, path: str, *, stage: bool) -> dict[str, Any] | None:
        fields = ("stage", "unit", "amount", "currency", "window", "unknownReason", "actor", "basis") if stage else ("unit", "amount", "currency", "window", "unknownReason", "basis")
        item = self.obj(value, fields, path)
        if item is None:
            return None
        if stage:
            self.enum(item["stage"], "stage", _ptr(path, "stage"))
            self.string(item["actor"], _ptr(path, "actor"))
        self.enum(item["unit"], "unit", _ptr(path, "unit"))
        self.number(item["amount"], _ptr(path, "amount"), nullable=True)
        self.string(item["currency"], _ptr(path, "currency"), nullable=True)
        self.string(item["window"], _ptr(path, "window"))
        self.string(item["unknownReason"], _ptr(path, "unknownReason"), nullable=True)
        self.enum(item["basis"], "measureBasis", _ptr(path, "basis"))
        unit, amount, currency, reason = item["unit"], item["amount"], item["currency"], item["unknownReason"]
        if amount is None:
            if item["basis"] != "UNKNOWN" or type(reason) is not str or not reason.strip():
                self.add("COST_BASIS", path, "unknown amount requires UNKNOWN basis and a reason")
        elif item["basis"] not in ("MEASURED", "ESTIMATED") or reason is not None:
            self.add("COST_BASIS", path, "known amount requires MEASURED or ESTIMATED basis and null reason")
        if unit == "MONEY" and amount is not None and (type(currency) is not str or not currency.strip()):
            self.add("COST_UNITS", _ptr(path, "currency"), "known MONEY requires currency")
        if unit in UNITS[1:] and currency is not None:
            self.add("COST_UNITS", _ptr(path, "currency"), "non-MONEY units require null currency")
        return item

    def run(self) -> list[dict[str, str]]:
        issue = _tree_issue(self.record)
        if issue:
            self.add(*issue)
            return self.sorted()
        top = self.obj(self.record, ("profileVersion", "recordId", "basis", "asOf", "decisionSource", "decision", "decisionDigest", "outcome"), "")
        if top is None:
            return self.sorted()
        if top["profileVersion"] != PROFILE_VERSION:
            self.add("ENUM", "/profileVersion", "profileVersion is not the supported literal")
        self.ident(top["recordId"], "/recordId")
        self.enum(top["basis"], "basis", "/basis")
        as_of = self.timestamp(top["asOf"], "/asOf")
        self.ref(top["decisionSource"], "/decisionSource")
        digest_valid = self.sha(top["decisionDigest"], "/decisionDigest")
        decision = top["decision"]
        try:
            decision_errors = validate_record(decision)
        except (TypeError, KeyError, IndexError, ValueError, OverflowError, RecursionError, UnicodeEncodeError):
            # Keep checking the independent outcome subtree if a malformed
            # embedded decision exposes an exception in its public validator.
            decision_errors = [_diag("SHAPE", "", "embedded decision could not be validated safely")]
        for error in decision_errors:
            pointer = error.get("pointer", "")
            self.add(error.get("code", "SHAPE"), "/decision" + pointer, "embedded decision: " + error.get("message", "invalid declared decision"))
        selection = decision.get("selection") if type(decision) is dict else None
        if type(selection) is dict and type(selection.get("decidedAt")) is str:
            decision_time = self.timestamp(selection["decidedAt"], "/decision/selection/decidedAt")
            if decision_time is not None and as_of is not None and decision_time > as_of:
                self.add("CHRONOLOGY", "/decision/selection/decidedAt", "selection decision time is later than record asOf")
        if type(decision) is dict:
            try:
                if digest_valid and _canonical_digest(decision) != top["decisionDigest"]:
                    self.add("DECISION_DRIFT", "/decisionDigest", "digest does not match canonical embedded decision bytes")
            except (TypeError, ValueError, UnicodeEncodeError, RecursionError):
                pass
        outcome = self.obj(top["outcome"], ("outcomeId", "decisionId", "primaryAttemptId", "attempts", "failedOrAbandonedAttemptIds", "initialReturn", "finalReturn", "repairs", "review", "technicalDisposition", "procedureDisposition", "procedureReason", "acceptedArtifacts", "telemetry", "remainingParentTaskSpend", "deviations", "limitations"), "/outcome")
        if outcome is not None:
            self._outcome(outcome, decision, as_of, top["basis"])
        return self.sorted()

    def _outcome(self, o: dict[str, Any], decision: Any, as_of: dt.datetime | None, basis: Any) -> None:
        base = "/outcome"
        self.ident(o["outcomeId"], base + "/outcomeId")
        self.ident(o["decisionId"], base + "/decisionId")
        self.ident(o["primaryAttemptId"], base + "/primaryAttemptId")
        selection = decision.get("selection") if type(decision) is dict else None
        decision_id = selection.get("decisionId") if type(selection) is dict else None
        selected_id = selection.get("selectedCandidateId") if type(selection) is dict else None
        if type(decision_id) is str and o["decisionId"] != decision_id:
            self.add("DECISION_JOIN", base + "/decisionId", "outcome decisionId does not match embedded decision")
        selected = None
        candidates = decision.get("candidates") if type(decision) is dict else None
        if type(candidates) is list and type(selected_id) is str:
            selected = next((c for c in candidates if type(c) is dict and c.get("candidateId") == selected_id), None)
        if type(selection) is dict and selection.get("disposition") != "SELECT":
            self.add("DECISION_JOIN", "/decision/selection/disposition", "only a selected decision can have an outcome")
        attempts_raw = self.array(o["attempts"], base + "/attempts")
        attempts: dict[str, dict[str, Any]] = {}
        attempt_times: dict[str, tuple[dt.datetime | None, dt.datetime | None]] = {}
        candidate_id = selected_id
        if attempts_raw is not None:
            if not attempts_raw:
                self.add("OUTCOME_INVARIANT", base + "/attempts", "at least one attempt is required")
            for i, raw in enumerate(attempts_raw):
                p = _ptr(base + "/attempts", i)
                item = self.obj(raw, ("attemptId", "candidateId", "executionRef", "workerActor", "workerInvocationId", "status", "startedAt", "endedAt", "clockUnknownReason", "observed", "observedBasis", "runtimeEvidence", "configurationDisposition"), p)
                if item is None:
                    continue
                aid = item["attemptId"]
                valid_id = self.ident(aid, p + "/attemptId")
                self.ident(item["candidateId"], p + "/candidateId")
                self.ref(item["executionRef"], p + "/executionRef")
                self.string(item["workerActor"], p + "/workerActor")
                self.string(item["workerInvocationId"], p + "/workerInvocationId")
                self.enum(item["status"], "attemptStatus", p + "/status")
                start = self.timestamp(item["startedAt"], p + "/startedAt", nullable=True)
                end = self.timestamp(item["endedAt"], p + "/endedAt", nullable=True)
                self.string(item["clockUnknownReason"], p + "/clockUnknownReason", nullable=True)
                if start is None or end is None:
                    if type(item["clockUnknownReason"]) is not str or not item["clockUnknownReason"].strip():
                        self.add("CHRONOLOGY", p + "/clockUnknownReason", "unknown attempt clock requires a reason")
                elif item["clockUnknownReason"] is not None:
                    self.add("CHRONOLOGY", p + "/clockUnknownReason", "known attempt clocks require null unknown reason")
                if start and end and end < start:
                    self.add("CHRONOLOGY", p + "/endedAt", "attempt end precedes start")
                identity = self.identity(item["observed"], p + "/observed")
                self.enum(item["observedBasis"], "observedBasis", p + "/observedBasis")
                runtime = item["runtimeEvidence"]
                if runtime is not None:
                    self.ref(runtime, p + "/runtimeEvidence")
                self.enum(item["configurationDisposition"], "configurationDisposition", p + "/configurationDisposition")
                if valid_id and type(aid) is str:
                    if aid in attempts:
                        self.add("DUPLICATE_ID", p + "/attemptId", "attempt ID is repeated")
                    else:
                        attempts[aid] = item
                        attempt_times[aid] = (start, end)
                if candidate_id is not None and item["candidateId"] != candidate_id:
                    self.add("ATTEMPT_JOIN", p + "/candidateId", "attempt candidate does not match the selected candidate")
                requested = selected.get("requested") if type(selected) is dict else None
                self._configuration(item, identity, requested, p)
                if start and as_of and start > as_of or end and as_of and end > as_of:
                    self.add("CHRONOLOGY", p, "attempt clock is later than record asOf")
                if basis == "ORIGINAL_RECORD" and start and type(selection) is dict:
                    decided = selection.get("decidedAt")
                    if type(decided) is str:
                        try:
                            if start < _time_value(decided):
                                self.add("CHRONOLOGY", p + "/startedAt", "original attempt starts before selection decision")
                        except (ValueError, OverflowError):
                            pass
        primary_id = o["primaryAttemptId"] if type(o["primaryAttemptId"]) is str else None
        primary = attempts.get(primary_id) if primary_id is not None else None
        if primary_id is None or primary_id not in attempts:
            self.add("ATTEMPT_JOIN", base + "/primaryAttemptId", "primary attempt ID does not resolve")
        failed = self.array(o["failedOrAbandonedAttemptIds"], base + "/failedOrAbandonedAttemptIds")
        if failed is not None:
            failed_set: set[Any] = set()
            for i, value in enumerate(failed):
                p = _ptr(base + "/failedOrAbandonedAttemptIds", i)
                if self.ident(value, p):
                    if value in failed_set:
                        self.add("DUPLICATE_ID", p, "failed attempt ID is repeated")
                    failed_set.add(value)
            expected = {aid for aid, a in attempts.items() if a.get("status") in ("FAILED", "BLOCKED", "ABANDONED")}
            if failed_set != expected:
                self.add("ATTEMPT_HISTORY", base + "/failedOrAbandonedAttemptIds", "IDs must exactly match declared FAILED, BLOCKED and ABANDONED attempts")
        initial = self._initial(o["initialReturn"], base + "/initialReturn", as_of)
        final_return = self._ref_or_null(o["finalReturn"], base + "/finalReturn")
        repairs = self._repairs(o["repairs"], base + "/repairs", attempts, attempt_times, primary, initial, final_return, o["review"], as_of)
        if initial and primary:
            capture_raw = initial.get("capturedAt")
            start, _ = attempt_times.get(primary.get("attemptId"), (None, None))
            if type(capture_raw) is str and start is not None:
                try:
                    if _time_value(capture_raw) < start:
                        self.add("CHRONOLOGY", base + "/initialReturn/capturedAt", "initial capture precedes primary attempt start")
                except (ValueError, OverflowError):
                    pass
        review = self._review(o["review"], base + "/review", attempts, attempt_times, primary, initial, as_of)
        self.enum(o["technicalDisposition"], "technicalDisposition", base + "/technicalDisposition")
        self.enum(o["procedureDisposition"], "procedureDisposition", base + "/procedureDisposition")
        self.string(o["procedureReason"], base + "/procedureReason")
        accepted = self._refs(o["acceptedArtifacts"], base + "/acceptedArtifacts", unique_locator=True)
        telemetry = self.array(o["telemetry"], base + "/telemetry")
        if telemetry is not None:
            self._measurements(telemetry, base + "/telemetry", stage=True)
        spend = self.array(o["remainingParentTaskSpend"], base + "/remainingParentTaskSpend")
        if spend is not None:
            self._measurements(spend, base + "/remainingParentTaskSpend", stage=False)
        deviations = self._deviations(o["deviations"], base + "/deviations", attempts)
        self.string(o["limitations"], base + "/limitations")
        self._cross_outcome(o, primary, initial, final_return, repairs, review, accepted, deviations, attempts, as_of)

    def _configuration(self, attempt: dict[str, Any], observed: dict[str, Any] | None, requested: Any, path: str) -> None:
        identity = observed if type(observed) is dict else {}
        unresolved = attempt["observedBasis"] == "UNRESOLVED"
        reason = identity.get("unknownReason")
        known = [f for f in IDENTITY_FIELDS if identity.get(f) is not None]
        if unresolved:
            if known or attempt["runtimeEvidence"] is not None or type(reason) is not str or not reason.strip():
                self.add("IDENTITY_BASIS", path + "/observedBasis", "UNRESOLVED requires all-null identity, no runtime reference and a reason")
        elif attempt["observedBasis"] == "VERIFIED_RUNTIME":
            if not identity.get("model") or attempt["runtimeEvidence"] is None:
                self.add("IDENTITY_BASIS", path + "/observedBasis", "VERIFIED_RUNTIME requires observed model and runtime evidence")
            if len(known) < len(IDENTITY_FIELDS) and (type(reason) is not str or not reason.strip()):
                self.add("IDENTITY_BASIS", path + "/observed/unknownReason", "partial runtime identity requires a reason")
            if len(known) == len(IDENTITY_FIELDS) and reason is not None:
                self.add("IDENTITY_BASIS", path + "/observed/unknownReason", "fully known runtime identity requires null reason")
        requested = requested if type(requested) is dict else {}
        mismatches = [f for f in IDENTITY_FIELDS if identity.get(f) is not None and requested.get(f) is not None and identity.get(f) != requested.get(f)]
        if mismatches:
            expected = "DEVIATION"
        elif not known:
            expected = "UNKNOWN"
        elif all(identity.get(f) is not None and requested.get(f) is not None for f in IDENTITY_FIELDS):
            expected = "MATCH"
        else:
            expected = "PARTIAL"
        if attempt["configurationDisposition"] != expected:
            self.add("CONFIGURATION_DISPOSITION", path + "/configurationDisposition", "disposition does not match known requested/observed dimensions")

    def _initial(self, value: Any, path: str, as_of: dt.datetime | None) -> dict[str, Any] | None:
        item = self.obj(value, ("ref", "artifacts", "firstDisposition", "capturedAt", "unknownReason"), path)
        if item is None:
            return None
        ref = self._ref_or_null(item["ref"], path + "/ref")
        artifacts = self._refs(item["artifacts"], path + "/artifacts", unique_locator=True)
        self.enum(item["firstDisposition"], "firstDisposition", path + "/firstDisposition")
        captured = self.timestamp(item["capturedAt"], path + "/capturedAt", nullable=True)
        self.string(item["unknownReason"], path + "/unknownReason", nullable=True)
        if item["firstDisposition"] == "NO_RETURN":
            if ref is not None or artifacts or captured is not None or type(item["unknownReason"]) is not str or not item["unknownReason"].strip():
                self.add("RETURN_INVARIANT", path, "NO_RETURN requires null ref/capture, no artifacts and a reason")
        else:
            if ref is None:
                self.add("RETURN_INVARIANT", path + "/ref", "a returned disposition requires a Ref")
            if captured is None and (type(item["unknownReason"]) is not str or not item["unknownReason"].strip()):
                self.add("CHRONOLOGY", path + "/unknownReason", "unknown capture time requires a reason")
            if captured is not None and item["unknownReason"] is not None:
                self.add("CHRONOLOGY", path + "/unknownReason", "known capture time requires null reason")
        if captured and as_of and captured > as_of:
            self.add("CHRONOLOGY", path + "/capturedAt", "initial capture is later than record asOf")
        return item

    def _ref_or_null(self, value: Any, path: str) -> dict[str, Any] | None:
        return None if value is None else self.ref(value, path)

    def _refs(self, value: Any, path: str, *, unique_locator: bool) -> list[dict[str, Any]] | None:
        rows = self.array(value, path)
        if rows is None:
            return None
        seen: set[str] = set()
        result = []
        for i, row in enumerate(rows):
            ref = self.ref(row, _ptr(path, i))
            if ref is not None:
                locator = ref.get("locator")
                if unique_locator and type(locator) is str:
                    if locator in seen:
                        self.add("DUPLICATE_ID", _ptr(path, i) + "/locator", "reference locator is repeated")
                    seen.add(locator)
                result.append(ref)
        return result

    def _repairs(self, value: Any, path: str, attempts: dict[str, dict[str, Any]], times: dict[str, tuple[dt.datetime | None, dt.datetime | None]], primary: dict[str, Any] | None, initial: dict[str, Any] | None, final_return: dict[str, Any] | None, review_raw: Any, as_of: dt.datetime | None) -> list[dict[str, Any]]:
        rows = self.array(value, path)
        if rows is None:
            return []
        seen: set[str] = set()
        result = []
        for i, raw in enumerate(rows):
            p = _ptr(path, i)
            item = self.obj(raw, ("repairId", "attemptId", "actor", "invocationId", "kind", "phase", "before", "after", "reason", "at", "clockUnknownReason"), p)
            if item is None:
                continue
            rid = item["repairId"]
            if self.ident(rid, p + "/repairId"):
                if rid in seen:
                    self.add("DUPLICATE_ID", p + "/repairId", "repair ID is repeated")
                seen.add(rid)
            aid = item["attemptId"]
            self.ident(aid, p + "/attemptId")
            self.string(item["actor"], p + "/actor")
            self.string(item["invocationId"], p + "/invocationId")
            self.enum(item["kind"], "repairKind", p + "/kind")
            self.enum(item["phase"], "repairPhase", p + "/phase")
            before = self._ref_or_null(item["before"], p + "/before")
            after = self._ref_or_null(item["after"], p + "/after")
            self.string(item["reason"], p + "/reason")
            at = self.timestamp(item["at"], p + "/at", nullable=True)
            self.string(item["clockUnknownReason"], p + "/clockUnknownReason", nullable=True)
            if at is None and (type(item["clockUnknownReason"]) is not str or not item["clockUnknownReason"].strip()):
                self.add("CHRONOLOGY", p + "/clockUnknownReason", "unknown repair time requires a reason")
            if at is not None and item["clockUnknownReason"] is not None:
                self.add("CHRONOLOGY", p + "/clockUnknownReason", "known repair time requires null reason")
            if at is not None and as_of is not None and at > as_of:
                self.add("CHRONOLOGY", p + "/at", "repair time is later than record asOf")
            if type(aid) is not str or aid not in attempts:
                self.add("ATTEMPT_JOIN", p + "/attemptId", "repair attempt ID does not resolve")
            if item["kind"] == "REPAIR":
                if after is None:
                    self.add("REPAIR_ATTRIBUTION", p + "/after", "REPAIR requires an after reference")
                if before and after and before.get("sha256") == after.get("sha256"):
                    self.add("REPAIR_ATTRIBUTION", p + "/after", "a changed repair requires a different before digest")
            elif item["kind"] == "ASSISTANCE" and before and after and before.get("sha256") != after.get("sha256"):
                self.add("REPAIR_ATTRIBUTION", p, "ASSISTANCE cannot claim changed bytes")
            if item["phase"] == "WORKER_PRE_RETURN" and type(aid) is str and aid in attempts:
                attempt = attempts[aid]
                pairs = ((item["actor"], attempt["workerActor"]), (item["invocationId"], attempt["workerInvocationId"]))
                if any(type(left) is str and type(right) is str and _normalize_actor(left) != _normalize_actor(right) for left, right in pairs):
                    self.add("REPAIR_ATTRIBUTION", p, "WORKER_PRE_RETURN actor and invocation must match its attempt")
            if item["phase"] == "LOCAL_REVIEW" and aid == (primary or {}).get("attemptId") and at is not None and initial:
                cap = initial.get("capturedAt")
                rv = review_raw.get("reviewedAt") if type(review_raw) is dict else None
                try:
                    review_time = _time_value(rv) if type(rv) is str else None
                except (ValueError, OverflowError):
                    review_time = None
                if type(cap) is str:
                    try:
                        if at < _time_value(cap):
                            self.add("CHRONOLOGY", p + "/at", "primary local review repair precedes initial capture")
                    except (ValueError, OverflowError):
                        pass
                if review_time and at > review_time:
                    self.add("CHRONOLOGY", p + "/at", "primary local review repair is later than review")
            result.append(item)
        return result

    def _review(self, value: Any, path: str, attempts: dict[str, dict[str, Any]], times: dict[str, tuple[dt.datetime | None, dt.datetime | None]], primary: dict[str, Any] | None, initial: dict[str, Any] | None, as_of: dt.datetime | None) -> dict[str, Any] | None:
        item = self.obj(value, ("disposition", "actor", "invocationId", "ref", "reviewedAt", "unknownReason"), path)
        if item is None:
            return None
        self.enum(item["disposition"], "reviewDisposition", path + "/disposition")
        self.string(item["actor"], path + "/actor", nullable=True)
        self.string(item["invocationId"], path + "/invocationId", nullable=True)
        ref = self._ref_or_null(item["ref"], path + "/ref")
        reviewed = self.timestamp(item["reviewedAt"], path + "/reviewedAt", nullable=True)
        self.string(item["unknownReason"], path + "/unknownReason", nullable=True)
        if item["disposition"] == "PENDING":
            if ref is not None or reviewed is not None or type(item["unknownReason"]) is not str or not item["unknownReason"].strip():
                self.add("OUTCOME_INVARIANT", path, "PENDING review requires null ref/time and an unknown reason")
            if (item["actor"] is None) != (item["invocationId"] is None):
                self.add("OUTCOME_INVARIANT", path, "pending reviewer actor and invocation must be both present or both null")
        else:
            if not item["actor"] or not item["invocationId"] or ref is None:
                self.add("OUTCOME_INVARIANT", path, "terminal review requires actor, invocation and reference")
            if reviewed is None and (type(item["unknownReason"]) is not str or not item["unknownReason"].strip()):
                self.add("CHRONOLOGY", path + "/unknownReason", "unknown terminal review time requires a reason")
            if reviewed is not None and item["unknownReason"] is not None:
                self.add("CHRONOLOGY", path + "/unknownReason", "known terminal review time requires null reason")
            if reviewed and as_of and reviewed > as_of:
                self.add("CHRONOLOGY", path + "/reviewedAt", "review time is later than record asOf")
            start, end = times.get((primary or {}).get("attemptId"), (None, None))
            capture = None
            if initial and type(initial.get("capturedAt")) is str:
                try:
                    capture = _time_value(initial["capturedAt"])
                except (ValueError, OverflowError):
                    pass
            if reviewed and end and reviewed < end:
                self.add("CHRONOLOGY", path + "/reviewedAt", "review time precedes primary attempt end")
            if reviewed and capture and reviewed < capture:
                self.add("CHRONOLOGY", path + "/reviewedAt", "review time precedes initial capture")
        for attempt in attempts.values():
            pairs = ((item["actor"], attempt["workerActor"]), (item["invocationId"], attempt["workerInvocationId"]))
            if any(type(left) is str and type(right) is str and _normalize_actor(left) == _normalize_actor(right) for left, right in pairs):
                self.add("REVIEW_INDEPENDENCE", path, "review actor and invocation must differ from each attempt worker")
        return item

    def _measurements(self, rows: list[Any], path: str, *, stage: bool) -> None:
        seen: set[tuple[Any, ...]] = set()
        for i, raw in enumerate(rows):
            p = _ptr(path, i)
            item = self.measure(raw, p, stage=stage)
            if item is None:
                continue
            if stage:
                key = (item.get("stage"), str(item.get("actor", "")).strip().casefold(), item.get("unit"), item.get("currency"), item.get("window"))
            else:
                key = (item.get("unit"), item.get("currency"), item.get("window"))
            if all(value is None or type(value) is str for value in key):
                if key in seen:
                    self.add("COST_UNITS", p, "measurement uniqueness key is repeated")
                seen.add(key)

    def _deviations(self, value: Any, path: str, attempts: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
        rows = self.array(value, path)
        if rows is None:
            return []
        config: set[Any] = set()
        result = []
        for i, raw in enumerate(rows):
            p = _ptr(path, i)
            item = self.obj(raw, ("attemptId", "kind", "reason", "evidence"), p)
            if item is None:
                continue
            aid = item["attemptId"]
            self.ident(aid, p + "/attemptId")
            self.enum(item["kind"], "deviationKind", p + "/kind")
            self.string(item["reason"], p + "/reason")
            self._ref_or_null(item["evidence"], p + "/evidence")
            if type(aid) is not str or aid not in attempts:
                self.add("ATTEMPT_JOIN", p + "/attemptId", "deviation attempt ID does not resolve")
            if item["kind"] == "CONFIGURATION":
                if type(aid) is str:
                    config.add(aid)
            result.append(item)
        for aid, attempt in attempts.items():
            if attempt.get("configurationDisposition") == "DEVIATION" and aid not in config:
                self.add("CONFIGURATION_DISPOSITION", path, "DEVIATION attempt requires a CONFIGURATION deviation row")
            if attempt.get("configurationDisposition") != "DEVIATION" and aid in config:
                self.add("CONFIGURATION_DISPOSITION", path, "non-DEVIATION attempt cannot have a CONFIGURATION deviation row")
        return result

    def _cross_outcome(self, o: dict[str, Any], primary: dict[str, Any] | None, initial: dict[str, Any] | None, final_return: dict[str, Any] | None, repairs: list[dict[str, Any]], review: dict[str, Any] | None, accepted: list[dict[str, Any]] | None, deviations: list[dict[str, Any]], attempts: dict[str, dict[str, Any]], as_of: dt.datetime | None) -> None:
        p = "/outcome"
        first = initial.get("firstDisposition") if initial else None
        initial_ref = initial.get("ref") if initial and type(initial.get("ref")) is dict else None
        if initial and first == "NO_RETURN" and o["technicalDisposition"] == "ACCEPTED_BOUNDED":
            self.add("RETURN_INVARIANT", p + "/technicalDisposition", "an outcome with no initial return cannot be accepted")
        if final_return is not None and initial_ref is None:
            self.add("RETURN_INVARIANT", p + "/finalReturn", "final return requires an initial return")
        local = [r for r in repairs if r.get("kind") == "REPAIR" and r.get("phase") == "LOCAL_REVIEW" and r.get("attemptId") == o["primaryAttemptId"]]
        if initial_ref and final_return and initial_ref.get("sha256") != final_return.get("sha256"):
            if not any(r.get("before") == initial_ref and r.get("after") == final_return for r in local):
                self.add("REPAIR_ATTRIBUTION", p + "/finalReturn", "changed return requires primary LOCAL_REVIEW before/after attribution")
        initial_products = initial.get("artifacts") if initial and type(initial.get("artifacts")) is list else []
        accepted = accepted or []
        for ref in accepted:
            matches = [r for r in initial_products if type(r) is dict and r.get("locator") == ref.get("locator")]
            if not matches:
                if not any(r.get("before") is None and r.get("after") == ref for r in local):
                    self.add("REPAIR_ATTRIBUTION", p + "/acceptedArtifacts", "new accepted product requires primary LOCAL_REVIEW attribution")
            elif all(r.get("sha256") != ref.get("sha256") for r in matches):
                before = next((r for r in matches if any(x.get("before") == r and x.get("after") == ref for x in local)), None)
                if before is None:
                    self.add("REPAIR_ATTRIBUTION", p + "/acceptedArtifacts", "changed accepted product requires primary LOCAL_REVIEW before/after attribution")
        technical = o["technicalDisposition"]
        review_disp = review.get("disposition") if review else None
        expected_review = "PENDING" if technical == "PENDING_REVIEW" else technical
        if review_disp != expected_review:
            self.add("OUTCOME_INVARIANT", p + "/review/disposition", "review and technical dispositions do not map exactly")
        if technical == "ACCEPTED_BOUNDED":
            if not primary or primary.get("status") != "COMPLETED" or initial_ref is None or final_return is None or not accepted:
                self.add("OUTCOME_INVARIANT", p + "/technicalDisposition", "accepted outcome requires completed primary, returned evidence, final return and accepted products")
        elif accepted:
            self.add("OUTCOME_INVARIANT", p + "/acceptedArtifacts", "non-accepted technical dispositions cannot claim accepted artifacts")
        if first == "ACCEPTED_UNREPAIRED":
            if any(r.get("kind") == "REPAIR" and r.get("phase") == "LOCAL_REVIEW" and r.get("attemptId") == o["primaryAttemptId"] for r in repairs):
                self.add("REPAIR_ATTRIBUTION", p + "/repairs", "ACCEPTED_UNREPAIRED forbids primary LOCAL_REVIEW repairs")
            if initial_ref and final_return and initial_ref != final_return:
                self.add("REPAIR_ATTRIBUTION", p + "/finalReturn", "ACCEPTED_UNREPAIRED requires unchanged final return")
            for ref in accepted:
                if not any(type(r) is dict and r.get("locator") == ref.get("locator") and r.get("sha256") == ref.get("sha256") for r in initial_products):
                    self.add("REPAIR_ATTRIBUTION", p + "/acceptedArtifacts", "ACCEPTED_UNREPAIRED requires unchanged accepted product pins")
        if primary and primary.get("status") != "COMPLETED" and technical == "ACCEPTED_BOUNDED":
            self.add("OUTCOME_INVARIANT", p + "/technicalDisposition", "accepted outcome requires a completed primary attempt")

    def sorted(self) -> list[dict[str, str]]:
        return sorted(self.errors, key=lambda e: (e["pointer"], e["code"]))


def validate_outcome_record(record: Any) -> list[dict[str, str]]:
    """Return sorted profile diagnostics; malformed values never escape as exceptions."""
    try:
        return _V(record).run()
    except (TypeError, KeyError, IndexError, ValueError, OverflowError, RecursionError, UnicodeEncodeError):
        return [_diag("SHAPE", "", "record could not be validated safely")]


class _DuplicateKey(ValueError):
    pass


def _object_no_duplicates(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    out: dict[str, Any] = {}
    for key, value in pairs:
        if key in out:
            raise _DuplicateKey
        out[key] = value
    return out


def _input_error(code: str, message: str) -> dict[str, Any]:
    return {"profileVersion": PROFILE_VERSION, "disposition": "INPUT_ERROR", "executionAuthorized": False, "errors": [_diag(code, "", message)]}


def _load_input(path: str) -> tuple[Any | None, dict[str, Any] | None]:
    try:
        raw = Path(path).read_bytes()
    except OSError:
        return None, _input_error("INPUT_IO", "could not read the explicitly supplied input file")
    if len(raw) > MAX_INPUT_BYTES:
        return None, _input_error("INPUT_SIZE", "input exceeds the 1 MiB limit")
    try:
        decoded = raw.decode("utf-8-sig", errors="strict")
    except UnicodeDecodeError:
        return None, _input_error("INPUT_ENCODING", "input is not valid UTF-8")
    try:
        value = json.loads(decoded, object_pairs_hook=_object_no_duplicates, parse_constant=lambda _: (_ for _ in ()).throw(ArithmeticError()))
    except _DuplicateKey:
        return None, _input_error("DUPLICATE_KEY", "JSON object contains a duplicate key")
    except ArithmeticError:
        return None, _input_error("NONFINITE_NUMBER", "JSON contains a non-finite number")
    except (json.JSONDecodeError, ValueError, RecursionError):
        return None, _input_error("INPUT_JSON", "input is not valid strict JSON")
    issue = _tree_issue(value)
    if issue and issue[0] == "NONFINITE_NUMBER":
        return None, _input_error("NONFINITE_NUMBER", "JSON contains a non-finite number")
    if issue and issue[0] == "FORMAT":
        return None, _input_error("INPUT_ENCODING", "JSON contains a string that is not valid UTF-8")
    if issue and issue[0] == "SHAPE":
        return None, _input_error("INPUT_DEPTH", "JSON exceeds the maximum container depth of 32")
    return value, None


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Validate an offline ReviewedOutcomeLink record.")
    parser.add_argument("--input", required=True, help="one explicitly supplied UTF-8 JSON file")
    args = parser.parse_args(argv)
    record, input_error = _load_input(args.input)
    if input_error is not None:
        result, code = input_error, 2
    else:
        errors = validate_outcome_record(record)
        result = {"profileVersion": PROFILE_VERSION, "disposition": "INVALID_OUTCOME_RECORD" if errors else "VALID_OUTCOME_RECORD_ONLY", "executionAuthorized": False, "errors": errors}
        code = 1 if errors else 0
    print(json.dumps(result, ensure_ascii=False, separators=(",", ":")))
    return code


if __name__ == "__main__":
    sys.exit(main())
