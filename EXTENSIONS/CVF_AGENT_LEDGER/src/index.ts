export { Marketplace, resetTaskCounter, resetBidCounter } from "./task-marketplace/marketplace";
export { TaskRegistry } from "./task-marketplace/task.registry";
export { BidManager } from "./task-marketplace/bid.manager";
export type {
  TaskStatus,
  TaskPriority,
  BidStatus,
  Task,
  Bid,
  TaskResult,
} from "./task-marketplace/types";

export { ReputationSystem, resetEventCounter } from "./reputation/reputation.system";
export { ScoreCalculator } from "./reputation/score.calculator";
export type {
  ReputationTier,
  EventType,
  ReputationProfile,
  ReputationEvent,
  ReputationSummary,
} from "./reputation/types";
export { TIER_THRESHOLDS, EVENT_DELTAS } from "./reputation/types";

export const AGENT_LEDGER_MERGE = {
  executionClass: "physical merge",
  mergedFrom: [
    "EXTENSIONS/CVF_ECO_v3.0_TASK_MARKETPLACE",
    "EXTENSIONS/CVF_ECO_v3.1_REPUTATION",
  ],
  compatibilityWrappersRequired: true,
} as const;
