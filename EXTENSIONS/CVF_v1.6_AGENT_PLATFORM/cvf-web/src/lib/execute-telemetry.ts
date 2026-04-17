import type { AIProvider, ExecutionRequest, ExecutionResponse } from '@/lib/ai';
import { calculateTokenCost } from '@/lib/model-pricing';
import { appendAuditEvent, appendCostEvent } from '@/lib/control-plane-events';
import type { SessionCookie } from '@/lib/middleware-auth';

function estimateTokenCount(value: string | undefined): number {
  const content = value?.trim() ?? '';
  if (!content) return 0;
  return Math.max(1, Math.ceil(content.length / 4));
}

export function resolveTokenUsage(prompt: string, output: string, response: ExecutionResponse) {
  const inputTokens = response.usage?.inputTokens ?? estimateTokenCount(prompt);
  const outputTokens = response.usage?.outputTokens ?? estimateTokenCount(output);
  const totalTokens = response.usage?.totalTokens ?? response.tokensUsed ?? (inputTokens + outputTokens);

  return {
    inputTokens,
    outputTokens,
    totalTokens,
  };
}

export async function emitExecutionTelemetry(input: {
  session: SessionCookie | null;
  request: Partial<ExecutionRequest>;
  prompt: string;
  output: string;
  provider: AIProvider;
  model: string;
  response: ExecutionResponse;
}) {
  const userId = input.session?.userId ?? 'service-account';
  const teamId = input.session?.teamId ?? 'team_exec';
  const orgId = input.session?.orgId ?? 'org_cvf';
  const actorRole = input.session?.role ?? 'admin';
  const usage = resolveTokenUsage(input.prompt, input.output, input.response);
  const estimatedCostUSD = calculateTokenCost(input.model, usage.inputTokens, usage.outputTokens);

  await appendCostEvent({
    userId,
    teamId,
    orgId,
    skillId: input.request.skillIds?.[0],
    templateId: input.request.templateId,
    provider: input.provider,
    model: input.model,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    estimatedCostUSD,
  });

  await appendAuditEvent({
    eventType: 'EXECUTION_COMPLETED',
    actorId: userId,
    actorRole,
    targetResource: input.request.templateName || input.request.templateId || 'unknown-template',
    action: 'EXECUTE_AI_TEMPLATE',
    riskLevel: input.request.cvfRiskLevel,
    phase: input.request.cvfPhase,
    outcome: 'SUCCESS',
    payload: {
      provider: input.provider,
      model: input.model,
      totalTokens: usage.totalTokens,
      estimatedCostUSD,
      skillIds: input.request.skillIds ?? [],
    },
  });
}
