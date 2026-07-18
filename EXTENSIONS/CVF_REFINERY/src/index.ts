export type { Clock, IdFactory } from "./deps.js";
export { DeterministicClock, SequentialIdFactory } from "./deps.js";

export type {
  SourceEnvelope,
  SourceEnvelopeStatus,
  SourceScope,
  SourceType,
  Confidentiality,
  RawReference,
} from "./types/source-envelope.js";
export type { NormalizedRecord, NormalizationStep } from "./types/normalized-record.js";
export type {
  DuplicateGroup,
  DuplicateMatchType,
  DuplicateDisposition,
} from "./types/duplicate-group.js";
export type {
  ConflictSet,
  ConflictCandidate,
  ConflictResolutionStatus,
} from "./types/conflict-set.js";
export type { QualityFinding, QualitySeverity } from "./types/quality-finding.js";
export type { IntegrityResult, IntegrityStatus } from "./types/integrity-result.js";
export type { LineageEvent, LineageStage } from "./types/lineage-event.js";
export type {
  RefineryPacket,
  RefineryStatus,
  RefineryFailureToken,
  RuleManifestRef,
} from "./types/refinery-packet.js";

export type { RefineryRunInput, RefineryRunResult } from "./pipeline/engine.js";
export { RefineryEngine, REQUIRED_STAGE_CHAIN } from "./pipeline/engine.js";

export {
  REFINERY_PACKET_HASH_PROFILE,
  REFINERY_PACKET_HASH_DIGEST_ALGORITHM,
  buildRefineryPacketHashPreimage,
  computeRefineryPacketHash,
  UnsupportedPacketHashValueError,
} from "./packet-hash/packet-hash.js";
export type { RefineryPacketHashProjection } from "./packet-hash/packet-hash.js";
