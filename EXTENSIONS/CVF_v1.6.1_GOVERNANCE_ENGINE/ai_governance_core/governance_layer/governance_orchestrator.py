"""
governance_orchestrator.py

DEPRECATED — Use core_orchestrator.CoreOrchestrator instead.
--------------------------------------------------------------

This module is retained for backward-compatibility only.
It delegates to CoreOrchestrator with compliance + brand components injected.

Migration: Replace `GovernanceOrchestrator()` with `CoreOrchestrator(...)`,
injecting compliance_engine, brand_guardian, and override_engine via DI.
"""

import warnings
from compliance_layer.compliance_engine import ComplianceEngine
from brand_control_layer.brand_guardian import BrandGuardian
from .audit_logger import AuditLogger
from override_layer.override_engine import OverrideEngine
from telemetry_layer.telemetry_exporter import TelemetryExporter


class GovernanceOrchestrator:
    """
    DEPRECATED — Thin facade around CoreOrchestrator.

    Retained for backward compatibility with code that calls
    `GovernanceOrchestrator().evaluate(html, css, ...)`.
    New code should use CoreOrchestrator with DI.
    """

    def __init__(self):
        warnings.warn(
            "GovernanceOrchestrator is deprecated. Use CoreOrchestrator with "
            "compliance_engine, brand_guardian, override_engine injected via DI.",
            DeprecationWarning,
            stacklevel=2
        )
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