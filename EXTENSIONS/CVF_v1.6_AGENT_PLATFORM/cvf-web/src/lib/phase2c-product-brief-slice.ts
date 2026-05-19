import type { GovernanceEvidenceReceipt } from '@/lib/ai';
import { generateDeliverablePack, type DeliverablePack } from '@/lib/deliverable-pack';
import type { Category, Execution } from '@/types';

export const PHASE_2C_PRODUCT_BRIEF_TEMPLATE_ID = 'app_builder_complete';
export const PHASE_2C_PRODUCT_BRIEF_SLICE_ID = 'CVF_17_05_PHASE_2C_CREATE_PRODUCT_BRIEF';

export const PHASE_2C_CERTIFIED_CAPABILITY_REFS = [
  'CVF-17.05:Phase2B:GovernedCapability:create-product-brief',
  'CVF-17.05:Phase2B:OutcomeWorkflow:product-brief-to-deliverable-pack',
  'CVF-17.05:Phase1R:ReceiptAdapter:web-governance-evidence-receipt',
] as const;

export interface Phase2CProductBriefSlice {
  sliceId: typeof PHASE_2C_PRODUCT_BRIEF_SLICE_ID;
  status: 'generated';
  templateId: typeof PHASE_2C_PRODUCT_BRIEF_TEMPLATE_ID;
  capabilityRefs: readonly string[];
  outputValidation: {
    structuredResult: true;
    qualityHint?: string;
    issues: string[];
  };
  deliverablePack: DeliverablePack;
  receiptAdapter: {
    source: 'web_governance_evidence_receipt';
    target: 'deliverable_pack_governance_evidence';
    receiptId?: string;
    envelopeId?: string;
    policySnapshotId?: string;
  };
  claimBoundary: 'live_governance_proof_required_before_public_claim';
}

export interface BuildPhase2CProductBriefSliceInput {
  templateId?: string;
  templateName?: string;
  category?: Category;
  inputs: Record<string, string>;
  intent: string;
  output: string;
  evidenceReceipt: GovernanceEvidenceReceipt;
  validation?: {
    qualityHint?: string;
    issues?: string[];
  };
}

export interface BuildPhase2CProductBriefSliceForRouteInput {
  responseSuccess: boolean;
  templateId?: string;
  templateName?: string;
  category?: Category;
  inputs: Record<string, string>;
  intent: string;
  output?: string;
  evidenceReceipt: GovernanceEvidenceReceipt;
  validation?: {
    qualityHint?: string;
    issues?: string[];
  };
}

export function isPhase2CProductBriefTemplate(templateId?: string): boolean {
  return templateId === PHASE_2C_PRODUCT_BRIEF_TEMPLATE_ID;
}

function buildExecutionId(receipt: GovernanceEvidenceReceipt): string {
  const stableRef = receipt.envelopeId || receipt.receiptId;
  return `phase2c-${stableRef.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
}

export function buildPhase2CProductBriefSlice(
  input: BuildPhase2CProductBriefSliceInput
): Phase2CProductBriefSlice | undefined {
  if (!isPhase2CProductBriefTemplate(input.templateId)) {
    return undefined;
  }

  const generatedAt = input.evidenceReceipt.generatedAt || new Date().toISOString();
  const execution: Execution = {
    id: buildExecutionId(input.evidenceReceipt),
    templateId: PHASE_2C_PRODUCT_BRIEF_TEMPLATE_ID,
    templateName: input.templateName || 'App Builder Complete',
    category: input.category || 'development',
    input: input.inputs,
    intent: input.intent,
    output: input.output,
    status: 'completed',
    result: 'accepted',
    createdAt: new Date(generatedAt),
    completedAt: new Date(),
    evidenceReceiptSnapshot: {
      decision: input.evidenceReceipt.decision,
      riskLevel: input.evidenceReceipt.riskLevel,
      provider: input.evidenceReceipt.provider,
      model: input.evidenceReceipt.model,
      policySnapshotId: input.evidenceReceipt.policySnapshotId,
      knowledgeCollectionId: input.evidenceReceipt.knowledgeCollectionId ?? undefined,
      receiptId: input.evidenceReceipt.receiptId,
    },
    starterSource: 'template',
  };

  return {
    sliceId: PHASE_2C_PRODUCT_BRIEF_SLICE_ID,
    status: 'generated',
    templateId: PHASE_2C_PRODUCT_BRIEF_TEMPLATE_ID,
    capabilityRefs: PHASE_2C_CERTIFIED_CAPABILITY_REFS,
    outputValidation: {
      structuredResult: true,
      qualityHint: input.validation?.qualityHint,
      issues: input.validation?.issues || [],
    },
    deliverablePack: generateDeliverablePack(execution, input.evidenceReceipt),
    receiptAdapter: {
      source: 'web_governance_evidence_receipt',
      target: 'deliverable_pack_governance_evidence',
      receiptId: input.evidenceReceipt.receiptId,
      envelopeId: input.evidenceReceipt.envelopeId,
      policySnapshotId: input.evidenceReceipt.policySnapshotId,
    },
    claimBoundary: 'live_governance_proof_required_before_public_claim',
  };
}

export function buildPhase2CProductBriefSliceForRoute(
  input: BuildPhase2CProductBriefSliceForRouteInput
): Phase2CProductBriefSlice | undefined {
  if (!input.responseSuccess || !input.output) {
    return undefined;
  }

  return buildPhase2CProductBriefSlice({
    templateId: input.templateId,
    templateName: input.templateName,
    category: input.category,
    inputs: input.inputs,
    intent: input.intent,
    output: input.output,
    evidenceReceipt: input.evidenceReceipt,
    validation: input.validation,
  });
}
