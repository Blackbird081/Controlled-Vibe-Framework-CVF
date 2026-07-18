from compliance_layer.severity_matrix import SEVERITY_MATRIX

CVF_POLICY_ADAPTER_VERSION = "phase2b-policy-adapter-1"


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

    def evaluate_cvf_policy_adapter(self, issues: list):
        return build_cvf_policy_adapter_snapshot(self.evaluate(issues))


def map_status_to_cvf_policy_result(status: str) -> str:
    if status == "APPROVED":
        return "allow"
    if status == "MANUAL_REVIEW":
        return "requires_approval"
    if status == "REJECTED":
        return "deny"
    return "requires_approval"


def build_cvf_policy_adapter_snapshot(policy_result: dict):
    status = policy_result.get("status", "MANUAL_REVIEW")
    return {
        "adapterVersion": CVF_POLICY_ADAPTER_VERSION,
        "source": "governance-engine:core-policy-engine",
        "policyResult": map_status_to_cvf_policy_result(status),
        "status": status,
        "score": policy_result.get("score", 0),
        "counts": {
            "critical": policy_result.get("critical", 0),
            "high": policy_result.get("high", 0),
            "medium": policy_result.get("medium", 0),
        },
    }
