"""
markdown_builder.py

Governance Markdown Report Builder
----------------------------------

Purpose:
- Convert governance JSON report into human-readable Markdown
- Deterministic output
- Suitable for PR comments, compliance docs, dashboards

Author: Governance Engine
"""

from typing import Dict, Any, List, Optional


class MarkdownReportBuilder:

    def build(self, report: Dict[str, Any]) -> str:
        """
        Convert structured governance report dict into Markdown string.
        """

        sections = [
            self._build_header(report),
            self._build_request_summary(report),
            self._build_decision_section(report),
            self._build_routing_section(report),
            self._build_approval_section(report),
            self._build_registry_section(report),
            self._build_ledger_section(report),
            self._build_integrity_section(report)
        ]

        # Filter out empty sections
        sections = [s for s in sections if s]

        return "\n\n".join(sections)

    # =========================
    # SECTIONS
    # =========================

    def _build_header(self, report: Dict[str, Any]) -> str:
        meta = report.get("report_metadata", {})

        return (
            f"# Governance Execution Report\n\n"
            f"- **Generated At:** {meta.get('generated_at')}\n"
            f"- **Version:** {meta.get('report_version')}\n"
            f"- **Type:** {meta.get('report_type')}"
        )

    def _build_request_summary(self, report: Dict[str, Any]) -> str:
        summary = report.get("request_summary", {})

        return (
            "## Request Summary\n\n"
            f"- **Request ID:** `{summary.get('request_id')}`\n"
            f"- **Artifact ID:** `{summary.get('artifact_id')}`"
        )

    def _build_decision_section(self, report: Dict[str, Any]) -> str:
        decision = report.get("decision_analysis", {})

        if not decision:
            return ""

        triggered_rules = decision.get("triggered_rules", [])

        rules_block = ""
        if triggered_rules:
            rules_block = "\n".join([f"  - {rule}" for rule in triggered_rules])
        else:
            rules_block = "  - None"

        return (
            "## Decision Analysis\n\n"
            f"- **Final Decision:** `{decision.get('final_decision')}`\n"
            f"- **Risk Score:** `{decision.get('risk_score')}`\n"
            f"- **Evaluated At:** {decision.get('evaluated_at')}\n\n"
            f"### Triggered Rules\n{rules_block}"
        )

    def _build_routing_section(self, report: Dict[str, Any]) -> str:
        routing = report.get("routing_analysis", {})

        if not routing:
            return ""

        return (
            "## Routing Analysis\n\n"
            f"- **Action Target:** `{routing.get('action_target')}`\n"
            f"- **Risk Score Used:** `{routing.get('risk_score_used')}`\n"
            f"- **Routed At:** {routing.get('routed_at')}"
        )

    def _build_approval_section(self, report: Dict[str, Any]) -> str:
        approval = report.get("approval_status")

        if not approval:
            return ""

        chain = approval.get("approval_chain", [])

        chain_block = ""
        if chain:
            for step in chain:
                chain_block += (
                    f"- `{step.get('role')}` "
                    f"(status: {step.get('status')}, "
                    f"approved_by: {step.get('approved_by')})\n"
                )
        else:
            chain_block = "- No approval steps defined"

        return (
            "## Approval Status\n\n"
            f"- **Status:** `{approval.get('status')}`\n"
            f"- **Current Step Index:** `{approval.get('current_step_index')}`\n"
            f"- **Expires At:** {approval.get('expires_at')}\n\n"
            f"### Approval Chain\n{chain_block.strip()}"
        )

    def _build_registry_section(self, report: Dict[str, Any]) -> str:
        registry = report.get("registry_state")

        if not registry:
            return ""

        return (
            "## Registry State\n\n"
            f"- **Artifact Status:** `{registry.get('artifact_status')}`\n"
            f"- **Governance State:** `{registry.get('governance_state')}`\n"
            f"- **Current Version:** `{registry.get('current_version')}`\n"
            f"- **Risk Level:** `{registry.get('risk_level')}`"
        )

    def _build_ledger_section(self, report: Dict[str, Any]) -> str:
        ledger = report.get("ledger_trace")

        if not ledger:
            return ""

        return (
            "## Ledger Trace\n\n"
            f"- **Ledger ID:** `{ledger.get('ledger_id')}`\n"
            f"- **Latest Block Index:** `{ledger.get('latest_block_index')}`\n"
            f"- **Latest Hash:** `{ledger.get('latest_hash')}`"
        )

    def _build_integrity_section(self, report: Dict[str, Any]) -> str:
        integrity = report.get("integrity", {})

        if not integrity:
            return ""

        return (
            "## Integrity Check\n\n"
            f"- **Has Approval:** `{integrity.get('has_approval')}`\n"
            f"- **Has Registry Snapshot:** `{integrity.get('has_registry_snapshot')}`\n"
            f"- **Has Ledger Reference:** `{integrity.get('has_ledger_reference')}`\n"
            f"- **Trace Complete:** `{integrity.get('trace_complete')}`"
        )