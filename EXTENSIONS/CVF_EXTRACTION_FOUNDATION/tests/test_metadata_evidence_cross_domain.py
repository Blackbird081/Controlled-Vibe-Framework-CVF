"""Cross-domain conformance tests using the shared MEOR-T4 fixture."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

PACKAGE_ROOT = Path(__file__).parent.parent
REPO_ROOT = Path(__file__).parents[3]
FIXTURE_PATH = (
    REPO_ROOT
    / "docs"
    / "reference"
    / "CVF_MEOR_T4_CROSS_DOMAIN_CONFORMANCE_FIXTURES_2026-06-12.json"
)

sys.path.insert(0, str(PACKAGE_ROOT / "src"))

from metadata_evidence import (  # noqa: E402
    MetadataEvidenceRecord,
    MetadataEvidenceValidationError,
    evaluate_metadata_evidence,
)

FIXTURE = json.loads(FIXTURE_PATH.read_text(encoding="utf-8"))
PROFILES = {
    profile["domainProfileId"]: profile for profile in FIXTURE["profiles"]
}
DECLARED_BY_PROFILE = {
    profile_id: {
        requirement["requirementId"]: requirement["ownerProfileId"]
        for requirement in profile["requirements"]
    }
    for profile_id, profile in PROFILES.items()
}


def test_shared_fixture_is_bounded_and_domain_sets_are_disjoint() -> None:
    assert FIXTURE["fixtureVersion"] == "cvf.meorCrossDomainConformance.t4.v1"
    assert FIXTURE["contractVersion"] == (
        "cvf.metadataEvidenceResolution.meor.t1.v1"
    )
    legal_ids = set(DECLARED_BY_PROFILE["legal_policy.synthetic"])
    technical_ids = set(DECLARED_BY_PROFILE["technical_project.synthetic"])

    assert legal_ids == {
        "legal_policy.current_status",
        "legal_policy.jurisdiction",
    }
    assert technical_ids == {
        "technical_project.repository_ref",
        "technical_project.target_runtime",
    }
    assert legal_ids.isdisjoint(technical_ids)
    serialized = json.dumps(FIXTURE).lower()
    assert "policy_local" not in serialized
    assert "cand-" not in serialized


@pytest.mark.parametrize("case", FIXTURE["cases"], ids=lambda case: case["caseId"])
def test_four_resolution_paths_match_t1_semantics(case: dict[str, object]) -> None:
    profile_id = str(case["ownerProfileId"])
    record = MetadataEvidenceRecord(
        requirement_id=str(case["requirementId"]),
        owner_profile_id=profile_id,
        observed_state=str(case["observedState"]),  # type: ignore[arg-type]
        evidence_basis=str(case["evidenceBasis"]),  # type: ignore[arg-type]
        evidence_pointers=tuple(case["evidencePointers"]),  # type: ignore[arg-type]
    )

    result = evaluate_metadata_evidence(
        record,
        declared_requirements=DECLARED_BY_PROFILE[profile_id],
    )

    assert result.resolution_state == case["expectedResolutionState"]
    assert (
        result.downstream_disposition
        == case["expectedDownstreamDisposition"]
    )


def test_cross_profile_requirement_injection_fails_closed() -> None:
    record = MetadataEvidenceRecord(
        requirement_id="legal_policy.current_status",
        owner_profile_id="technical_project.synthetic",
        observed_state="MISSING",
        evidence_basis="NONE",
    )
    combined_owner_map = {
        **DECLARED_BY_PROFILE["legal_policy.synthetic"],
        **DECLARED_BY_PROFILE["technical_project.synthetic"],
    }

    with pytest.raises(MetadataEvidenceValidationError) as exc_info:
        evaluate_metadata_evidence(
            record,
            declared_requirements=combined_owner_map,
        )

    assert exc_info.value.token == "CROSS_PROFILE_REQUIREMENT_BLEED"
