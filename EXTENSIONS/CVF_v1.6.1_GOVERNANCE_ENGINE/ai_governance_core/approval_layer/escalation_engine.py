class EscalationEngine:

    def escalate_if_needed(self, decision):

        if decision == "REJECTED":
            return "EXECUTIVE_REVIEW_REQUIRED"

        if decision == "FROZEN":
            return "AI_GOVERNANCE_ADMIN_REVIEW"

        return None