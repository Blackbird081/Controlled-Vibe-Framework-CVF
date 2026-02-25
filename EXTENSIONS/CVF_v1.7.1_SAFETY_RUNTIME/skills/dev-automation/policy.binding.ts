/**
 * policy.binding.ts
 *
 * Governance binding layer for DevAutomation skill.
 *
 * Responsible for:
 * - System guard enforcement
 * - Risk evaluation
 * - Budget enforcement (via cost.binding)
 * - Approval state validation
 *
 * Does NOT:
 * - Execute AI
 * - Generate code
 * - Modify policy rules
 */

import { enforceSystemPolicy } from "@/governance/system/system.guard";
import { RiskEngine } from "@/governance/risk/risk.engine";
import { enforceDevAutomationBudget } from "./cost.binding";
import { prisma } from "@/lib/db";

/**
 * Input contract for policy evaluation
 */
export interface DevAutomationPolicyInput {
  proposalId: string;
  userId: string;
  role: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  sessionId?: string;
}

/**
 * Final policy evaluation result
 */
export interface DevAutomationPolicyResult {
  allowed: boolean;
  estimatedUsd: number;
  totalTokens: number;
}

/**
 * Main governance gate for DevAutomation
 */
export async function enforceDevAutomationPolicy(
  input: DevAutomationPolicyInput
): Promise<DevAutomationPolicyResult> {
  const {
    proposalId,
    userId,
    role,
    model,
    inputTokens,
    outputTokens,
    sessionId,
  } = input;

  /**
   * 1️⃣ System-level kill switch
   */
  enforceSystemPolicy();

  /**
   * 2️⃣ Load proposal
   */
  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
  });

  if (!proposal) {
    throw new Error("Proposal not found");
  }

  /**
   * 3️⃣ Risk evaluation
   */
  const riskEngine = new RiskEngine();

  const riskResult = await riskEngine.evaluate({
    instruction: proposal.instruction,
    role,
  });

  if (!riskResult.allowed) {
    throw new Error(`Risk blocked: ${riskResult.reason}`);
  }

  /**
   * 4️⃣ Budget enforcement (includes cost estimation)
   */
  const budgetResult = await enforceDevAutomationBudget({
    userId,
    role,
    usage: {
      model,
      inputTokens,
      outputTokens,
    },
    sessionId,
  });

  /**
   * 5️⃣ Approval state validation
   */
  if (proposal.approvalStatus !== "APPROVED") {
    throw new Error("Proposal not approved");
  }

  return {
    allowed: true,
    estimatedUsd: budgetResult.estimatedUsd,
    totalTokens: budgetResult.totalTokens,
  };
}