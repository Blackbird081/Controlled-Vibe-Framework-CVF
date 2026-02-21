import json
from datetime import datetime
from .risk_calculator import RiskCalculator


class TelemetryExporter:

    def __init__(self, history_path="data/governance_history.json"):
        self.history_path = history_path
        self.risk_calculator = RiskCalculator()

    def export(self, project, result):

        risk_score = self.risk_calculator.calculate(
            result["compliance"],
            result["brand"],
            result["override_used"]
        )

        record = {
            "project": project,
            "timestamp": datetime.utcnow().isoformat(),
            "compliance_score": result["compliance"]["score"],
            "brand_drift_score": result["brand"]["drift"]["drift_score"],
            "override_used": result["override_used"],
            "final_status": result["final_status"],
            "risk_score": risk_score
        }

        try:
            with open(self.history_path, "r") as f:
                history = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            history = []

        history.append(record)

        with open(self.history_path, "w") as f:
            json.dump(history, f, indent=2)

        return record