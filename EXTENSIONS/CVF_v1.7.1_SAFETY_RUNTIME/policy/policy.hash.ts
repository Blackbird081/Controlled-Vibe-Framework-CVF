import type { PolicyRule } from "../types/index"
import crypto from "crypto"

export function generatePolicyHash(
  version: string,
  rules: PolicyRule[]
): string {

  const serialized = JSON.stringify({
    version,
    rules: rules.map(r => ({
      id: r.id,
      description: r.description,
      evaluateLogic: r.evaluate.toString()
    }))
  })

  return crypto
    .createHash("sha256")
    .update(serialized)
    .digest("hex")
}
