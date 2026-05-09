import { ContractEnforcer } from "../governance/contract.enforcer";

export class ExecutionGuard {

  static validateBefore(skill: any, input: any): boolean {
    return ContractEnforcer.validateInput(skill, input);
  }

  static validateAfter(skill: any, output: any): boolean {
    return ContractEnforcer.validateOutput(skill, output);
  }

  static enforceRisk(riskScore: number): boolean {
    return riskScore <= 80;
  }
}