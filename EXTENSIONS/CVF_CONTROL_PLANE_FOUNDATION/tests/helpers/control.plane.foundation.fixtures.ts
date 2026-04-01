import type { KnowledgeItem } from "../../src/control.plane.knowledge.barrel";
import type { SessionSnapshot } from "../../../CVF_ECO_v2.1_GOVERNANCE_CANVAS/src/types";

export const FIXED_NOW = "2026-03-22T10:00:00.000Z";

export function makeKnowledgeItem(
  id: string,
  relevanceScore = 0.8,
  overrides: Partial<KnowledgeItem> = {},
): KnowledgeItem {
  return {
    itemId: `item-${id}`,
    title: `Title ${id}`,
    content: `Content for item ${id}`,
    relevanceScore,
    source: `source-${id}`,
    ...overrides,
  };
}

export function makeSessionSnapshot(
  overrides: Partial<SessionSnapshot> = {},
): SessionSnapshot {
  const now = Date.now();

  return {
    sessionId: "session-1",
    agentId: "agent-control",
    actionCount: 3,
    cumulativeRisk: 1.5,
    highestRisk: "R1",
    verdictCounts: {
      ALLOW: 2,
      WARN: 1,
      ESCALATE: 0,
      BLOCK: 0,
    },
    domainBreakdown: {
      finance: 3,
    },
    startedAt: now - 1000,
    endedAt: now,
    ...overrides,
  };
}
