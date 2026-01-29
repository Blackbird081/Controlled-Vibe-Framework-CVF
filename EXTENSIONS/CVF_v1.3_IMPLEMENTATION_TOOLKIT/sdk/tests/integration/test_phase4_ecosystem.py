"""Phase 4: Ecosystem tests"""

import pytest
from datetime import datetime

from ..community.platform import RFCPlatform
from ..integrations.framework import IntegrationFramework, IntegrationCategory
from ..governance.ecosystem import EcosystemGovernance, SupportTier


class TestCommunityPlatform:
    """Test community RFC platform"""
    
    def test_member_registration(self):
        """Test community member registration"""
        platform = RFCPlatform()
        
        member = platform.register_member("alice", "alice@cvf.io")
        
        assert member.username == "alice"
        assert member.email == "alice@cvf.io"
        assert member.contributions == 0
    
    def test_rfc_publication_notifications(self):
        """Test RFC publication sends notifications"""
        platform = RFCPlatform()
        
        # Register members
        m1 = platform.register_member("alice", "alice@cvf.io")
        m2 = platform.register_member("bob", "bob@cvf.io")
        
        # Publish RFC
        platform.publish_rfc_to_community(
            "rfc-1",
            "Add Routing Engine",
            "https://github.com/..."
        )
        
        # Check notifications sent
        assert len(platform.notifications) == 2
        assert all(n.type.value == "rfc_opened" for n in platform.notifications)
    
    def test_community_voting(self):
        """Test community voting on RFC"""
        platform = RFCPlatform()
        
        member = platform.register_member("voter", "voter@cvf.io")
        platform.publish_rfc_to_community("rfc-1", "Test", "url")
        platform.start_community_voting("rfc-1")
        
        discussion = platform.rfc_discussions["rfc-1"]
        assert discussion["voting_status"] == "open"


class TestIntegrationFramework:
    """Test partner integration framework"""
    
    def test_partner_registration(self):
        """Test registering new partner"""
        framework = IntegrationFramework()
        
        partner = framework.register_partner(
            name="Claude Provider",
            category=IntegrationCategory.LLM_PROVIDER,
            website="https://anthropic.com",
            contact_email="partner@anthropic.com",
            description="Claude AI integration"
        )
        
        assert partner.name == "Claude Provider"
        assert partner.category == IntegrationCategory.LLM_PROVIDER
    
    def test_partner_certification(self):
        """Test partner certification process"""
        framework = IntegrationFramework()
        
        partner = framework.register_partner(
            "Test Partner",
            IntegrationCategory.LLM_PROVIDER,
            "https://test.com",
            "test@test.com",
            "Test integration"
        )
        
        result = framework.certify_partner(partner.id, 85, "Passed all checks")
        
        assert result["status"] == "success"
        assert partner.certification_score == 85
    
    def test_skill_publication(self):
        """Test publishing skill from partner"""
        framework = IntegrationFramework()
        
        partner = framework.register_partner(
            "Test",
            IntegrationCategory.LLM_PROVIDER,
            "https://test.com",
            "test@test.com",
            "Test"
        )
        framework.certify_partner(partner.id, 90)
        
        skill = framework.publish_skill(
            partner.id,
            "Query Skill",
            "query-001",
            "1.0.0",
            "R0",
            "https://docs.com",
            "https://github.com/..."
        )
        
        assert skill.skill_name == "Query Skill"
        assert partner.active_skills == 1
    
    def test_skill_rating(self):
        """Test rating/reviewing skills"""
        framework = IntegrationFramework()
        
        partner = framework.register_partner(
            "Test",
            IntegrationCategory.LLM_PROVIDER,
            "https://test.com",
            "test@test.com",
            "Test"
        )
        framework.certify_partner(partner.id, 90)
        
        skill = framework.publish_skill(
            partner.id,
            "Query",
            "query-001",
            "1.0.0",
            "R0",
            "https://docs.com",
            "https://github.com/..."
        )
        
        framework.rate_skill(skill.id, 4.5, "Great skill!")
        
        assert skill.ratings == 4.5
        assert skill.num_reviews == 1
    
    def test_marketplace_catalog(self):
        """Test marketplace catalog generation"""
        framework = IntegrationFramework()
        
        partner = framework.register_partner(
            "Test",
            IntegrationCategory.LLM_PROVIDER,
            "https://test.com",
            "test@test.com",
            "Test"
        )
        framework.certify_partner(partner.id, 90)
        
        framework.publish_skill(
            partner.id, "Skill 1", "s1", "1.0.0", "R0",
            "https://docs.com", "https://github.com/..."
        )
        framework.publish_skill(
            partner.id, "Skill 2", "s2", "1.0.0", "R1",
            "https://docs.com", "https://github.com/..."
        )
        
        catalog = framework.get_marketplace_catalog()
        assert catalog["total_skills"] == 2


class TestEcosystemGovernance:
    """Test ecosystem governance"""
    
    def test_partner_agreement_creation(self):
        """Test creating partner agreement"""
        governance = EcosystemGovernance()
        
        agreement = governance.create_partner_agreement(
            "partner-1",
            "Test Partner",
            "llm_provider",
            SupportTier.PREMIUM
        )
        
        assert agreement.partner_id == "partner-1"
        assert agreement.sla.tier == SupportTier.PREMIUM
    
    def test_onboarding_checklist(self):
        """Test partner onboarding checklist"""
        governance = EcosystemGovernance()
        
        agreement = governance.create_partner_agreement(
            "partner-1",
            "Test Partner",
            "llm_provider"
        )
        
        # Initially incomplete
        assert not agreement.onboarding_checklist.is_complete()
        assert agreement.onboarding_checklist.get_progress() == 0.0
        
        # Complete all items
        for key in agreement.onboarding_checklist.items:
            agreement.onboarding_checklist.items[key] = True
        
        assert agreement.onboarding_checklist.is_complete()
        assert agreement.onboarding_checklist.get_progress() == 100.0
    
    def test_agreement_signing(self):
        """Test signing partner agreement"""
        governance = EcosystemGovernance()
        
        agreement = governance.create_partner_agreement(
            "partner-1",
            "Test Partner",
            "llm_provider"
        )
        
        # Try to sign incomplete agreement
        result = agreement.sign_agreement()
        assert result["status"] == "error"
        
        # Complete checklist and sign
        for key in agreement.onboarding_checklist.items:
            agreement.onboarding_checklist.items[key] = True
        
        result = agreement.sign_agreement()
        assert result["status"] == "success"
        assert agreement.signed_at is not None
    
    def test_sla_management(self):
        """Test SLA tier management"""
        governance = EcosystemGovernance()
        
        agreement = governance.create_partner_agreement(
            "partner-1",
            "Test Partner",
            "llm_provider",
            SupportTier.STANDARD
        )
        
        assert agreement.sla.response_time_hours == 24
        
        # Upgrade to Premium
        agreement.update_sla(SupportTier.PREMIUM)
        assert agreement.sla.response_time_hours == 4
    
    def test_dispute_filing(self):
        """Test filing ecosystem dispute"""
        governance = EcosystemGovernance()
        
        result = governance.file_dispute(
            "partner-1",
            "partner-2",
            "sla_breach",
            "Partner failed to meet SLA"
        )
        
        assert result["status"] == "filed"
        assert "case_id" in result
        assert "due_date" in result
    
    def test_governance_dashboard(self):
        """Test governance dashboard"""
        governance = EcosystemGovernance()
        
        # Create some agreements
        governance.create_partner_agreement("p1", "Partner 1", "llm_provider")
        governance.create_partner_agreement("p2", "Partner 2", "workflow")
        
        dashboard = governance.get_governance_dashboard()
        
        assert dashboard["total_partners"] == 2
        assert dashboard["open_disputes"] == 0
