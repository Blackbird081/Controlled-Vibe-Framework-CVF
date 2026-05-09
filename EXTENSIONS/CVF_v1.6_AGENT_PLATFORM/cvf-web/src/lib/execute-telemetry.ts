import type { AIProvider, ExecutionRequest, ExecutionResponse } from '@/lib/ai';
import { calculateTokenCost } from '@/lib/model-pricing';
import { appendAuditEvent, appendCostEvent } from '@/lib/control-plane-events';
import type { SessionCookie } from '@/lib/middleware-auth';
import { withSessionAuditPayload } from '@/lib/middleware-auth';
import { checkTeamQuota, hasSoftCapAuditEvent } from '@/lib/quota-guard';

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
  const emittedAt = new Date().toISOString();

  await appendCostEvent({
    timestamp: emittedAt,
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

  const quotaStatus = await checkTeamQuota(teamId, emittedAt);
  if (
    quotaStatus.teamId
    && quotaStatus.period
    && quotaStatus.policyTimestamp
    && quotaStatus.currentUSD >= quotaStatus.softCapUSD
  ) {
    const policyAlreadyAudited = await hasSoftCapAuditEvent(quotaStatus.teamId, {
      kind: 'quota-policy',
      id: 'quota-policy-reference',
      evidenceClass: 'FULL',
      timestamp: quotaStatus.policyTimestamp,
      teamId: quotaStatus.teamId,
      orgId,
      softCapUSD: quotaStatus.softCapUSD,
      hardCapUSD: quotaStatus.hardCapUSD,
      period: quotaStatus.period,
      setBy: 'system',
      setAt: quotaStatus.policyTimestamp,
    }, emittedAt);

    if (!policyAlreadyAudited) {
      console.warn(
        `[CVF QUOTA SOFT CAP] team=${quotaStatus.teamId} current=${quotaStatus.currentUSD.toFixed(4)} limit=${quotaStatus.softCapUSD.toFixed(4)}`,
      );
      await appendAuditEvent({
        timestamp: emittedAt,
        eventType: 'QUOTA_SOFT_CAP_REACHED',
        actorId: userId,
        actorRole,
        targetResource: quotaStatus.teamId,
        action: 'NOTIFY_TEAM_QUOTA_SOFT_CAP',
        riskLevel: 'R1',
        phase: 'PHASE C',
        outcome: 'WARNING',
        payload: withSessionAuditPayload(input.session, {
          teamId: quotaStatus.teamId,
          currentUSD: quotaStatus.currentUSD,
          softCapUSD: quotaStatus.softCapUSD,
          hardCapUSD: quotaStatus.hardCapUSD,
          period: quotaStatus.period,
          billingWindowKey: quotaStatus.billingWindowKey,
          policyTimestamp: quotaStatus.policyTimestamp,
        }),
      });
    }
  }

  await appendAuditEvent({
    timestamp: emittedAt,
    eventType: 'EXECUTION_COMPLETED',
    actorId: userId,
    actorRole,
    targetResource: input.request.templateName || input.request.templateId || 'unknown-template',
    action: 'EXECUTE_AI_TEMPLATE',
    riskLevel: input.request.cvfRiskLevel,
    phase: input.request.cvfPhase,
    outcome: 'SUCCESS',
    payload: withSessionAuditPayload(input.session, {
      provider: input.provider,
      model: input.model,
      totalTokens: usage.totalTokens,
      estimatedCostUSD,
      skillIds: input.request.skillIds ?? [],
    }),
  });
}
