import { ContractDefinition } from "./contract.types"

export class ContractEnforcer {

  validateInput(input: any, contract?: ContractDefinition): void {

    if (!contract)
      return

    if (contract.requiredFields) {
      for (const field of contract.requiredFields) {
        if (!(field in input)) {
          throw new Error(`Contract violation: missing field '${field}'`)
        }
      }
    }

    if (contract.allowedTypes) {
      if (!contract.allowedTypes.includes(input.type)) {
        throw new Error(
          `Contract violation: type '${input.type}' not allowed`
        )
      }
    }
  }

  validateOutput(output: any, contract?: ContractDefinition): void {

    if (!contract)
      return

    if (contract.outputType && output.type !== contract.outputType) {
      throw new Error(
        `Contract violation: output type '${output.type}' invalid`
      )
    }
  }
}