import {
  createCompiledKnowledgeArtifactContract,
  createKnowledgeMaintenanceContract,
  createKnowledgeRefactorContract,
  type CompiledKnowledgeArtifact,
  type CompiledKnowledgeArtifactCompileRequest,
  type GovernDecision,
  type KnowledgeMaintenanceCheck,
  type KnowledgeMaintenanceResult,
} from 'cvf-control-plane-foundation';

/**
 * W80-T1 — N4 Product/Operator Adoption: knowledge-native lifecycle wrappers.
 * Pure functions — no persistence, no registry writes.
 * Authorization: docs/baselines/CVF_GC018_W80_T1_N4_PRODUCT_OPERATOR_ADOPTION_AUTHORIZATION_2026-04-14.md
 */

export interface KnowledgeCompileInput {
  compileRequest: CompiledKnowledgeArtifactCompileRequest;
  governDecision?: GovernDecision;
}

export interface KnowledgeCompileOutput {
  artifact: CompiledKnowledgeArtifact;
  governed: boolean;
}

export interface KnowledgeMaintainInput {
  artifact: CompiledKnowledgeArtifact;
  checks: KnowledgeMaintenanceCheck[];
}

export interface KnowledgeRefactorInput {
  result: KnowledgeMaintenanceResult;
}

export function compileKnowledgeArtifact(input: KnowledgeCompileInput): KnowledgeCompileOutput {
  const contract = createCompiledKnowledgeArtifactContract();
  let artifact = contract.compile(input.compileRequest);
  let governed = false;
  if (input.governDecision) {
    artifact = contract.govern(artifact, input.governDecision);
    governed = true;
  }
  return { artifact, governed };
}

export function maintainKnowledgeArtifact(input: KnowledgeMaintainInput): KnowledgeMaintenanceResult {
  const contract = createKnowledgeMaintenanceContract();
  return contract.evaluate({ artifact: input.artifact, checks: input.checks });
}

export function refactorKnowledgeArtifact(input: KnowledgeRefactorInput) {
  const contract = createKnowledgeRefactorContract();
  return contract.recommend({ result: input.result });
}
