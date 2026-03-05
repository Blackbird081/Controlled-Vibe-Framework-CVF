/**
 * Base Skill Interface
 * All skills (static or dynamic) must implement this contract.
 */

export type SkillType = "STATIC" | "DYNAMIC" | "EXTERNAL";

export interface SkillMetadata {
  id: string;
  name: string;
  version: string;
  domain: string;
  type: SkillType;
  riskLevel: number; // 0 - 100
}

export interface SkillContext {
  input: any;
  memory?: Record<string, any>;
}

export interface SkillResult {
  success: boolean;
  output?: any;
  error?: string;
}

export interface Skill {
  metadata: SkillMetadata;
  execute(context: SkillContext): Promise<SkillResult>;
}