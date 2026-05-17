import { EVENT_DELTAS, EventType, ReputationEvent, ReputationProfile, ReputationSummary } from "./types";
import { ScoreCalculator } from "./score.calculator";

let eventCounter = 0;

function nextEventId(): string {
  eventCounter++;
  return `REP-${String(eventCounter).padStart(4, "0")}`;
}

export function resetEventCounter(): void {
  eventCounter = 0;
}

export class ReputationSystem {
  private profiles: Map<string, ReputationProfile> = new Map();
  private events: ReputationEvent[] = [];
  private calculator: ScoreCalculator;
  private initialScore: number;

  constructor(initialScore: number = 30) {
    this.calculator = new ScoreCalculator();
    this.initialScore = initialScore;
  }

  register(agentId: string): ReputationProfile {
    if (this.profiles.has(agentId)) return this.profiles.get(agentId)!;

    const now = Date.now();
    const profile: ReputationProfile = {
      agentId,
      score: this.initialScore,
      tier: this.calculator.tierFromScore(this.initialScore),
      totalEvents: 0,
      successCount: 0,
      failureCount: 0,
      violationCount: 0,
      commendationCount: 0,
      createdAt: now,
      lastUpdatedAt: now,
    };
    this.profiles.set(agentId, profile);
    return profile;
  }

  getProfile(agentId: string): ReputationProfile | undefined {
    return this.profiles.get(agentId);
  }

  recordEvent(agentId: string, type: EventType, reason: string = "", metadata: Record<string, unknown> = {}): ReputationEvent | undefined {
    const profile = this.profiles.get(agentId);
    if (!profile) return undefined;

    const delta = EVENT_DELTAS[type];
    const event: ReputationEvent = {
      id: nextEventId(),
      agentId,
      type,
      delta,
      reason,
      timestamp: Date.now(),
      metadata,
    };
    this.events.push(event);

    profile.score = this.calculator.clamp(profile.score + delta);
    profile.tier = this.calculator.tierFromScore(profile.score);
    profile.totalEvents++;
    profile.lastUpdatedAt = Date.now();

    switch (type) {
      case "task_completed":
      case "bid_accepted":
        profile.successCount++;
        break;
      case "task_failed":
      case "bid_rejected":
        profile.failureCount++;
        break;
      case "violation":
        profile.violationCount++;
        break;
      case "commendation":
        profile.commendationCount++;
        break;
    }

    return event;
  }

  getHistory(agentId: string): ReputationEvent[] {
    return this.events.filter((e) => e.agentId === agentId);
  }

  getRecentHistory(agentId: string, count: number = 10): ReputationEvent[] {
    return this.getHistory(agentId).slice(-count);
  }

  summarize(agentId: string): ReputationSummary | undefined {
    const profile = this.profiles.get(agentId);
    if (!profile) return undefined;

    const history = this.getHistory(agentId);
    const recentDeltas = history.slice(-10).map((e) => e.delta);

    return {
      agentId,
      score: profile.score,
      tier: profile.tier,
      successRate: this.calculator.successRate(profile.successCount, profile.totalEvents),
      totalEvents: profile.totalEvents,
      recentTrend: this.calculator.trend(recentDeltas),
    };
  }

  leaderboard(limit: number = 10): ReputationProfile[] {
    return [...this.profiles.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  findByTier(tier: string): ReputationProfile[] {
    return [...this.profiles.values()].filter((p) => p.tier === tier);
  }

  count(): number {
    return this.profiles.size;
  }

  clear(): void {
    this.profiles.clear();
    this.events = [];
  }
}
