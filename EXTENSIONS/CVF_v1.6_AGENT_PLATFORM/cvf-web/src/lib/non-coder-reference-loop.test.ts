import { describe, expect, it } from 'vitest';
import {
  buildNonCoderReferenceLoop,
  buildNonCoderLiveExecutionRequest,
  formatNonCoderReferenceLoopMarkdown,
} from './non-coder-reference-loop';

describe('non-coder reference loop', () => {
  it('builds a canonical 5-phase governed packet', () => {
    const artifact = buildNonCoderReferenceLoop({
      appName: 'TaskFlow',
      appType: 'Web App',
      problem: 'Teams lose track of recurring work',
      targetUsers: 'small operations teams',
      coreFeatures: 'Task board\nRecurring tasks\nDue date reminders',
      outOfScope: 'Mobile app\nReal-time chat',
      techPreference: 'Next.js',
      dataStorage: 'Cloud Database',
      archType: 'Layered (UI/Logic/Data)',
      apiStyle: 'REST API',
      distribution: 'GitHub Releases',
      spec: '# TaskFlow Spec',
    });

    expect(artifact.riskLevel).toBe('R2');
    expect(artifact.phases.map(phase => phase.phase)).toEqual([
      'INTAKE',
      'DESIGN',
      'BUILD',
      'REVIEW',
      'FREEZE',
    ]);
    expect(artifact.approvals.map(approval => approval.id)).toEqual([
      'design-gate',
      'freeze-gate',
    ]);
    expect(artifact.executionHandoff.mode).toBe('full');
    expect(artifact.executionHandoff.templateId).toBe('app_builder_wizard');
    expect(artifact.executionHandoff.cvfPhase).toBe('BUILD');
    expect(artifact.executionHandoff.skillPreflightDeclaration).toContain('NONCODER_REFERENCE_PACKET');
    expect(artifact.freezeReceipt.baselineArtifact).toContain('TASKFLOW_FREEZE_RECEIPT.md');
  });

  it('converts the packet into a governed live execution request', () => {
    const artifact = buildNonCoderReferenceLoop({
      appName: 'DeskMate',
      appType: 'Desktop App',
      problem: 'Personal admin work is too fragmented',
      spec: '# DeskMate Spec',
    });

    const live = buildNonCoderLiveExecutionRequest(artifact);

    expect(live.request.templateId).toBe('app_builder_wizard');
    expect(live.request.mode).toBe('full');
    expect(live.request.cvfPhase).toBe('BUILD');
    expect(live.request.fileScope?.length).toBeGreaterThan(0);
    expect(live.request.skillPreflightDeclaration).toContain('NONCODER_REFERENCE_PACKET');
    expect(live.freezeReceipt.acceptedOutput).toContain('DeskMate');
  });

  it('formats markdown with freeze receipt and approvals', () => {
    const artifact = buildNonCoderReferenceLoop({
      appName: 'DeskMate',
      appType: 'Desktop App',
      problem: 'Personal admin work is too fragmented',
      spec: '# DeskMate Spec',
    });

    const markdown = formatNonCoderReferenceLoopMarkdown(artifact);

    expect(markdown).toContain('# DeskMate Governed Non-Coder Reference Packet');
    expect(markdown).toContain('## Approval Checkpoints');
    expect(markdown).toContain('## Freeze Receipt');
    expect(markdown).toContain('Mode: full');
  });
});
