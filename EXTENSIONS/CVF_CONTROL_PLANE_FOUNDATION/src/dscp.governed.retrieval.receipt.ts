import type {
  GovernedContextPackage,
  GovernedRetrievalReceipt,
  ContentDeliveryClass,
} from "./dscp.governed.context.contract";

// --- DSCP-T4: Governed Retrieval Receipt Helper ---
// Tranche: DSCP-T4 (Retrieval Receipt Runtime Boundary)
// Authorization: docs/baselines/CVF_GC018_DSCP_T4_RETRIEVAL_RECEIPT_RUNTIME_BOUNDARY_2026-06-07.md

// --- Input Interface ---

export interface GovernedRetrievalReceiptInput {
  receiptId: string;
  query: string;
  queryTimestamp: string;
  contextPackage: GovernedContextPackage;
  governanceOutcome: GovernedRetrievalReceipt["governanceOutcome"];
  contentDeliveryClass: ContentDeliveryClass;
  freshnessDisclosureApplied: boolean;
  // Optional additional gate results. Package classificationGate and
  // freshnessGate always win over any caller-supplied values for those keys.
  governanceGateResults?: Record<string, string>;
  // Caller-supplied; not computed here. See Non-Goals in GC-018.
  modelResponseHash: string;
}

// --- Builder ---

export function buildGovernedRetrievalReceipt(
  input: GovernedRetrievalReceiptInput,
): GovernedRetrievalReceipt {
  const evidence = input.contextPackage.governanceEvidence;

  return {
    receiptId: input.receiptId,
    query: input.query,
    queryTimestamp: input.queryTimestamp,
    contextPackageId: input.contextPackage.innerPackage.packageId,
    governanceOutcome: input.governanceOutcome,
    contentDeliveryClass: input.contentDeliveryClass,
    freshnessDisclosureApplied: input.freshnessDisclosureApplied,
    // Spread caller-supplied keys first, then overwrite classification/freshness
    // gates with package evidence values so caller cannot override them.
    governanceGateResults: {
      ...input.governanceGateResults,
      classificationGate: evidence.classificationGate,
      freshnessGate: evidence.freshnessGate,
    },
    modelResponseHash: input.modelResponseHash,
    sourceArtifactIds: [...evidence.sourceArtifactIds],
    rawSourceReleased: false,
  };
}
