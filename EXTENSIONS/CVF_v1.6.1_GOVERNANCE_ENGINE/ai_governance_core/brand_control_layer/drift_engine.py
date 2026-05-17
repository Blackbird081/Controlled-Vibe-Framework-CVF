DRIFT_WEIGHTS = {
    "color.primary": 40,
    "color.secondary": 20,
    "font.heading": 20,
    "font.body": 15,
    "spacing": 15,
    "radius": 10,
    "shadow": 5
}


class DriftEngine:

    def compare(self, approved_tokens: dict, new_tokens: dict):
        drift_score = 0
        changed = []

        for key, approved_value in approved_tokens.items():
            new_value = new_tokens.get(key)

            if new_value != approved_value:
                weight = DRIFT_WEIGHTS.get(key, 5)
                drift_score += weight
                changed.append(key)

        return {
            "drift_score": drift_score,
            "changed_tokens": changed
        }