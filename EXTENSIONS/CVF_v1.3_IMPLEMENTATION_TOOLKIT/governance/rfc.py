"""CVF Governance RFC (Request for Comments) Process

Enables community input on:
- New capability proposals
- Policy changes
- Version roadmap
- Ecosystem standards
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
from enum import Enum
from datetime import datetime, timedelta


class RFCStatus(Enum):
    """RFC status lifecycle"""
    DRAFT = "draft"
    OPEN_FOR_COMMENT = "open_for_comment"
    REVIEW = "review"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    SUPERSEDED = "superseded"


class RFCType(Enum):
    """Types of RFCs"""
    CAPABILITY_PROPOSAL = "capability_proposal"
    POLICY_CHANGE = "policy_change"
    ROADMAP = "roadmap"
    STANDARD = "standard"
    BREAKING_CHANGE = "breaking_change"


class VoteType(Enum):
    """Vote types"""
    APPROVE = "approve"
    REQUEST_CHANGES = "request_changes"
    REJECT = "reject"
    ABSTAIN = "abstain"


@dataclass
class RFCComment:
    """Comment on RFC"""
    id: str
    author_id: str
    content: str
    created_at: datetime = field(default_factory=datetime.utcnow)
    replies: List["RFCComment"] = field(default_factory=list)


@dataclass
class RFCVote:
    """Vote on RFC"""
    voter_id: str
    vote_type: VoteType
    reasoning: str = ""
    created_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class RFC:
    """Request for Comments document"""
    id: str
    type: RFCType
    title: str
    author_id: str
    description: str
    motivation: str
    proposal: str
    impact_assessment: str
    status: RFCStatus = RFCStatus.DRAFT
    created_at: datetime = field(default_factory=datetime.utcnow)
    open_for_comment_until: Optional[datetime] = None
    target_decision_date: Optional[datetime] = None
    
    # Discussion
    comments: List[RFCComment] = field(default_factory=list)
    votes: List[RFCVote] = field(default_factory=list)
    
    # Metadata
    labels: List[str] = field(default_factory=list)
    related_rfcs: List[str] = field(default_factory=list)
    links: Dict[str, str] = field(default_factory=dict)

    def get_vote_summary(self) -> Dict[str, int]:
        """Get vote counts by type"""
        summary = {
            "approve": 0,
            "request_changes": 0,
            "reject": 0,
            "abstain": 0,
        }
        
        for vote in self.votes:
            summary[vote.vote_type.value] += 1

        return summary

    def get_approval_rate(self) -> float:
        """Get approval rate (0-1)"""
        if not self.votes:
            return 0.0
        
        approves = len([v for v in self.votes if v.vote_type == VoteType.APPROVE])
        total_votes = len([v for v in self.votes if v.vote_type != VoteType.ABSTAIN])
        
        return approves / total_votes if total_votes > 0 else 0.0

    def is_active(self) -> bool:
        """Check if RFC is still open for comment"""
        if not self.open_for_comment_until:
            return False
        return datetime.utcnow() < self.open_for_comment_until


class GovernanceRFCProcess:
    """RFC Process Manager"""

    def __init__(self, comment_period_days: int = 14, voting_period_days: int = 7):
        self.rfcs: Dict[str, RFC] = {}
        self.comment_period_days = comment_period_days
        self.voting_period_days = voting_period_days

    def create_rfc(self, rfc_type: RFCType, title: str, author_id: str,
                   description: str, motivation: str, proposal: str,
                   impact_assessment: str) -> RFC:
        """Create new RFC"""
        now = datetime.utcnow()
        
        rfc = RFC(
            id=f"rfc-{datetime.utcnow().timestamp()}",
            type=rfc_type,
            title=title,
            author_id=author_id,
            description=description,
            motivation=motivation,
            proposal=proposal,
            impact_assessment=impact_assessment,
            status=RFCStatus.DRAFT,
            created_at=now,
            open_for_comment_until=now + timedelta(days=self.comment_period_days),
            target_decision_date=now + timedelta(days=self.comment_period_days + self.voting_period_days),
        )

        self.rfcs[rfc.id] = rfc
        return rfc

    def open_for_comment(self, rfc_id: str):
        """Open RFC for community comment"""
        rfc = self.rfcs.get(rfc_id)
        if rfc:
            rfc.status = RFCStatus.OPEN_FOR_COMMENT
            rfc.open_for_comment_until = datetime.utcnow() + timedelta(days=self.comment_period_days)

    def add_comment(self, rfc_id: str, author_id: str, content: str) -> RFCComment:
        """Add comment to RFC"""
        rfc = self.rfcs.get(rfc_id)
        if not rfc:
            raise ValueError(f"RFC {rfc_id} not found")

        if not rfc.is_active():
            raise ValueError(f"RFC {rfc_id} is not open for comments")

        comment = RFCComment(
            id=f"comment-{len(rfc.comments)}",
            author_id=author_id,
            content=content,
        )

        rfc.comments.append(comment)
        return comment

    def add_vote(self, rfc_id: str, voter_id: str, vote_type: VoteType,
                reasoning: str = "") -> RFCVote:
        """Add vote on RFC"""
        rfc = self.rfcs.get(rfc_id)
        if not rfc:
            raise ValueError(f"RFC {rfc_id} not found")

        # Check if already voted (prevent duplicate votes)
        existing_vote = next((v for v in rfc.votes if v.voter_id == voter_id), None)
        if existing_vote:
            # Allow changing vote
            rfc.votes.remove(existing_vote)

        vote = RFCVote(
            voter_id=voter_id,
            vote_type=vote_type,
            reasoning=reasoning,
        )

        rfc.votes.append(vote)
        return vote

    def move_to_review(self, rfc_id: str):
        """Move RFC from comment to review phase"""
        rfc = self.rfcs.get(rfc_id)
        if rfc:
            rfc.status = RFCStatus.REVIEW
            rfc.open_for_comment_until = None

    def finalize(self, rfc_id: str, approved: bool, decision_notes: str = ""):
        """Finalize RFC decision"""
        rfc = self.rfcs.get(rfc_id)
        if not rfc:
            return

        if approved:
            rfc.status = RFCStatus.ACCEPTED
        else:
            rfc.status = RFCStatus.REJECTED

        rfc.links["decision_notes"] = decision_notes

    def get_active_rfcs(self) -> List[RFC]:
        """Get all active RFCs (open for comment)"""
        return [
            rfc for rfc in self.rfcs.values()
            if rfc.status == RFCStatus.OPEN_FOR_COMMENT and rfc.is_active()
        ]

    def get_rfc_summary(self, rfc_id: str) -> Dict[str, Any]:
        """Get RFC summary with discussion metrics"""
        rfc = self.rfcs.get(rfc_id)
        if not rfc:
            return {}

        return {
            "id": rfc.id,
            "type": rfc.type.value,
            "title": rfc.title,
            "author": rfc.author_id,
            "status": rfc.status.value,
            "created_at": rfc.created_at.isoformat(),
            "open_for_comment_until": rfc.open_for_comment_until.isoformat() if rfc.open_for_comment_until else None,
            "discussion_metrics": {
                "total_comments": len(rfc.comments),
                "total_votes": len(rfc.votes),
                "vote_summary": rfc.get_vote_summary(),
                "approval_rate": rfc.get_approval_rate(),
            },
            "is_active": rfc.is_active(),
        }

    def get_governance_stats(self) -> Dict[str, Any]:
        """Get overall governance stats"""
        stats = {
            "total_rfcs": len(self.rfcs),
            "by_status": {},
            "by_type": {},
            "recent_decisions": [],
        }

        for status in RFCStatus:
            status_rfcs = [r for r in self.rfcs.values() if r.status == status]
            stats["by_status"][status.value] = len(status_rfcs)

        for rfc_type in RFCType:
            type_rfcs = [r for r in self.rfcs.values() if r.type == rfc_type]
            stats["by_type"][rfc_type.value] = len(type_rfcs)

        # Recent decisions
        decided = [
            r for r in self.rfcs.values()
            if r.status in [RFCStatus.ACCEPTED, RFCStatus.REJECTED]
        ]
        decided.sort(key=lambda r: r.created_at, reverse=True)
        stats["recent_decisions"] = [
            {
                "id": r.id,
                "title": r.title,
                "status": r.status.value,
                "approval_rate": r.get_approval_rate(),
            }
            for r in decided[:5]
        ]

        return stats
