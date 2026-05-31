import {
  classifyMemoryTier,
  describeMemoryTier,
  type MemoryTier,
} from "./memory-tier-classifier.contract";

export const RUNTIME_MEMORY_HIERARCHY_CONTRACT_VERSION =
  "cvf.runtimeMemoryHierarchy.v1";

export type RuntimeMemoryAction = "write" | "retrieve" | "inject" | "reinject";

export type RuntimeMemoryActorRole =
  | "OPERATOR"
  | "GOVERNOR"
  | "HUMAN"
  | "BUILDER"
  | "AI_AGENT"
  | "REVIEWER"
  | "SERVICE_AGENT"
  | "OBSERVER"
  | "ANALYST"
  | "unknown";

export type RuntimeMemoryDecisionState =
  | "allowed"
  | "denied"
  | "requires_approval";

export type RuntimeMemorySensitivity =
  | "public"
  | "internal"
  | "confidential"
  | "restricted";

export type RuntimeMemoryContaminationBoundary =
  | "clean"
  | "unknown"
  | "tainted";

export interface RuntimeMemoryTierRule {
  tier: MemoryTier;
  privacyScope: ReturnType<typeof describeMemoryTier>["privacyScope"];
  persistenceClass: ReturnType<typeof describeMemoryTier>["persistenceClass"];
  allowedActions: RuntimeMemoryAction[];
  allowedActors: Partial<Record<RuntimeMemoryAction, RuntimeMemoryActorRole[]>>;
  durablePersistenceAllowed: boolean;
  crossSessionAccessAllowed: boolean;
  canReinject: false;
  runtimeProof:
    | "h2_working_ephemeral"
    | "t5_task_ephemeral"
    | "m1_durable_cross_session"
    | "policy_map_only";
  boundary: string;
}

export interface RuntimeMemoryActionInput {
  tier?: string;
  action: RuntimeMemoryAction;
  actorRole: RuntimeMemoryActorRole;
  sensitivity?: RuntimeMemorySensitivity;
  contaminationBoundary?: RuntimeMemoryContaminationBoundary;
  crossSession?: boolean;
  durablePersistenceRequested?: boolean;
}

export interface RuntimeMemoryActionDecision {
  contractVersion: typeof RUNTIME_MEMORY_HIERARCHY_CONTRACT_VERSION;
  tier: MemoryTier;
  action: RuntimeMemoryAction;
  actorRole: RuntimeMemoryActorRole;
  decision: RuntimeMemoryDecisionState;
  reason: string;
  privacyScope: RuntimeMemoryTierRule["privacyScope"];
  persistenceClass: RuntimeMemoryTierRule["persistenceClass"];
  canReinject: false;
  durablePersistenceAllowed: boolean;
  crossSessionAccessAllowed: boolean;
  persistentStoreCreated: boolean;
  newMemoryTierCreated: false;
}

export interface WorkingMemoryEntry {
  executionId: string;
  actorId: string;
  actorRole: RuntimeMemoryActorRole;
  createdAt: number;
  payload: Record<string, unknown>;
}

export interface WorkingMemoryWriteInput {
  executionId: string;
  actorId: string;
  actorRole: RuntimeMemoryActorRole;
  payload: Record<string, unknown>;
  sensitivity?: RuntimeMemorySensitivity;
  contaminationBoundary?: RuntimeMemoryContaminationBoundary;
  durablePersistenceRequested?: boolean;
}

export interface WorkingMemoryRetrieveInput {
  executionId: string;
  actorId: string;
  actorRole: RuntimeMemoryActorRole;
  sensitivity?: RuntimeMemorySensitivity;
  contaminationBoundary?: RuntimeMemoryContaminationBoundary;
  crossSession?: boolean;
}

export interface WorkingMemoryRuntimeResult {
  decision: RuntimeMemoryActionDecision;
  entry?: WorkingMemoryEntry;
}

export interface WorkingMemoryRuntimeStore {
  write(input: WorkingMemoryWriteInput): WorkingMemoryRuntimeResult;
  retrieve(input: WorkingMemoryRetrieveInput): WorkingMemoryRuntimeResult;
  clear(): void;
  list(): WorkingMemoryEntry[];
}

const READ_PRIVILEGED_ACTORS: RuntimeMemoryActorRole[] = [
  "OPERATOR",
  "GOVERNOR",
  "REVIEWER",
  "SERVICE_AGENT",
];

const RUNTIME_ACTORS: RuntimeMemoryActorRole[] = [
  "OPERATOR",
  "GOVERNOR",
  "HUMAN",
  "BUILDER",
  "AI_AGENT",
  "SERVICE_AGENT",
];

const REVIEW_READ_ACTORS: RuntimeMemoryActorRole[] = [
  ...RUNTIME_ACTORS,
  "REVIEWER",
  "ANALYST",
];

const TIER_RUNTIME_RULES: Record<MemoryTier, RuntimeMemoryTierRule> = {
  working: {
    ...describeMemoryTier({ tier: "working" }),
    allowedActions: ["write", "retrieve"],
    allowedActors: {
      write: RUNTIME_ACTORS,
      retrieve: REVIEW_READ_ACTORS,
    },
    durablePersistenceAllowed: false,
    crossSessionAccessAllowed: false,
    canReinject: false,
    runtimeProof: "h2_working_ephemeral",
    boundary: "ephemeral_same_execution_working_context_only",
  },
  task: {
    ...describeMemoryTier({ tier: "task" }),
    allowedActions: ["write", "retrieve"],
    allowedActors: {
      write: RUNTIME_ACTORS,
      retrieve: REVIEW_READ_ACTORS,
    },
    durablePersistenceAllowed: false,
    crossSessionAccessAllowed: false,
    canReinject: false,
    runtimeProof: "t5_task_ephemeral",
    boundary: "ephemeral_task_memory_from_t5_only",
  },
  skill: {
    ...describeMemoryTier({ tier: "skill" }),
    allowedActions: ["write", "retrieve"],
    allowedActors: {
      write: ["OPERATOR", "GOVERNOR", "BUILDER", "SERVICE_AGENT"],
      retrieve: ["OPERATOR", "GOVERNOR", "REVIEWER", "BUILDER", "SERVICE_AGENT"],
    },
    durablePersistenceAllowed: true,
    crossSessionAccessAllowed: true,
    canReinject: false,
    runtimeProof: "m1_durable_cross_session",
    boundary: "m1_policy_gated_skill_memory_summary_only",
  },
  organizational: {
    ...describeMemoryTier({ tier: "organizational" }),
    allowedActions: [],
    allowedActors: {},
    durablePersistenceAllowed: false,
    crossSessionAccessAllowed: false,
    canReinject: false,
    runtimeProof: "policy_map_only",
    boundary: "organizational_memory_not_authorized_in_h2",
  },
  "long-term": {
    ...describeMemoryTier({ tier: "long-term" }),
    allowedActions: ["write", "retrieve"],
    allowedActors: {
      write: ["OPERATOR", "GOVERNOR", "SERVICE_AGENT"],
      retrieve: ["OPERATOR", "GOVERNOR", "REVIEWER", "SERVICE_AGENT"],
    },
    durablePersistenceAllowed: true,
    crossSessionAccessAllowed: true,
    canReinject: false,
    runtimeProof: "m1_durable_cross_session",
    boundary: "m1_policy_gated_long_term_memory_summary_only",
  },
  audit: {
    ...describeMemoryTier({ tier: "audit" }),
    allowedActions: ["write", "retrieve"],
    allowedActors: {
      write: ["SERVICE_AGENT", "OPERATOR", "GOVERNOR"],
      retrieve: READ_PRIVILEGED_ACTORS,
    },
    durablePersistenceAllowed: false,
    crossSessionAccessAllowed: false,
    canReinject: false,
    runtimeProof: "policy_map_only",
    boundary: "append_only_audit_readout_no_prompt_reinjection",
  },
  receipt: {
    ...describeMemoryTier({ tier: "receipt" }),
    allowedActions: ["write", "retrieve"],
    allowedActors: {
      write: ["SERVICE_AGENT", "OPERATOR", "GOVERNOR"],
      retrieve: READ_PRIVILEGED_ACTORS,
    },
    durablePersistenceAllowed: false,
    crossSessionAccessAllowed: false,
    canReinject: false,
    runtimeProof: "policy_map_only",
    boundary: "append_only_receipt_readout_no_prompt_reinjection",
  },
};

export function listRuntimeMemoryTierRules(): RuntimeMemoryTierRule[] {
  return Object.values(TIER_RUNTIME_RULES).map(cloneTierRule);
}

export function describeRuntimeMemoryTier(
  input: Pick<RuntimeMemoryActionInput, "tier">,
): RuntimeMemoryTierRule {
  return cloneTierRule(TIER_RUNTIME_RULES[classifyMemoryTier(input)]);
}

export function evaluateRuntimeMemoryAction(
  input: RuntimeMemoryActionInput,
): RuntimeMemoryActionDecision {
  const tier = classifyMemoryTier({ tier: input.tier });
  const rule = TIER_RUNTIME_RULES[tier];
  const sensitivity = input.sensitivity ?? "internal";
  const contaminationBoundary = input.contaminationBoundary ?? "clean";

  if (input.durablePersistenceRequested && !rule.durablePersistenceAllowed) {
    return buildDecision(input, rule, "denied", "durable_persistence_not_authorized");
  }

  if (input.action === "reinject") {
    return buildDecision(input, rule, "denied", "memory_reinjection_not_authorized_in_h2");
  }

  if (input.action === "inject") {
    return buildDecision(input, rule, "denied", "memory_injection_not_authorized_in_h2");
  }

  if (input.crossSession && !rule.crossSessionAccessAllowed) {
    return buildDecision(input, rule, "denied", "cross_session_memory_access_not_authorized");
  }

  if (!rule.allowedActions.includes(input.action)) {
    return buildDecision(input, rule, "denied", `${tier}_memory_action_not_authorized`);
  }

  const allowedActors = rule.allowedActors[input.action] ?? [];
  if (!allowedActors.includes(input.actorRole)) {
    return buildDecision(input, rule, "denied", "actor_not_allowed_for_memory_tier");
  }

  if (sensitivity === "restricted" && !READ_PRIVILEGED_ACTORS.includes(input.actorRole)) {
    return buildDecision(input, rule, "requires_approval", "restricted_memory_requires_review");
  }

  if (contaminationBoundary !== "clean") {
    return buildDecision(input, rule, "denied", "contamination_boundary_blocks_memory_action");
  }

  return buildDecision(input, rule, "allowed", "runtime_memory_action_authorized");
}

export function createWorkingMemoryRuntimeStore(options: {
  now?: () => number;
} = {}): WorkingMemoryRuntimeStore {
  return new InProcessWorkingMemoryRuntimeStore(options.now ?? (() => Date.now()));
}

class InProcessWorkingMemoryRuntimeStore implements WorkingMemoryRuntimeStore {
  private readonly entries = new Map<string, WorkingMemoryEntry>();
  private readonly now: () => number;

  constructor(now: () => number) {
    this.now = now;
  }

  write(input: WorkingMemoryWriteInput): WorkingMemoryRuntimeResult {
    const decision = evaluateRuntimeMemoryAction({
      tier: "working",
      action: "write",
      actorRole: input.actorRole,
      sensitivity: input.sensitivity,
      contaminationBoundary: input.contaminationBoundary,
      durablePersistenceRequested: input.durablePersistenceRequested,
    });

    if (decision.decision !== "allowed") {
      return { decision };
    }

    const entry: WorkingMemoryEntry = {
      executionId: input.executionId,
      actorId: input.actorId,
      actorRole: input.actorRole,
      createdAt: this.now(),
      payload: { ...input.payload },
    };
    this.entries.set(input.executionId, entry);
    return { decision, entry: cloneWorkingEntry(entry) };
  }

  retrieve(input: WorkingMemoryRetrieveInput): WorkingMemoryRuntimeResult {
    const decision = evaluateRuntimeMemoryAction({
      tier: "working",
      action: "retrieve",
      actorRole: input.actorRole,
      sensitivity: input.sensitivity,
      contaminationBoundary: input.contaminationBoundary,
      crossSession: input.crossSession,
    });

    if (decision.decision !== "allowed") {
      return { decision };
    }

    const entry = this.entries.get(input.executionId);
    if (!entry) {
      return {
        decision: {
          ...decision,
          decision: "denied",
          reason: "working_memory_entry_missing",
        },
      };
    }

    if (entry.actorId !== input.actorId) {
      return {
        decision: {
          ...decision,
          decision: "denied",
          reason: "working_memory_actor_scope_mismatch",
        },
      };
    }

    return { decision, entry: cloneWorkingEntry(entry) };
  }

  clear(): void {
    this.entries.clear();
  }

  list(): WorkingMemoryEntry[] {
    return Array.from(this.entries.values()).map(cloneWorkingEntry);
  }
}

function buildDecision(
  input: RuntimeMemoryActionInput,
  rule: RuntimeMemoryTierRule,
  decision: RuntimeMemoryDecisionState,
  reason: string,
): RuntimeMemoryActionDecision {
  return {
    contractVersion: RUNTIME_MEMORY_HIERARCHY_CONTRACT_VERSION,
    tier: rule.tier,
    action: input.action,
    actorRole: input.actorRole,
    decision,
    reason,
    privacyScope: rule.privacyScope,
    persistenceClass: rule.persistenceClass,
    canReinject: false,
    durablePersistenceAllowed: rule.durablePersistenceAllowed,
    crossSessionAccessAllowed: rule.crossSessionAccessAllowed,
    persistentStoreCreated: rule.durablePersistenceAllowed &&
      input.durablePersistenceRequested === true &&
      decision === "allowed",
    newMemoryTierCreated: false,
  };
}

function cloneTierRule(rule: RuntimeMemoryTierRule): RuntimeMemoryTierRule {
  return {
    ...rule,
    allowedActions: [...rule.allowedActions],
    allowedActors: Object.fromEntries(
      Object.entries(rule.allowedActors).map(([action, actors]) => [
        action,
        [...actors],
      ]),
    ) as RuntimeMemoryTierRule["allowedActors"],
  };
}

function cloneWorkingEntry(entry: WorkingMemoryEntry): WorkingMemoryEntry {
  return {
    ...entry,
    payload: { ...entry.payload },
  };
}
