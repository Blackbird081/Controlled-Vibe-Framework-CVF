from compliance_layer.compliance_engine import ComplianceEngine
from brand_control_layer.brand_guardian import BrandGuardian
from .audit_logger import AuditLogger
from override_layer.override_engine import OverrideEngine
from telemetry_layer.telemetry_exporter import TelemetryExporter


class GovernanceOrchestrator:

    def __init__(self):
        self.compliance = ComplianceEngine()
        self.brand = BrandGuardian()
        self.audit = AuditLogger()
        self.telemetry = TelemetryExporter()

        self.override = OverrideEngine(
            registry_path="override_layer/override_registry.json",
            schema_path="override_layer/override_schema.json"
        )

    def evaluate(self, html, css, approved_system, new_system, project):

        compliance_result = self.compliance.validate(html, css)
        brand_result = self.brand.protect(
            approved_system,
            new_system
        )

        final_status = "APPROVED"
        override_used = False

        if compliance_result["status"] == "REJECTED":
            if not self.override.is_override_allowed(project, "COMPLIANCE"):
                final_status = "REJECTED"
            else:
                override_used = True

        if brand_result["freeze"]["freeze"]:
            if not self.override.is_override_allowed(project, "BRAND_DRIFT"):
                final_status = "FROZEN"
            else:
                override_used = True

        result = {
            "compliance": compliance_result,
            "brand": brand_result,
            "override_used": override_used,
            "final_status": final_status
        }

        self.audit.log(project, result)

        telemetry_record = self.telemetry.export(project, result)

        result["telemetry"] = telemetry_record

        return result