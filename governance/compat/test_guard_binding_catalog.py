from pathlib import Path

import pytest
import guard_binding_catalog as subject


def test_public_selection_is_explicit_not_file_absence():
    public = "docs/reference/current-missing-owner.md"
    private = "docs/roadmaps/private-evidence.md"
    assert subject.public_required_paths((public, private, "CLAUDE.md")) == (public,)
    assert subject.public_required_markers({public: ("normative token", private), private: ("other",)}) == {public: ("normative token",)}


def test_private_root_cannot_select_public_profile(tmp_path):
    (tmp_path / "AGENTS.md").write_text("Private carrier")
    with pytest.raises(ValueError, match="exact exported"):
        subject.require_public_projection(tmp_path)


def test_public_carrier_mismatch_rejects(tmp_path):
    source = tmp_path / "governance/toolkit/05_OPERATION/CVF_PUBLIC_CORE_AGENTS.md"
    source.parent.mkdir(parents=True)
    source.write_text("Public carrier")
    (tmp_path / "AGENTS.md").write_text("Public carrier")
    subject.require_public_projection(tmp_path)
    (tmp_path / "AGENTS.md").write_text("tampered carrier")
    with pytest.raises(ValueError):
        subject.require_public_projection(tmp_path)


def test_exported_normative_templates_remain_required_public_owners():
    paths = (
        "docs/reference/CVF_GC018_CONTINUATION_CANDIDATE_TEMPLATE.md",
        "docs/reference/CVF_AGENT_WORK_ORDER_TEMPLATE_2026-05-19.md",
    )
    assert subject.public_required_paths(paths) == paths
