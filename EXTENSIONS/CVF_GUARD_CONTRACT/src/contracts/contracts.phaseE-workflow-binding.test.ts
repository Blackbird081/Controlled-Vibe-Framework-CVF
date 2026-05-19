import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { WorkflowBinding } from './workflow-binding.contract';
import {
  WORKFLOW_BINDING_CONTRACT_VERSION,
  getActiveWorkflowSteps,
  validateWorkflowBinding,
} from './workflow-binding.contract';

const bindingUrl = new URL(
  '../../../CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/workflows/workflow.product.create_product_brief.v1.json',
  import.meta.url,
);

function loadCreateProductBriefBinding(): WorkflowBinding {
  return JSON.parse(readFileSync(bindingUrl, 'utf8')) as WorkflowBinding;
}

describe('Phase E workflow binding contract', () => {
  it('validates the concrete Create Product Brief workflow binding', () => {
    const binding = loadCreateProductBriefBinding();

    expect(binding.workflowId).toBe('workflow.product.create_product_brief.v1');
    expect(binding.version).toBe(WORKFLOW_BINDING_CONTRACT_VERSION);
    expect(validateWorkflowBinding(binding)).toEqual({ valid: true, errors: [] });
  });

  it('keeps the reviewer step deferred and outside active runtime steps', () => {
    const binding = loadCreateProductBriefBinding();
    const activeSteps = getActiveWorkflowSteps(binding);

    expect(activeSteps.map((step) => step.sequence)).toEqual([1, 2, 3, 5]);

    const reviewerStep = binding.steps.find((step) => step.sequence === 4);
    expect(reviewerStep?.role.role).toBe('REVIEWER');
    expect(reviewerStep?.status).toBe('deferred_until_reviewer_surface');
    expect(activeSteps.some((step) => step.stepId === reviewerStep?.stepId)).toBe(false);
  });

  it('requires receipt-required steps to match transition receipt metadata', () => {
    const binding = loadCreateProductBriefBinding();
    const receiptSteps = binding.steps.filter((step) => step.receiptRequired);

    expect(receiptSteps.length).toBe(binding.steps.length);
    for (const step of receiptSteps) {
      expect(step.transition.receiptRequired).toBe(true);
    }
  });

  it('rejects invalid role vocabulary', () => {
    const binding = loadCreateProductBriefBinding();
    const invalidBinding = {
      ...binding,
      steps: [
        {
          ...binding.steps[0],
          role: { role: 'PRODUCT_MANAGER' },
        },
        ...binding.steps.slice(1),
      ],
    } as unknown as WorkflowBinding;

    expect(validateWorkflowBinding(invalidBinding)).toEqual({
      valid: false,
      errors: ['invalid role for step-1-intake-validation: PRODUCT_MANAGER'],
    });
  });

  it('rejects invalid output-class vocabulary', () => {
    const binding = loadCreateProductBriefBinding();
    const invalidBinding = {
      ...binding,
      steps: [
        {
          ...binding.steps[0],
          outputClass: 'prd_document',
        },
        ...binding.steps.slice(1),
      ],
    } as unknown as WorkflowBinding;

    expect(validateWorkflowBinding(invalidBinding)).toEqual({
      valid: false,
      errors: ['invalid outputClass for step-1-intake-validation: prd_document'],
    });
  });

  it('rejects deferred non-reviewer steps', () => {
    const binding = loadCreateProductBriefBinding();
    const invalidBinding = {
      ...binding,
      steps: binding.steps.map((step) =>
        step.sequence === 2
          ? { ...step, status: 'deferred_until_reviewer_surface' }
          : step,
      ),
    } as WorkflowBinding;

    expect(validateWorkflowBinding(invalidBinding)).toEqual({
      valid: false,
      errors: [
        'deferred reviewer surface step must use REVIEWER role: step-2-knowledge-retrieval',
      ],
    });
  });
});
