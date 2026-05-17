import { SkillRegistry, SkillRecord, SkillLifecycleState } from './skill.lifecycle.js';

// --- Types ---

export type RolloutStage =
  | 'DRAFT_REVIEW'
  | 'CANARY'
  | 'GENERAL_AVAILABILITY'
  | 'DEPRECATION'
  | 'REVOCATION';

export type RolloutGateResult = 'PASS' | 'FAIL' | 'PENDING';

export interface RolloutGate {
  stage: RolloutStage;
  result: RolloutGateResult;
  checkedAt: string;
  reason?: string;
}

export interface RolloutRecord {
  skillId: string;
  currentStage: RolloutStage;
  history: RolloutStageEntry[];
  gates: RolloutGate[];
  canaryConfig?: CanaryConfig;
  deprecationConfig?: DeprecationConfig;
  successorId?: string;
}

export interface RolloutStageEntry {
  stage: RolloutStage;
  enteredAt: string;
  exitedAt?: string;
}

export interface CanaryConfig {
  allowedAgents: string[];
  allowedProjects: string[];
  startedAt: string;
  minCycles: number;
  currentCycles: number;
  anomalyCount: number;
}

export interface DeprecationConfig {
  successorId: string;
  gracePeriodVersions: number;
  noticeIssuedAt: string;
  graceExpired: boolean;
}

export interface RolloutTransitionResult {
  success: boolean;
  from: RolloutStage;
  to: RolloutStage;
  reason: string;
  gate?: RolloutGate;
}

// --- Constants ---

const STAGE_ORDER: RolloutStage[] = [
  'DRAFT_REVIEW',
  'CANARY',
  'GENERAL_AVAILABILITY',
  'DEPRECATION',
  'REVOCATION',
];

const STAGE_TO_LIFECYCLE: Record<RolloutStage, SkillLifecycleState> = {
  DRAFT_REVIEW: 'PROPOSED',
  CANARY: 'ACTIVE',
  GENERAL_AVAILABILITY: 'ACTIVE',
  DEPRECATION: 'DEPRECATED',
  REVOCATION: 'REVOKED',
};

// --- Rollout Engine ---

export class SkillRolloutEngine {
  private rollouts: Map<string, RolloutRecord> = new Map();

  initiateRollout(skillId: string): RolloutRecord {
    if (this.rollouts.has(skillId)) {
      throw new Error(`Rollout already exists for skill: ${skillId}`);
    }

    const record: RolloutRecord = {
      skillId,
      currentStage: 'DRAFT_REVIEW',
      history: [
        {
          stage: 'DRAFT_REVIEW',
          enteredAt: new Date().toISOString(),
        },
      ],
      gates: [],
    };

    this.rollouts.set(skillId, record);
    return record;
  }

  getRollout(skillId: string): RolloutRecord | undefined {
    return this.rollouts.get(skillId);
  }

  getAllRollouts(): RolloutRecord[] {
    return Array.from(this.rollouts.values());
  }

  getRolloutsByStage(stage: RolloutStage): RolloutRecord[] {
    return this.getAllRollouts().filter(r => r.currentStage === stage);
  }

  // --- Stage 1 → 2: DRAFT_REVIEW → CANARY ---
  promoteToCanary(
    skillId: string,
    config: { allowedAgents: string[]; allowedProjects: string[]; minCycles?: number }
  ): RolloutTransitionResult {
    const record = this.getOrFail(skillId);

    if (record.currentStage !== 'DRAFT_REVIEW') {
      return this.failTransition(record.currentStage, 'CANARY', 'Must be in DRAFT_REVIEW to promote to CANARY');
    }

    const gate = this.runIntakeGate(skillId);
    record.gates.push(gate);

    if (gate.result !== 'PASS') {
      return this.failTransition('DRAFT_REVIEW', 'CANARY', `Intake gate failed: ${gate.reason}`, gate);
    }

    record.canaryConfig = {
      allowedAgents: config.allowedAgents,
      allowedProjects: config.allowedProjects,
      startedAt: new Date().toISOString(),
      minCycles: config.minCycles ?? 1,
      currentCycles: 0,
      anomalyCount: 0,
    };

    return this.transition(record, 'CANARY', gate);
  }

  // --- Stage 2 → 3: CANARY → GENERAL_AVAILABILITY ---
  promoteToGA(skillId: string): RolloutTransitionResult {
    const record = this.getOrFail(skillId);

    if (record.currentStage !== 'CANARY') {
      return this.failTransition(record.currentStage, 'GENERAL_AVAILABILITY', 'Must be in CANARY to promote to GA');
    }

    const gate = this.runCanaryGate(skillId);
    record.gates.push(gate);

    if (gate.result !== 'PASS') {
      return this.failTransition('CANARY', 'GENERAL_AVAILABILITY', `Canary gate failed: ${gate.reason}`, gate);
    }

    return this.transition(record, 'GENERAL_AVAILABILITY', gate);
  }

  // --- Stage 3 → 4: GENERAL_AVAILABILITY → DEPRECATION ---
  deprecate(
    skillId: string,
    config: { successorId: string; gracePeriodVersions?: number }
  ): RolloutTransitionResult {
    const record = this.getOrFail(skillId);

    if (record.currentStage !== 'GENERAL_AVAILABILITY') {
      return this.failTransition(record.currentStage, 'DEPRECATION', 'Must be in GA to deprecate');
    }

    const successorRollout = this.rollouts.get(config.successorId);
    if (!successorRollout || successorRollout.currentStage !== 'GENERAL_AVAILABILITY') {
      const gate: RolloutGate = {
        stage: 'DEPRECATION',
        result: 'FAIL',
        checkedAt: new Date().toISOString(),
        reason: `Successor ${config.successorId} must be at GENERAL_AVAILABILITY before deprecation`,
      };
      record.gates.push(gate);
      return this.failTransition('GENERAL_AVAILABILITY', 'DEPRECATION', gate.reason!, gate);
    }

    const gate: RolloutGate = {
      stage: 'DEPRECATION',
      result: 'PASS',
      checkedAt: new Date().toISOString(),
    };
    record.gates.push(gate);

    record.deprecationConfig = {
      successorId: config.successorId,
      gracePeriodVersions: config.gracePeriodVersions ?? 1,
      noticeIssuedAt: new Date().toISOString(),
      graceExpired: false,
    };
    record.successorId = config.successorId;

    return this.transition(record, 'DEPRECATION', gate);
  }

  // --- Stage 4 → 5: DEPRECATION → REVOCATION ---
  revoke(skillId: string, reason: string): RolloutTransitionResult {
    const record = this.getOrFail(skillId);

    if (record.currentStage !== 'DEPRECATION') {
      return this.failTransition(record.currentStage, 'REVOCATION', 'Must be in DEPRECATION to revoke');
    }

    const gate = this.runRevocationGate(skillId, reason);
    record.gates.push(gate);

    if (gate.result !== 'PASS') {
      return this.failTransition('DEPRECATION', 'REVOCATION', `Revocation gate failed: ${gate.reason}`, gate);
    }

    return this.transition(record, 'REVOCATION', gate);
  }

  recordCanaryCycle(skillId: string, anomalyDetected: boolean): void {
    const record = this.getOrFail(skillId);
    if (!record.canaryConfig) throw new Error('No canary config');

    record.canaryConfig.currentCycles += 1;
    if (anomalyDetected) {
      record.canaryConfig.anomalyCount += 1;
    }
  }

  expireGracePeriod(skillId: string): void {
    const record = this.getOrFail(skillId);
    if (!record.deprecationConfig) throw new Error('No deprecation config');
    record.deprecationConfig.graceExpired = true;
  }

  getLifecycleState(stage: RolloutStage): SkillLifecycleState {
    return STAGE_TO_LIFECYCLE[stage];
  }

  getStageIndex(stage: RolloutStage): number {
    return STAGE_ORDER.indexOf(stage);
  }

  // --- Private helpers ---

  private getOrFail(skillId: string): RolloutRecord {
    const record = this.rollouts.get(skillId);
    if (!record) throw new Error(`No rollout found for skill: ${skillId}`);
    return record;
  }

  private runIntakeGate(skillId: string): RolloutGate {
    return {
      stage: 'DRAFT_REVIEW',
      result: 'PASS',
      checkedAt: new Date().toISOString(),
    };
  }

  private runCanaryGate(skillId: string): RolloutGate {
    const record = this.getOrFail(skillId);
    const canary = record.canaryConfig;

    if (!canary) {
      return {
        stage: 'CANARY',
        result: 'FAIL',
        checkedAt: new Date().toISOString(),
        reason: 'No canary config found',
      };
    }

    if (canary.currentCycles < canary.minCycles) {
      return {
        stage: 'CANARY',
        result: 'FAIL',
        checkedAt: new Date().toISOString(),
        reason: `Canary cycles ${canary.currentCycles} < required ${canary.minCycles}`,
      };
    }

    if (canary.anomalyCount > 0) {
      return {
        stage: 'CANARY',
        result: 'FAIL',
        checkedAt: new Date().toISOString(),
        reason: `Canary has ${canary.anomalyCount} anomalies — must be 0 for promotion`,
      };
    }

    return {
      stage: 'CANARY',
      result: 'PASS',
      checkedAt: new Date().toISOString(),
    };
  }

  private runRevocationGate(skillId: string, reason: string): RolloutGate {
    const record = this.getOrFail(skillId);
    const deprecation = record.deprecationConfig;

    const isSecurityIssue = reason.toLowerCase().includes('security');
    const graceExpired = deprecation?.graceExpired ?? false;

    if (!isSecurityIssue && !graceExpired) {
      return {
        stage: 'REVOCATION',
        result: 'FAIL',
        checkedAt: new Date().toISOString(),
        reason: 'Grace period not expired and no security justification',
      };
    }

    return {
      stage: 'REVOCATION',
      result: 'PASS',
      checkedAt: new Date().toISOString(),
    };
  }

  private transition(record: RolloutRecord, to: RolloutStage, gate: RolloutGate): RolloutTransitionResult {
    const from = record.currentStage;
    const lastEntry = record.history[record.history.length - 1];
    if (lastEntry) lastEntry.exitedAt = new Date().toISOString();

    record.currentStage = to;
    record.history.push({
      stage: to,
      enteredAt: new Date().toISOString(),
    });

    return { success: true, from, to, reason: 'Gate passed', gate };
  }

  private failTransition(from: RolloutStage, to: RolloutStage, reason: string, gate?: RolloutGate): RolloutTransitionResult {
    return { success: false, from, to, reason, gate };
  }
}
