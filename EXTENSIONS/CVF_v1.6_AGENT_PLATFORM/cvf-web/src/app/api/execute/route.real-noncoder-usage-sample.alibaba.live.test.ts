/**
 * Real Noncoder Usage Sample — Alibaba Live Strategy Run
 *
 * Generates one operator-review packet for a real non-coder usability check.
 * This proves the live route can emit a Strategy answer plus VI4 evidence, but
 * does not self-pass the human readability/usefulness gate.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { resolveAlibabaApiKey } from '@/lib/alibaba-env';
import { generateIntent, getTemplateById } from '@/lib/templates';

const evaluateEnforcementMock = vi.hoisted(() => vi.fn());
const verifySessionCookieMock = vi.hoisted(() => vi.fn());
const checkTeamQuotaMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/enforcement', () => ({
  evaluateEnforcement: evaluateEnforcementMock,
}));

vi.mock('@/lib/middleware-auth', () => ({
  verifySessionCookie: verifySessionCookieMock,
  withSessionAuditPayload: (
    session: { impersonation?: { realActorId: string; sessionId: string } } | null | undefined,
    payload?: Record<string, unknown>,
  ) => {
    const nextPayload = { ...(payload ?? {}) };
    if (session?.impersonation) {
      nextPayload.impersonatedBy = session.impersonation.realActorId;
      nextPayload.impersonationSessionId = session.impersonation.sessionId;
    }
    return Object.keys(nextPayload).length > 0 ? nextPayload : undefined;
  },
}));

vi.mock('@/lib/quota-guard', () => ({
  checkTeamQuota: checkTeamQuotaMock,
  hasSoftCapAuditEvent: vi.fn().mockResolvedValue(false),
}));

import { POST } from './route';

const ALIBABA_API_KEY = resolveAlibabaApiKey();
const OUTPUT_PATH = path.resolve(
  process.cwd(),
  '../../..',
  'docs/reviews/CVF_REAL_NONCODER_USAGE_TEST_OPERATOR_SAMPLE_2026-05-25.md',
);

const STRATEGY_INPUTS = {
  topic: 'Decide the next 30-day go-to-market move for CVF after the vertical integration milestone',
  context: [
    'CVF now has proof-backed vertical integration, multi-provider coverage, and multi-workflow coverage.',
    'The operator is a non-coder who wants practical value, not more internal governance jargon.',
    'The team must avoid low-value deepening and should pick the path that best proves usefulness to real users.',
  ].join(' '),
  options: [
    '1. Run a small non-coder pilot with Strategy workflow and evidence package review.',
    '2. Build more workflow/provider coverage before user testing.',
    '3. Prepare hosted readiness first, then test with users later.',
  ].join('\n'),
  constraints: [
    'No production rollout claim from this sample.',
    'No tool execution or spending authorization.',
    'The output must explain what happened, what matters, and what to do next in language a non-coder can inspect.',
  ].join(' '),
  priority: 'Practical user value',
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return 'not_emitted';
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return JSON.stringify(value);
}

function summarizeSurface(surface: Record<string, unknown>): string {
  const keys = [
    'status',
    'decision',
    'finalState',
    'currentState',
    'recoveryAction',
    'validationGate',
    'provider',
    'model',
    'toolName',
    'runtimeExecutionAuthorized',
    'approvalState',
  ];
  const parts = keys
    .filter(key => surface[key] !== undefined)
    .map(key => `${key}=${formatValue(surface[key])}`);
  return parts.length > 0 ? parts.join('; ') : 'present';
}

function writeOperatorPacket(body: Record<string, unknown>): void {
  const receipt = asRecord(body.governanceEvidenceReceipt);
  const readout = asRecord(body.verticalIntegrationReadout);
  const evidencePackage = asRecord(readout.evidencePackage);
  const callLevel = asRecord(evidencePackage.callLevel);
  const eventModel = asRecord(evidencePackage.eventModel);
  const denominatorNote = asRecord(evidencePackage.denominatorNote);
  const stateMachine = asRecord(body.stateMachine);
  const recovery = asRecord(body.recovery);
  const toolAction = asRecord(evidencePackage.toolAction);
  const approvalState = asRecord(evidencePackage.approvalState);
  const providerMethod = asRecord(evidencePackage.providerMethod);
  const surfaces = Array.isArray(readout.surfaces)
    ? readout.surfaces as Array<Record<string, unknown>>
    : [];
  const output = String(body.output ?? body.result ?? body.message ?? '');

  const surfaceRows = surfaces
    .map(surface => `| ${formatValue(surface.surfaceId)} | ${formatValue(surface.present)} | ${summarizeSurface(surface)} |`)
    .join('\n');

  const markdown = `# CVF Real Non-Coder Usage Test - Operator Sample

Date: 2026-05-25

Status: ` + '`READY_FOR_OPERATOR_REVIEW`' + `

Purpose: provide one fresh live Strategy workflow response for a human non-coder usability check. Codex does not self-pass this gate.

## Live Run

- Provider/model: ` + '`' + `${formatValue(body.provider)}/${formatValue(body.model)}` + '`' + `
- Template/workflow: ` + '`' + `${formatValue(body.templateId)} / ${formatValue(body.workflowId)}` + '`' + `
- Receipt id: ` + '`' + `${formatValue(receipt.receiptId)}` + '`' + `
- Receipt mode/decision: ` + '`' + `${formatValue(receipt.evidenceMode)} / ${formatValue(receipt.decision)}` + '`' + `
- Trace id: ` + '`' + `${formatValue(receipt.traceId)}` + '`' + `
- Secret handling: raw API keys were not printed or written.

## Non-Coder Prompt

Topic: ${STRATEGY_INPUTS.topic}

Options:

${STRATEGY_INPUTS.options}

Constraints: ${STRATEGY_INPUTS.constraints}

## Main Output To Review

` + '```markdown' + `
${output.trim()}
` + '```' + `

## VI4 Evidence Quick Read

- Evidence contract: ` + '`' + `${formatValue(evidencePackage.contractVersion)}` + '`' + `
- Call-level result: ` + '`' + `${formatValue(callLevel.successfulCalls)}/${formatValue(callLevel.totalCalls)} successful; live=${formatValue(callLevel.liveCalls)}; receiptBacked=${formatValue(callLevel.receiptBackedCalls)}; callPassRate=${formatValue(callLevel.callPassRate)}` + '`' + `
- Event model: ` + '`' + `totalEvents=${formatValue(eventModel.totalEvents)}; eventsPerCall=${formatValue(eventModel.eventsPerCall)}` + '`' + `
- Denominator note: ${formatValue(denominatorNote.summary)}
- Tool action posture: ` + '`' + `authorized=${formatValue(toolAction.runtimeExecutionAuthorized)}; tool=${formatValue(toolAction.toolName)}` + '`' + `
- Approval posture: ` + '`' + `state=${formatValue(approvalState.status ?? approvalState.approvalState)}` + '`' + `
- Provider-method posture: ` + '`' + `status=${formatValue(providerMethod.status)}; provider=${formatValue(providerMethod.provider)}; model=${formatValue(providerMethod.model)}` + '`' + `
- Workflow state: ` + '`' + `finalState=${formatValue(stateMachine.finalState)}; recoveryAction=${formatValue(recovery.recoveryAction)}; validationGate=${formatValue(recovery.validationGate)}` + '`' + `

## Surface Scan

| Surface | Present | Short readout |
| --- | --- | --- |
${surfaceRows || '| not_emitted | false | no surface array found |'}

## Operator Questions

Please answer these as the real usability gate:

1. Could you understand the main recommendation without knowing CVF internals?
2. Did the output explain what happened and what to do next?
3. Was the VI4 evidence useful, or too much/noisy?
4. Were any words unclear, too technical, or trust-breaking?
5. Would you accept this as a good Strategy workflow result for a non-coder? Answer PASS, HOLD, or BLOCKED.
6. What one change would make this easier for a non-coder to act on?

## Claim Boundary

This packet proves one live Strategy response was generated with a governance receipt and VI4 evidence. It does not prove non-coder UX quality until the operator review above is completed.
`;

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, markdown, 'utf8');
}

describe.skipIf(!ALIBABA_API_KEY)(
  '/api/execute real noncoder usage Strategy sample — Alibaba live',
  () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
      process.env.ALIBABA_API_KEY = ALIBABA_API_KEY;

      evaluateEnforcementMock.mockReset();
      verifySessionCookieMock.mockReset();
      checkTeamQuotaMock.mockReset();

      evaluateEnforcementMock.mockReturnValue({ status: 'ALLOW', reasons: [] });
      checkTeamQuotaMock.mockResolvedValue({
        exceeded: false,
        currentUSD: 0,
        softCapUSD: 50,
        hardCapUSD: 100,
        overrideActive: false,
      });
      verifySessionCookieMock.mockResolvedValue({
        userId: 'usr_real_noncoder_usage_sample',
        user: 'Real Noncoder Usage Sample Tester',
        role: 'admin',
        orgId: 'org_cvf',
        teamId: 'team_exec',
        expiresAt: Date.now() + 3_600_000,
        authMode: 'session',
      });
    });

    afterEach(() => {
      process.env = { ...originalEnv };
    });

    it(
      'writes an operator review packet with output and VI4 evidence',
      async () => {
        const template = getTemplateById('strategy_analysis');
        expect(template).toBeDefined();

        const intent = generateIntent(template!, STRATEGY_INPUTS);
        const response = await POST(
          new Request('http://localhost/api/execute', {
            method: 'POST',
            body: JSON.stringify({
              templateId: 'strategy_analysis',
              templateName: template?.name,
              intent,
              inputs: STRATEGY_INPUTS,
              provider: 'alibaba',
              model: 'qwen-turbo',
              mode: 'simple',
              cvfRiskLevel: 'R1',
              action: 'analyze a real non-coder Strategy workflow usage sample',
              skillPreflightPassed: true,
              skillPreflightDeclaration: 'SKILL PREFLIGHT PASS: real non-coder usage sample only, no implementation.',
              skillIds: ['strategy-analysis'],
              verticalIntegrationChain: {
                threadId: `real-noncoder-usage-strategy-${Date.now()}`,
                turnIndex: 1,
                operatorGoal: 'help a non-coder decide the next 30-day CVF value proof move',
              },
              aiCommit: {
                commitId: 'real-noncoder-usage-strategy-sample',
                agentId: 'codex-real-noncoder-usage',
                timestamp: Date.now(),
                description: 'Real non-coder usage sample for operator review',
              },
            }),
          }) as never,
        );

        const body = await response.json() as Record<string, unknown>;
        if (response.status !== 200 || body.success !== true) {
          const guard = asRecord(body.guardResult);
          throw new Error(`real noncoder sample failed: http=${response.status}; success=${String(body.success)}; error=${String(body.error ?? body.model ?? 'unknown')}; guard=${formatValue(guard.finalDecision)}:${formatValue(guard.blockedBy)}`);
        }

        const receipt = asRecord(body.governanceEvidenceReceipt);
        const readout = asRecord(body.verticalIntegrationReadout);
        const evidencePackage = asRecord(readout.evidencePackage);
        const callLevel = asRecord(evidencePackage.callLevel);

        expect(body.provider).toBe('alibaba');
        expect(body.model).toBe('qwen-turbo');
        expect(receipt).toMatchObject({
          evidenceMode: 'live',
          decision: 'ALLOW',
          provider: 'alibaba',
          model: 'qwen-turbo',
        });
        expect(evidencePackage).toMatchObject({
          contractVersion: 'cvf.verticalEvidencePackage.vi4.v1',
        });
        expect(callLevel).toMatchObject({
          totalCalls: 1,
          successfulCalls: 1,
          failedCalls: 0,
          liveCalls: 1,
          receiptBackedCalls: 1,
          callPassRate: 1,
        });
        expect(String(body.output ?? '')).not.toHaveLength(0);
        expect(JSON.stringify(body)).not.toContain(ALIBABA_API_KEY);

        writeOperatorPacket(body);

        console.info(JSON.stringify({
          operatorSamplePath: OUTPUT_PATH,
          provider: body.provider,
          model: body.model,
          receiptId: receipt.receiptId,
          rawSecretPrinted: false,
        }));
      },
      180_000,
    );
  },
);
