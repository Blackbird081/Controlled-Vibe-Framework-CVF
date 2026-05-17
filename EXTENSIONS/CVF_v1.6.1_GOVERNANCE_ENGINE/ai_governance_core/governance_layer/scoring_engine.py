class ScoringEngine:

    SEVERITY_WEIGHTS = {
        "critical": 50,
        "high": 20,
        "medium": 10,
        "low": 5
    }

    def calculate_score(self, failures, all_rules):
        score = 100

        for rule in all_rules:
            if rule["id"] in failures:
                weight = self.SEVERITY_WEIGHTS.get(rule["severity"], 0)
                score -= weight

        return max(score, 0)