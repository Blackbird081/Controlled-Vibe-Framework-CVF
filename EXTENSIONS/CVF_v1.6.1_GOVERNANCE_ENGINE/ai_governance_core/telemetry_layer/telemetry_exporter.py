import json
import threading
from datetime import datetime
from .risk_calculator import RiskCalculator

_telemetry_lock = threading.Lock()


class TelemetryExporter:

    def __init__(self, history_path="data/governance_history.json"):
        self.history_path = history_path
        self.risk_calculator = RiskCalculator()

    def export(self, project, result):

        risk_score = self.risk_calculator.calculate(
            result.get("compliance", {}),
            result.get("brand", {}),
            result.get("override_used", False)
        )

        record = {
            "project": project,
            "timestamp": datetime.utcnow().isoformat(),
            "compliance_score": result.get("compliance", {}).get("score", 0),
            "brand_drift_score": result.get("brand", {}).get("drift", {}).get("drift_score", 0),
            "override_used": result.get("override_used", False),
            "final_status": result.get("final_status", "UNKNOWN"),
            "risk_score": risk_score
        }

        with _telemetry_lock:
            try:
                with open(self.history_path, "r") as f:
                    history = json.load(f)
            except (FileNotFoundError, json.JSONDecodeError):
                history = []

            history.append(record)

            with open(self.history_path, "w") as f:
                json.dump(history, f, indent=2)

        return record