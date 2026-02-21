class DriftDetector:

    def detect(self, approved: dict, current: dict, threshold=0.15):
        total_keys = len(approved.keys())
        changed = 0

        for key in approved:
            if approved[key] != current.get(key):
                changed += 1

        drift_ratio = changed / total_keys if total_keys else 0

        return {
            "drift_ratio": drift_ratio,
            "exceeded": drift_ratio > threshold
        }