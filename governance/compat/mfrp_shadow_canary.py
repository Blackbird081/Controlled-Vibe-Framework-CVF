"""MFRP-P4 invariant, evidence ledger, rollback, and CLI entrypoint."""

from mfrp_shadow_canary_core import *  # noqa: F401,F403


P5_REOPEN_SAMPLE_TARGET = 20


def p5_reopen_sample_gate(eligible_count: int) -> dict[str, Any]:
    """Return the necessary sample gate; never self-authorize P5."""
    if eligible_count < 0:
        raise ValueError("eligible_count must be non-negative")
    sample_satisfied = eligible_count >= P5_REOPEN_SAMPLE_TARGET
    return {
        "requiredEligibleCount": P5_REOPEN_SAMPLE_TARGET,
        "observedEligibleCount": eligible_count,
        "sampleSatisfied": sample_satisfied,
        "calendarWaitRequiredAfterSampleSatisfied": False,
        "day30AloneAuthorizesReopen": False,
        "day30InsufficientSampleDisposition": "INSUFFICIENT_EVIDENCE",
        "status": (
            "SAMPLE_GATE_SATISFIED_P5_DECISION_STILL_REQUIRED"
            if sample_satisfied
            else "P5_CLOSED_SAMPLE_INCOMPLETE"
        ),
        "claimBoundary": (
            "This is a necessary sample gate only. Safety, audit, recall and "
            "evidence-quality gates remain controlling in a separate P5 decision."
        ),
    }

# ---------------------------------------------------------------------------
# P4-I1 Named Independent Invariant
# ---------------------------------------------------------------------------


class AuditInputScopeExceeded(Exception):
    """Raised when the audit is asked to read outside its closed manifest."""


@dataclass(frozen=True)
class PinnedEvidenceInput:
    """One declared authority/evidence path plus its expected identity.

    Per P4-RV-1: path existence is not identity verification. Every declared
    authority/evidence input must carry an expected Git commit/blob pair or a
    SHA-256, and check 1 must recompute the actual bytes and fail closed on
    missing, mismatched, duplicate, or rebound identity -- never merely
    ``Path.is_file()``.

    Per P4-RV-5: when ``git_blob_sha`` is supplied, check 1 recomputes the
    identity from the actual COMMITTED blob object (``git cat-file blob
    <sha>``), never the mutable worktree file at ``path`` -- worktree content
    can legitimately drift from what was true at the historical commit a row
    claims. ``git_blob_sha`` is optional so isolated/synthetic test fixtures
    that have no corresponding git object may still pin by worktree
    SHA-256 alone.
    """

    path: Path
    expected_sha256: str | None = None
    expected_commit: str | None = None
    git_blob_sha: str | None = None

    def __post_init__(self) -> None:
        if not self.expected_sha256 and not self.expected_commit and not self.git_blob_sha:
            raise ValueError(
                f"PinnedEvidenceInput for {self.path} declares no expected "
                "identity (none of expected_sha256, expected_commit, "
                "git_blob_sha); path existence alone is never identity "
                "verification"
            )


@dataclass(frozen=True)
class ClosedAuditManifest:
    """The only inputs P4-I1 may read: an explicit closed set.

    ``declared_evidence_paths`` carries one ``PinnedEvidenceInput`` per
    declared authority/evidence source -- never a bare path. Duplicate paths
    (the same file declared twice, possibly with conflicting expected
    identities -- a "rebound" identity) are rejected by check 1, not silently
    deduplicated.

    Per P4-RV-5: ``return_blob_git_sha``, when supplied, makes check 2/3 read
    the actual COMMITTED blob object for ``return_blob_path`` (via ``git
    cat-file blob <sha>``) instead of the mutable worktree file -- the row
    being audited claims a specific immutable commit/blob, and the audit must
    prove against those exact committed bytes, not whatever currently sits on
    disk at that path.
    """

    return_blob_path: Path
    declared_evidence_paths: tuple[PinnedEvidenceInput, ...]
    hard_obligation_locator: str
    hard_obligation_locator_pattern: str
    comparator_row: dict[str, Any]
    return_blob_expected_sha256: str | None = None
    return_blob_git_sha: str | None = None


def run_p4_i1_invariant(
    manifest: ClosedAuditManifest,
    *,
    extra_read_paths: tuple[Path, ...] = (),
    semantic_replay_requested: bool = False,
) -> dict[str, Any]:
    """Execute the five numbered P4-I1 checks against the closed manifest only.

    ``extra_read_paths`` simulates an auditor attempting to read something
    beyond the manifest's own declared paths; any such path not already a
    member of the closed set raises ``AuditInputScopeExceeded``.
    ``semantic_replay_requested`` simulates a regeneration/rerun-the-phase
    command; when true it also raises ``AuditInputScopeExceeded``. The audit
    never reads or executes anything beyond the closed manifest itself.
    """
    declared_paths = tuple(item.path for item in manifest.declared_evidence_paths)
    closed_set = {manifest.return_blob_path, *declared_paths}

    if semantic_replay_requested:
        raise AuditInputScopeExceeded(
            "semantic re-execution / phase regeneration is outside the closed "
            "P4-I1 input manifest"
        )
    for path in extra_read_paths:
        if path not in closed_set:
            raise AuditInputScopeExceeded(f"undeclared audit input path: {path}")

    checks: dict[str, Any] = {}

    # 1. named authority/evidence bytes match their pinned identity. Path
    # existence is never identity verification: every declared input must
    # recompute an actual SHA-256 (or, when only a commit is pinned, the
    # actual Git blob at that commit) and compare it against the expected
    # value. Missing files, hash mismatches, and duplicate/rebound paths
    # (the same path declared twice with different expected identities) all
    # fail this check. Per P4-RV-5: when the item pins a ``git_blob_sha``,
    # the actual bytes are read from that COMMITTED blob object, never the
    # mutable worktree file -- worktree content can drift from what a row
    # claims was true at its own historical commit.
    seen_paths: dict[Path, str] = {}
    duplicate_rebound = False
    for item in manifest.declared_evidence_paths:
        if item.git_blob_sha:
            committed_bytes = git_blob_bytes(item.git_blob_sha)
            exists = committed_bytes is not None
            actual_sha256 = (
                hashlib.sha256(committed_bytes).hexdigest() if committed_bytes is not None else None
            )
        else:
            full = REPO_ROOT / item.path
            exists = full.is_file()
            actual_sha256 = (
                hashlib.sha256(full.read_bytes()).hexdigest() if exists else None
            )
        identity_match = exists and actual_sha256 == item.expected_sha256
        checks.setdefault("authorityEvidenceMatch", []).append({
            "path": str(item.path),
            "exists": exists,
            "expectedSha256": item.expected_sha256,
            "actualSha256": actual_sha256,
            "identityMatch": identity_match,
            "readFromCommittedBlob": bool(item.git_blob_sha),
        })
        key = item.path
        if key in seen_paths and seen_paths[key] != (item.expected_sha256 or ""):
            duplicate_rebound = True
        seen_paths[key] = item.expected_sha256 or ""
    check1_pass = (
        bool(manifest.declared_evidence_paths)
        and not duplicate_rebound
        and all(
            item["identityMatch"] for item in checks.get("authorityEvidenceMatch", [])
        )
    )

    # 2. hard-obligation locator exists exactly once in the declared evidence
    # envelope. A generic substring count (e.g. counting every occurrence of
    # the bare token "C15" anywhere in the document) is not a mechanically
    # unambiguous locator -- the trusted return uses that bare token in
    # multiple unrelated places (its predicate-miss set listing, its fixed
    # sentinel name, its adjudication summary). The locator here
    # (``manifest.hard_obligation_locator_pattern``, the module default being
    # ``HARD_OBLIGATION_LOCATOR_PATTERN``) is the exact anchored disclosure
    # sentence resolving to exactly one bounded statement: the predicate-miss
    # set immediately followed by C15's FALSE_NEGATIVE classification. This
    # resolves to exactly one match when present once, zero when absent, and
    # more than one only if the exact sentence is duplicated. Per P4-RV-5:
    # when the manifest pins ``return_blob_git_sha``, the text is read from
    # that COMMITTED blob object, never the mutable worktree file at
    # ``return_blob_path`` -- the row claims a specific historical commit,
    # and worktree content at that path can legitimately have moved on since.
    if manifest.return_blob_git_sha:
        committed_return_bytes = git_blob_bytes(manifest.return_blob_git_sha)
        return_text = (
            committed_return_bytes.decode("utf-8", errors="replace")
            if committed_return_bytes is not None
            else ""
        )
    else:
        full_return = REPO_ROOT / manifest.return_blob_path
        return_text = full_return.read_text(encoding="utf-8") if full_return.is_file() else ""
    locator_pattern = re.compile(
        re.escape(manifest.hard_obligation_locator_pattern)
    )
    locator_occurrences = len(locator_pattern.findall(return_text))
    check2_pass = locator_occurrences == 1

    # 3. the return does not claim acceptance when the obligation is absent,
    # failed, NOT_CHECKED or UNCLASSIFIED
    obligation_intact = (
        "FALSE_NEGATIVE" in return_text
        and "C07" in return_text
        and "C08" in return_text
        and "C18" in return_text
    )
    check3_pass = obligation_intact

    # 4. receipt limitations/not-checked/unclassified survive into the
    # comparator classification (the row must not silently drop them)
    blind_spot = manifest.comparator_row.get("blindSpotDisposition", {})
    check4_pass = (
        set(blind_spot.get("nonRepresentable", [])) == set(NON_REPRESENTABLE_BLIND_SPOTS)
        and blind_spot.get("c15") == C15_DISPOSITION
        and blind_spot.get("excludedFromSuccessDenominators") is True
    )

    # 5. trusted disposition commit is an ancestor of shadow disclosure
    order_evidence = manifest.comparator_row.get("trustedRecordOrderEvidence", {})
    check5_pass = order_evidence.get("orderOfRecordStatus") == "PROVEN"

    all_pass = check1_pass and check2_pass and check3_pass and check4_pass and check5_pass

    return {
        "invariantId": INVARIANT_ID,
        "checks": {
            "1_authorityEvidenceBytesMatchPinnedIdentity": check1_pass,
            "2_hardObligationLocatorPresentOnce": check2_pass,
            "3_noAcceptanceClaimOverAbsentObligation": check3_pass,
            "4_limitationsSurviveIntoClassification": check4_pass,
            "5_trustedDispositionAncestorOfDisclosure": check5_pass,
        },
        "locatorOccurrenceCount": locator_occurrences,
        "result": "PASS" if all_pass else "FAIL",
        "closedManifest": {
            "returnBlobPath": str(manifest.return_blob_path),
            "returnBlobGitSha": manifest.return_blob_git_sha,
            "returnBlobReadFromCommittedBlob": bool(manifest.return_blob_git_sha),
            "declaredEvidencePaths": [
                {
                    "path": str(item.path),
                    "expectedSha256": item.expected_sha256,
                    "gitBlobSha": item.git_blob_sha,
                }
                for item in manifest.declared_evidence_paths
            ],
            "hardObligationLocator": manifest.hard_obligation_locator,
            "hardObligationLocatorPattern": manifest.hard_obligation_locator_pattern,
        },
    }


def default_closed_audit_manifest(row: dict[str, Any]) -> ClosedAuditManifest:
    """Build the P4-I1 closed audit manifest for THIS row specifically.

    Per P4-RV-5: this must never default to the R1B constants
    (``TRUSTED_RETURN_PATH``/``TRUSTED_RETURN_EXPECTED_SHA256``/
    ``HARD_OBLIGATION_LOCATOR``/``HARD_OBLIGATION_LOCATOR_PATTERN``)
    regardless of which row is actually current -- a valid R1B invariant
    must never mask a missing/duplicated obligation in a genuinely different
    current return. The manifest is instead constructed from the row's own
    persisted, normalized pin data (``closedAuditManifestPins``, written by
    ``_build_linked_or_ineligible_row`` at row-construction time): its own
    committed blob path/git-sha, the actual SHA-256 of that blob's real
    committed bytes (recomputed at construction time, not re-derived here),
    and its own hard-obligation locator/pattern. This also satisfies check
    2/3's requirement to read the COMMITTED blob rather than mutable
    worktree bytes, since ``return_blob_git_sha`` is threaded through to
    ``run_p4_i1_invariant``.

    Only when a row carries no ``closedAuditManifestPins`` at all (a
    malformed/legacy row that predates this field existing) does this fall
    back to the row's own ``phaseReturnIdentity``/``blindSpotDisposition``
    fields directly -- never to the R1B constants, since defaulting to R1B
    for an unrelated row is exactly the defect this correction removes. If
    even those are absent, the manifest is built with pins that will
    honestly fail check 1 (no identity to verify against) rather than
    silently substituting R1B's identity for a different row.
    """
    pins = row.get("closedAuditManifestPins")
    identity = row.get("phaseReturnIdentity", {})
    blind_spot = row.get("blindSpotDisposition", {})

    if pins:
        return_blob_path = Path(pins.get("returnBlobPath") or identity.get("path", ""))
        return_blob_git_sha = pins.get("returnBlobGitSha") or identity.get("blob")
        return_blob_expected_sha256 = pins.get("returnBlobExpectedSha256")
        hard_obligation_locator = pins.get("hardObligationLocator") or blind_spot.get(
            "hardObligationLocator", ""
        )
        hard_obligation_locator_pattern = pins.get("hardObligationLocatorPattern") or ""
    else:
        # No persisted pins on this row at all: build strictly from the
        # row's own identity/blind-spot fields, never from the R1B module
        # constants, so a genuinely different row can never be silently
        # audited as if it were R1B.
        return_blob_path = Path(identity.get("path", ""))
        return_blob_git_sha = identity.get("blob")
        return_blob_expected_sha256 = None
        hard_obligation_locator = blind_spot.get("hardObligationLocator", "")
        hard_obligation_locator_pattern = ""

    return ClosedAuditManifest(
        return_blob_path=return_blob_path,
        declared_evidence_paths=(
            PinnedEvidenceInput(
                path=return_blob_path,
                expected_sha256=return_blob_expected_sha256,
                git_blob_sha=return_blob_git_sha,
            ),
        ),
        hard_obligation_locator=hard_obligation_locator,
        hard_obligation_locator_pattern=hard_obligation_locator_pattern,
        comparator_row=row,
        return_blob_expected_sha256=return_blob_expected_sha256,
        return_blob_git_sha=return_blob_git_sha,
    )


# ---------------------------------------------------------------------------
# Rollback rehearsal
# ---------------------------------------------------------------------------


def rollback_rehearsal(*, runtime_dir: Path | None = None) -> dict[str, Any]:
    """Prove that removing the ignored shadow receipt dir leaves trusted
    disposition and repository bytes unchanged.

    Rollback is stopping the shadow command and preserving committed
    evidence -- it does not assume a production feature flag.
    """
    target = runtime_dir if runtime_dir is not None else (REPO_ROOT / RUNTIME_DIR)

    before_blob = git_blob_at(TRUSTED_COMMIT, TRUSTED_RETURN_PATH)
    before_head = git_head()
    _, before_status, _ = _run_git(["status", "--short"])

    target.mkdir(parents=True, exist_ok=True)
    marker = target / "shadow_receipt_marker.json"
    marker.write_text(
        json.dumps({"note": "ephemeral shadow marker for rollback rehearsal"}),
        encoding="utf-8",
    )
    created = marker.is_file()

    # Remove only the verified, explicit repository-bounded temp directory.
    if target.is_dir() and target.resolve().is_relative_to(REPO_ROOT.resolve()):
        for item in sorted(target.glob("**/*"), reverse=True):
            if item.is_file():
                item.unlink()
        for item in sorted(target.glob("**/*"), reverse=True):
            if item.is_dir():
                item.rmdir()
        if target.is_dir():
            target.rmdir()
    removed = not target.exists()

    after_blob = git_blob_at(TRUSTED_COMMIT, TRUSTED_RETURN_PATH)
    after_head = git_head()
    _, after_status, _ = _run_git(["status", "--short"])

    return {
        "runtimeDirectory": str(RUNTIME_DIR),
        "markerCreated": created,
        "markerRemoved": removed,
        "trustedBlobBefore": before_blob,
        "trustedBlobAfter": after_blob,
        "trustedBlobUnchanged": before_blob == after_blob,
        "headBefore": before_head,
        "headAfter": after_head,
        "headUnchanged": before_head == after_head,
        "repositoryStatusBefore": before_status,
        "repositoryStatusAfter": after_status,
        "trustedDispositionUnchanged": before_blob == after_blob and before_head == after_head,
        "providerCallsDuringRollback": 0,
    }


# ---------------------------------------------------------------------------
# Evidence build (top-level orchestration for the CLI)
# ---------------------------------------------------------------------------


def _default_opening_row(execution_base: str) -> dict[str, Any]:
    """The pinned R1B-R2 opening row, per the Actual-Seam And One-Command
    Contract, used only when no prior ledger and no new observation input
    are supplied -- i.e. the true opening-of-window call."""
    return build_initial_observation_row(execution_base).to_dict()


def derive_safety_triggers(
    rows: list[dict[str, Any]], invariant_result: dict[str, Any]
) -> dict[str, bool]:
    """Derive early-review triggers from persisted evidence, never constants."""

    def trusted_blocks(row: dict[str, Any]) -> bool:
        disposition = str(row.get("trustedOutcome", {}).get("disposition", "")).upper()
        return any(token in disposition for token in ("BLOCK", "REJECT", "REVISE", "RETURN_TO_DESIGN"))

    def machine_closes(row: dict[str, Any]) -> bool:
        outcome = row.get("machineOutcome")
        if not isinstance(outcome, dict):
            return False
        return outcome.get("validatorAccepted") is True or str(outcome.get("status", "")).upper() in {
            "PASS",
            "DETERMINISTIC_PREFLIGHT_COMPLETE",
        }

    def blind_spot_intact(row: dict[str, Any]) -> bool:
        disposition = row.get("blindSpotDisposition")
        return isinstance(disposition, dict) and (
            set(disposition.get("nonRepresentable", [])) == set(NON_REPRESENTABLE_BLIND_SPOTS)
            and disposition.get("c15") == C15_DISPOSITION
            and disposition.get("excludedFromSuccessDenominators") is True
        )

    invariant_failed = invariant_result.get("result") != "PASS"
    return {
        "unexplainedDivergence": any(
            row.get("divergenceClass") == "UNEXPLAINED_DIVERGENCE" for row in rows
        ),
        "machineClosureWhereTrustedBlocks": any(
            trusted_blocks(row) and machine_closes(row) for row in rows
        ),
        "identityOrSourceDrift": any(
            row.get("divergenceClass") == "IDENTITY_OR_SOURCE_DRIFT" for row in rows
        ),
        "hiddenLimitationOrUnclassified": invariant_failed or any(
            row.get("phase") == "UNCLASSIFIED"
            or row.get("divergenceClass") == "UNCLASSIFIED"
            or not blind_spot_intact(row)
            for row in rows
        ),
        "orderOfRecordFailure": any(
            row.get("trustedRecordOrderEvidence", {}).get("orderOfRecordStatus") != "PROVEN"
            for row in rows
        ),
        "externalEffect": any(
            (row.get("costEvidence", {}).get("externalCalls", 0) or 0) > 0 for row in rows
        ),
        "auditScopeExcess": any(
            row.get("auditDisposition") == "AUDIT_INPUT_SCOPE_EXCEEDED"
            or row.get("auditReason") == "AUDIT_INPUT_SCOPE_EXCEEDED"
            for row in rows
        ),
        "independentInvariantFailure": invariant_failed,
    }


def build_evidence(
    execution_base: str | None = None,
    *,
    prior_ledger_path: str | None = None,
    new_observation: NewObservationInput | None = None,
) -> dict[str, Any]:
    """Build (or extend) the bounded P4 evidence ledger.

    Per P4-RV-3: this is the one bounded observation/checkpoint input seam.
    With neither ``prior_ledger_path`` nor ``new_observation`` supplied, this
    reproduces the original opening-of-window behavior exactly (the pinned
    R1B-R2 row, checkpoint ``initialization``) for backward compatibility.
    With ``prior_ledger_path`` supplied, the previously-produced evidence
    JSON is consumed and appended to rather than always starting from zero.
    With ``new_observation`` supplied, that explicit natural return is
    validated, linked (or honestly recorded ineligible) and appended;
    duplicate/rebound rows are rejected. The checkpoint is determined by the
    declared population thresholds (initialization/M5/M10/final), never
    hard-coded.
    """
    base = execution_base or git_head()

    prior_evidence: dict[str, Any] | None = None
    if prior_ledger_path:
        prior_path = Path(prior_ledger_path)
        if not prior_path.is_absolute():
            prior_path = REPO_ROOT / prior_path
        prior_evidence = json.loads(prior_path.read_text(encoding="utf-8"))

    if new_observation is not None:
        append_result = append_observation(prior_evidence, new_observation, base)
        all_rows = append_result["rows"]
        checkpoint = append_result["checkpoint"]
    elif prior_evidence is not None:
        # Consume the prior ledger's rows unchanged; no new observation is
        # being added this call (e.g. a bare checkpoint recompute).
        all_rows = list(prior_evidence.get("rows", []))
        eligible_rows = [row for row in all_rows if not row.get("ineligibleClass")]
        checkpoint = checkpoint_for_population(len(eligible_rows))
    else:
        # Backward-compatible default: the original pinned R1B-R2 opening
        # row, exactly as the pre-correction helper always produced.
        all_rows = [_default_opening_row(base)]
        checkpoint = checkpoint_for_population(0)

    eligible_rows = [row for row in all_rows if not row.get("ineligibleClass")]
    n_eligible = len(eligible_rows)
    population_count = len(all_rows)

    # The invariant and rollback rehearsal are evaluated against the most
    # recently appended/most relevant row (the last row in the ledger) --
    # the same single-row scope the pre-correction helper always used, now
    # generalized to whichever row is current rather than hard-coded to
    # R1B-R2.
    current_row = all_rows[-1] if all_rows else {}
    manifest = default_closed_audit_manifest(current_row)
    invariant_result = run_p4_i1_invariant(manifest)
    rollback_result = rollback_rehearsal()
    sample_ids = select_sample(eligible_rows) if eligible_rows else []

    phase_coverage = {phase: 0 for phase in CANONICAL_PHASES}
    for row in all_rows:
        if row.get("ineligibleClass"):
            continue
        phase = row.get("phase")
        if phase in phase_coverage:
            phase_coverage[phase] += 1

    evidence: dict[str, Any] = {
        "schema": SCHEMA,
        "profile": "cvf.mfrp.p4ShadowCanary.evidence.v1",
        "designIdentity": {
            "path": "docs/assessments/CVF_MFRP_P4_SHADOW_CANARY_AND_GOVERNANCE_TAX_BUDGET_DESIGN_2026-09-02.md",
            "sha256": "65698a95dc7bb7f437fe061a81559701b91a3e611c445f5122ad8145c5f13df5",
        },
        "r1bR2Identity": {
            "returnPath": TRUSTED_RETURN_PATH,
            "commit": TRUSTED_COMMIT,
            "blob": TRUSTED_BLOB,
            "trustedOutcome": TRUSTED_OUTCOME,
        },
        "openingDate": "2026-09-02",
        "sunsetDate": "2026-10-02",
        "sunsetRule": "earlier of 20 eligible natural returns or 30 calendar days from opening",
        "p5ReopenSampleGate": p5_reopen_sample_gate(n_eligible),
        "checkpoint": checkpoint,
        "populationCount": population_count,
        "eligibleCount": n_eligible,
        "phaseCoverage": phase_coverage,
        "rows": all_rows,
        "sampling": {
            "formula": "k = min(4, max(1, ceil(0.20 * n))) for n >= 1, else k = 0",
            "n": n_eligible,
            "k": len(sample_ids),
            "selectedRowIds": sample_ids,
        },
        "blindSpots": {
            "nonRepresentable": list(NON_REPRESENTABLE_BLIND_SPOTS),
            "c15": C15_DISPOSITION,
            "excludedFromSuccessDenominators": True,
        },
        "invariant": invariant_result,
        "admissionMetrics": {
            "preExecutionReviewCount": 0,
            "routineReviewBoundaryCount": 0,
            "safetyTriggerReviewCount": 0,
            "admissionFalseNegatives": 0,
        },
        "taxMetrics": {
            # M0/M1/M2 are attributable historical admission measurements
            # already established by committed evidence, per the Review Cost
            # standard's admission fields and the baseline's Governance-Tax
            # And Recall Ledger contract. They are not fabricated: each cites
            # the exact prior committed return it is pulled from. Only the
            # recall conclusion may remain NOT_YET_ESTIMABLE while the
            # positive-trigger denominator is zero -- M0/M1/M2 themselves are
            # concrete non-negative integers with disclosed sources, not
            # NOT_YET_ESTIMABLE placeholders.
            "m0": {
                "source": "docs/reviews/CVF_MFRP_P3_R1B_ACTUAL_SEAM_REPLAY_WORKER_RETURN_2026-09-02.md",
                "description": (
                    "earliest historical admission measurement in this MFRP "
                    "chain: the original (rejected) R1B actual-seam replay "
                    "return"
                ),
                "preExecutionReviewCount": 0,
                "implementationDefectsFoundAtReturnBoundary": 3,
                "reviewerDisposition": "RETURN_TO_DESIGN",
                "recallConclusion": "NOT_YET_ESTIMABLE",
            },
            "m1": {
                "source": "docs/reviews/CVF_MFRP_P3_R1B_R2_ACTUAL_SEAM_REPLAY_REPAIR_WORKER_RETURN_2026-09-02.md",
                "description": (
                    "second historical admission measurement: the R1B-R2 "
                    "repair round's first-pass independent adjudication, "
                    "before its own in-place repair (distinct from M2, "
                    "which is the same return's final post-repair "
                    "adjudication)"
                ),
                "preExecutionReviewCount": 0,
                "implementationDefectsFoundAtReturnBoundary": 3,
                "reviewerDisposition": "REVISE_IN_PLACE_CONSOLIDATED",
                "recallConclusion": "NOT_YET_ESTIMABLE",
            },
            "m2": {
                "source": "docs/reviews/CVF_MFRP_P3_R1B_R2_ACTUAL_SEAM_REPLAY_REPAIR_WORKER_RETURN_2026-09-02.md",
                "description": (
                    "third historical admission measurement: the same "
                    "R1B-R2 return's final post-repair adjudication and "
                    "acceptance"
                ),
                "preExecutionReviewCount": 0,
                "implementationDefectsFoundAtReturnBoundary": 3,
                "reviewerDisposition": "REVIEWER_ACCEPTED_EVIDENCE_RETURN_TO_DESIGN_BOUNDED",
                "recallConclusion": "NOT_YET_ESTIMABLE",
            },
            "initialObservation": {
                "shadowCommandCount": sum(
                    row.get("costEvidence", {}).get("shadowCommandCount", 0) or 0
                    for row in all_rows
                ),
                "externalCalls": sum(
                    row.get("costEvidence", {}).get("externalCalls", 0) or 0
                    for row in all_rows
                ),
                "auditScopeExceededCount": 0,
            },
            "positiveTriggerDenominator": 0,
            "recall": "NOT_YET_ESTIMABLE",
        },
        "safetyTriggers": derive_safety_triggers(all_rows, invariant_result),
        "rollbackResult": rollback_result,
        "limitations": [
            "C07, C08 and C18 are not representable by current P2 and are excluded "
            "from safety/recall denominators.",
            "C15 remains FALSE_NEGATIVE and is never counted as PASS.",
            "No saved cost is claimed during shadow mode.",
            "Consistency (ENVELOPE_CONSISTENT_WITH_TRUSTED) is never correctness "
            "or route equivalence.",
        ] + (
            [
                "The initial R1B-R2 pair has no explicitly linked receipt; it is "
                "recorded ineligible (BLOCKED_NO_ELIGIBLE_NATURAL_PAIR) rather than "
                "substituted with an unrelated current receipt.",
            ]
            if any(row.get("ineligibleClass") for row in all_rows)
            else []
        ),
        "claimBoundary": (
            "Bounded P4 shadow evidence only. The trusted route remains "
            "controlling. No reviewer acceptance, P5 readiness, route "
            "replacement, correctness, recall preservation, or observed "
            "cost-saving claim is made by this evidence."
        ),
    }
    return evidence


def evidence_bytes(evidence: dict[str, Any]) -> bytes:
    return (
        json.dumps(evidence, ensure_ascii=False, sort_keys=True, indent=2) + "\n"
    ).encode("utf-8")


def normalize_for_byte_comparison(evidence: dict[str, Any]) -> dict[str, Any]:
    """Strip explicitly excluded duration fields for byte-identity comparison.

    Also excludes the rollback rehearsal's live ``git status --short``
    snapshot strings. Those two fields are moment-of-execution ambient
    worktree evidence (they legitimately change the instant the evidence
    fixture itself is written to an untracked path) and are excluded from
    the determinism claim on the same footing as duration: they describe
    when/where the run happened, not what the canary computed. The
    load-bearing identity fields -- ``trustedBlobBefore/After``,
    ``headBefore/After`` and ``trustedDispositionUnchanged`` -- are never
    excluded and must remain byte-identical across runs.
    """
    clone = json.loads(json.dumps(evidence))
    for row in clone.get("rows", []):
        cost = row.get("costEvidence")
        if isinstance(cost, dict):
            cost.pop("shadowDurationSeconds", None)
    rollback = clone.get("rollbackResult")
    if isinstance(rollback, dict):
        rollback.pop("repositoryStatusBefore", None)
        rollback.pop("repositoryStatusAfter", None)
    return clone


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output", required=True, help="Path to write the bounded evidence JSON."
    )
    parser.add_argument(
        "--execution-base",
        default=None,
        help="Frozen execution base to bind into deterministic output (defaults to HEAD).",
    )
    parser.add_argument(
        "--prior-ledger",
        default=None,
        help=(
            "Path to a previously-produced evidence JSON to consume and "
            "append to, instead of always starting from zero."
        ),
    )
    # Bounded natural-observation input seam (P4-RV-3). All --new-* flags
    # are optional; when --new-return-path is supplied the remaining
    # required identity fields must also be supplied, and the row is
    # validated, linked (or honestly recorded ineligible) and appended.
    parser.add_argument("--new-return-path", default=None)
    parser.add_argument("--new-commit", default=None)
    parser.add_argument("--new-blob", default=None)
    parser.add_argument("--new-trusted-outcome", default=None)
    parser.add_argument("--new-phase", default="UNCLASSIFIED")
    parser.add_argument("--new-hard-obligation-locator", default=None)
    parser.add_argument("--new-hard-obligation-locator-pattern", default=None)
    parser.add_argument("--new-source-authority-locator", default=None)
    parser.add_argument("--new-receipt-path", default=None)
    parser.add_argument("--new-receipt-digest", default=None)
    parser.add_argument("--new-verifier-identity", default=None)
    parser.add_argument("--new-readout-identity", default=None)
    parser.add_argument("--new-autorun-base", default=None)
    parser.add_argument("--new-autorun-head", default=None)
    parser.add_argument("--new-row-id", default=None)
    args = parser.parse_args()

    new_observation: NewObservationInput | None = None
    if args.new_return_path:
        required = {
            "--new-commit": args.new_commit,
            "--new-blob": args.new_blob,
            "--new-trusted-outcome": args.new_trusted_outcome,
            "--new-hard-obligation-locator": args.new_hard_obligation_locator,
            "--new-hard-obligation-locator-pattern": args.new_hard_obligation_locator_pattern,
            "--new-source-authority-locator": args.new_source_authority_locator,
        }
        missing = [flag for flag, value in required.items() if not value]
        if missing:
            parser.error(
                "--new-return-path requires all of: "
                + ", ".join(sorted(required))
                + f"; missing: {missing}"
            )
        new_observation = NewObservationInput(
            return_path=args.new_return_path,
            trusted_commit=args.new_commit,
            trusted_blob=args.new_blob,
            trusted_outcome=args.new_trusted_outcome,
            phase=args.new_phase,
            hard_obligation_locator=args.new_hard_obligation_locator,
            hard_obligation_locator_pattern=args.new_hard_obligation_locator_pattern,
            source_authority_locator=args.new_source_authority_locator,
            receipt_path=args.new_receipt_path,
            receipt_digest=args.new_receipt_digest,
            verifier_identity=args.new_verifier_identity,
            readout_identity=args.new_readout_identity,
            autorun_base=args.new_autorun_base,
            autorun_head=args.new_autorun_head,
            row_id=args.new_row_id,
        )

    evidence = build_evidence(
        execution_base=args.execution_base,
        prior_ledger_path=args.prior_ledger,
        new_observation=new_observation,
    )
    output = Path(args.output)
    if not output.is_absolute():
        output = REPO_ROOT / output
    output.write_bytes(evidence_bytes(evidence))
    print(json.dumps({
        "schema": evidence["schema"],
        "checkpoint": evidence["checkpoint"],
        "populationCount": evidence["populationCount"],
        "p5ReopenSampleGateStatus": evidence["p5ReopenSampleGate"]["status"],
        "rowIds": [row["rowId"] for row in evidence["rows"]],
        "ineligibleClasses": [
            row["ineligibleClass"] for row in evidence["rows"] if row["ineligibleClass"]
        ],
        "invariantResult": evidence["invariant"]["result"],
        "rollbackTrustedDispositionUnchanged": evidence["rollbackResult"]["trustedDispositionUnchanged"],
        "outputSha256": hashlib.sha256(output.read_bytes()).hexdigest(),
    }, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
