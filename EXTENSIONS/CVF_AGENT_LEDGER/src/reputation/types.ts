export type ReputationTier = "untrusted" | "newcomer" | "reliable" | "trusted" | "exemplary";
export type EventType = "task_completed" | "task_failed" | "violation" | "commendation" | "bid_accepted" | "bid_rejected";

export interface ReputationProfile {
  agentId: string;
  score: number;
  tier: ReputationTier;
  totalEvents: number;
  successCount: number;
  failureCount: number;
  violationCount: number;
  commendationCount: number;
  createdAt: number;
  lastUpdatedAt: number;
}

export interface ReputationEvent {
  id: string;
  agentId: string;
  type: EventType;
  delta: number;
  reason: string;
  timestamp: number;
  metadata: Record<string, unknown>;
}

export interface ReputationSummary {
  agentId: string;
  score: number;
  tier: ReputationTier;
  successRate: number;
  totalEvents: number;
  recentTrend: "improving" | "stable" | "declining";
}

export const TIER_THRESHOLDS: Record<ReputationTier, number> = {
  untrusted: 0,
  newcomer: 20,
  reliable: 50,
  trusted: 75,
  exemplary: 90,
};

export const EVENT_DELTAS: Record<EventType, number> = {
  task_completed: 5,
  task_failed: -8,
  violation: -15,
  commendation: 10,
  bid_accepted: 2,
  bid_rejected: -1,
};
