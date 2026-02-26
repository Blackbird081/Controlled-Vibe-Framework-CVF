import { ContractDefinition, IOContract } from "./contract.types"
import { OutputValidator } from "./output_validator"
import { ContractValidator } from "./contract_validator"

export class ContractEnforcer {
  private outputValidator = new OutputValidator()
  private validator = new ContractValidator()

  validateInput(input: any, contract?: ContractDefinition): void {
    this.validator.validateDefinition(contract)

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

    if (contract.requireDomainMatch && input?.ioContract?.domain_id && input?.domain) {
      if (input.ioContract.domain_id !== input.domain) {
        throw new Error(
          `Contract violation: ioContract domain '${input.ioContract.domain_id}' mismatches input domain '${input.domain}'`
        )
      }
    }
  }

  validateOutput(output: any, contract?: ContractDefinition): void {
    this.validator.validateDefinition(contract)

    if (!contract)
      return

    if (contract.outputType && output.type !== contract.outputType) {
      throw new Error(
        `Contract violation: output type '${output.type}' invalid`
      )
    }
  }

  enforce(output: string, contract: IOContract): string {
    this.validator.validateIOContract(contract)
    const valid = this.outputValidator.validate(output, contract)
    if (!valid) {
      throw new Error(`Contract violation: output failed IO contract '${contract.contract_id}'`)
    }
    return output
  }
}
