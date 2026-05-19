import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type { WorkflowBinding, WorkflowStepExecutionTrace } from './workflow-binding.contract';
import {
  FULL_ROLE_ACTION_MATRIX_DEFERRED_REASON,
  RECEIPT_BINDING_CONTRACT_VERSION,
  bindStepReceipts,
  buildSelectedFlowReceiptObligations,
  emitStepReceipt,
} from './receipt-binding.contract';

function loadProductBriefBinding(): WorkflowBinding {
  const bindingPath = resolve(
    process.cwd(),
    '../CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/workflows/workflow.product.create_product_brief.v1.json',
  );
  return JSON.parse(readFileSync(bindingPath, 'utf8')) as WorkflowBinding;
}

function makeTraces(binding: WorkflowBinding): WorkflowStepExecutionTrace[] {
  return binding.steps
    .filter((step) => step.status === 'active')
    .map((step) => ({
      stepId: step.stepId,
      preconditionChecked: true,
      decision: 'completed',
      receiptId: `receipt-${step.sequence}`,
      source: 'route_dispatch',
    }));
}

describe('Phase E receipt binding contract', () => {
  it('covers only active selected-flow role/action pairs', () => {
    const binding = loadProductBriefBinding();
    const obligations = buildSelectedFlowReceiptObligations(binding);

    expect(obligations.map((obligation) => [
      obligation.stepId,
      obligation.role,
      obligation.actionClass,
      obligation.outputClass,
    ])).toEqual([
      ['step-1-intake-validation', 'BUILDER', 'artifact_export', 'recommendation'],
      ['step-2-knowledge-retrieval', 'BUILDER', 'file_read', 'analysis'],
      ['step-3-provider-call', 'BUILDER', 'provider_call', 'artifact'],
      ['step-5-receipt-emit', 'BUILDER', 'artifact_export', 'implementation_note'],
    ]);
    expect(obligations.map((obligation) => obligation.stepId))
      .not.toContain('step-4-review-gate');
    expect(obligations.every((obligation) => obligation.disposition === 'covered_selected_flow'))
      .toBe(true);
  });

  it('emits a step receipt only when a matching trace carries a receipt id', () => {
    const binding = loadProductBriefBinding();
    const [obligation] = buildSelectedFlowReceiptObligations(binding);

    expect(emitStepReceipt(obligation, {
      stepId: obligation.stepId,
      preconditionChecked: true,
      decision: 'completed',
      receiptId: 'receipt-1',
      source: 'route_dispatch',
    })).toMatchObject({
      obligationId: obligation.obligationId,
      stepId: obligation.stepId,
      receiptId: 'receipt-1',
      emitted: true,
      source: 'workflow_step_trace',
    });

    expect(emitStepReceipt(obligation, {
      stepId: obligation.stepId,
      preconditionChecked: true,
      decision: 'completed',
      receiptId: null,
      source: 'route_dispatch',
    })).toBeUndefined();
  });

  it('binds selected-flow traces and explicitly defers the full matrix', () => {
    const binding = loadProductBriefBinding();
    const result = bindStepReceipts(binding, makeTraces(binding));

    expect(result.contractVersion).toBe(RECEIPT_BINDING_CONTRACT_VERSION);
    expect(result.obligations).toHaveLength(4);
    expect(result.emissions).toHaveLength(4);
    expect(result.emissions.map((emission) => emission.stepId)).toEqual([
      'step-1-intake-validation',
      'step-2-knowledge-retrieval',
      'step-3-provider-call',
      'step-5-receipt-emit',
    ]);
    expect(result.fullMatrixDisposition).toBe('deferred_with_reason');
    expect(result.fullMatrixDeferredReason).toBe(FULL_ROLE_ACTION_MATRIX_DEFERRED_REASON);
  });
});
