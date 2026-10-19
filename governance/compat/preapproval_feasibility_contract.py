#!/usr/bin/env python3
"""Opt-in preapproval feasibility evaluator that reuses the canonical SCEC validator.

Contract owner: docs/reference/preapproval_feasibility/README.md. Declared-state
joins only: no network, no grant write, no effect admission.
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path, PurePosixPath
from typing import Any

COMPAT_DIR = Path(__file__).resolve().parent
REPO_ROOT = COMPAT_DIR.parents[1]
if str(COMPAT_DIR) not in sys.path:
    sys.path.insert(0, str(COMPAT_DIR))

import check_semantic_convergence_control as scec  # noqa: E402
import run_worker_return_fast_gate as worker_return_gate  # noqa: E402

COMPANION_SCHEMA = "cvf.preapprovalFeasibility.v1"
RECEIPT_SCHEMA = "cvf.preapprovalFeasibilityReceipt.v1"
MARKER_LINE = "Preapproval-Feasibility: REQUIRED"
MARKER_PREFIX = "Preapproval-Feasibility:"
COMPANION_PREFIX = "Preapproval-Feasibility-Companion:"
COMPANION_LINE_RE = re.compile(r"^Preapproval-Feasibility-Companion: (\S+)$")
ELIGIBLE_FAMILIES = ("docs/reference/", "docs/baselines/", "docs/work_orders/", "docs/reviews/")
TOP_KEYS = ("schemaVersion", "proposal", "approvalTarget", "prospectiveOutcome", "phasePrerequisites", "requestQueue")
PREREQ_ROW_KEYS = ("requirementId", "requiredForPhase", "evidence", "deferredToPhase")
EVIDENCE_KEYS = ("path", "sha256", "locator")
QUEUE_KEYS = ("rows", "requestCeiling", "promisedFullCoverage", "coverageDisposition")
QUEUE_ROW_KEYS = ("rowId", "kind", "packageName", "discoveryLocator")
FEASIBLE_DISPOSITIONS = ("CONTINUE_BOUNDED", "READY_WITH_EXECUTABLE_PROOF")
HOLD_DISPOSITIONS = ("STOP_REASSESS_ARCHITECTURE", "ROOT_CONTRACT_REQUIRED")
ACTION_SPEC_VERSION = "NCR_PREFEAS_ROOT_BUILD_ACTION_V1"
ACTION_KEY = "requestedAction"
ACTION_KEYS = ("kind", "runtimeReadinessClaim")
ROOT_BUILD_KIND = "INTEGRATED_ROOT_CONTRACT_BUILD"
ROOT_BUILD_PHASE = "PRE_DISPATCH_INTEGRATED_ROOT_CONTRACT_BUILD"
ROOT_BUILD_DISPOSITION = "FEASIBLE_FOR_INTEGRATED_ROOT_BUILD"
ROOT_BUILD_ROW_IDS = ("ROOT_BUILD_BASELINE", "ROOT_BUILD_SCOPE")
ROOT_BUILD_BASELINE_DIR = "docs/baselines"
ROOT_BUILD_BASELINE_PREFIX = "CVF_GC018_"
PACKAGE_NAME_RE = re.compile(r"^(?:@[A-Za-z0-9][A-Za-z0-9._~-]*/)?[A-Za-z0-9][A-Za-z0-9._~-]*$")


def diag(code: str, message: str) -> dict[str, str]:
    return {"code": code, "message": message}


def is_eligible_proposal_path(path: str) -> bool:
    return (
        isinstance(path, str)
        and path.endswith(".md")
        and path.startswith(ELIGIBLE_FAMILIES)
        and "/archive/" not in path
        and scec._is_safe_repo_relative_path(path)
    )


class Snapshot:
    """One byte snapshot per repository-relative path for a single evaluation."""

    def __init__(self, root: Path | str) -> None:
        self.root = Path(root).resolve()
        self._cache: dict[str, bytes | None] = {}

    def read(self, path: Any) -> bytes | None:
        if not isinstance(path, str) or not scec._is_safe_repo_relative_path(path):
            return None
        if path not in self._cache:
            self._cache[path] = self._load(path)
        return self._cache[path]

    def _load(self, path: str) -> bytes | None:
        try:
            full = (self.root / PurePosixPath(path)).resolve()
            full.relative_to(self.root)
            return full.read_bytes() if full.is_file() else None
        except (OSError, ValueError, RuntimeError):
            return None

    def sha256(self, path: Any) -> str | None:
        data = self.read(path)
        return None if data is None else hashlib.sha256(data).hexdigest()

    def text(self, path: Any) -> str | None:
        data = self.read(path)
        if data is None:
            return None
        try:
            return data.decode("utf-8")
        except UnicodeDecodeError:
            return None

    def blocks(self, path: Any) -> tuple[dict, ...] | None:
        text = self.text(path)
        return None if text is None else tuple(scec.find_active_blocks(text))


def _reject_duplicate_keys(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            raise ValueError(f"duplicate JSON key {key!r}")
        result[key] = value
    return result


def _reject_constant(name: str) -> Any:
    raise ValueError(f"non-finite JSON constant {name}")


def load_strict_json(data: bytes) -> Any:
    return json.loads(data.decode("utf-8"), object_pairs_hook=_reject_duplicate_keys, parse_constant=_reject_constant)


def outcome_digest(outcome: Any) -> str:
    canonical = json.dumps(outcome, sort_keys=True, ensure_ascii=True, separators=(",", ":"))
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def _unfenced_lines(text: str):
    """Yield standalone lines outside fenced blocks; fence delimiters are never yielded."""
    in_fence, width = False, 0
    for raw in text.split("\n"):
        line = raw.rstrip("\r")
        if in_fence:
            closing = scec.CLOSE_FENCE_LINE_RE.match(line)
            if closing and len(closing.group(1)) >= width:
                in_fence = False
            continue
        opening = scec.OPEN_FENCE_LINE_RE.match(line)
        if opening:
            in_fence, width = True, len(opening.group(1))
            continue
        yield line


def parse_declarations(text: str) -> tuple[str, str | None, list[dict[str, str]]]:
    """Return (UNMARKED|MARKED|MALFORMED, companion path, diagnostics).

    Only standalone lines outside fenced blocks count; inline or fenced examples
    never activate and substring matches are never used as triggers.
    """
    markers: list[str] = []
    companions: list[str] = []
    for line in _unfenced_lines(text):
        if line.startswith(COMPANION_PREFIX):
            companions.append(line)
        elif line.startswith(MARKER_PREFIX):
            markers.append(line)
    if not markers and not companions:
        return "UNMARKED", None, []
    diags: list[dict[str, str]] = []
    if not markers:
        diags.append(diag("MARKER_MISSING", "companion declaration present without the REQUIRED marker line"))
    elif len(markers) > 1:
        diags.append(diag("MARKER_DUPLICATE", f"exactly one marker line is required; found {len(markers)}"))
    elif markers[0] != MARKER_LINE:
        diags.append(diag("MARKER_MALFORMED", f"marker line must be exactly `{MARKER_LINE}`"))
    companion_path = None
    if not companions:
        diags.append(diag("COMPANION_MISSING", "marked proposal has no companion declaration line"))
    elif len(companions) > 1:
        diags.append(diag("COMPANION_DUPLICATE", f"exactly one companion line is required; found {len(companions)}"))
    else:
        match = COMPANION_LINE_RE.match(companions[0])
        candidate = match.group(1) if match else None
        if candidate is None or not candidate.endswith(".json") or not scec._is_safe_repo_relative_path(candidate):
            diags.append(diag("COMPANION_PATH_INVALID", "companion line needs one safe repository-relative .json path"))
        else:
            companion_path = candidate
    return ("MALFORMED" if diags else "MARKED"), companion_path, diags


def new_receipt(proposal_path: Any) -> dict[str, Any]:
    return {
        "schemaVersion": RECEIPT_SCHEMA,
        "proposal": {"path": proposal_path if isinstance(proposal_path, str) else None, "sha256": None},
        "companion": {"path": None, "sha256": None},
        "approvalTarget": {"path": None, "sha256": None},
        "prospectiveOutcomeSha256": None,
        "canonicalBlockCount": 0,
        "canonicalViolations": [],
        "prerequisites": {"examined": 0, "deferred": 0},
        "queue": None,
        "technicalDisposition": "INVALID",
        "coverageDisposition": "NOT_APPLICABLE",
        "operatorApprovalRequired": True,
        "effectAdmission": False,
        "diagnostics": [],
    }


def _exact_keys(obj: Any, keys: tuple[str, ...], label: str, code: str, diags: list) -> bool:
    if not isinstance(obj, dict):
        diags.append(diag(code, f"{label} must be an object"))
        return False
    missing = [key for key in keys if key not in obj]
    extra = sorted(key for key in obj if key not in keys)
    if missing or extra:
        diags.append(diag(code, f"{label} requires exactly {list(keys)}; missing {missing}, unknown {extra}"))
        return False
    return True


def _nonempty_str(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def _check_bindings(comp: dict, proposal_path: str, proposal_sha: str, receipt: dict, diags: list) -> None:
    proposal, target = comp.get("proposal"), comp.get("approvalTarget")
    ok_p = _exact_keys(proposal, ("path", "sha256"), "proposal", "BINDING_SHAPE", diags)
    ok_t = _exact_keys(target, ("path", "sha256", "prospectiveOutcomeSha256"), "approvalTarget", "BINDING_SHAPE", diags)
    if ok_p:
        if proposal["path"] != proposal_path:
            diags.append(diag("PROPOSAL_PATH_MISMATCH", "companion proposal.path is not the evaluated proposal"))
        if proposal["sha256"] != proposal_sha:
            diags.append(diag("PROPOSAL_HASH_DRIFT", "companion proposal.sha256 does not match the current proposal bytes"))
    if ok_t:
        receipt["approvalTarget"]["path"] = target["path"] if isinstance(target["path"], str) else None
        if ok_p and target["path"] != proposal["path"]:
            diags.append(diag("TARGET_PATH_MISMATCH", "approvalTarget.path must equal proposal.path in v1"))
        if target["sha256"] != proposal_sha:
            diags.append(diag("TARGET_HASH_DRIFT", "approvalTarget.sha256 does not match the current proposal bytes"))
        if target["sha256"] == proposal_sha:
            receipt["approvalTarget"]["sha256"] = proposal_sha
        digest = outcome_digest(comp.get("prospectiveOutcome"))
        receipt["prospectiveOutcomeSha256"] = digest
        if target["prospectiveOutcomeSha256"] != digest:
            diags.append(diag("OUTCOME_DIGEST_DRIFT", "approvalTarget.prospectiveOutcomeSha256 does not match prospectiveOutcome"))


def _check_outcome(outcome: Any, snap: Snapshot, receipt: dict, diags: list) -> str | None:
    if not scec.is_active_block(outcome):
        diags.append(diag("OUTCOME_NOT_ACTIVE_SCEC", f"prospectiveOutcome must be one active {scec.SCEC_SCHEMA_VERSION} object"))
        return None
    receipt["canonicalBlockCount"] = 1
    result = scec.validate_block(
        outcome,
        predecessor_hash_resolver=snap.sha256,
        predecessor_block_resolver=snap.blocks,
        evidence_bytes_resolver=snap.read,
    )
    receipt["canonicalViolations"] = [diag(v.code, v.message) for v in result.violations]
    disposition = outcome.get("requiredDisposition")
    return disposition if isinstance(disposition, str) else None


def _check_required_row(row: dict, label: str, snap: Snapshot, diags: list) -> None:
    if row["deferredToPhase"] is not None:
        diags.append(diag("PREREQ_REQUIRED_HAS_DEFERRAL", f"{label} is required for the phase and must not carry deferredToPhase"))
    evidence = row["evidence"]
    if not _exact_keys(evidence, EVIDENCE_KEYS, f"{label}.evidence", "PREREQ_EVIDENCE_SHAPE", diags):
        return
    path, sha, locator = evidence["path"], evidence["sha256"], evidence["locator"]
    data = snap.read(path)
    if data is None:
        diags.append(diag("PREREQ_EVIDENCE_UNREADABLE", f"{label} evidence path is unsafe, missing or unreadable"))
        return
    if not isinstance(sha, str) or not scec.SHA256_RE.match(sha) or hashlib.sha256(data).hexdigest() != sha:
        diags.append(diag("PREREQ_EVIDENCE_HASH_MISMATCH", f"{label} evidence sha256 does not match the current bytes"))
        return
    text = snap.text(path)
    if text is None:
        diags.append(diag("PREREQ_EVIDENCE_NOT_UTF8", f"{label} evidence is not strict UTF-8"))
    elif not _nonempty_str(locator) or locator not in text:
        diags.append(diag("PREREQ_LOCATOR_NOT_FOUND", f"{label} locator does not occur in the hash-bound evidence"))


def check_prerequisites(block: Any, snap: Snapshot, diags: list) -> tuple[int, int]:
    if not _exact_keys(block, ("phase", "rows"), "phasePrerequisites", "PREREQ_SHAPE", diags):
        return 0, 0
    phase, rows = block["phase"], block["rows"]
    if not _nonempty_str(phase):
        diags.append(diag("PREREQ_PHASE_INVALID", "phasePrerequisites.phase must be a nonempty string"))
    if not isinstance(rows, list):
        diags.append(diag("PREREQ_SHAPE", "phasePrerequisites.rows must be an array"))
        return 0, 0
    examined = deferred = 0
    seen: set[str] = set()
    for index, row in enumerate(rows):
        label = f"phasePrerequisites.rows[{index}]"
        if not _exact_keys(row, PREREQ_ROW_KEYS, label, "PREREQ_ROW_SHAPE", diags):
            continue
        rid = row["requirementId"]
        if not _nonempty_str(rid):
            diags.append(diag("PREREQ_ID_INVALID", f"{label}.requirementId must be a nonempty string"))
        elif rid in seen:
            diags.append(diag("PREREQ_ID_DUPLICATE", f"{label}.requirementId `{rid}` is duplicated"))
        else:
            seen.add(rid)
        required = row["requiredForPhase"]
        if not isinstance(required, bool):
            diags.append(diag("PREREQ_REQUIRED_FLAG_INVALID", f"{label}.requiredForPhase must be a boolean"))
        elif required:
            examined += 1
            _check_required_row(row, label, snap, diags)
        else:
            deferred += 1
            target_phase = row["deferredToPhase"]
            if row["evidence"] is not None:
                diags.append(diag("PREREQ_DEFERRED_HAS_EVIDENCE", f"{label} is deferred and must carry evidence: null"))
            if not _nonempty_str(target_phase) or target_phase == phase:
                diags.append(diag("PREREQ_DEFERRAL_INVALID", f"{label} needs a nonempty deferredToPhase different from the current phase"))
    return examined, deferred


def valid_package_identity(name: Any) -> bool:
    return isinstance(name, str) and PACKAGE_NAME_RE.fullmatch(name) is not None


def check_queue(queue: Any, diags: list) -> tuple[dict[str, int] | None, str]:
    if not _exact_keys(queue, QUEUE_KEYS, "requestQueue", "QUEUE_SHAPE", diags):
        return None, "NOT_APPLICABLE"
    rows, ceiling = queue["rows"], queue["requestCeiling"]
    promised, declared = queue["promisedFullCoverage"], queue["coverageDisposition"]
    ok = True
    if not isinstance(rows, list):
        diags.append(diag("QUEUE_SHAPE", "requestQueue.rows must be an array"))
        return None, "NOT_APPLICABLE"
    if not isinstance(ceiling, int) or isinstance(ceiling, bool) or ceiling < 0:
        diags.append(diag("QUEUE_CEILING_INVALID", "requestCeiling must be a nonnegative integer"))
        ok = False
    if not isinstance(promised, bool):
        diags.append(diag("QUEUE_PROMISE_INVALID", "promisedFullCoverage must be a boolean"))
        ok = False
    if declared not in ("COMPLETE", "PARTIAL"):
        diags.append(diag("QUEUE_COVERAGE_INVALID", "coverageDisposition must be COMPLETE or PARTIAL"))
        ok = False
    exact = discovery = 0
    seen: set[str] = set()
    for index, row in enumerate(rows):
        label = f"requestQueue.rows[{index}]"
        if not _exact_keys(row, QUEUE_ROW_KEYS, label, "QUEUE_ROW_SHAPE", diags):
            continue
        if not _nonempty_str(row["rowId"]):
            diags.append(diag("QUEUE_ROW_ID_INVALID", f"{label}.rowId must be a nonempty string"))
        elif row["rowId"] in seen:
            diags.append(diag("QUEUE_ROW_ID_DUPLICATE", f"{label}.rowId `{row['rowId']}` is duplicated"))
        else:
            seen.add(row["rowId"])
        kind = row["kind"]
        if kind == "EXACT_NPM_METADATA":
            exact += 1
            if not valid_package_identity(row["packageName"]) or row["discoveryLocator"] is not None:
                diags.append(diag("QUEUE_EXACT_IDENTITY_INVALID", f"{label} needs one publisher identity (name or @scope/name) and discoveryLocator null"))
        elif kind == "DISCOVERY":
            discovery += 1
            if row["packageName"] is not None or not _nonempty_str(row["discoveryLocator"]):
                diags.append(diag("QUEUE_DISCOVERY_INVALID", f"{label} needs packageName null and a nonempty discoveryLocator"))
        else:
            diags.append(diag("QUEUE_KIND_INVALID", f"{label}.kind must be EXACT_NPM_METADATA or DISCOVERY"))
    total = len(rows)
    cap = ceiling if isinstance(ceiling, int) and not isinstance(ceiling, bool) else None
    summary = {"exact": exact, "discovery": discovery, "total": total, "cap": cap, "unrequested": 0}
    if not ok:
        return summary, "NOT_APPLICABLE"
    computed = "COMPLETE" if total <= ceiling else "PARTIAL"
    summary["unrequested"] = max(0, total - ceiling)
    if declared != computed:
        diags.append(diag("QUEUE_COVERAGE_FALSE", f"declared coverage {declared} but {total} potential requests against ceiling {ceiling} is {computed}"))
    if computed == "PARTIAL" and promised:
        diags.append(diag("QUEUE_FULL_COVERAGE_PROMISED", "an over-ceiling queue must not promise full coverage"))
    return summary, computed


def _check_action(action: Any, comp: dict, proposal_path: str, text: str, diags: list) -> None:
    """Static validity of the optional requestedAction; it never grants anything."""
    if not _exact_keys(action, ACTION_KEYS, ACTION_KEY, "ACTION_SHAPE", diags):
        return
    if action["kind"] != ROOT_BUILD_KIND:
        diags.append(diag("ACTION_KIND_INVALID", f"requestedAction.kind must be exactly {ROOT_BUILD_KIND}"))
    if action["runtimeReadinessClaim"] is not False:
        diags.append(diag("ACTION_READINESS_CLAIM_INVALID", "requestedAction.runtimeReadinessClaim must be the boolean false"))
    block = comp["phasePrerequisites"]
    if not isinstance(block, dict) or block.get("phase") != ROOT_BUILD_PHASE:
        diags.append(diag("ACTION_PHASE_MISMATCH", f"requestedAction requires phasePrerequisites.phase {ROOT_BUILD_PHASE}"))
    doc_types = [line.rstrip(" \t") for line in _unfenced_lines(text) if line.startswith("docType:")]
    if not proposal_path.startswith("docs/work_orders/") or doc_types != ["docType: work_order"]:
        diags.append(diag("ACTION_PROPOSAL_NOT_WORK_ORDER", "requestedAction needs a docs/work_orders proposal with one standalone docType: work_order"))


def _is_root_build_baseline_path(path: Any) -> bool:
    if not isinstance(path, str) or not path.endswith(".md") or not scec._is_safe_repo_relative_path(path):
        return False
    posix = PurePosixPath(path)
    return posix.as_posix() == path and path.startswith(ROOT_BUILD_BASELINE_DIR + "/") and posix.name.startswith(ROOT_BUILD_BASELINE_PREFIX)


def _check_root_build_rows(block: dict, diags: list) -> None:
    """Join structure of the two root-build rows; hash/locator were verified by check_prerequisites."""
    paths = []
    for rid in ROOT_BUILD_ROW_IDS:
        rows = [r for r in block["rows"] if r["requirementId"] == rid]
        if len(rows) != 1:
            diags.append(diag("ROOT_BUILD_ROW_MISSING", f"exactly one `{rid}` prerequisite row is required; found {len(rows)}"))
        elif rows[0]["requiredForPhase"] is not True or rows[0]["deferredToPhase"] is not None:
            diags.append(diag("ROOT_BUILD_ROW_NOT_REQUIRED", f"`{rid}` must be requiredForPhase=true with deferredToPhase null"))
        else:
            paths.append(rows[0]["evidence"]["path"])
    if len(paths) == len(ROOT_BUILD_ROW_IDS) and (paths[0] != paths[1] or not _is_root_build_baseline_path(paths[0])):
        diags.append(diag("ROOT_BUILD_BASELINE_PATH_INVALID", f"both root-build rows need one normalized {ROOT_BUILD_BASELINE_DIR}/{ROOT_BUILD_BASELINE_PREFIX}*.md path"))


def _check_worker_return_route(proposal_path: str, text: str, snap: Snapshot, diags: list) -> bool:
    """Compose the production return runner's bound commands on the snapshotted bytes."""
    try:
        # No gate, test or candidate code is executed; construction only.
        commands = worker_return_gate.build_commands(
            (), proposal_path, repo_root=snap.root, work_order_text=text,
        )
        return_path = worker_return_gate._worker_return_path(
            proposal_path, repo_root=snap.root, work_order_text=text,
        )
        required_bindings = {
            "work-order acceptance ledger": (("--work-order", proposal_path), ("--return", return_path)),
            "worker-return quality gate": (("--active-work-order", proposal_path),),
            "independent review probe admission": (("--active-work-order", proposal_path),),
        }
        for label, pairs in required_bindings.items():
            matching = [c.command for c in commands if c.name == label]
            if len(matching) != 1 or not all(
                any(tuple(matching[0][i:i + 2]) == pair for i in range(len(matching[0]) - 1))
                for pair in pairs
            ):
                raise ValueError(f"{label} lacks the exact work-order/return binding")
    except (OSError, ValueError, RuntimeError) as exc:
        diags.append(diag("WORKER_RETURN_ROUTE_UNBUILDABLE", f"bound worker-return command construction failed: {exc}"))
        return False
    return True


def _resolve_root_build(comp: dict, disposition: str | None, proposal_path: str, text: str, snap: Snapshot, receipt: dict) -> bool:
    """Resolve a statically valid requestedAction after canonical and prerequisite checks passed."""
    diags = receipt["diagnostics"]
    if disposition != "ROOT_CONTRACT_REQUIRED" or comp["prospectiveOutcome"].get("successorScope") != "INTEGRATED_ROOT_CONTRACT":
        diags.append(diag("ACTION_DISPOSITION_MISMATCH", "requestedAction qualifies only ROOT_CONTRACT_REQUIRED with successorScope INTEGRATED_ROOT_CONTRACT"))
        return False
    _check_root_build_rows(comp["phasePrerequisites"], diags)
    if not diags:
        _check_worker_return_route(proposal_path, text, snap, diags)
    if diags:
        return False
    receipt["technicalDisposition"] = ROOT_BUILD_DISPOSITION
    receipt["runtimeReadiness"] = False
    return True


def evaluate(root: Path | str, proposal_path: Any, approval_target: Any = None, *, explicit: bool = True) -> dict[str, Any]:
    """Evaluate one proposal; every call re-reads and re-validates all bytes."""
    receipt = new_receipt(proposal_path)
    diags: list[dict[str, str]] = receipt["diagnostics"]
    snap = Snapshot(root)

    def finish() -> dict[str, Any]:
        receipt["technicalDisposition"] = "INVALID"
        return receipt

    if not is_eligible_proposal_path(proposal_path):
        diags.append(diag("PROPOSAL_NOT_ELIGIBLE", "proposal must be a safe non-archive Markdown path in docs/reference, baselines, work_orders or reviews"))
        return finish()
    if explicit and approval_target != proposal_path:
        diags.append(diag("APPROVAL_TARGET_MISMATCH", "explicit mode requires --approval-target equal to the proposal path"))
        return finish()
    data = snap.read(proposal_path)
    text = snap.text(proposal_path)
    if data is None:
        diags.append(diag("PROPOSAL_UNREADABLE", "proposal is missing, unsafe or unreadable"))
        return finish()
    receipt["proposal"]["sha256"] = hashlib.sha256(data).hexdigest()
    if text is None:
        diags.append(diag("PROPOSAL_NOT_UTF8", "proposal is not strict UTF-8"))
        return finish()
    state, companion_path, declaration_diags = parse_declarations(text)
    if state == "UNMARKED" and not explicit:
        receipt["technicalDisposition"] = "NOT_APPLICABLE"
        return receipt
    if state == "UNMARKED":
        diags.append(diag("PROPOSAL_UNMARKED", "explicit caller requires a marked proposal; zero objects is never feasibility"))
        return finish()
    diags.extend(declaration_diags)
    if companion_path is None:
        return finish()
    receipt["companion"]["path"] = companion_path
    raw = snap.read(companion_path)
    if raw is None:
        diags.append(diag("COMPANION_UNREADABLE", "companion is missing, unsafe or unreadable"))
        return finish()
    receipt["companion"]["sha256"] = hashlib.sha256(raw).hexdigest()
    try:
        comp = load_strict_json(raw)
    except (UnicodeDecodeError, ValueError) as exc:
        diags.append(diag("COMPANION_MALFORMED_JSON", f"companion is not strict UTF-8 JSON without duplicate keys: {exc}"))
        return finish()
    declared = isinstance(comp, dict) and ACTION_KEY in comp
    if not _exact_keys(comp, TOP_KEYS + ((ACTION_KEY,) if declared else ()), "companion", "COMPANION_SHAPE", diags):
        return finish()
    if comp["schemaVersion"] != COMPANION_SCHEMA:
        diags.append(diag("COMPANION_SCHEMA_INVALID", f"schemaVersion must be {COMPANION_SCHEMA}"))
    _check_bindings(comp, proposal_path, receipt["proposal"]["sha256"], receipt, diags)
    disposition = _check_outcome(comp["prospectiveOutcome"], snap, receipt, diags)
    receipt["prerequisites"]["examined"], receipt["prerequisites"]["deferred"] = check_prerequisites(comp["phasePrerequisites"], snap, diags)
    if comp["requestQueue"] is not None:
        receipt["queue"], receipt["coverageDisposition"] = check_queue(comp["requestQueue"], diags)
    if declared:
        _check_action(comp[ACTION_KEY], comp, proposal_path, text, diags)
    if diags or receipt["canonicalViolations"] or receipt["canonicalBlockCount"] != 1:
        return finish()
    if declared and disposition != "STOP_REASSESS_ARCHITECTURE":
        return receipt if _resolve_root_build(comp, disposition, proposal_path, text, snap, receipt) else finish()
    if disposition in FEASIBLE_DISPOSITIONS:
        if proposal_path.startswith("docs/work_orders/") and not _check_worker_return_route(proposal_path, text, snap, diags):
            return finish()
        receipt["technicalDisposition"] = "FEASIBLE"
    elif disposition in HOLD_DISPOSITIONS:
        receipt["technicalDisposition"] = "HOLD"
    else:
        diags.append(diag("OUTCOME_DISPOSITION_UNKNOWN", "requiredDisposition is not a known canonical disposition"))
        return finish()
    return receipt
