from compliance_layer.severity_matrix import SEVERITY_MATRIX


class PolicyEngine:

    def evaluate(self, issues: list):
        critical = 0
        high = 0
        medium = 0

        for issue in issues:
            severity = SEVERITY_MATRIX.get(issue, "medium")
            if severity == "critical":
                critical += 1
            elif severity == "high":
                high += 1
            else:
                medium += 1

        score = 100 - (critical * 50 + high * 20 + medium * 10)
        score = max(score, 0)

        if critical > 0:
            status = "REJECTED"
        elif score < 80:
            status = "MANUAL_REVIEW"
        else:
            status = "APPROVED"

        return {
            "status": status,
            "score": score,
            "critical": critical,
            "high": high,
            "medium": medium
        }