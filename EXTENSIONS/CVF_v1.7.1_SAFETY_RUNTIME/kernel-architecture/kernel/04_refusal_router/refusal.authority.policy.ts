import { CapabilityRequest } from "./capability.types"
import { DefaultCapabilityProfile } from "./capability.registry"

export class AuthorityPolicy {
  isAllowed(req: CapabilityRequest): boolean {
    return DefaultCapabilityProfile[req.capability] === true
  }
}
