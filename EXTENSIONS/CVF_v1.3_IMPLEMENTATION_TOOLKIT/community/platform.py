"""CVF Community RFC Platform

Manages RFC discussions, voting, and community engagement
Bridges internal governance with public community input
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
from enum import Enum
from datetime import datetime
import json


class NotificationType(Enum):
    """Types of community notifications"""
    RFC_OPENED = "rfc_opened"
    RFC_COMMENT = "rfc_comment"
    VOTING_STARTED = "voting_started"
    VOTING_ENDED = "voting_ended"
    DECISION_MADE = "decision_made"


@dataclass
class CommunityMember:
    """Community member profile"""
    id: str
    username: str
    email: str
    certification_level: Optional[str] = None  # Foundation, Practitioner, Architect, Specialist
    contributions: int = 0  # RFCs, comments, votes
    reputation_score: int = 0  # Based on quality contributions
    joined_at: datetime = field(default_factory=datetime.utcnow)
    last_active: Optional[datetime] = None
    verified: bool = False
    role: str = "member"  # member, moderator, steering_committee


@dataclass
class CommunityNotification:
    """Notification sent to community members"""
    id: str
    type: NotificationType
    recipient_id: str
    rfc_id: str
    title: str
    message: str
    created_at: datetime = field(default_factory=datetime.utcnow)
    read: bool = False
    action_url: Optional[str] = None


class CommunityEngagementMetrics:
    """Track community health and engagement"""
    
    def __init__(self):
        self.active_members = 0
        self.total_comments = 0
        self.total_votes = 0
        self.avg_response_time_hours = 0.0
        self.member_retention = 0.0  # % of active members from month N-1
        self.contribution_distribution = {}  # Top contributors
        
    def calculate_engagement_score(self) -> float:
        """Calculate overall community engagement (0-100)"""
        # Simple scoring: comments + votes + participation
        # More sophisticated algorithms possible
        base_score = min(100, (self.total_comments + self.total_votes) / 10)
        retention_bonus = self.member_retention * 10
        return base_score + retention_bonus


class RFCPlatform:
    """Community RFC Platform Manager"""
    
    def __init__(self):
        self.members: Dict[str, CommunityMember] = {}
        self.notifications: List[CommunityNotification] = []
        self.rfc_discussions: Dict[str, Dict[str, Any]] = {}
        self.engagement_metrics = CommunityEngagementMetrics()
    
    def register_member(self, username: str, email: str) -> CommunityMember:
        """Register new community member"""
        member = CommunityMember(
            id=f"member-{len(self.members)}",
            username=username,
            email=email,
        )
        self.members[member.id] = member
        return member
    
    def publish_rfc_to_community(self, rfc_id: str, rfc_title: str, 
                                 discussion_url: str) -> Dict[str, Any]:
        """Publish RFC to community for discussion"""
        
        # Create discussion entry
        discussion = {
            "rfc_id": rfc_id,
            "title": rfc_title,
            "published_at": datetime.utcnow().isoformat(),
            "discussion_url": discussion_url,
            "status": "open",
            "community_comments": [],
            "community_votes": [],
            "engagement_score": 0,
        }
        
        self.rfc_discussions[rfc_id] = discussion
        
        # Notify all members
        for member_id, member in self.members.items():
            notification = CommunityNotification(
                id=f"notif-{len(self.notifications)}",
                type=NotificationType.RFC_OPENED,
                recipient_id=member_id,
                rfc_id=rfc_id,
                title=f"New RFC: {rfc_title}",
                message=f"A new RFC has been opened for community feedback",
                action_url=discussion_url,
            )
            self.notifications.append(notification)
        
        return discussion
    
    def add_community_comment(self, rfc_id: str, member_id: str, 
                             comment_text: str) -> Dict[str, Any]:
        """Add comment to RFC discussion"""
        
        if rfc_id not in self.rfc_discussions:
            raise ValueError(f"RFC {rfc_id} not found")
        
        member = self.members.get(member_id)
        if not member:
            raise ValueError(f"Member {member_id} not found")
        
        comment = {
            "id": f"comment-{len(self.rfc_discussions[rfc_id]['community_comments'])}",
            "author": member.username,
            "author_id": member_id,
            "text": comment_text,
            "created_at": datetime.utcnow().isoformat(),
            "upvotes": 0,
            "replies": [],
        }
        
        self.rfc_discussions[rfc_id]["community_comments"].append(comment)
        
        # Update member activity
        member.contributions += 1
        member.last_active = datetime.utcnow()
        
        # Notify others (not the author)
        for other_id in self.members:
            if other_id != member_id:
                notification = CommunityNotification(
                    id=f"notif-{len(self.notifications)}",
                    type=NotificationType.RFC_COMMENT,
                    recipient_id=other_id,
                    rfc_id=rfc_id,
                    title=f"New comment on {self.rfc_discussions[rfc_id]['title']}",
                    message=f"{member.username} commented: {comment_text[:50]}...",
                )
                self.notifications.append(notification)
        
        return comment
    
    def start_community_voting(self, rfc_id: str) -> Dict[str, Any]:
        """Open RFC for community voting"""
        
        if rfc_id not in self.rfc_discussions:
            raise ValueError(f"RFC {rfc_id} not found")
        
        self.rfc_discussions[rfc_id]["voting_started_at"] = datetime.utcnow().isoformat()
        self.rfc_discussions[rfc_id]["voting_status"] = "open"
        
        # Notify members
        for member_id in self.members:
            notification = CommunityNotification(
                id=f"notif-{len(self.notifications)}",
                type=NotificationType.VOTING_STARTED,
                recipient_id=member_id,
                rfc_id=rfc_id,
                title=f"Voting open on {self.rfc_discussions[rfc_id]['title']}",
                message="Community voting is now open. Cast your vote!",
            )
            self.notifications.append(notification)
        
        return self.rfc_discussions[rfc_id]
    
    def get_member_dashboard(self, member_id: str) -> Dict[str, Any]:
        """Get personalized member dashboard"""
        
        member = self.members.get(member_id)
        if not member:
            return {}
        
        # Get unread notifications
        unread = [n for n in self.notifications 
                 if n.recipient_id == member_id and not n.read]
        
        # Get open RFCs
        open_rfcs = [r for r in self.rfc_discussions.values() 
                    if r["status"] == "open"]
        
        return {
            "member": {
                "username": member.username,
                "certification_level": member.certification_level,
                "contributions": member.contributions,
                "reputation_score": member.reputation_score,
            },
            "unread_notifications": len(unread),
            "active_rfcs": len(open_rfcs),
            "engagement_score": self.engagement_metrics.calculate_engagement_score(),
            "recent_notifications": [
                {
                    "type": n.type.value,
                    "title": n.title,
                    "created_at": n.created_at.isoformat(),
                }
                for n in unread[:5]
            ],
        }
    
    def get_community_stats(self) -> Dict[str, Any]:
        """Get overall community statistics"""
        
        total_comments = sum(len(d["community_comments"]) 
                           for d in self.rfc_discussions.values())
        total_votes = sum(len(d.get("community_votes", [])) 
                        for d in self.rfc_discussions.values())
        
        return {
            "total_members": len(self.members),
            "active_members": len([m for m in self.members.values() 
                                  if m.last_active is not None]),
            "total_contributions": sum(m.contributions for m in self.members.values()),
            "open_rfcs": len([r for r in self.rfc_discussions.values() 
                            if r["status"] == "open"]),
            "total_comments": total_comments,
            "total_votes": total_votes,
            "avg_response_time_hours": self.engagement_metrics.avg_response_time_hours,
            "member_retention": self.engagement_metrics.member_retention,
            "engagement_score": self.engagement_metrics.calculate_engagement_score(),
        }
    
    def mark_notification_read(self, notification_id: str):
        """Mark notification as read"""
        for notif in self.notifications:
            if notif.id == notification_id:
                notif.read = True
                break
    
    def get_top_contributors(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get top community contributors"""
        
        contributors = sorted(
            self.members.values(),
            key=lambda m: m.reputation_score,
            reverse=True
        )[:limit]
        
        return [
            {
                "username": m.username,
                "contributions": m.contributions,
                "reputation_score": m.reputation_score,
                "certification_level": m.certification_level,
            }
            for m in contributors
        ]
