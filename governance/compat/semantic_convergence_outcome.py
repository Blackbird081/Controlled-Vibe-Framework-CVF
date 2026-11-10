"""Outcome enrollment joins for the existing SCEC gate; no effect authority.

Registry anchors are reviewer-owned pointers, not a second counter ledger.
Unenrolled historical outcomes remain outside this forward-only extension.
"""
from __future__ import annotations

import datetime as dt
import hashlib
import json
import re
import stat
from contextlib import contextmanager
from contextvars import ContextVar
from pathlib import Path, PurePosixPath

REGISTRY = "governance/compat/outcome_learning_anchors.json"
SCHEMA = "cvf.outcomeLearningAnchors@1"
COVERAGE_TAG = "cvf-milestone-coverage-json"
CHECKS = {"environment", "launch", "journey", "remainingBudget", "exactVersion"}
MAX_BYTES = 1024 * 1024
_snapshot = ContextVar("outcome_snapshot", default=None)


@contextmanager
def snapshot():
    if _snapshot.get() is not None:
        yield
        return
    token = _snapshot.set({"files": {}, "bytes": 0})
    try:
        yield
    finally:
        _snapshot.reset(token)


def strict_json(text: str):
    def pairs(items):
        result = {}
        for key, value in items:
            if key in result:
                raise ValueError("duplicate JSON key")
            result[key] = value
        return result
    def invalid_constant(value):
        raise ValueError("non-finite JSON constant: " + value)
    return json.loads(text, object_pairs_hook=pairs, parse_constant=invalid_constant)


def safe_bytes(root: Path, path: str) -> bytes:
    if (not isinstance(path, str) or not path or "\\" in path or ":" in path
            or path.startswith("/") or any(p in ("", ".", "..") for p in path.split("/"))):
        raise ValueError("unsafe evidence path")
    target = root.joinpath(*PurePosixPath(path).parts)
    target.resolve().relative_to(root.resolve())
    for part in (target, *target.parents):
        if part == root:
            break
        if part.is_symlink() or (hasattr(part, "is_junction") and part.is_junction()):
            raise ValueError("linked evidence path")
    info = target.stat()
    if not stat.S_ISREG(info.st_mode) or info.st_size > MAX_BYTES:
        raise ValueError("evidence exceeds bounded read")
    cache = _snapshot.get()
    key = str(target.resolve()).casefold()
    if cache is not None and key in cache["files"]:
        return cache["files"][key]
    with target.open("rb") as stream:
        raw = stream.read(MAX_BYTES + 1)
    if len(raw) > MAX_BYTES:
        raise ValueError("evidence grew past bounded read")
    if cache is not None:
        cache["bytes"] += len(raw)
        if cache["bytes"] > 16 * MAX_BYTES:
            raise ValueError("outcome evidence exceeds 16MiB invocation budget")
        cache["files"][key] = raw
    return raw


def pinned(root: Path, ref: dict) -> bytes:
    if (not isinstance(ref, dict) or set(ref) != {"path", "sha256"}
            or not isinstance(ref["sha256"], str)
            or not re.fullmatch(r"[a-f0-9]{64}", ref["sha256"])):
        raise ValueError("invalid evidence reference")
    raw = safe_bytes(root, ref["path"])
    # These are text contract pins, stable across Git autocrlf worktrees.
    normalized = raw.replace(b"\r\n", b"\n")
    if hashlib.sha256(normalized).hexdigest() != ref["sha256"]:
        raise ValueError("evidence hash drift: " + ref["path"])
    return raw


def decision_state(root, ref, milestone):
    value = strict_json(pinned(root, ref).decode("utf-8"))
    if (isinstance(value, dict) and value.get("schemaVersion") == "cvf.outcomeOperatorDecision@1"
            and set(value) == {"schemaVersion", "milestoneId", "state", "instruction"}
            and value["milestoneId"] == milestone and value["state"] in ("HELD", "OPEN")
            and isinstance(value["instruction"], str) and value["instruction"].strip()):
        return value["state"]
    # Read-only adapter for the pre-existing M6 operator hold; never converts it
    # into a resume. A later OPEN needs an explicitly reviewed typed decision.
    if (milestone == "NCR-HTML-PILOT" and isinstance(value, dict)
            and value.get("stateKey") == "m6IntegratedImplementation20261028"
            and value.get("value", {}).get("humanUiOperatorCheckpoint", {}).get("status") == "HELD_BY_OPERATOR"):
        return "HELD"
    raise ValueError("operator decision lacks a recognized outcome/state contract")


@snapshot()
def load_registry(root: Path) -> dict:
    data = strict_json(safe_bytes(root, REGISTRY).decode("utf-8"))
    if not isinstance(data, dict) or set(data) != {"schemaVersion", "outcomes"} or data["schemaVersion"] != SCHEMA:
        raise ValueError("invalid outcome registry")
    if not isinstance(data["outcomes"], dict) or len(data["outcomes"]) > 32:
        raise ValueError("outcomes must be an object")
    authority = strict_json(safe_bytes(root, "docs/milestone-coverage-authority.json").decode("utf-8"))
    for key, row in data["outcomes"].items():
        if (not isinstance(row, dict) or set(row) != {"authority", "anchor", "history", "state", "decision"}
                or key not in authority["milestones"] or row["authority"] != authority["milestones"][key]
                or row["state"] not in ("HELD", "OPEN")
                or not isinstance(row["history"], list) or not 1 <= len(row["history"]) <= 32):
            raise ValueError("invalid enrolled outcome: " + key)
        for ref in [row["anchor"], row["decision"], *row["history"]]:
            pinned(root, ref)
        if (len({ref["path"].casefold() for ref in row["history"]}) != len(row["history"])
                or len({ref["sha256"] for ref in row["history"]}) != len(row["history"])):
            raise ValueError("duplicate history evidence")
        if decision_state(root, row["decision"], key) != row["state"]:
            raise ValueError("registry state contradicts pinned operator decision")
    return data["outcomes"]


def validate_registry_transition(previous: str, current: dict):
    """Compare with Git HEAD, not a worker-supplied predecessor snapshot."""
    if not previous:
        return
    old = strict_json(previous)
    for key, before in old["outcomes"].items():
        after = current.get(key)
        if after is None or after["anchor"] != before["anchor"] or after["authority"] != before["authority"]:
            raise ValueError("enrolled outcome/anchor cannot be erased or replaced")
        if after["history"][:len(before["history"])] != before["history"]:
            raise ValueError("outcome history must retain its committed prefix")


def _timestamp(value):
    if not isinstance(value, str):
        raise ValueError("timestamp must be a UTC string")
    stamp = dt.datetime.fromisoformat(value.replace("Z", "+00:00"))
    if stamp.utcoffset() != dt.timedelta(0):
        raise ValueError("timestamp must be UTC")
    return stamp


def validate_readiness(root, ref, milestone, row, now):
    receipt = strict_json(pinned(root, ref).decode("utf-8"))
    fields = {"schemaVersion", "milestoneId", "source", "observedAt", "expiresAt", "checks", "decision"}
    if (not isinstance(receipt, dict) or set(receipt) != fields
            or receipt["schemaVersion"] != "cvf.operatorPreparationReceipt@1"
            or receipt["milestoneId"] != milestone or receipt["decision"] != row["decision"]):
        raise ValueError("preparation receipt identity mismatch")
    source = strict_json(pinned(root, receipt["source"]).decode("utf-8"))
    if (not isinstance(source, dict) or set(source) != {"schemaVersion", "milestoneId", "sourceCommit", "files"}
            or source["schemaVersion"] != "cvf.operatorRuntimeSource@1" or source["milestoneId"] != milestone
            or not isinstance(source["sourceCommit"], str) or not re.fullmatch(r"[a-f0-9]{40}", source["sourceCommit"])
            or not isinstance(source["files"], list) or not 1 <= len(source["files"]) <= 32):
        raise ValueError("runtime source manifest identity invalid")
    for file_ref in source["files"]:
        pinned(root, file_ref)
    pinned(root, receipt["decision"])
    observed, expires = _timestamp(receipt["observedAt"]), _timestamp(receipt["expiresAt"])
    if not observed <= now < expires or expires - observed > dt.timedelta(minutes=30):
        raise ValueError("preparation receipt stale, future or over 30 minutes")
    checks = receipt["checks"]
    if not isinstance(checks, dict) or set(checks) != CHECKS:
        raise ValueError("preparation receipt lacks required checks")
    for check, result in checks.items():
        if not isinstance(result, dict) or set(result) != {"status", "evidence"} or result["status"] != "PASS":
            raise ValueError("preparation check not passed")
        observation = strict_json(pinned(root, result["evidence"]).decode("utf-8"))
        if (not isinstance(observation, dict)
                or set(observation) != {"schemaVersion", "milestoneId", "check", "source", "status", "observedAt", "evidence"}
                or observation["schemaVersion"] != "cvf.operatorPreparationCheck@1"
                or observation["milestoneId"] != milestone or observation["check"] != check
                or observation["source"] != receipt["source"] or observation["status"] != "PASS"
                or not observed - dt.timedelta(minutes=30) <= _timestamp(observation["observedAt"]) <= observed):
            raise ValueError("preparation check is not joined to outcome/source/check/time")
        pinned(root, observation["evidence"])


@snapshot()
def validate(root: Path, path: str, text: str, blocks: list, *, fences, parse_blocks,
             now=None) -> list[tuple[str, str]]:
    """Forward changed-artifact check, called by SCEC's existing phase gate.

    Source hashes validate identity, not whether an assertion in a receipt is true.
    The reviewer must inspect semantics; no provider/runtime proof is fabricated.
    """
    tagged = [body for tag, body in fences(text) if tag == COVERAGE_TAG]
    bindings = [block.get("outcomeBinding") for block in blocks if "outcomeBinding" in block]
    if not tagged and not bindings and COVERAGE_TAG not in text:
        return []
    try:
        rows = load_registry(root)
        if len(tagged) != 1:
            raise ValueError("outcome binding requires exactly one milestone coverage block")
        coverage = strict_json(tagged[0])
        milestone = coverage["milestone"]["id"]
        if milestone not in rows:
            if bindings:
                raise ValueError("outcome binding names an unenrolled milestone")
            return []
        row = rows[milestone]
        auth = coverage["authority"]
        if {key: auth[key] for key in ("path", "heading")} != row["authority"]:
            raise ValueError("outcome authority mismatch")
        if len(blocks) != 1 or len(bindings) != 1:
            raise ValueError("enrolled outcome requires one SCEC outcomeBinding")
        binding = bindings[0]
        fields = {"milestoneId", "anchor", "history", "operatorAction", "readiness"}
        if not isinstance(binding, dict) or set(binding) != fields:
            raise ValueError("invalid outcomeBinding shape")
        if (binding["milestoneId"] != milestone or binding["anchor"] != row["anchor"]
                or binding["history"] != row["history"]):
            raise ValueError("outcome anchor or accumulated history omitted/replaced")
        # Preserve SCEC as the only chain/counter owner. Every descendant must
        # reach the reviewer-admitted anchor, regardless of the latest error name.
        current, seen = blocks[0], {path}
        for _ in range(64):
            predecessor = current.get("predecessor")
            if not isinstance(predecessor, dict):
                raise ValueError("outcome chain reset: missing admitted predecessor")
            prior_path = predecessor.get("path")
            if prior_path in seen:
                raise ValueError("outcome predecessor cycle")
            raw = safe_bytes(root, prior_path)
            # SCEC predecessor pins deliberately retain its existing raw-byte rule.
            if hashlib.sha256(raw).hexdigest() != predecessor.get("sha256"):
                raise ValueError("outcome predecessor hash drift")
            prior_blocks = parse_blocks(raw.decode("utf-8"))
            if len(prior_blocks) != 1:
                raise ValueError("outcome predecessor must have one SCEC block")
            prior = prior_blocks[0]
            if current.get("problemKey") != prior.get("problemKey"):
                raise ValueError("outcome relabeled under a new problemKey")
            if current.get("chainOrdinal") != prior.get("chainOrdinal", -2) + 1:
                raise ValueError("outcome ordinal reset")
            if prior_path == row["anchor"]["path"]:
                pinned(root, row["anchor"])
                break
            seen.add(prior_path)
            current = prior
        else:
            raise ValueError("outcome chain exceeds 64 ancestors")
        # Multiple different observed blockers require one integrated reassessment.
        if len(row["history"]) >= 2 and blocks[0].get("requiredDisposition") == "CONTINUE_BOUNDED":
            raise ValueError("repeated outcome failure requires integrated root reassessment")
        action = binding["operatorAction"]
        if action not in ("NONE", "REQUEST_AVAILABILITY", "INVITE_ACCEPTANCE"):
            raise ValueError("invalid operator action")
        if action == "NONE":
            if binding["readiness"] is not None:
                raise ValueError("unused readiness receipt")
        else:
            if row["state"] == "HELD":
                raise ValueError("operator-held outcome cannot request waiting or acceptance")
            validate_readiness(root, binding["readiness"], milestone, row,
                               now or dt.datetime.now(dt.timezone.utc))
        return []
    except (OSError, UnicodeError, ValueError, KeyError, TypeError, AttributeError) as exc:
        return [("OUTCOME_LEARNING_BINDING_INVALID", str(exc))]
