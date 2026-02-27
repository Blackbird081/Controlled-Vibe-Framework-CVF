import { systemPolicy } from "./system.policy"

export function enforceSystemPolicy() {
  if (systemPolicy.emergencyStop) {
    throw new Error("System is in emergency stop mode")
  }
}
