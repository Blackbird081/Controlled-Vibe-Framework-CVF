// domain.guard.hook.ts

import { CVFDomain } from "../policy/domain.binding.policy";
import { CVFPhase } from "../policy/phase.binding.policy";
import { PolicyDecisionEngine } from "../policy/policy.decision.engine";

export interface DomainGuardContext {

  skill_id: string;

  domain: CVFDomain;

  phase: CVFPhase;

  certified: boolean;

  execution_environment: "dev" | "staging" | "production";

  runtime_requester: string;

}

export interface DomainGuardResult {

  allowed: boolean;

  reason?: string;

  escalation_required?: boolean;

}

export class DomainGuardHook {

  static enforce(ctx: DomainGuardContext): DomainGuardResult {

    // 1️⃣ Skill phải certified
    if (!ctx.certified) {
      return {
        allowed: false,
        reason: "Skill not certified"
      };
    }

    // 2️⃣ Production domain lock
    if (
      ctx.execution_environment === "production" &&
      ctx.domain !== "engineering" &&
      ctx.domain !== "operations"
    ) {
      return {
        allowed: false,
        reason: "Domain not allowed in production",
        escalation_required: true
      };
    }

    // 3️⃣ Security / Finance absolute guard
    if (
      ctx.domain === "security" ||
      ctx.domain === "finance" ||
      ctx.domain === "compliance"
    ) {
      if (ctx.execution_environment !== "production") {
        return {
          allowed: false,
          reason: "Sensitive domain cannot run outside production"
        };
      }
    }

    return { allowed: true };
  }

}