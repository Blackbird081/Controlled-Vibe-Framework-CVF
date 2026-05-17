import json


class ProjectScorecard:

    def __init__(self, history_path="data/governance_history.json"):
        self.history_path = history_path

    def compute_average_risk(self, project):

        try:
            with open(self.history_path, "r") as f:
                history = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return 0

        records = [
            r for r in history if r["project"] == project
        ]

        if not records:
            return 0

        total = sum(r["risk_score"] for r in records)

        return round(total / len(records), 2)