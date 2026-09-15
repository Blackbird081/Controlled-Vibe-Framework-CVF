"""Architecture Readiness Admission renderer - extracted from build_dispatch_packet_scaffold.py
at DARA-T2-R1 to satisfy the R1-05 feasible-split requirement.

Public entry point: architecture_readiness_section(args) -> list[str]
"""

from __future__ import annotations


def _architecture_readiness_block(args: object) -> str:
    """Emit a checker-safe blocked default for DARA-T2 Architecture Readiness
    Admission. Never invents a matrix row: internal-agent dispatches get the
    excluded-from-ceiling default; every other dispatch surface gets the
    fail-closed unclassified default until the dispatch author explicitly
    proves applicability with a real matrix."""
    dispatch_surface = getattr(args, "dispatch_surface", "")
    if dispatch_surface == "INTERNAL_AGENT":
        declaration = "NOT_APPLICABLE_INTERNAL_AGENT_WITH_REASON"
        reason = (
            "Reason: internal-agent dispatch; never counts against the "
            "external invocation ceiling."
        )
    else:
        declaration = "BLOCKED_ARCHITECTURE_APPLICABILITY_UNCLASSIFIED"
        reason = (
            "Reason: scaffold default; the dispatch author must replace this "
            "with `REQUIRED` plus a complete `## Architecture Binding Matrix`, "
            "or `NOT_APPLICABLE_ACCEPTED_DESIGN_ECHO` citing an accepted "
            "matrix digest/review path/commit, before this packet may "
            "dispatch. The scaffold never invents architecture rows."
        )
    return (
        "## Architecture Readiness Admission\n\n"
        f"Architecture-Readiness Admission: {declaration}\n\n"
        f"{reason}\n"
    )


def architecture_readiness_section(args: object) -> list[str]:
    """Return the architecture readiness lines to append, or [] if excluded.

    Respects args.include_architecture_readiness_block (default True) so that
    golden-fixture tests that set include_architecture_readiness_block=False
    continue to produce byte-identical output.
    """
    if not getattr(args, "include_architecture_readiness_block", True):
        return []
    return [_architecture_readiness_block(args), ""]
