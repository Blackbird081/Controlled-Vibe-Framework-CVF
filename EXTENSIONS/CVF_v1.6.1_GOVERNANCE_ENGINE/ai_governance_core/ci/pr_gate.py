import sys
from governance_layer.governance_orchestrator import GovernanceOrchestrator
from .exit_codes import ExitCodes


def run_pr_gate(html, css, approved_system, new_system, project):

    orchestrator = GovernanceOrchestrator()

    result = orchestrator.evaluate(
        html,
        css,
        approved_system,
        new_system,
        project
    )

    status = result["final_status"]

    if status == "APPROVED":
        sys.exit(ExitCodes.APPROVED)

    elif status == "MANUAL_REVIEW":
        sys.exit(ExitCodes.MANUAL_REVIEW)

    elif status == "REJECTED":
        sys.exit(ExitCodes.REJECTED)

    elif status == "FROZEN":
        sys.exit(ExitCodes.FROZEN)
    if result["override_used"]:
        print("⚠ Override applied - requires audit review")