class RiskCalculator:

    def calculate(self, compliance_result, brand_result, override_used):

        compliance_score = compliance_result["score"]
        drift_score = brand_result["drift"]["drift_score"]

        risk = 0

        risk += (100 - compliance_score) * 0.5
        risk += drift_score * 0.4

        if override_used:
            risk += 15

        risk = min(100, risk)

        return round(risk, 2)