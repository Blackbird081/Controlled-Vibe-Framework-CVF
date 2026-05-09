import { IOContract } from "./contract.types"

export class TransformationGuard {
  validate(contract: IOContract, transformRequested: boolean): void {
    if (transformRequested && contract.allow_transform === false) {
      throw new Error(
        `Contract violation: transformation is disabled for '${contract.contract_id}'`
      )
    }
  }
}
