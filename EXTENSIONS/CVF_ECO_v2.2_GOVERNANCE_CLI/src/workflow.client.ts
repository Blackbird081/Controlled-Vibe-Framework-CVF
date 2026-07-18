import { CLIArgs, CLIOutput } from "./types";
import { executeGovernedTemplateCommand, FetchLike, buildExecutePayload } from "./execute.client";
import { buildMa1Packet, type Ma1CliPacket } from "./ma1-packet";

export const WORKFLOW_CHAIN_CONTRACT =
  "cvf.workflowChainExecution.wce.w1.v1" as const;

// Canonical role sequence per template key.
// Duplicated here to keep CLI standalone (no cross-package dependency on cvf-web).
export const CLI_WORKFLOW_TEMPLATES: Record<string, string[]> = {
  fullCycle: ["OPERATOR", "AI_AGENT", "AI_AGENT", "REVIEWER"],
  designOnly: ["AI_AGENT"],
  buildReview: ["AI_AGENT", "REVIEWER"],
  quickBuild: ["AI_AGENT"],
};

export interface WorkflowStepResult {
  stepIndex: number;
  agentRole: string;
  templateId: string;
  input: string;
  output: string;
  receipt?: unknown;
  ma1Packet?: Ma1CliPacket;
  success: boolean;
  error?: string;
}

export interface WorkflowChainResult {
  contractVersion: typeof WORKFLOW_CHAIN_CONTRACT;
  templateKey: string;
  totalSteps: number;
  steps: WorkflowStepResult[];
  finalOutput: string;
  success: boolean;
  error?: string;
}

function extractOutputFromResult(result: CLIOutput): string {
  if (result.data && typeof result.data === "object") {
    const d = result.data as Record<string, unknown>;
    // Try to extract meaningful text output from governance receipt
    const receipt = d.governanceEvidenceReceipt;
    if (receipt && typeof receipt === "object") {
      const r = receipt as Record<string, unknown>;
      if (typeof r.output === "string") return r.output;
    }
    if (typeof d.output === "string") return d.output;
    if (typeof d.message === "string") return d.message;
  }
  // Fall back to message text, stripping JSON wrapper if possible
  try {
    const parsed = JSON.parse(result.message) as Record<string, unknown>;
    if (typeof parsed.output === "string") return parsed.output;
  } catch {
    // not JSON
  }
  return result.message;
}

export async function executeWorkflowChain(
  templateKey: string,
  initialInput: string,
  options: {
    endpoint: string;
    baseRole?: string;
    receipt: boolean;
    verbose: boolean;
    providers?: Record<string, string>;
    fetchFn?: FetchLike;
  },
): Promise<WorkflowChainResult> {
  const roles = CLI_WORKFLOW_TEMPLATES[templateKey];
  if (!roles || roles.length === 0) {
    return {
      contractVersion: WORKFLOW_CHAIN_CONTRACT,
      templateKey,
      totalSteps: 0,
      steps: [],
      finalOutput: "",
      success: false,
      error: `Unknown workflow template: ${templateKey}. Valid keys: ${Object.keys(CLI_WORKFLOW_TEMPLATES).join(", ")}`,
    };
  }

  const steps: WorkflowStepResult[] = [];
  let currentInput = initialInput;

  for (let i = 0; i < roles.length; i++) {
    const role = roles[i];
    const provider = options.providers?.[role.toLowerCase()] ?? options.providers?.[role];

    // Build CLIArgs for this step
    const stepArgs: CLIArgs = {
      command: "execute",
      positional: [],
      flags: {
        template: templateKey,
        role,
        input: JSON.stringify({ intent: currentInput }),
        endpoint: options.endpoint,
        receipt: options.receipt,
        verbose: options.verbose,
        ...(provider ? { provider } : {}),
        ...(options.providers
          ? { providers: Object.entries(options.providers).map(([k, v]) => `${k}:${v}`).join(",") }
          : {}),
      },
    };

    let result: CLIOutput;
    try {
      result = options.fetchFn
        ? await executeGovernedTemplateCommand(stepArgs, options.fetchFn)
        : await executeGovernedTemplateCommand(stepArgs);
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      steps.push({
        stepIndex: i,
        agentRole: role,
        templateId: templateKey,
        input: currentInput,
        output: "",
        success: false,
        error,
      });
      return {
        contractVersion: WORKFLOW_CHAIN_CONTRACT,
        templateKey,
        totalSteps: roles.length,
        steps,
        finalOutput: "",
        success: false,
        error: `Step ${i + 1} (${role}) threw: ${error}`,
      };
    }

    const output = extractOutputFromResult(result);
    const stepReceipt = result.success ? (result.data as Record<string, unknown>)?.governanceEvidenceReceipt : undefined;
    const nextRole = roles[i + 1];
    const ma1Packet = options.receipt && result.success && nextRole
      ? buildMa1Packet(
          { stepIndex: i, agentRole: role, templateId: templateKey, input: currentInput, output, receipt: stepReceipt, success: true },
          nextRole,
          templateKey,
          options.providers ? { provider: options.providers[nextRole.toLowerCase()] ?? options.providers[nextRole] } : undefined,
        )
      : undefined;
    const step: WorkflowStepResult = {
      stepIndex: i,
      agentRole: role,
      templateId: templateKey,
      input: currentInput,
      output,
      receipt: stepReceipt,
      ma1Packet,
      success: result.success,
      error: result.success ? undefined : result.message,
    };
    steps.push(step);

    if (!result.success) {
      return {
        contractVersion: WORKFLOW_CHAIN_CONTRACT,
        templateKey,
        totalSteps: roles.length,
        steps,
        finalOutput: "",
        success: false,
        error: `Step ${i + 1} (${role}) failed: ${result.message}`,
      };
    }

    // Chain: output of this step becomes input of next
    currentInput = output;
  }

  return {
    contractVersion: WORKFLOW_CHAIN_CONTRACT,
    templateKey,
    totalSteps: roles.length,
    steps,
    finalOutput: currentInput,
    success: true,
  };
}
