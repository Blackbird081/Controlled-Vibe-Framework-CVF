export {
  KnowledgeQueryContract,
  createKnowledgeQueryContract,
} from "./knowledge.query.contract";
export type {
  KnowledgeItem,
  KnowledgeQueryRequest,
  KnowledgeResult,
  KnowledgeQueryContractDependencies,
} from "./knowledge.query.contract";

export {
  KnowledgeRankingContract,
  createKnowledgeRankingContract,
} from "./knowledge.ranking.contract";
export type {
  RankableKnowledgeItem,
  ScoringWeights,
  ScoreBreakdown,
  RankedKnowledgeItem,
  KnowledgeRankingRequest,
  RankedKnowledgeResult,
  KnowledgeRankingContractDependencies,
} from "./knowledge.ranking.contract";

export {
  KnowledgeQueryBatchContract,
  createKnowledgeQueryBatchContract,
} from "./knowledge.query.batch.contract";
export type {
  KnowledgeQueryBatch,
  KnowledgeQueryBatchContractDependencies,
} from "./knowledge.query.batch.contract";

// W33-T1 — KnowledgeRankingBatchContract
export {
  KnowledgeRankingBatchContract,
  createKnowledgeRankingBatchContract,
} from "./knowledge.ranking.batch.contract";
export type {
  KnowledgeRankingBatch,
  KnowledgeRankingBatchContractDependencies,
} from "./knowledge.ranking.batch.contract";

// W72-T1 — StructuralIndexContract
export {
  StructuralIndexContract,
  createStructuralIndexContract,
} from "./knowledge.structural.index.contract";
export type {
  StructuralRelationType,
  StructuralEntity,
  StructuralRelation,
  StructuralIndexRequest,
  StructuralNeighbor,
  StructuralIndexResult,
  StructuralIndexContractDependencies,
} from "./knowledge.structural.index.contract";

// W72-T1 — StructuralIndexBatchContract
export {
  StructuralIndexBatchContract,
  createStructuralIndexBatchContract,
} from "./knowledge.structural.index.batch.contract";
export type {
  StructuralIndexBatch,
  StructuralIndexBatchContractDependencies,
} from "./knowledge.structural.index.batch.contract";

// W72-T4 — CompiledKnowledgeArtifactContract
export {
  CompiledKnowledgeArtifactContract,
  createCompiledKnowledgeArtifactContract,
} from "./knowledge.compiled.artifact.contract";
export type {
  CompiledArtifactType,
  GovernanceStatus,
  CompiledKnowledgeArtifactCompileRequest,
  CompiledKnowledgeArtifact,
  GovernDecision,
  CompiledKnowledgeArtifactContractDependencies,
} from "./knowledge.compiled.artifact.contract";

// W72-T4 — CompiledKnowledgeArtifactBatchContract
export {
  CompiledKnowledgeArtifactBatchContract,
  createCompiledKnowledgeArtifactBatchContract,
} from "./knowledge.compiled.artifact.batch.contract";
export type {
  CompiledKnowledgeArtifactBatch,
  CompiledKnowledgeArtifactBatchContractDependencies,
} from "./knowledge.compiled.artifact.batch.contract";

// W73-T2 — KnowledgeMaintenanceContract (Lifecycle Step 5)
export {
  KnowledgeMaintenanceContract,
  createKnowledgeMaintenanceContract,
} from "./knowledge.maintenance.contract";
export type {
  KnowledgeMaintenanceSignalType,
  KnowledgeMaintenanceSignal,
  KnowledgeLintCheck,
  KnowledgeContradictionCheck,
  KnowledgeDriftCheck,
  KnowledgeOrphanCheck,
  KnowledgeStalenessCheck,
  KnowledgeMaintenanceCheck,
  KnowledgeMaintenanceRequest,
  KnowledgeMaintenanceResult,
  KnowledgeMaintenanceContractDependencies,
} from "./knowledge.maintenance.contract";

// W73-T2 — KnowledgeMaintenanceBatchContract
export {
  KnowledgeMaintenanceBatchContract,
  createKnowledgeMaintenanceBatchContract,
} from "./knowledge.maintenance.batch.contract";
export type {
  KnowledgeMaintenanceBatch,
  KnowledgeMaintenanceBatchContractDependencies,
} from "./knowledge.maintenance.batch.contract";

// W74-T1 — KnowledgeRefactorContract (Lifecycle Step 6)
export {
  KnowledgeRefactorContract,
  createKnowledgeRefactorContract,
} from "./knowledge.refactor.contract";
export type {
  KnowledgeRefactorAction,
  KnowledgeRefactorProposal,
  KnowledgeRefactorRequest,
  KnowledgeRefactorContractDependencies,
} from "./knowledge.refactor.contract";

// W74-T1 — KnowledgeRefactorBatchContract
export {
  KnowledgeRefactorBatchContract,
  createKnowledgeRefactorBatchContract,
} from "./knowledge.refactor.batch.contract";
export type {
  KnowledgeRefactorBatch,
  KnowledgeRefactorBatchContractDependencies,
} from "./knowledge.refactor.batch.contract";

// W75-T1 — KnowledgeContextAssemblyContract
export {
  KnowledgeContextAssemblyContract,
  createKnowledgeContextAssemblyContract,
} from "./knowledge.context.assembly.contract";
export type {
  KnowledgeContextEntry,
  KnowledgeContextPacket,
  KnowledgeContextAssemblyRequest,
  KnowledgeContextAssemblyContractDependencies,
} from "./knowledge.context.assembly.contract";

// W75-T1 — KnowledgeContextAssemblyBatchContract
export {
  KnowledgeContextAssemblyBatchContract,
  createKnowledgeContextAssemblyBatchContract,
} from "./knowledge.context.assembly.batch.contract";
export type {
  KnowledgeContextAssemblyBatch,
  KnowledgeContextAssemblyBatchContractDependencies,
} from "./knowledge.context.assembly.batch.contract";
