import { AuthorityPolicy } from "./refusal.authority.policy"
import { CapabilityRequest } from "./capability.types"

export class CapabilityGuard {

  private policy = new AuthorityPolicy()

  validate(req: CapabilityRequest) {

    const allowed = this.policy.isAllowed(req)

    if (!allowed) {
      throw new Error(
        `Capability denied: ${req.capability}`
      )
    }
  }
}