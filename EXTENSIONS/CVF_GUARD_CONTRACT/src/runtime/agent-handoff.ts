import type {
  HandoffCheckpoint,
  HandoffCheckpointResolution,
  HandoffCheckpointStatus,
  HandoffTransitionContext,
  HandoffTransitionKind,
} from '../types';

export interface CreateHandoffCheckpointInput {
  transition?: HandoffTransitionKind;
  transitionContext?: HandoffTransitionContext;
  reason: string;
  createdAt?: string;
  currentOwnerId?: string;
  nextOwnerId?: string;
  nextOwnerType?: HandoffCheckpoint['nextOwnerType'];
  nextGovernedMove?: string;
  scopeHint?: string;
  status?: HandoffCheckpointStatus;
  metadata?: Record<string, unknown>;
}

export function classifyHandoffTransition(
  context: HandoffTransitionContext,
): HandoffTransitionKind {
  if (context.workActuallyClosed) {
    return 'CLOSURE';
  }

  if (
    context.sameWorkerContinuesImmediately &&
    !context.ownershipChanges &&
    !context.approvalOrDecisionPending &&
    !context.meaningfulStatePresent
  ) {
    return 'CONTINUE';
  }

  if (
    context.sameWorkerWillResumeLater &&
    !context.ownershipChanges &&
    !context.approvalOrDecisionPending &&
    !context.meaningfulStatePresent
  ) {
    return 'BREAK';
  }

  if (context.ownershipChanges && context.nextOwnerType === 'AGENT') {
    return 'AGENT_TRANSFER';
  }

  if (context.ownershipChanges) {
    return 'SHIFT_HANDOFF';
  }

  if (context.approvalOrDecisionPending) {
    return 'ESCALATION_HANDOFF';
  }

  if (context.sameWorkerWillResumeLater || context.meaningfulStatePresent) {
    return 'PAUSE';
  }

  return 'PAUSE';
}

export function requiresFormalHandoff(
  transition: HandoffTransitionKind,
): boolean {
  return (
    transition === 'PAUSE' ||
    transition === 'SHIFT_HANDOFF' ||
    transition === 'AGENT_TRANSFER' ||
    transition === 'ESCALATION_HANDOFF'
  );
}

export function createHandoffCheckpoint(
  input: CreateHandoffCheckpointInput,
): HandoffCheckpoint {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const transition =
    input.transition ??
    classifyHandoffTransition(
      input.transitionContext ?? {
        meaningfulStatePresent: true,
      },
    );

  return {
    id: `handoff-${transition.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    transition,
    formalHandoffRequired: requiresFormalHandoff(transition),
    reason: input.reason,
    createdAt,
    currentOwnerId: input.currentOwnerId,
    nextOwnerId: input.nextOwnerId,
    nextOwnerType: input.nextOwnerType,
    nextGovernedMove: input.nextGovernedMove,
    scopeHint: input.scopeHint,
    status: input.status ?? 'OPEN',
    metadata: input.metadata,
  };
}

export function resolveHandoffCheckpoint(
  checkpoint: HandoffCheckpoint,
  resolution: HandoffCheckpointResolution,
  resolvedAt = new Date().toISOString(),
): HandoffCheckpoint {
  return {
    ...checkpoint,
    status: 'RESOLVED',
    resolution,
    resolvedAt,
  };
}
