class ImpactAnalyzer:

    def compare(self, baseline_results, new_results):

        changes = 0

        for base, new in zip(baseline_results, new_results):
            if base["decision"] != new["decision"]:
                changes += 1

        impact_ratio = changes / len(baseline_results) if baseline_results else 0

        return {
            "total_cases": len(baseline_results),
            "decision_changes": changes,
            "impact_ratio": round(impact_ratio, 2)
        }