"""
audit_logger.py

Governance Audit Logger
-----------------------

Purpose:
- Log governance evaluation results
- Provide audit trail for compliance
- Support structured JSON logging

Author: Governance Engine
"""

import json
import os
from datetime import datetime


class AuditLogger:

    def __init__(self, log_path="audit/governance_audit.json"):
        self.log_path = log_path
        os.makedirs(os.path.dirname(self.log_path), exist_ok=True)

    def log(self, project: str, result: dict):
        """Append a governance evaluation result to the audit log."""

        entry = {
            "project": project,
            "timestamp": datetime.utcnow().isoformat(),
            "final_status": result.get("final_status"),
            "override_used": result.get("override_used", False),
            "compliance_status": result.get("compliance", {}).get("status"),
            "brand_freeze": result.get("brand", {}).get("freeze", {}).get("freeze", False),
        }

        try:
            with open(self.log_path, "r") as f:
                audit_log = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            audit_log = []

        audit_log.append(entry)

        with open(self.log_path, "w") as f:
            json.dump(audit_log, f, indent=2)

        return entry
