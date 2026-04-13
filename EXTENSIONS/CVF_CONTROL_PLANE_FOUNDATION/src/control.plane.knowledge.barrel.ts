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
