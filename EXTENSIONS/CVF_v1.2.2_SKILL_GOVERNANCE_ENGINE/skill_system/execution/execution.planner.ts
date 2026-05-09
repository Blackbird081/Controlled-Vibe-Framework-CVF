export interface ExecutionPlan {
  skillId: string;
  steps: string[];
  requiresExternalCall: boolean;
}

export class ExecutionPlanner {

  static create(skill: any): ExecutionPlan {

    const requiresExternal =
      skill.type === "EXTERNAL" ||
      skill.metadata?.risk_profile?.factors?.includes("external_dependency");

    return {
      skillId: skill.id,
      steps: ["validate_input", "execute_core", "validate_output"],
      requiresExternalCall: requiresExternal
    };
  }
}