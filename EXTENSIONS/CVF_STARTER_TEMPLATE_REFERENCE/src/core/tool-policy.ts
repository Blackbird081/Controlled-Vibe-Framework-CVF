// @reference-only — This module is not wired into the main execution pipeline.
// src/core/tool-policy.ts

export interface ToolPolicy {
  name: string;
  allowedRoles: string[];
  maxRisk: "LOW" | "MEDIUM" | "HIGH";
}

export class ToolPolicyEnforcer {
  constructor(private readonly policies: ToolPolicy[]) {}

  validate(
    toolName: string,
    role: string,
    risk: "LOW" | "MEDIUM" | "HIGH"
  ) {
    const policy = this.policies.find((p) => p.name === toolName);

    if (!policy) {
      throw new Error(`Tool ${toolName} not registered`);
    }

    if (!policy.allowedRoles.includes(role)) {
      throw new Error(
        `Role ${role} not allowed to use tool ${toolName}`
      );
    }

    const riskOrder = { LOW: 1, MEDIUM: 2, HIGH: 3 };

    if (riskOrder[risk] > riskOrder[policy.maxRisk]) {
      throw new Error(
        `Tool ${toolName} not allowed for risk level ${risk}`
      );
    }
  }
}
