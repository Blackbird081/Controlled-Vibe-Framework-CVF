// skill.validator.ts

import { CVFSkillDraft } from "./models/cvf-skill.draft";
import { RiskScorer } from "../governance/risk_scorer";
import { DomainGuard } from "../governance/domain.guard";
import { PhaseBinder } from "../governance/phase.binding";

export class SkillValidator {

  static async validate(draft: CVFSkillDraft): Promise<CVFSkillDraft> {

    draft.inferred_risk = RiskScorer.score(draft.procedural_steps);

    draft.inferred_domain = DomainGuard.infer(draft.procedural_steps);

    draft.inferred_phase = PhaseBinder.bind(draft.procedural_steps);

    if (draft.inferred_risk === "critical") {
      throw new Error("External skill rejected: Critical risk");
    }

    draft.status = "validated";

    return draft;
  }

}