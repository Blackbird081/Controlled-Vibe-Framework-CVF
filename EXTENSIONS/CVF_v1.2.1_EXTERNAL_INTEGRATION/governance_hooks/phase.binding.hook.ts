// phase.binding.hook.ts

import { CVFPhase } from "../policies/phase.binding.policy";

export interface PhaseBindingContext {

  current_phase: CVFPhase;

  target_phase: CVFPhase;

  immutable: boolean;

  certified: boolean;

}

export interface PhaseBindingResult {

  allowed: boolean;

  reason?: string;

}

const phaseOrder: CVFPhase[] = [
  "Discovery",
  "Design",
  "Build",
  "Review",
  "Production"
];

export class PhaseBindingHook {

  static enforce(ctx: PhaseBindingContext): PhaseBindingResult {

    const currentIndex = phaseOrder.indexOf(ctx.current_phase);
    const targetIndex = phaseOrder.indexOf(ctx.target_phase);

    // 1️⃣ Không được nhảy lùi phase
    if (targetIndex < currentIndex) {
      return {
        allowed: false,
        reason: "Backward phase transition not allowed"
      };
    }

    // 2️⃣ Production bắt buộc certified + immutable
    if (ctx.target_phase === "Production") {
      if (!ctx.certified || !ctx.immutable) {
        return {
          allowed: false,
          reason: "Production requires certified & immutable skill"
        };
      }
    }

    return { allowed: true };
  }

}
