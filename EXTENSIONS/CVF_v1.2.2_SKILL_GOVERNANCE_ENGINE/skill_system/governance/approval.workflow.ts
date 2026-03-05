import { SkillValidator } from "./skill.validator";
import { SkillNormalizer } from "./skill.normalizer";
import { RiskScorer } from "./risk.scorer";
import { DomainGuard } from "./domain.guard";

export type ApprovalDecision =
  | "APPROVED"
  | "REJECTED"
  | "PROBATION";

export class ApprovalWorkflow {

  static evaluate(skill: any, schemaPath: string, policyPath: string): ApprovalDecision {

    const normalized = SkillNormalizer.normalize(skill);

    if (!SkillValidator.validateSchema(normalized, schemaPath))
      return "REJECTED";

    if (!SkillValidator.validateIntegrity(normalized))
      return "REJECTED";

    if (!DomainGuard.isAllowed(normalized.domain, policyPath))
      return "REJECTED";

    const riskScore = RiskScorer.compute(normalized);

    if (riskScore > 80)
      return "REJECTED";

    if (riskScore > 60)
      return "PROBATION";

    return "APPROVED";
  }
}