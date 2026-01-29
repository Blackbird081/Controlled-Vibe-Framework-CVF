"""Integration tests for Phase 3 components"""

import pytest
from datetime import datetime, timedelta

# Import Phase 3 components
from ..routing.router import SkillRouter, RoutingRequest, RiskLevel, RoutingDecision
from ..dashboard.metrics import MetricsCollector, ExecutionMetric
from ..certification.program import CertificationProgram, CertificationLevel
from ..governance.rfc import GovernanceRFCProcess, RFCType


class TestSkillRoutingIntegration:
    """Integration tests for skill routing"""

    def test_end_to_end_r0_execution(self):
        """Test R0 skill routing to execution"""
        router = SkillRouter()
        
        # Register agents
        router.register_agent("executor-1", ["query", "read"])
        router.register_agent("executor-2", ["query", "read", "execute"])
        
        # Register skill
        router.register_skill("read-data", RiskLevel.R0, ["query", "read"])
        
        # Create routing request
        request = RoutingRequest(
            skill_id="read-data",
            risk_level=RiskLevel.R0,
            required_capabilities=["query", "read"]
        )
        
        # Route
        result = router.route(request)
        
        assert result.decision == RoutingDecision.AUTO_EXECUTE
        assert result.assigned_agent is not None
        assert result.approval_required_from is None

    def test_r2_routing_requires_approval(self):
        """Test R2 skill requires approval"""
        router = SkillRouter()
        
        router.register_agent("executor-1", ["deploy"], approval_roles=["manager"])
        router.register_skill("deploy-staging", RiskLevel.R2, ["deploy"])
        
        request = RoutingRequest(
            skill_id="deploy-staging",
            risk_level=RiskLevel.R2,
            required_capabilities=["deploy"]
        )
        
        result = router.route(request)
        
        assert result.decision == RoutingDecision.APPROVAL_REQUIRED
        assert result.approval_required_from is not None
        assert "approval_manager" in result.approval_required_from


class TestMonitoringIntegration:
    """Integration tests for monitoring dashboard"""

    def test_metrics_collection_and_aggregation(self):
        """Test collecting metrics and aggregating for dashboard"""
        collector = MetricsCollector()
        
        # Collect some metrics
        for i in range(10):
            metric = ExecutionMetric(
                skill_id=f"skill-{i}",
                risk_level="R0" if i < 5 else "R2",
                status="success" if i < 8 else "failed",
                latency_ms=float(100 + i * 10),
                agent_id=f"agent-{i % 3}",
                audit_logged=True
            )
            collector.record_execution(metric)
        
        # Get aggregated metrics
        dashboard = collector.to_dashboard_view("24h")
        
        assert dashboard["summary"]["total_executions"] == 10
        assert dashboard["summary"]["success_rate"] == 80.0
        assert dashboard["quality_metrics"]["audit_completeness"] == 100.0
        assert dashboard["risk_distribution"]["R0"] == 5
        assert dashboard["risk_distribution"]["R2"] == 5


class TestCertificationIntegration:
    """Integration tests for certification program"""

    def test_certification_pathway(self):
        """Test complete certification pathway"""
        program = CertificationProgram()
        
        # Verify modules exist
        catalog = program.get_catalog()
        assert len(catalog["modules"]) == 4
        
        # Check Foundation module
        foundation = program.modules["cvf-foundation-1"]
        assert foundation.level == CertificationLevel.FOUNDATION
        assert foundation.prerequisites == []
        
        # Check Practitioner has Foundation as prerequisite
        practitioner = program.modules["cvf-practitioner-1"]
        assert "cvf-foundation-1" in practitioner.prerequisites

    def test_exam_creation_and_completion(self):
        """Test exam creation and result submission"""
        program = CertificationProgram()
        
        # Create exam
        exam = program.create_exam("cvf-foundation-1")
        assert exam.id is not None
        assert len(exam.questions) > 0
        
        # Submit result
        from ..certification.program import CertificationResult
        result = CertificationResult(
            exam_id=exam.id,
            candidate_id="candidate-123",
            score=85
        )
        
        program.submit_exam_result(result)
        
        # Check certificate issued
        assert len(program.certificates_issued) > 0
        
        # Check candidate progress
        progress = program.get_candidate_progress("candidate-123")
        assert progress["total_modules_completed"] == 1


class TestGovernanceIntegration:
    """Integration tests for governance RFC process"""

    def test_rfc_lifecycle(self):
        """Test complete RFC lifecycle"""
        rfc_process = GovernanceRFCProcess(
            comment_period_days=7,
            voting_period_days=3
        )
        
        # Create RFC
        rfc = rfc_process.create_rfc(
            rfc_type=RFCType.CAPABILITY_PROPOSAL,
            title="Add Routing Engine",
            author_id="architect-1",
            description="Proposal to add skill routing engine",
            motivation="Better skill execution management",
            proposal="Implement SkillRouter with R0-R3 decision logic",
            impact_assessment="Improves efficiency by 20-30%"
        )
        
        assert rfc.status.value == "draft"
        
        # Open for comment
        rfc_process.open_for_comment(rfc.id)
        assert rfc_process.rfcs[rfc.id].status.value == "open_for_comment"
        
        # Add comments
        from ..governance.rfc import VoteType
        comment = rfc_process.add_comment(rfc.id, "user-1", "Great idea!")
        assert comment is not None
        
        # Add votes
        rfc_process.add_vote(rfc.id, "voter-1", VoteType.APPROVE)
        rfc_process.add_vote(rfc.id, "voter-2", VoteType.APPROVE)
        rfc_process.add_vote(rfc.id, "voter-3", VoteType.REQUEST_CHANGES)
        
        # Check approval rate
        rfc_summary = rfc_process.get_rfc_summary(rfc.id)
        assert rfc_summary["discussion_metrics"]["total_votes"] == 3
        assert rfc_summary["discussion_metrics"]["approval_rate"] > 0.6


class TestCrossComponentIntegration:
    """Test integration across multiple Phase 3 components"""

    def test_metrics_inform_governance_decision(self):
        """Test using metrics to inform RFC decision"""
        # Setup
        collector = MetricsCollector()
        rfc_process = GovernanceRFCProcess()
        
        # Collect metrics showing performance
        for i in range(100):
            metric = ExecutionMetric(
                skill_id="test-skill",
                risk_level="R1",
                status="success" if i < 95 else "failed",
                latency_ms=150.0,
                agent_id="agent-1",
                audit_logged=True
            )
            collector.record_execution(metric)
        
        # Create RFC based on strong metrics
        rfc = rfc_process.create_rfc(
            rfc_type=RFCType.POLICY_CHANGE,
            title="Increase R1 Automation Threshold",
            author_id="architect-1",
            description="Metrics show 95% success rate",
            motivation="Strong performance data supports automation",
            proposal="Lower R1 to R0 for proven skills",
            impact_assessment="Expected 5-10% latency improvement"
        )
        
        dashboard = collector.to_dashboard_view("24h")
        assert dashboard["summary"]["success_rate"] == 95.0
        assert rfc.id is not None
