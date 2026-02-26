import { CapabilityGuard } from "./capability.guard"
import { CapabilityRequest } from "./capability.types"

export class ExecutionGate {

  private guard = new CapabilityGuard()

  authorize(req: CapabilityRequest) {
    this.guard.validate(req)
  }
}