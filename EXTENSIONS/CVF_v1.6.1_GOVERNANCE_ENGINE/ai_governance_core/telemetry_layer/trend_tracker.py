import json
import threading

_trend_lock = threading.Lock()


class TrendTracker:

    def __init__(self, history_path="data/governance_history.json"):
        self.history_path = history_path

    def calculate_trend(self, project):

        with _trend_lock:
            try:
                with open(self.history_path, "r") as f:
                    history = json.load(f)
            except (FileNotFoundError, json.JSONDecodeError):
                return None

        project_records = [
            r for r in history if r["project"] == project
        ]

        if len(project_records) < 2:
            return "INSUFFICIENT_DATA"

        latest = project_records[-1]["risk_score"]
        previous = project_records[-2]["risk_score"]

        if latest > previous:
            return "RISK_INCREASING"
        elif latest < previous:
            return "RISK_DECREASING"
        else:
            return "STABLE"