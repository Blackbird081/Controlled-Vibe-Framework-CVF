/**
 * System Chain UC-03 Contract-To-Runtime Representative Path -- Proof Cases
 *
 * GC-011: CvfSdk -> PipelineOrchestrator caller-backed representative path.
 * One positive case (runReferenceGovernedLoop through public SDK) and one
 * negative case (SDK-created governed pipeline blocked from BUILD without PLAN).
 *
 * Provider-free local proof only. Zero provider/API/MCP calls.
 */

import { describe, it, expect } from 'vitest';
import { CvfSdk } from '../governance/guard_runtime/sdk/cvf.sdk.js';
import { PipelineOrchestrator } from '../governance/guard_runtime/pipeline.orchestrator.js';

describe('UC-03 Contract-To-Runtime Representative Path (GC-011)', () => {

  // --- Positive case: runReferenceGovernedLoop through public SDK ---

  it('GC-011 positive: CvfSdk.runReferenceGovernedLoop reaches terminal COMPLETED with guard ALLOW', async () => {
    const cvf = CvfSdk.create();

    const result = await cvf.runReferenceGovernedLoop({
      workflowId: 'uc03-positive-loop',
      pipelineId: 'uc03-positive-pipeline',
      intent: 'UC-03 positive contract-to-runtime proof',
      riskLevel: 'R1',
      requireApproval: false,
      role: 'HUMAN',
    });

    expect(result.success).toBe(true);
    expect(result.workflowStatus).toBe('COMPLETED');
    expect(result.pipelineStatus).toBe('COMPLETED');
    expect(result.guardDecision).toBe('ALLOW');
    expect(result.checkpointId).toBeDefined();
    expect(result.freezeReceipt).toBeDefined();
    expect(result.pipeline?.artifacts.some((a) => a.type === 'FREEZE')).toBe(true);
  });

  // --- Negative case: SDK-created governed pipeline, DESIGN -> BUILD blocked without PLAN ---

  it('GC-011 negative: CvfSdk.createPipeline governed pipeline blocked from BUILD without PLAN artifact', () => {
    const cvf = CvfSdk.create();

    const pipeline = cvf.createPipeline({
      id: 'uc03-neg-gov',
      intent: 'UC-03 negative contract-to-runtime proof',
      riskLevel: 'R1',
      role: 'HUMAN',
      metadata: { controlMode: 'governed' },
    });

    expect(pipeline.id).toBe('uc03-neg-gov');
    expect(pipeline.status).toBe('CREATED');

    // Access the SDK's internal PipelineOrchestrator for phase advances.
    // The SDK's createPipeline delegates to this same orchestrator.
    const orchestrator = (cvf as unknown as { pipeline: PipelineOrchestrator }).pipeline;

    // CREATED -> INTAKE
    let r = orchestrator.advancePhase('uc03-neg-gov');
    expect(r.success).toBe(true);

    // INTAKE -> DESIGN
    r = orchestrator.advancePhase('uc03-neg-gov');
    expect(r.success).toBe(true);

    const current = orchestrator.getPipeline('uc03-neg-gov');
    expect(current?.status).toBe('DESIGN');

    // DESIGN -> BUILD blocked: no PLAN artifact in governed mode
    r = orchestrator.advancePhase('uc03-neg-gov');
    expect(r.success).toBe(false);
    expect(r.error).toContain('PLAN artifact');
  });
});
