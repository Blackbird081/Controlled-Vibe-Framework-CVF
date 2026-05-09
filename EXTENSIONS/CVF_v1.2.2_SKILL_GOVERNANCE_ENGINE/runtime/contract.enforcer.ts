export interface SkillContract {
  required_inputs: string[];
  forbidden_operations?: string[];
}

export class ContractEnforcer {
  validateInput(
    contract: SkillContract,
    payload: Record<string, any>
  ) {
    for (const field of contract.required_inputs) {
      if (!(field in payload)) {
        throw new Error(`Missing required input: ${field}`);
      }
    }
  }

  validateOperation(
    contract: SkillContract,
    operation: string
  ) {
    if (
      contract.forbidden_operations &&
      contract.forbidden_operations.includes(operation)
    ) {
      throw new Error(`Operation forbidden by contract: ${operation}`);
    }
  }
}