class FreezeEngine:

    FREEZE_THRESHOLD = 30

    def evaluate(self, drift_result):
        if drift_result["drift_score"] >= self.FREEZE_THRESHOLD:
            return {
                "freeze": True,
                "reason": "Brand drift exceeds threshold"
            }

        if "color.primary" in drift_result["changed_tokens"]:
            return {
                "freeze": True,
                "reason": "Primary brand color changed"
            }

        return {
            "freeze": False
        }