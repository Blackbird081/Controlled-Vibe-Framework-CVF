// contract_runtime_engine.ts

import { IOContract } from "./contract.types"
import { ContractEnforcer } from "./contract_enforcer"

export class ContractRuntimeEngine {
  private enforcer = new ContractEnforcer()

  execute(output: string, contract: IOContract): string {
    return this.enforcer.enforce(output, contract)
  }
}