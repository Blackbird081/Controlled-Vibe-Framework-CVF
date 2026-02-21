from .html_analyzer import HTMLAnalyzer
from .contrast_engine import ContrastEngine
from .severity_matrix import SEVERITY_MATRIX


class ComplianceEngine:

    def __init__(self):
        self.contrast = ContrastEngine()
        self.analyzer = HTMLAnalyzer(self.contrast)

    def validate(self, html_content, css_contents=None):
        issues = self.analyzer.analyze(html_content, css_contents)

        critical = 0
        high = 0
        medium = 0

        for issue in issues:
            severity = SEVERITY_MATRIX.get(issue, "medium")

            if severity == "critical":
                critical += 1
            elif severity == "high":
                high += 1
            else:
                medium += 1

        score = 100 - (critical * 50 + high * 20 + medium * 10)
        score = max(score, 0)

        status = "APPROVED"

        if critical > 0:
            status = "REJECTED"
        elif score < 80:
            status = "MANUAL_REVIEW"

        return {
            "issues": issues,
            "score": score,
            "status": status
        }