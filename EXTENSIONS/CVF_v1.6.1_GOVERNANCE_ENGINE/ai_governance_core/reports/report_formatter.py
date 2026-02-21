"""
report_formatter.py

Unified Governance Report Formatter
------------------------------------

Purpose:
- Provide single entry point to format governance reports
- Support multiple output formats
- Ensure deterministic rendering
- Keep formatting separate from business logic

Author: Governance Engine
"""

import json
from typing import Dict, Any, Literal, Optional

from .markdown_builder import MarkdownReportBuilder


OutputFormat = Literal[
    "json",
    "json_pretty",
    "markdown",
    "audit_compact"
]


class ReportFormatter:

    def __init__(self):
        self._markdown_builder = MarkdownReportBuilder()

    # =====================================
    # PUBLIC ENTRY
    # =====================================

    def format(
        self,
        report: Dict[str, Any],
        output_format: OutputFormat = "json_pretty"
    ) -> str:
        """
        Format governance report into requested output format.
        """

        if output_format == "json":
            return self._format_json(report)

        if output_format == "json_pretty":
            return self._format_json_pretty(report)

        if output_format == "markdown":
            return self._format_markdown(report)

        if output_format == "audit_compact":
            return self._format_audit_compact(report)

        raise ValueError(f"Unsupported output format: {output_format}")

    # =====================================
    # FORMATTERS
    # =====================================

    def _format_json(self, report: Dict[str, Any]) -> str:
        """
        Compact JSON (no whitespace).
        """
        return json.dumps(report, separators=(",", ":"), ensure_ascii=False)

    def _format_json_pretty(self, report: Dict[str, Any]) -> str:
        """
        Pretty JSON for human readability.
        """
        return json.dumps(
            report,
            indent=2,
            ensure_ascii=False,
            sort_keys=False
        )

    def _format_markdown(self, report: Dict[str, Any]) -> str:
        """
        Convert to Markdown.
        """
        return self._markdown_builder.build(report)

    def _format_audit_compact(self, report: Dict[str, Any]) -> str:
        """
        Generate minimal audit trace payload.
        Designed for logging, blockchain storage, or event streaming.
        """

        audit_payload = {
            "request_id": report.get("request_summary", {}).get("request_id"),
            "artifact_id": report.get("request_summary", {}).get("artifact_id"),
            "final_decision": report.get("decision_analysis", {}).get("final_decision"),
            "risk_score": report.get("decision_analysis", {}).get("risk_score"),
            "action_target": report.get("routing_analysis", {}).get("action_target"),
            "approval_status": (
                report.get("approval_status", {}) or {}
            ).get("status"),
            "registry_state": (
                report.get("registry_state", {}) or {}
            ).get("governance_state"),
            "ledger_hash": (
                report.get("ledger_trace", {}) or {}
            ).get("latest_hash")
        }

        return json.dumps(
            audit_payload,
            separators=(",", ":"),
            ensure_ascii=False
        )