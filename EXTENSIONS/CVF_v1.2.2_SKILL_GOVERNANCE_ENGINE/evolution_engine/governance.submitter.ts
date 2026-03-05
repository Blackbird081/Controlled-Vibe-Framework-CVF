import { ApprovalWorkflow } from "../skill_system/governance/approval.workflow";

export class GovernanceSubmitter {

  static submit(
    skill: any,
    schemaPath: string,
    policyPath: string
  ): "APPROVED" | "REJECTED" | "PROBATION" {

    return ApprovalWorkflow.evaluate(skill, schemaPath, policyPath);
  }

}