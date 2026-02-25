import type { PolicyDefinition, PolicyRule } from "../types/index"
import { generatePolicyHash } from "./policy.hash"

const registry: Record<string, PolicyDefinition> = {}

export function registerPolicy(
  version: string,
  rules: PolicyRule[]
) {

  if (registry[version]) {
    throw new Error("Policy version already exists (immutable)")
  }

  const hash = generatePolicyHash(version, rules)

  registry[version] = {
    version,
    createdAt: Date.now(),
    rules,
    hash
  }
}

export function getPolicy(version: string): PolicyDefinition {

  const policy = registry[version]

  if (!policy) {
    throw new Error("Policy version not found")
  }

  return policy
}

export function listPolicies(): readonly PolicyDefinition[] {
  return Object.values(registry)
}