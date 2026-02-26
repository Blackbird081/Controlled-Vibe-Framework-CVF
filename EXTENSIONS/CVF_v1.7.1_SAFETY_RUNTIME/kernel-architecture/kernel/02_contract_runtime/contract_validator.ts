import { ContractDefinition, IOContract } from "./contract.types"

export class ContractValidator {
  validateDefinition(def?: ContractDefinition): void {
    if (!def) {
      return
    }

    if (def.requiredFields && def.requiredFields.length === 0) {
      throw new Error("Contract definition invalid: requiredFields cannot be empty")
    }
  }

  validateIOContract(contract: IOContract, declaredDomain?: string): void {
    if (!contract.contract_id || !contract.domain_id) {
      throw new Error("IO contract invalid: missing identifiers")
    }

    if (declaredDomain && contract.domain_id !== declaredDomain) {
      throw new Error(
        `Contract violation: ioContract domain '${contract.domain_id}' mismatches '${declaredDomain}'`
      )
    }
  }
}

