class EnforcementEngine:

    def decide(self, actions):

        if "REJECT" in actions:
            return "REJECTED"

        if "REVIEW" in actions:
            return "MANUAL_REVIEW"

        return "APPROVED"