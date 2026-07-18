export type { Clock, IdFactory } from "./deps.js";
export { DeterministicClock, SequentialIdFactory } from "./deps.js";

export type { RefineryPacketRef, RefineryStatus } from "./types/refinery-packet.js";
export type { EvidenceRecord, ProvenanceLabel } from "./types/evidence.js";
export type { ObligationRecord, ObligationHardOrSoft, ObligationStatus } from "./types/obligation.js";
export type { VerificationResult, VerificationStatus } from "./types/verification-result.js";
export type {
  KernelEvaluationRequest,
  RequestStatus,
} from "./types/kernel-evaluation-request.js";
export type { KernelDecision, KernelDecisionToken } from "./types/kernel-decision.js";
export type { TruthReceipt, ReceiptDecisionToken, ReceiptStatus } from "./types/truth-receipt.js";
export type { TruthReference, ReferenceState } from "./types/truth-reference.js";

export {
  RECEIPT_HASH_PROFILE,
  RECEIPT_HASH_DIGEST_ALGORITHM,
  buildReceiptHashPreimage,
  computeReceiptHash,
} from "./receipt/receipt-hash.js";
export type { ReceiptHashPreimageFields } from "./receipt/receipt-hash.js";

export type { AdmissionResult, AdmissionRejectionReason } from "./engine/admission.js";
export type {
  ReferenceIssuanceResult,
  ReferenceRejectionReason,
  ReferenceStateResolutionResult,
  ReferenceStateResolutionReason,
  SupersessionResult,
  SupersessionRejectionReason,
} from "./engine/reference-issuer.js";
export type { ReceiptIssuanceResult, ReceiptIssuanceRejectionReason } from "./engine/receipt-issuer.js";
export type {
  RevocationResult,
  RevocationRejectionReason,
  ReferenceRevocationResult,
  ReferenceRevocationRejectionReason,
} from "./engine/revocation.js";
export type {
  ReferenceRevocationRecord,
  ReferenceSupersessionRecord,
} from "./stores/kernel-stores.js";

export { TruthKernel } from "./kernel.js";
export type { EvaluateInput, EvaluateResult } from "./kernel.js";
