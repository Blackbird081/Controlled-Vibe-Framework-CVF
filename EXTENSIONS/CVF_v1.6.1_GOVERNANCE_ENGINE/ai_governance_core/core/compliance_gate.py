class ComplianceGate:

    def evaluate(self, failures: list):
        if any(f.startswith("A11Y") or f.startswith("INT") for f in failures):
            return "REJECTED"
        if failures:
            return "WARNING"
        return "APPROVED"