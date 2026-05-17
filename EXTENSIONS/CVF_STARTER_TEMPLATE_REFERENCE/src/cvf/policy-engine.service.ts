// src/cvf/policy-engine.service.ts

export interface PolicyRule {
  name: string;
  check(context: any): boolean;
}

export class PolicyEngine {
  constructor(private readonly rules: PolicyRule[]) {}

  enforce(context: any) {
    for (const rule of this.rules) {
      const result = rule.check(context);

      if (!result) {
        throw new Error(`Policy violation: ${rule.name}`);
      }
    }
  }
}
