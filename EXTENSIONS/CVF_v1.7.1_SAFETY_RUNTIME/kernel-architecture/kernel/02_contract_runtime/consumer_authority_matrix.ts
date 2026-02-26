import { ContractConsumerRole, IOContract } from "./contract.types"

const DEFAULT_ALLOWED: ContractConsumerRole[] = [
  "assistant",
  "system",
  "integration"
]

export class ConsumerAuthorityMatrix {
  isConsumerAllowed(
    contract: IOContract,
    consumerRole: ContractConsumerRole = "assistant"
  ): boolean {
    const allowed = contract.allowed_consumers || DEFAULT_ALLOWED
    return allowed.includes(consumerRole)
  }
}

