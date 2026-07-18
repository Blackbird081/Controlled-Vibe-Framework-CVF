import { WORKFLOW_CHAIN_CONTRACT, WorkflowStepResult } from "./workflow.client";

export const MA1_CLI_CONTRACT =
  "cvf.ma1CliSerialization.wce.w2.v1" as const;

export const MA1_STANDARD_CONTRACT =
  "cvf.internalMultiAgentTransfer.ma1.v1" as const;

export interface Ma1CliPacket {
  contractVersion: typeof MA1_CLI_CONTRACT;
  ma1ContractVersion: typeof MA1_STANDARD_CONTRACT;
  workflowContractVersion: typeof WORKFLOW_CHAIN_CONTRACT;
  stepIndex: number;
  templateKey: string;
  date: string;
  topic: string;
  surfaceFidelityGate: { passed: boolean; notes: string };
  authorityChain: string[];
  sourcePacket: { role: string; output: string; receiptId?: string };
  roleAssignment: { targetRole: string; provider?: string };
  executionInstructions: string;
  roleOutputSchema: string;
  dissentLedger: string[];
  integrationDecision: { decision: "proceed" | "hold" | "escalate"; reason: string };
  completionEvidence: { receiptId: string; decision: string } | null;
  claimBoundary: string;
}

export function buildMa1Packet(
  completedStep: WorkflowStepResult,
  nextRole: string,
  templateKey: string,
  options?: { provider?: string; dissentLedger?: string[] },
): Ma1CliPacket {
  const receiptId =
    completedStep.receipt &&
    typeof completedStep.receipt === "object" &&
    "receiptId" in (completedStep.receipt as Record<string, unknown>)
      ? String((completedStep.receipt as Record<string, unknown>).receiptId)
      : undefined;

  return {
    contractVersion: MA1_CLI_CONTRACT,
    ma1ContractVersion: MA1_STANDARD_CONTRACT,
    workflowContractVersion: WORKFLOW_CHAIN_CONTRACT,
    stepIndex: completedStep.stepIndex,
    templateKey,
    date: new Date().toISOString().slice(0, 10),
    topic: `Transfer from ${completedStep.agentRole} to ${nextRole} in ${templateKey} pipeline`,
    surfaceFidelityGate: {
      passed: completedStep.success,
      notes: completedStep.success ? "Step completed successfully" : (completedStep.error ?? "Step failed"),
    },
    authorityChain: [
      `docs/baselines/CVF_GC018_WCE_WORKFLOW_CHAIN_EXECUTION_2026-05-29.md`,
      `docs/reference/CVF_INTERNAL_MULTI_AGENT_WORK_TRANSFER_PACKET_STANDARD_2026-05-26.md`,
      `docs/baselines/CVF_GC018_MA1_INTERNAL_MULTI_AGENT_WORK_TRANSFER_PACKET_2026-05-26.md`,
    ],
    sourcePacket: {
      role: completedStep.agentRole,
      output: completedStep.output,
      ...(receiptId ? { receiptId } : {}),
    },
    roleAssignment: {
      targetRole: nextRole,
      ...(options?.provider ? { provider: options.provider } : {}),
    },
    executionInstructions: completedStep.output,
    roleOutputSchema: "Governed response per CVF template contract",
    dissentLedger: options?.dissentLedger ?? [],
    integrationDecision: {
      decision: completedStep.success ? "proceed" : "hold",
      reason: completedStep.success
        ? "Prior step completed and passed surface fidelity gate"
        : "Prior step failed — hold until resolved",
    },
    completionEvidence: receiptId
      ? {
          receiptId,
          decision: completedStep.receipt
            ? String((completedStep.receipt as Record<string, unknown>).decision ?? "ALLOW")
            : "ALLOW",
        }
      : null,
    claimBoundary:
      "This packet does not authorize agent execution, memory reinjection, or governance override. It is a structured handoff record only.",
  };
}
