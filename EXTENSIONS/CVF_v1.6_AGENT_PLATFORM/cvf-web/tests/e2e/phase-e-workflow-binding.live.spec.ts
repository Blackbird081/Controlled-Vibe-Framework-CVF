import { test, expect } from '@playwright/test';

import { loginAs, seedStorageWithAlibaba } from './utils';

const hasAlibabaKey = Boolean(
  process.env.DASHSCOPE_API_KEY
  || process.env.ALIBABA_API_KEY
  || process.env.CVF_ALIBABA_API_KEY
  || process.env.CVF_BENCHMARK_ALIBABA_KEY,
);

test.beforeEach(async ({ page }) => {
  test.skip(!hasAlibabaKey, 'Phase E workflow binding live proof requires a DashScope-compatible key.');
  await seedStorageWithAlibaba(page);
});

test('Phase E E.6 verifies governed Product Brief execution chain checkpoints', async ({ page }) => {
  await loginAs(page, 'dev', 'dev123');

  const response = await page.request.post('/api/execute', {
    data: {
      templateId: 'app_builder_complete',
      templateName: 'App Builder Complete',
      intent: 'Create a concise product brief for TaskFlow, a lightweight task-planning app for small product teams.',
      inputs: {
        appName: 'TaskFlow',
        appType: 'Web App',
        problem: 'Small teams need a lighter way to plan, triage, and hand off work.',
        targetUsers: 'Small product teams and founders',
        coreFeatures: 'Task board, owner fields, status filters, acceptance criteria, weekly summary',
        successCriteria: 'A user can create, assign, filter, and review tasks without onboarding friction.',
        platforms: 'Web browser',
      },
      provider: 'alibaba',
      model: 'qwen-turbo',
      cvfPhase: 'BUILD',
      cvfRiskLevel: 'R1',
      action: 'build template execution request',
      skillPreflightPassed: true,
      skillPreflightDeclaration: 'SKILL PREFLIGHT PASS: product brief only, no implementation.',
      skillIds: ['product-brief-authoring'],
      aiCommit: {
        commitId: 'phase-e-e4-workflow-live-proof',
        agentId: 'cvf-playwright-live',
        timestamp: Date.now(),
        description: 'Phase E E.6 governed execution chain live proof',
      },
    },
  });

  const body = await response.json();

  expect(response.status()).toBe(200);
  expect(body.success).toBe(true);
  expect(body.providerRouting?.selectedProvider).toBe('alibaba');
  expect(body.rolePermission).toMatchObject({
    role: 'BUILDER',
    permissionRole: 'BUILDER',
    outputClass: 'artifact',
    allowed: true,
  });
  expect(body.governanceEnvelope).toEqual(expect.objectContaining({
    phase: 'BUILD',
    riskLevel: 'R1',
  }));
  expect(body.workflowId).toBe('workflow.product.create_product_brief.v1');
  expect(body.stepTraces.map((trace: { stepId: string }) => trace.stepId)).toEqual([
    'step-1-intake-validation',
    'step-2-knowledge-retrieval',
    'step-3-provider-call',
    'step-4-review-gate',
    'step-5-receipt-emit',
  ]);
  expect(body.stepTraces.filter((trace: { decision: string }) => trace.decision === 'completed').every((trace: {
    preconditionChecked: boolean;
    decision: string;
    receiptId: string | null;
    source: string;
  }) => (
    trace.preconditionChecked === true
    && trace.decision === 'completed'
    && trace.receiptId === body.governanceEvidenceReceipt.receiptId
    && trace.source === 'route_dispatch'
  ))).toBe(true);
  expect(body.stepTraces).toContainEqual(expect.objectContaining({
    stepId: 'step-4-review-gate',
    decision: 'deferred',
    receiptId: null,
  }));
  expect(body.stepTraces).toContainEqual(expect.objectContaining({
    stepId: 'step-5-receipt-emit',
    decision: 'deferred',
    receiptId: null,
  }));
  expect(body.stateMachine).toMatchObject({
    contractVersion: 'cvf.workflowStateMachineProjection.v1',
    workflowId: 'workflow.product.create_product_brief.v1',
    initialState: 'intake_pending',
    finalState: 'review_pending',
    completedStepIds: [
      'step-1-intake-validation',
      'step-2-knowledge-retrieval',
      'step-3-provider-call',
    ],
    deferredStepIds: [
      'step-4-review-gate',
      'step-5-receipt-emit',
    ],
    waitingStepIds: ['step-5-receipt-emit'],
  });
  expect(body.receiptObligations.map((obligation: { role: string; actionClass: string }) => [
    obligation.role,
    obligation.actionClass,
  ])).toEqual([
    ['BUILDER', 'artifact_export'],
    ['BUILDER', 'file_read'],
    ['BUILDER', 'provider_call'],
    ['BUILDER', 'artifact_export'],
  ]);
  expect(body.receipts).toEqual(body.receiptBinding.emissions.map((emission: {
    stepId: string;
    obligationId: string;
  }) => ({
    stepId: emission.stepId,
    receiptId: body.governanceEvidenceReceipt.receiptId,
    source: 'governance_evidence_receipt',
    obligationId: emission.obligationId,
  })));
  expect(body.receipts.map((receipt: { stepId: string }) => receipt.stepId)).toEqual([
    'step-1-intake-validation',
    'step-2-knowledge-retrieval',
    'step-3-provider-call',
  ]);
  expect(body.receiptBinding.fullMatrixDisposition).toBe('deferred_with_reason');
  expect(body.deferredStepIds).toEqual([
    'step-4-review-gate',
    'step-5-receipt-emit',
  ]);
  expect(String(body.output ?? '')).not.toContain('MOCK_');
});
