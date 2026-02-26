import { IOContract } from "./contract.types"

export class IOContractRegistry {
  private contracts: Map<string, IOContract> = new Map()

  register(contract: IOContract): void {
    if (this.contracts.has(contract.contract_id)) {
      throw new Error(`IO contract already exists: ${contract.contract_id}`)
    }
    this.contracts.set(contract.contract_id, contract)
  }

  get(contractId: string): IOContract | undefined {
    return this.contracts.get(contractId)
  }

  upsert(contract: IOContract): void {
    this.contracts.set(contract.contract_id, contract)
  }
}

