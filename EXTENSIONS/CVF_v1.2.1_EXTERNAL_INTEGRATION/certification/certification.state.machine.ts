// certification.state.machine.ts

import { PolicyDecisionEngine, DecisionOutcome } from "../policies/policy.decision.engine";

export type CertificationState =
  | "raw"
  | "draft"
  | "validated"
  | "under_review"
  | "certified"
  | "promoted"
  | "production"
  | "archived"
  | "rejected";

export interface StateTransitionContext {

  skill_id: string;

  current_state: CertificationState;

  target_state: CertificationState;

  decision_context?: Parameters<typeof PolicyDecisionEngine.evaluate>[0];

  manual_override?: boolean;

}

export interface StateTransitionResult {

  allowed: boolean;

  new_state?: CertificationState;

  reason?: string;

}

export const CERTIFICATION_STATE_MACHINE_ADAPTER_VERSION =
  "phase2b-certification-state-machine-adapter-1";

export interface CertificationStateMachineAdapterSnapshot {

  version: typeof CERTIFICATION_STATE_MACHINE_ADAPTER_VERSION;

  source: "external-integration:certification-state-machine";

  skill_id: string;

  current_state: CertificationState;

  target_state: CertificationState;

  allowed: boolean;

  new_state?: CertificationState;

  reason?: string;

  manual_override: boolean;

}

const transitionMap: Record<CertificationState, CertificationState[]> = {

  raw: ["draft"],

  draft: ["validated", "rejected"],

  validated: ["under_review", "certified", "rejected"],

  under_review: ["certified", "rejected"],

  certified: ["promoted", "archived"],

  promoted: ["production", "archived"],

  production: ["archived"],

  archived: [],

  rejected: []

};

export class CertificationStateMachine {

  static transition(ctx: StateTransitionContext): StateTransitionResult {

    const { current_state, target_state, decision_context, manual_override } = ctx;

    // 1️⃣ Manual override (controlled)
    if (manual_override) {
      return {
        allowed: true,
        new_state: target_state
      };
    }

    // 2️⃣ Check structural transition validity
    const allowedTargets = transitionMap[current_state];

    if (!allowedTargets.includes(target_state)) {
      return {
        allowed: false,
        reason: `Invalid transition: ${current_state} → ${target_state}`
      };
    }

    // 3️⃣ Special enforcement for certification
    if (target_state === "certified") {

      if (!decision_context) {
        return {
          allowed: false,
          reason: "Missing decision context for certification"
        };
      }

      const decision: DecisionOutcome =
        PolicyDecisionEngine.evaluate(decision_context);

      if (decision !== "certified") {
        return {
          allowed: false,
          reason: `DecisionEngine blocked certification (${decision})`
        };
      }
    }

    return {
      allowed: true,
      new_state: target_state
    };
  }

  static transitionWithAdapter(
    ctx: StateTransitionContext
  ): { result: StateTransitionResult; adapter: CertificationStateMachineAdapterSnapshot } {

    const result = this.transition(ctx);

    return {
      result,
      adapter: {
        version: CERTIFICATION_STATE_MACHINE_ADAPTER_VERSION,
        source: "external-integration:certification-state-machine",
        skill_id: ctx.skill_id,
        current_state: ctx.current_state,
        target_state: ctx.target_state,
        allowed: result.allowed,
        new_state: result.new_state,
        reason: result.reason,
        manual_override: ctx.manual_override === true
      }
    };
  }

}
