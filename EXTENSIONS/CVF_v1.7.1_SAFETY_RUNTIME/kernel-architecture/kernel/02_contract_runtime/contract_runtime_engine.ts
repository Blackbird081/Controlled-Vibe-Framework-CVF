// contract_runtime_engine.ts

import { RuntimeContractRequest } from "./contract.types"
import { ContractEnforcer } from "./contract_enforcer"
import { IOContractRegistry } from "./io_contract_registry"
import { ConsumerAuthorityMatrix } from "./consumer_authority_matrix"
import { TransformationGuard } from "./transformation_guard"
import { ContractValidator } from "./contract_validator"

export class ContractRuntimeEngine {
  private enforcer = new ContractEnforcer()
  private registry = new IOContractRegistry()
  private matrix = new ConsumerAuthorityMatrix()
  private transformGuard = new TransformationGuard()
  private validator = new ContractValidator()

  execute(output: string, request: RuntimeContractRequest): string {
    const consumerRole = request.consumerRole || "assistant"
    const transformRequested = request.transformRequested || false

    this.validator.validateIOContract(request.ioContract, request.declaredDomain)
    this.registry.upsert(request.ioContract)

    if (!this.matrix.isConsumerAllowed(request.ioContract, consumerRole)) {
      throw new Error(
        `Contract violation: consumer '${consumerRole}' not allowed for '${request.ioContract.contract_id}'`
      )
    }

    this.transformGuard.validate(request.ioContract, transformRequested)

    return this.enforcer.enforce(output, request.ioContract)
  }
}
