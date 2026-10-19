#!/usr/bin/env python3
"""Local-only convergence envelope support for dispatch packet scaffolds."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

# NCR_REVIEW_CONTINUATION_V1: optional operator-cleared same-scope continuation.
# Declaration-only validation: it never proves operator consent or actual effects.
GRANT_SCHEMA = "cvf.reviewDispatchContinuationAuthorization@1.0.0"
GRANT_FENCE = "operator-continuation-authorization-json"
SCOPE_FENCE = "continuation-scope-json"
PATH_FIELD = "operatorContinuationEvidencePath"
SHA_FIELD = "operatorContinuationEvidenceSha256"
GRANT_MAX_BYTES = 65536
GRANT_KEYS = ("schemaVersion", "decisionOwner", "operatorInstructionEvidence", "status", "expiresAtUtc", "validityDisposition", "binding", "scope")
BINDING_KEYS = ("parentAssignmentId", "rootCauseClusterId", "reviewRoundCount", "reworkGeneration", "priorFindingSetDigest", "dispatchSurface", "commitMode")
SCOPE_KEYS = ("objectiveId", "acceptanceItems", "allowedArtifacts", "riskCeiling", "effectCeilings", "numericalCeilings", "commitOwner")
EFFECT_KEYS = ("providerCalls", "networkCalls", "publicWrites", "deployments", "realDataMutations", "destructiveActions", "productRuntimeStarts")
SURFACES = ("INTERNAL_AGENT", "EXTERNAL_AGENT_CLI_MCP")
_PLACEHOLDER_RE = re.compile(r"(?i)\b(?:TODO|TBD|FILL_ME|TO_FILL)\b|^\s*(?:N/A|NONE|UNKNOWN|NOT_APPLICABLE\w*)\s*$")
_UTC_RE = re.compile(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3}(?:\d{3})?)?(?:Z|\+00:00)")
_DIGEST_RE = re.compile(r"[0-9a-f]{64}")


def add_arguments(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--dispatch-kind", choices=("INITIAL", "REWORK"), default="INITIAL")
    parser.add_argument(
        "--dispatch-surface",
        choices=("INTERNAL_AGENT", "EXTERNAL_AGENT_CLI_MCP"),
        default="INTERNAL_AGENT",
    )
    parser.add_argument("--review-round-count", type=int, default=0)
    parser.add_argument("--root-cause-cluster-id", default="NOT_APPLICABLE_INITIAL_DISPATCH")
    parser.add_argument("--prior-finding-set-digest", default="NOT_APPLICABLE_INITIAL_DISPATCH")
    parser.add_argument("--cumulative-external-invocation-count", type=int, default=0)
    parser.add_argument("--external-invocation-ceiling", type=int, default=0)
    parser.add_argument("--new-independent-critical-evidence", default="NONE")
    parser.add_argument("--operator-continuation-evidence-path", default=None)
    parser.add_argument("--operator-continuation-evidence-sha256", default=None)


def _no_dupes(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    out: dict[str, Any] = {}
    for key, value in pairs:
        if key in out:
            raise ValueError(f"duplicate JSON key {key!r}")
        out[key] = value
    return out


def _no_constant(name: str) -> Any:
    raise ValueError(f"non-finite JSON constant {name}")


def strict_json(text: str) -> Any:
    """Parse JSON rejecting duplicate members at every depth and NaN/Infinity."""
    return json.loads(text, object_pairs_hook=_no_dupes, parse_constant=_no_constant)


def same(left: Any, right: Any) -> bool:
    """Structural equality that never conflates bool/int/float/str."""
    if type(left) is not type(right):
        return False
    if isinstance(left, dict):
        return set(left) == set(right) and all(same(left[key], right[key]) for key in left)
    if isinstance(left, list):
        return len(left) == len(right) and all(same(a, b) for a, b in zip(left, right))
    return left == right


def _count(value: Any) -> bool:
    return type(value) is int and value >= 0


def _text(value: Any, minimum: int = 1) -> bool:
    return isinstance(value, str) and len(value.strip()) >= minimum and not _PLACEHOLDER_RE.search(value)


def safe_path(raw: Any) -> bool:
    """Normalized repo-relative forward-slash path: no absolute/drive/dot/traversal forms."""
    if not isinstance(raw, str) or not raw or raw != raw.strip() or raw.startswith("/"):
        return False
    if re.search(r"[\\:\x00-\x1f]", raw):
        return False
    return all(part not in ("", ".", "..") and part == part.rstrip(" .") for part in raw.split("/"))


def read_bounded(root: Path, rel: str, limit: int = GRANT_MAX_BYTES) -> tuple[bytes | None, str]:
    """Read one contained regular file without symlinks, never more than limit bytes."""
    cur = Path(root).resolve()
    for part in rel.split("/"):
        cur = cur / part
        if cur.is_symlink():
            return None, "symlink path component"
    if not cur.is_file() or os.path.normcase(os.path.realpath(cur)) != os.path.normcase(str(cur)):
        return None, "missing, non-file or re-resolved path"
    try:
        with cur.open("rb") as handle:
            data = handle.read(limit + 1)
    except OSError as exc:
        return None, f"unreadable ({exc.__class__.__name__})"
    return (None, f"exceeds {limit} bytes") if len(data) > limit else (data, "")


def _fence_re(tag: str) -> re.Pattern[str]:
    return re.compile(rf"(?ms)^```{tag}[ \t]*\r?\n(.*?)^```[ \t]*\r?$")


def _opens(text: str, tag: str) -> int:
    return len(re.findall(rf"(?m)^[ \t]{{0,3}}(?:`{{3,}}|~{{3,}})[ \t]*{tag}\b", text))


def field_lines(text: str, name: str) -> list[str]:
    pattern = rf"(?m)^[ \t]*(?:[-*][ \t]+)?`?{re.escape(name)}`?:[ \t]*(.*)$"
    return [value.strip().rstrip("|").strip(" `") for value in re.findall(pattern, text)]


def scope_issues(scope: Any) -> list[str]:
    if not isinstance(scope, dict) or set(scope) != set(SCOPE_KEYS):
        return ["scope must contain exactly " + ", ".join(SCOPE_KEYS)]
    issues: list[str] = []
    if not _text(scope["objectiveId"]):
        issues.append("scope.objectiveId must be a non-placeholder string")
    items = scope["acceptanceItems"]
    if not isinstance(items, list) or not items or not all(_text(item) for item in items) or len(set(items)) != len(items):
        issues.append("scope.acceptanceItems must be a nonempty unique list of nonempty IDs")
    artifacts = scope["allowedArtifacts"]
    if not isinstance(artifacts, list) or not artifacts or not all(safe_path(item) for item in artifacts) or len(set(artifacts)) != len(artifacts):
        issues.append("scope.allowedArtifacts must be a nonempty unique list of safe repo paths")
    if scope["riskCeiling"] != "SAME_AS_AUTHORIZED_PARENT":
        issues.append("scope.riskCeiling must be SAME_AS_AUTHORIZED_PARENT")
    if scope["commitOwner"] != "reviewer-closer":
        issues.append("scope.commitOwner must be reviewer-closer")
    effects = scope["effectCeilings"]
    if not isinstance(effects, dict) or set(effects) != set(EFFECT_KEYS) or not all(_count(v) for v in effects.values()):
        issues.append("scope.effectCeilings must contain exactly " + ", ".join(EFFECT_KEYS) + " as nonnegative integers")
    caps = scope["numericalCeilings"]
    if not isinstance(caps, dict) or not caps or not all(isinstance(k, str) and k and _count(v) for k, v in caps.items()):
        issues.append("scope.numericalCeilings must be a nonempty map of nonnegative integer caps")
    elif not all(type(caps.get(key)) is int and caps[key] > 0 for key in ("workerMinutes", "reviewerMinutes")):
        issues.append("scope.numericalCeilings requires positive workerMinutes and reviewerMinutes")
    return issues


def binding_issues(binding: Any, target: dict[str, Any] | None) -> list[str]:
    if not isinstance(binding, dict) or set(binding) != set(BINDING_KEYS):
        return ["binding must contain exactly " + ", ".join(BINDING_KEYS)]
    issues: list[str] = []
    for key in ("parentAssignmentId", "rootCauseClusterId"):
        if not _text(binding[key]) or binding[key].startswith("NOT_APPLICABLE"):
            issues.append(f"binding.{key} must be a stable non-placeholder string")
    for key in ("reviewRoundCount", "reworkGeneration"):
        if not _count(binding[key]):
            issues.append(f"binding.{key} must be a strict nonnegative integer")
    if not isinstance(binding["priorFindingSetDigest"], str) or not _DIGEST_RE.fullmatch(binding["priorFindingSetDigest"]):
        issues.append("binding.priorFindingSetDigest must be a lowercase SHA-256")
    if binding["dispatchSurface"] not in SURFACES:
        issues.append("binding.dispatchSurface must be INTERNAL_AGENT or EXTERNAL_AGENT_CLI_MCP")
    if binding["commitMode"] != "WORKER_MUST_NOT_COMMIT":
        issues.append("binding.commitMode must be WORKER_MUST_NOT_COMMIT")
    if target is not None:
        issues.extend(f"binding.{key} does not equal the work-order value" for key in BINDING_KEYS if not same(binding[key], target.get(key)))
    return issues


def ceiling_issues(grant: dict[str, Any], target: dict[str, Any]) -> list[str]:
    caps = grant["scope"]["numericalCeilings"]
    if "externalInvocationCeiling" in caps:
        if not same(caps["externalInvocationCeiling"], target.get("externalInvocationCeiling")):
            return ["scope.numericalCeilings.externalInvocationCeiling must equal the work-order ceiling"]
    elif grant["binding"]["dispatchSurface"] == "EXTERNAL_AGENT_CLI_MCP":
        return ["scope.numericalCeilings.externalInvocationCeiling is required for EXTERNAL_AGENT_CLI_MCP"]
    return []


def _expiry_issues(disposition: Any, expires: Any, now: datetime | None) -> list[str]:
    if disposition == "UNTIL_REVOKED_OR_SCOPE_CHANGE":
        return [] if expires is None else ["UNTIL_REVOKED_OR_SCOPE_CHANGE requires expiresAtUtc null"]
    if disposition != "UNTIL_UTC_EXPIRY":
        return ["validityDisposition must be UNTIL_UTC_EXPIRY or UNTIL_REVOKED_OR_SCOPE_CHANGE"]
    if not isinstance(expires, str) or not _UTC_RE.fullmatch(expires):
        return ["UNTIL_UTC_EXPIRY requires a timezone-aware UTC expiresAtUtc"]
    try:
        when = datetime.fromisoformat(expires.replace("Z", "+00:00"))
    except ValueError:
        return ["expiresAtUtc is not a valid timestamp"]
    return [] if when > (now or datetime.now(timezone.utc)) else ["operator continuation grant is expired"]


def grant_issues(grant: Any, now: datetime | None = None) -> list[str]:
    if not isinstance(grant, dict) or set(grant) != set(GRANT_KEYS):
        return ["grant must contain exactly " + ", ".join(GRANT_KEYS)]
    issues: list[str] = []
    for key, expected in (("schemaVersion", GRANT_SCHEMA), ("decisionOwner", "OPERATOR"), ("status", "ACTIVE")):
        if grant[key] != expected:
            issues.append(f"grant {key} must be {expected}")
    if not _text(grant["operatorInstructionEvidence"], 24):
        issues.append("operatorInstructionEvidence must be a concrete instruction reference of at least 24 characters")
    return issues + _expiry_issues(grant["validityDisposition"], grant["expiresAtUtc"], now) + binding_issues(grant["binding"], None) + scope_issues(grant["scope"])


def load_grant(root: Path, path: Any, sha: Any, now: datetime | None = None) -> tuple[dict[str, Any] | None, list[str]]:
    """Load one bounded Markdown grant source; returns (grant, issues), grant only when fully valid."""
    if not isinstance(sha, str) or not _DIGEST_RE.fullmatch(sha):
        return None, ["operator continuation sha256 must be a lowercase 64-hex digest"]
    parts = path.split("/") if isinstance(path, str) else []
    if not (safe_path(path) and path.endswith(".md") and path.startswith(("docs/baselines/", "docs/reviews/"))
            and not re.search(r"\s", path) and "archive" not in (part.lower() for part in parts)):
        return None, ["operator continuation path must be a safe non-archive docs/baselines or docs/reviews Markdown path"]
    data, error = read_bounded(root, path)
    if data is None:
        return None, [f"operator continuation source rejected: {error}"]
    if hashlib.sha256(data).hexdigest() != sha:
        return None, ["operator continuation source raw sha256 mismatch"]
    try:
        text = data.decode("utf-8")
        blocks = _fence_re(GRANT_FENCE).findall(text)
        if _opens(text, GRANT_FENCE) != 1 or len(blocks) != 1:
            raise ValueError(f"exactly one {GRANT_FENCE} block is required")
        grant = strict_json(blocks[0])
    except ValueError as exc:  # UnicodeError and JSONDecodeError are ValueError subclasses
        return None, [f"operator continuation source invalid: {exc}"]
    issues = grant_issues(grant, now)
    return (None if issues else grant), issues


def declared(text: str) -> bool:
    return bool(field_lines(text, PATH_FIELD) or field_lines(text, SHA_FIELD) or _opens(text, SCOPE_FENCE))


def work_order_target(text: str) -> tuple[dict[str, Any], list[str]]:
    """Single unambiguous convergence scalars of the work order being admitted."""
    target: dict[str, Any] = {}
    issues: list[str] = []
    for key in BINDING_KEYS[:-1] + ("externalInvocationCeiling",):
        values = field_lines(text, key)
        if len(values) != 1:
            issues.append(f"work order must declare exactly one {key} for the operator continuation binding")
        else:
            numeric = key in ("reviewRoundCount", "reworkGeneration", "externalInvocationCeiling")
            target[key] = int(values[0]) if numeric and re.fullmatch(r"\d+", values[0]) else values[0]
    modes = {value.strip().rstrip(".").strip(" `") for value in re.findall(r"(?m)^Commit mode:[ \t]*(.+)$", text)}
    if len(modes) != 1:
        issues.append("work order must declare one unambiguous Commit mode")
    else:
        target["commitMode"] = next(iter(modes))
    return target, issues


def evaluate(text: str, root: Path, *, target: dict[str, Any], forbidden: set[str], ledger_union: set[str] | None, now: datetime | None = None) -> tuple[str, list[str]]:
    """Return ("ABSENT"|"INVALID"|"CLEARED", issues) for a completed work order."""
    paths, shas = field_lines(text, PATH_FIELD), field_lines(text, SHA_FIELD)
    blocks = _fence_re(SCOPE_FENCE).findall(text)
    if not (paths or shas or _opens(text, SCOPE_FENCE)):
        return "ABSENT", []
    if len(paths) != 1 or len(shas) != 1 or _opens(text, SCOPE_FENCE) != 1 or len(blocks) != 1 or not paths[0] or not shas[0]:
        return "INVALID", [f"operator continuation requires exactly one non-empty {PATH_FIELD}, {SHA_FIELD} and {SCOPE_FENCE} block"]
    grant, issues = load_grant(root, paths[0], shas[0], now)
    if grant is None:
        return "INVALID", issues
    issues = binding_issues(grant["binding"], target) + ceiling_issues(grant, target)
    if paths[0] in forbidden:
        issues.append("operator continuation source must not be a self-referenced or worker-writable artifact")
    try:
        if not same(strict_json(blocks[0]), grant["scope"]):
            issues.append(f"{SCOPE_FENCE} must be type-identical to grant.scope")
    except ValueError as exc:
        issues.append(f"{SCOPE_FENCE} is invalid: {exc}")
    if ledger_union is None:
        issues.append("operator continuation requires a valid acceptance ledger")
    elif set(grant["scope"]["allowedArtifacts"]) != ledger_union:
        issues.append("scope.allowedArtifacts must equal the acceptance-ledger expected-artifact union")
    return ("INVALID" if issues else "CLEARED"), issues


def cli_continuation(args: Any, root: Path | None = None, now: datetime | None = None) -> tuple[dict[str, Any] | None, list[str]]:
    """Scaffold-time source and argument-binding check; the final checker owns the scope/ledger join."""
    path = getattr(args, "operator_continuation_evidence_path", None)
    sha = getattr(args, "operator_continuation_evidence_sha256", None)
    if path is None and sha is None:
        return None, []
    if path is None or sha is None:
        return None, ["--operator-continuation-evidence-path and --operator-continuation-evidence-sha256 are required together"]
    if args.dispatch_kind != "REWORK" or args.review_round_count < 2:
        return None, ["operator continuation applies only to REWORK at review round two or later"]
    grant, issues = load_grant(root or Path.cwd(), path, sha, now)
    if grant is None:
        return None, issues
    target = {
        "parentAssignmentId": args.batch_id, "rootCauseClusterId": args.root_cause_cluster_id,
        "reviewRoundCount": args.review_round_count, "reworkGeneration": args.review_round_count,
        "priorFindingSetDigest": args.prior_finding_set_digest, "dispatchSurface": args.dispatch_surface,
        "commitMode": args.commit_mode, "externalInvocationCeiling": args.external_invocation_ceiling,
    }
    issues = binding_issues(grant["binding"], target) + ceiling_issues(grant, target)
    own = {f"docs/work_orders/CVF_AGENT_WORK_ORDER_{args.batch_id}_{args.date}.md", f"docs/reviews/CVF_{args.batch_id}_WORKER_RETURN_{args.date}.md"}
    if path in own or path in grant["scope"]["allowedArtifacts"]:
        issues.append("operator continuation source must not be a self-referenced or worker-writable artifact")
    return (None if issues else grant), issues


def validate(args: Any, root: Path | None = None, now: datetime | None = None) -> str | None:
    grant, problems = cli_continuation(args, root, now)
    if problems:
        return "operator continuation rejected: " + "; ".join(problems)
    cleared = grant is not None
    if args.dispatch_kind == "INITIAL" and (
        args.review_round_count != 0
        or args.root_cause_cluster_id != "NOT_APPLICABLE_INITIAL_DISPATCH"
        or args.prior_finding_set_digest != "NOT_APPLICABLE_INITIAL_DISPATCH"
    ):
        return "INITIAL dispatch requires round zero and initial sentinel values."
    if args.dispatch_kind == "REWORK" and (
        args.review_round_count < 1
        or (args.review_round_count >= 3 and not cleared)
        or args.root_cause_cluster_id == "NOT_APPLICABLE_INITIAL_DISPATCH"
        or not re.fullmatch(r"[0-9a-f]{64}", args.prior_finding_set_digest)
    ):
        return "REWORK requires round 1-2, a root-cause cluster ID, and a lowercase SHA-256 digest."
    if (
        args.dispatch_kind == "REWORK"
        and args.review_round_count >= 2
        and args.new_independent_critical_evidence == "NONE"
        and not cleared
    ):
        return "round-two REWORK requires exact new critical evidence IDs."
    if (
        args.dispatch_surface == "EXTERNAL_AGENT_CLI_MCP"
        and args.cumulative_external_invocation_count >= args.external_invocation_ceiling
    ):
        return "external dispatch requires cumulative invocation count below ceiling."
    return None


def kwargs(args: Any) -> dict[str, Any]:
    return {
        "dispatch_kind": args.dispatch_kind,
        "dispatch_surface": args.dispatch_surface,
        "review_round_count": args.review_round_count,
        "root_cause_cluster_id": args.root_cause_cluster_id,
        "prior_finding_set_digest": args.prior_finding_set_digest,
        "cumulative_external_invocation_count": args.cumulative_external_invocation_count,
        "external_invocation_ceiling": args.external_invocation_ceiling,
        "new_independent_critical_evidence": args.new_independent_critical_evidence,
        "operator_continuation_evidence_path": getattr(args, "operator_continuation_evidence_path", None),
        "operator_continuation_evidence_sha256": getattr(args, "operator_continuation_evidence_sha256", None),
    }


def provenance_flags(args: Any) -> str:
    parts: list[str] = []
    if args.dispatch_kind != "INITIAL":
        parts.extend((f" --dispatch-kind {args.dispatch_kind}", f" --review-round-count {args.review_round_count}"))
        parts.extend((f" --root-cause-cluster-id {args.root_cause_cluster_id}", f" --prior-finding-set-digest {args.prior_finding_set_digest}"))
    if args.dispatch_surface != "INTERNAL_AGENT":
        parts.extend((f" --dispatch-surface {args.dispatch_surface}", f" --cumulative-external-invocation-count {args.cumulative_external_invocation_count}"))
        parts.append(f" --external-invocation-ceiling {args.external_invocation_ceiling}")
    if args.new_independent_critical_evidence != "NONE":
        parts.append(f" --new-independent-critical-evidence {args.new_independent_critical_evidence}")
    if getattr(args, "operator_continuation_evidence_path", None) is not None:
        parts.append(f" --operator-continuation-evidence-path {args.operator_continuation_evidence_path}")
    if getattr(args, "operator_continuation_evidence_sha256", None) is not None:
        parts.append(f" --operator-continuation-evidence-sha256 {args.operator_continuation_evidence_sha256}")
    return "".join(parts)


def build_provenance_block(args: Any) -> str:
    command = (
        "python governance/compat/build_dispatch_packet_scaffold.py"
        f" --packet-kind {args.packet_kind} --batch-id {args.batch_id}"
        f' --title "{args.title}" --date {args.date} --base {args.base}'
        f" --commit-mode {args.commit_mode}"
    )
    if args.include_worker_return_skeleton:
        command += " --include-worker-return-skeleton"
    command += provenance_flags(args) + " --stdout"
    return (
        "## Scaffold Provenance Block\n\n| Field | Value |\n| --- | --- |\n"
        f"| scaffoldHelperCommand | `{command}` |\n"
        f"| generatedProfile | {args.packet_kind} plus {args.commit_mode} no-commit worker profile |\n"
        "| generatedSkeletonStatus | USED_AS_STARTING_POINT |\n"
        "| manualEditsAfterScaffold | FILL_ME (describe manual edits made after scaffold generation) |\n"
        "| checkerReadAheadConfirmation | FILL_ME (list `governance/compat/check_*.py` paths read before authoring) |\n"
        "| docOnlyNewFields | FILL_ME (list new doc-only field names introduced by this dispatch) |\n"
        "| claimBoundary | Dispatch authoring provenance only; no runtime/provider/live/public/Web/MCP/model-router behavior claim. |\n"
    )


def continuation_block(args: Any) -> str:
    """Opt-in scalar fields plus the exact grant.scope block; empty for legacy callers."""
    grant, problems = cli_continuation(args)
    if problems:
        raise ValueError("operator continuation rejected: " + "; ".join(problems))
    if grant is None:
        return ""
    scope = json.dumps(grant["scope"], indent=2, ensure_ascii=False)
    return (
        f"\n{PATH_FIELD}: {args.operator_continuation_evidence_path}\n"
        f"{SHA_FIELD}: {args.operator_continuation_evidence_sha256}\n\n```{SCOPE_FENCE}\n{scope}\n```"
    )


def build_block(args: Any) -> str:
    initial = args.dispatch_kind == "INITIAL"
    dependency = "COMPLETE_INITIAL_ACCEPTANCE_MATRIX" if initial else "COMPLETE_BEFORE_FIRST_REPAIR"
    rework = "NOT_APPLICABLE_INITIAL_DISPATCH" if initial else "CONSOLIDATED_ALL_DEPENDENT_FINDINGS"
    regression = "BASELINE_NEGATIVE_TESTS_PLANNED" if initial else "REQUIRED_AND_PLANNED_FOR_EACH_TARGETED_DEFECT"
    next_dispatch = "INITIAL_DISPATCH" if initial else "ONE_CONSOLIDATED_REWORK"
    sweep = "COMPLETE_INITIAL_ACCEPTANCE_MATRIX" if initial else "COMPLETE_BEFORE_REWORK_DISPATCH"
    internal = args.dispatch_surface == "INTERNAL_AGENT"
    usage = "NOT_APPLICABLE_INTERNAL_AGENT" if internal else "KNOWN_FOR_ADMISSION"
    quota = "NOT_APPLICABLE_INTERNAL_AGENT" if internal else "ADMITTED_WITHIN_CUMULATIVE_CEILING"
    fields = (
        ("dispatchKind", args.dispatch_kind), ("dispatchSurface", args.dispatch_surface),
        ("parentAssignmentId", args.batch_id), ("reviewRoundCount", args.review_round_count),
        ("priorFindingSetDigest", args.prior_finding_set_digest),
        ("dependencyAuditDisposition", dependency), ("reworkFindingDisposition", rework),
        ("newIndependentCriticalEvidence", args.new_independent_critical_evidence),
        ("regressionGuardDisposition", regression),
        ("cumulativeExternalInvocationCount", args.cumulative_external_invocation_count),
        ("externalInvocationCeiling", args.external_invocation_ceiling),
        ("usageAvailability", usage), ("quotaAdmissionDisposition", quota),
        ("nextDispatchDisposition", next_dispatch), ("rootCauseClusterId", args.root_cause_cluster_id),
        ("reworkGeneration", args.review_round_count), ("consolidatedDefectClassSweep", sweep),
        ("successorTrancheOpened", "NO"),
        ("implementationAutonomyDisposition", "CONTRACT_AUTHORITY_EVIDENCE_OUTCOME_ONLY"),
        ("preExecutionReviewAdmission", "NOT_REQUIRED_BEFORE_EXECUTION"),
        ("preExecutionReviewTrigger", "NONE"),
        ("nextRoutineReviewBoundary", "WORKER_RETURN"),
        ("reviewerWorkBoundary", "EVALUATE_RETURNED_EVIDENCE_NOT_RECREATE_IMPLEMENTATION"),
    )
    body = "\n".join(f"{name}: {value}" for name, value in fields)
    if not initial:
        body += (
            "\nreviewerLocalRepairBoundary: FILL_ME"
            "\nreviewerLocalRepairBasis: FILL_ME (cite the finding and controlling boundary)"
        )
    body += continuation_block(args)
    return "## Review Dispatch Convergence And Invocation Budget Control\n\nReview-Dispatch Convergence Control: REQUIRED\n\n" + body + "\n"
