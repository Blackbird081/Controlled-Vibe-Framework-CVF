"""CVF Partner Integration Framework

Enables integration with:
- LLM providers (Claude, ChatGPT, Ollama, Gemini)
- Workflow platforms (Zapier, Make, n8n)
- Enterprise systems (Salesforce, ServiceNow)
- Observability tools (Datadog, New Relic, Splunk)
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any, Callable
from enum import Enum
from datetime import datetime
import json


class IntegrationCategory(Enum):
    """Partner integration categories"""
    LLM_PROVIDER = "llm_provider"
    WORKFLOW = "workflow"
    ENTERPRISE = "enterprise"
    OBSERVABILITY = "observability"
    SKILL_MARKETPLACE = "skill_marketplace"


class IntegrationStatus(Enum):
    """Integration status in ecosystem"""
    DEVELOPMENT = "development"
    CERTIFIED = "certified"
    PRODUCTION = "production"
    DEPRECATED = "deprecated"


@dataclass
class IntegrationPartner:
    """Partner company/project in CVF ecosystem"""
    id: str
    name: str
    category: IntegrationCategory
    website: str
    contact_email: str
    description: str
    status: IntegrationStatus = IntegrationStatus.DEVELOPMENT
    created_at: datetime = field(default_factory=datetime.utcnow)
    certified_at: Optional[datetime] = None
    certification_score: float = 0.0  # 0-100
    active_skills: int = 0
    monthly_executions: int = 0
    support_level: str = "standard"  # standard, premium, enterprise


@dataclass
class SkillIntegration:
    """Individual skill integrated from partner"""
    id: str
    partner_id: str
    skill_name: str
    skill_id: str
    version: str
    risk_level: str  # R0-R3
    status: str  # draft, published, deprecated
    downloads: int = 0
    ratings: float = 0.0  # 0-5
    num_reviews: int = 0
    published_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    documentation_url: str = ""
    source_repository: str = ""


class IntegrationFramework:
    """Framework for managing partner integrations"""
    
    def __init__(self):
        self.partners: Dict[str, IntegrationPartner] = {}
        self.skills: Dict[str, SkillIntegration] = {}
        self.integrations: Dict[str, Dict[str, Any]] = {}
        self.certification_requirements: Dict[str, List[str]] = self._init_requirements()
    
    def _init_requirements(self) -> Dict[str, List[str]]:
        """Initialize certification requirements by category"""
        return {
            IntegrationCategory.LLM_PROVIDER.value: [
                "support_skill_contract_v1",
                "implement_routing_compatibility",
                "provide_audit_logging",
                "handle_approval_workflows",
                "support_fallback_chains",
            ],
            IntegrationCategory.WORKFLOW.value: [
                "trigger_on_skill_events",
                "support_risk_levels",
                "preserve_audit_trail",
                "handle_approvals",
                "provide_error_handling",
            ],
            IntegrationCategory.ENTERPRISE.value: [
                "sso_integration",
                "audit_compliance",
                "role_based_access",
                "workflow_integration",
                "metrics_export",
            ],
            IntegrationCategory.OBSERVABILITY.value: [
                "ingest_metrics",
                "alert_on_anomalies",
                "custom_dashboards",
                "log_aggregation",
                "sla_tracking",
            ],
        }
    
    def register_partner(self, name: str, category: IntegrationCategory,
                        website: str, contact_email: str,
                        description: str) -> IntegrationPartner:
        """Register new integration partner"""
        
        partner = IntegrationPartner(
            id=f"partner-{len(self.partners)}",
            name=name,
            category=category,
            website=website,
            contact_email=contact_email,
            description=description,
        )
        
        self.partners[partner.id] = partner
        return partner
    
    def certify_partner(self, partner_id: str, certification_score: float,
                       reviewer_notes: str = "") -> Dict[str, Any]:
        """Certify partner for production use"""
        
        partner = self.partners.get(partner_id)
        if not partner:
            raise ValueError(f"Partner {partner_id} not found")
        
        # Verify certification requirements
        requirements = self.certification_requirements.get(partner.category.value, [])
        
        if certification_score < 80:
            return {
                "status": "failed",
                "message": f"Score {certification_score}/100 below threshold (80)",
                "required_fixes": requirements,
            }
        
        partner.status = IntegrationStatus.CERTIFIED
        partner.certified_at = datetime.utcnow()
        partner.certification_score = certification_score
        
        # Move to production
        partner.status = IntegrationStatus.PRODUCTION
        
        return {
            "status": "success",
            "partner": partner.name,
            "certification_score": certification_score,
            "certified_at": partner.certified_at.isoformat(),
            "next_review": "2026-07-29",  # Annual review
        }
    
    def publish_skill(self, partner_id: str, skill_name: str, 
                     skill_id: str, version: str, risk_level: str,
                     documentation_url: str, source_repository: str) -> SkillIntegration:
        """Publish partner skill to marketplace"""
        
        partner = self.partners.get(partner_id)
        if not partner:
            raise ValueError(f"Partner {partner_id} not found")
        
        if partner.status != IntegrationStatus.PRODUCTION:
            raise ValueError(f"Partner must be certified for production")
        
        skill = SkillIntegration(
            id=f"skill-{len(self.skills)}",
            partner_id=partner_id,
            skill_name=skill_name,
            skill_id=skill_id,
            version=version,
            risk_level=risk_level,
            status="published",
            published_at=datetime.utcnow(),
            documentation_url=documentation_url,
            source_repository=source_repository,
        )
        
        self.skills[skill.id] = skill
        partner.active_skills += 1
        
        return skill
    
    def rate_skill(self, skill_id: str, rating: float, 
                   review_text: str = "") -> Dict[str, Any]:
        """Submit rating/review for partner skill"""
        
        skill = self.skills.get(skill_id)
        if not skill:
            raise ValueError(f"Skill {skill_id} not found")
        
        if not 0 <= rating <= 5:
            raise ValueError("Rating must be 0-5")
        
        # Update running average
        old_total = skill.ratings * skill.num_reviews
        skill.num_reviews += 1
        skill.ratings = (old_total + rating) / skill.num_reviews
        
        return {
            "skill_id": skill_id,
            "new_rating": round(skill.ratings, 2),
            "total_reviews": skill.num_reviews,
        }
    
    def get_partner_profile(self, partner_id: str) -> Dict[str, Any]:
        """Get detailed partner profile"""
        
        partner = self.partners.get(partner_id)
        if not partner:
            return {}
        
        # Get partner's skills
        partner_skills = [s for s in self.skills.values() 
                         if s.partner_id == partner_id]
        
        # Calculate metrics
        total_downloads = sum(s.downloads for s in partner_skills)
        avg_rating = (sum(s.ratings * s.num_reviews for s in partner_skills) /
                     sum(s.num_reviews for s in partner_skills)) if partner_skills else 0
        
        return {
            "id": partner.id,
            "name": partner.name,
            "category": partner.category.value,
            "status": partner.status.value,
            "website": partner.website,
            "description": partner.description,
            "certification_score": partner.certification_score,
            "certified_at": partner.certified_at.isoformat() if partner.certified_at else None,
            "active_skills": partner.active_skills,
            "total_downloads": total_downloads,
            "average_skill_rating": round(avg_rating, 2),
            "monthly_executions": partner.monthly_executions,
            "support_level": partner.support_level,
        }
    
    def get_marketplace_catalog(self) -> Dict[str, Any]:
        """Get skill marketplace catalog"""
        
        skills_by_category = {}
        for skill in self.skills.values():
            if skill.status == "published":
                partner = self.partners.get(skill.partner_id)
                category = partner.category.value if partner else "unknown"
                
                if category not in skills_by_category:
                    skills_by_category[category] = []
                
                skills_by_category[category].append({
                    "id": skill.id,
                    "name": skill.skill_name,
                    "partner": partner.name if partner else "Unknown",
                    "risk_level": skill.risk_level,
                    "rating": round(skill.ratings, 2),
                    "downloads": skill.downloads,
                    "documentation": skill.documentation_url,
                })
        
        return {
            "total_skills": len([s for s in self.skills.values() 
                               if s.status == "published"]),
            "total_partners": len([p for p in self.partners.values()
                                 if p.status == IntegrationStatus.PRODUCTION]),
            "by_category": skills_by_category,
        }
    
    def get_integration_metrics(self) -> Dict[str, Any]:
        """Get ecosystem integration metrics"""
        
        partners = list(self.partners.values())
        skills = list(self.skills.values())
        
        return {
            "total_partners": len(partners),
            "certified_partners": len([p for p in partners 
                                     if p.status == IntegrationStatus.PRODUCTION]),
            "total_skills": len(skills),
            "published_skills": len([s for s in skills if s.status == "published"]),
            "total_downloads": sum(s.downloads for s in skills),
            "total_monthly_executions": sum(p.monthly_executions for p in partners),
            "average_skill_rating": (sum(s.ratings * s.num_reviews for s in skills) /
                                   sum(s.num_reviews for s in skills) 
                                   if any(s.num_reviews for s in skills) else 0),
            "market_growth": {
                "partners_last_30_days": len([p for p in partners 
                                            if (datetime.utcnow() - p.created_at).days <= 30]),
                "skills_last_30_days": len([s for s in skills 
                                          if s.published_at and 
                                          (datetime.utcnow() - s.published_at).days <= 30]),
            },
        }
