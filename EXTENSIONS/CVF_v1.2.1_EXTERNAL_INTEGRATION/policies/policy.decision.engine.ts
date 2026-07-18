// policy.decision.engine.ts

import { sourceTrustPolicy } from "./source.trust.policy";
import { riskThresholdPolicy, RiskLevel } from "./risk.threshold.policy";
import { phaseBindingPolicy, CVFPhase } from "./phase.binding.policy";
import { domainBindingPolicy, CVFDomain } from "./domain.binding.policy";
import { policyOverrideMatrix } from "./policy.override.matrix";

import { SourceTrustLevel } from "./source.trust.policy";

export type DecisionOutcome =
  | "certified"
  | "under_review"
  | "rejected"
  | "sandbox_only";

export interface DecisionContext {

  source: keyof typeof sourceTrustPolicy;
  risk_level: RiskLevel;
  phase: CVFPhase;
  domain: CVFDomain;
  validation_passed: boolean;
  manual_override?: boolean;

}

interface LayerDecision {
  source?: DecisionOutcome;
  risk?: DecisionOutcome;
  phase?: DecisionOutcome;
  domain?: DecisionOutcome;
  validation?: DecisionOutcome;
  manual_override?: DecisionOutcome;
}

export const POLICY_DECISION_ENGINE_ADAPTER_VERSION =
  "phase2b-external-policy-decision-engine-adapter-1";

export interface PolicyDecisionEngineAdapterSnapshot {
  version: typeof POLICY_DECISION_ENGINE_ADAPTER_VERSION;
  source: "external-integration:policy-decision-engine";
  decision: DecisionOutcome;
  sourceTrust: SourceTrustLevel;
  riskLevel: RiskLevel;
  phase: CVFPhase;
  domain: CVFDomain;
  validationPassed: boolean;
  manualOverride: boolean;
}

export class PolicyDecisionEngine {

  static evaluate(ctx: DecisionContext): DecisionOutcome {

    const results: LayerDecision = {};

    // 1️⃣ Manual override (highest precedence)
    if (ctx.manual_override) {
      results.manual_override = "certified";
    }

    // 2️⃣ Source Policy
    const sourceRule = sourceTrustPolicy[ctx.source];

    if (sourceRule.trust_level === "blocked") {
      results.source = "rejected";
    } else {
      results.source = "certified";
    }

    // 3️⃣ Risk Policy
    const riskRule = riskThresholdPolicy[ctx.risk_level];

    if (riskRule.reject_immediately) {
      results.risk = "rejected";
    } else if (!riskRule.allow_auto_certification) {
      results.risk = "under_review";
    } else {
      results.risk = "certified";
    }

    // 4️⃣ Phase Policy
    const phaseRule = phaseBindingPolicy[ctx.phase];

    if (!phaseRule.allowed_risk_levels.includes(ctx.risk_level)) {
      results.phase = "rejected";
    } else if (phaseRule.require_manual_review) {
      results.phase = "under_review";
    } else {
      results.phase = "certified";
    }

    // 5️⃣ Domain Policy
    const domainRule = domainBindingPolicy[ctx.domain];

    if (!domainRule.allow_domain) {
      results.domain = "rejected";
    } else if (!domainRule.allowed_risk_levels.includes(ctx.risk_level)) {
      results.domain = "rejected";
    } else if (!domainRule.auto_certification_allowed) {
      results.domain = "under_review";
    } else {
      results.domain = "certified";
    }

    // 6️⃣ Validation
    if (!ctx.validation_passed) {
      results.validation = "under_review";
    } else {
      results.validation = "certified";
    }

    return this.resolve(results, ctx);
  }

  static evaluateWithAdapter(ctx: DecisionContext): PolicyDecisionEngineAdapterSnapshot {
    const decision = this.evaluate(ctx);

    return {
      version: POLICY_DECISION_ENGINE_ADAPTER_VERSION,
      source: "external-integration:policy-decision-engine",
      decision,
      sourceTrust: sourceTrustPolicy[ctx.source].trust_level,
      riskLevel: ctx.risk_level,
      phase: ctx.phase,
      domain: ctx.domain,
      validationPassed: ctx.validation_passed,
      manualOverride: ctx.manual_override === true,
    };
  }

  private static resolve(
    results: LayerDecision,
    ctx: DecisionContext
  ): DecisionOutcome {

    const precedence = policyOverrideMatrix.precedence_order;

    for (const layer of precedence) {

      const decision = results[layer as keyof LayerDecision];
      if (!decision) continue;

      // Absolute reject
      if (
        decision === "rejected" &&
        policyOverrideMatrix.absolute_reject_layers.includes(layer)
      ) {
        return "rejected";
      }

      // Blocking manual review
      if (
        decision === "under_review" &&
        policyOverrideMatrix.manual_review_is_blocking
      ) {
        return "under_review";
      }
    }

    // Production absolute lock
    if (
      ctx.phase === "Production" &&
      policyOverrideMatrix.production_is_absolute
    ) {
      const phaseRule = phaseBindingPolicy["Production"];
      if (!phaseRule.allowed_risk_levels.includes(ctx.risk_level)) {
        return "rejected";
      }
    }

    return "certified";
  }

}
