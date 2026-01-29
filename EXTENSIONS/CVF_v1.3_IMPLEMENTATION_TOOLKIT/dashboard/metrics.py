"""CVF Monitoring Dashboard - Metrics Collection & Visualization

Tracks:
- Skill execution metrics (success rate, latency, error rate)
- Risk level distribution
- Agent load and health
- Audit trail completeness
- Business impact metrics
"""

from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional
from enum import Enum
from datetime import datetime
import json


class MetricType(Enum):
    """Types of metrics tracked"""
    EXECUTION_SUCCESS = "execution_success"
    EXECUTION_LATENCY = "execution_latency"
    ERROR_RATE = "error_rate"
    APPROVAL_TIME = "approval_time"
    AGENT_LOAD = "agent_load"
    AUDIT_COMPLETENESS = "audit_completeness"
    BUSINESS_IMPACT = "business_impact"


@dataclass
class ExecutionMetric:
    """Single execution metric"""
    skill_id: str
    risk_level: str
    status: str  # "success", "failed", "approved", "rejected"
    latency_ms: float
    agent_id: Optional[str] = None
    approval_count: int = 0
    approval_time_seconds: Optional[float] = None
    error_message: Optional[str] = None
    timestamp: datetime = field(default_factory=datetime.utcnow)
    audit_logged: bool = False


@dataclass
class DashboardMetrics:
    """Aggregated dashboard metrics"""
    period: str  # "1h", "24h", "7d", "30d"
    total_executions: int = 0
    successful_executions: int = 0
    failed_executions: int = 0
    average_latency_ms: float = 0.0
    error_rate: float = 0.0
    
    # Risk level breakdown
    r0_count: int = 0
    r1_count: int = 0
    r2_count: int = 0
    r3_count: int = 0
    
    # Approval metrics
    total_approvals_needed: int = 0
    approvals_granted: int = 0
    approvals_rejected: int = 0
    average_approval_time_seconds: float = 0.0
    
    # Agent metrics
    agent_loads: Dict[str, int] = field(default_factory=dict)
    agent_error_rates: Dict[str, float] = field(default_factory=dict)
    
    # Audit metrics
    audit_completeness: float = 0.0  # % of executions with complete audit
    
    # Business metrics
    high_risk_success_rate: float = 0.0  # R2/R3 success rate
    human_approval_acceptance_rate: float = 0.0
    
    timestamp: datetime = field(default_factory=datetime.utcnow)


class MetricsCollector:
    """Collects execution metrics"""

    def __init__(self):
        self.metrics: List[ExecutionMetric] = []
        self.aggregated: Dict[str, DashboardMetrics] = {}

    def record_execution(self, metric: ExecutionMetric):
        """Record a skill execution metric"""
        self.metrics.append(metric)

    def get_period_metrics(self, period: str = "24h") -> DashboardMetrics:
        """Get aggregated metrics for period"""
        if period in self.aggregated:
            return self.aggregated[period]

        # Aggregate metrics for period
        now = datetime.utcnow()
        
        # Filter metrics by period
        if period == "1h":
            delta_seconds = 3600
        elif period == "24h":
            delta_seconds = 86400
        elif period == "7d":
            delta_seconds = 604800
        else:  # 30d
            delta_seconds = 2592000

        period_metrics = [
            m for m in self.metrics
            if (now - m.timestamp).total_seconds() <= delta_seconds
        ]

        # Aggregate
        agg = DashboardMetrics(period=period)
        
        if period_metrics:
            agg.total_executions = len(period_metrics)
            agg.successful_executions = len([m for m in period_metrics if m.status == "success"])
            agg.failed_executions = len([m for m in period_metrics if m.status == "failed"])
            agg.error_rate = agg.failed_executions / agg.total_executions if agg.total_executions > 0 else 0

            # Latency
            latencies = [m.latency_ms for m in period_metrics if m.latency_ms > 0]
            agg.average_latency_ms = sum(latencies) / len(latencies) if latencies else 0

            # Risk levels
            agg.r0_count = len([m for m in period_metrics if m.risk_level == "R0"])
            agg.r1_count = len([m for m in period_metrics if m.risk_level == "R1"])
            agg.r2_count = len([m for m in period_metrics if m.risk_level == "R2"])
            agg.r3_count = len([m for m in period_metrics if m.risk_level == "R3"])

            # Approval metrics
            agg.total_approvals_needed = len([m for m in period_metrics if m.approval_count > 0])
            agg.approvals_granted = len([m for m in period_metrics if m.status == "approved"])
            agg.approvals_rejected = len([m for m in period_metrics if m.status == "rejected"])
            
            approval_times = [m.approval_time_seconds for m in period_metrics if m.approval_time_seconds]
            agg.average_approval_time_seconds = sum(approval_times) / len(approval_times) if approval_times else 0

            # Audit completeness
            audited = len([m for m in period_metrics if m.audit_logged])
            agg.audit_completeness = audited / agg.total_executions if agg.total_executions > 0 else 0

            # High-risk success rate
            high_risk = [m for m in period_metrics if m.risk_level in ["R2", "R3"]]
            high_risk_success = len([m for m in high_risk if m.status == "success"])
            agg.high_risk_success_rate = high_risk_success / len(high_risk) if high_risk else 1.0

            # Human approval acceptance
            human_reviewed = [m for m in period_metrics if m.approval_count > 0]
            accepted = len([m for m in human_reviewed if m.status in ["success", "approved"]])
            agg.human_approval_acceptance_rate = accepted / len(human_reviewed) if human_reviewed else 1.0

        self.aggregated[period] = agg
        return agg

    def get_agent_health(self) -> Dict[str, Dict[str, Any]]:
        """Get health status for each agent"""
        agent_metrics = {}

        for metric in self.metrics:
            if not metric.agent_id:
                continue
                
            if metric.agent_id not in agent_metrics:
                agent_metrics[metric.agent_id] = {
                    "total": 0,
                    "successful": 0,
                    "failed": 0,
                    "avg_latency": 0,
                    "error_rate": 0,
                    "last_execution": None,
                }

            agent_metrics[metric.agent_id]["total"] += 1
            if metric.status == "success":
                agent_metrics[metric.agent_id]["successful"] += 1
            elif metric.status == "failed":
                agent_metrics[metric.agent_id]["failed"] += 1
                
            agent_metrics[metric.agent_id]["last_execution"] = metric.timestamp.isoformat()

            # Calculate error rate
            total = agent_metrics[metric.agent_id]["total"]
            failed = agent_metrics[metric.agent_id]["failed"]
            agent_metrics[metric.agent_id]["error_rate"] = failed / total if total > 0 else 0

        return agent_metrics

    def to_dashboard_view(self, period: str = "24h") -> Dict[str, Any]:
        """Convert metrics to dashboard view"""
        metrics = self.get_period_metrics(period)
        
        return {
            "period": period,
            "summary": {
                "total_executions": metrics.total_executions,
                "success_rate": (metrics.successful_executions / metrics.total_executions * 100) if metrics.total_executions > 0 else 0,
                "error_rate": metrics.error_rate * 100,
                "average_latency_ms": round(metrics.average_latency_ms, 2),
            },
            "risk_distribution": {
                "R0": metrics.r0_count,
                "R1": metrics.r1_count,
                "R2": metrics.r2_count,
                "R3": metrics.r3_count,
            },
            "approvals": {
                "total_needed": metrics.total_approvals_needed,
                "granted": metrics.approvals_granted,
                "rejected": metrics.approvals_rejected,
                "acceptance_rate": (metrics.approvals_granted / metrics.total_approvals_needed * 100) if metrics.total_approvals_needed > 0 else 0,
                "average_approval_time_seconds": round(metrics.average_approval_time_seconds, 2),
            },
            "quality_metrics": {
                "audit_completeness": metrics.audit_completeness * 100,
                "high_risk_success_rate": metrics.high_risk_success_rate * 100,
                "human_approval_acceptance_rate": metrics.human_approval_acceptance_rate * 100,
            },
            "agent_health": self.get_agent_health(),
            "timestamp": metrics.timestamp.isoformat(),
        }
