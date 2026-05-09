/**
 * CVF Adoption SDK + CI/CD Tests — Track IV Phase C
 *
 * Tests the CvfSdk facade, CI config generation, and project template generation.
 */

import { describe, it, expect } from 'vitest';
import { CvfSdk } from '../governance/guard_runtime/sdk/cvf.sdk.js';
import {
  generateCIPipeline,
  generateGitHubActionsYaml,
  generateProjectTemplate,
} from '../governance/guard_runtime/sdk/ci.config.js';

const VALID_AI_COMMIT = {
  commitId: 'sdk-commit-001',
  agentId: 'sdk-agent',
  timestamp: Date.now(),
};

// --- CvfSdk ---

describe('CvfSdk', () => {
  describe('factory', () => {
    it('creates with default full config', () => {
      const cvf = CvfSdk.create();
      expect(cvf.getGuardCount()).toBe(15);
      expect(cvf.getVersion()).toBe('4.0.0-runtime');
    });

    it('creates with core preset (8 guards)', () => {
      const cvf = CvfSdk.create({ guards: 'core' });
      expect(cvf.getGuardCount()).toBe(8);
    });

    it('creates with minimal preset (0 guards)', () => {
      const cvf = CvfSdk.create({ guards: 'minimal' });
      expect(cvf.getGuardCount()).toBe(0);
    });

    it('creates with custom guards', () => {
      const custom = {
        id: 'custom_test', name: 'Custom', description: 'Test', priority: 999, enabled: true,
        evaluate: () => ({ guardId: 'custom_test', decision: 'ALLOW' as const, severity: 'INFO' as const, reason: 'ok', timestamp: new Date().toISOString() }),
      };
      const cvf = CvfSdk.create({ guards: 'minimal', customGuards: [custom] });
      expect(cvf.getGuardCount()).toBe(1);
    });

    it('exposes engine, pipeline, conformance, gateway, bridge', () => {
      const cvf = CvfSdk.create();
      expect(cvf.engine).toBeDefined();
      expect(cvf.pipeline).toBeDefined();
      expect(cvf.conformance).not.toBeNull();
      expect(cvf.gateway).not.toBeNull();
      expect(cvf.bridge).not.toBeNull();
    });

    it('disables conformance when configured', () => {
      const cvf = CvfSdk.create({ enableConformance: false });
      expect(cvf.conformance).toBeNull();
    });

    it('disables gateway when configured', () => {
      const cvf = CvfSdk.create({ enableGateway: false });
      expect(cvf.gateway).toBeNull();
    });

    it('disables extension bridge when configured', () => {
      const cvf = CvfSdk.create({ enableExtensionBridge: false });
      expect(cvf.bridge).toBeNull();
    });
  });

  describe('evaluate', () => {
    it('allows HUMAN BUILD action', () => {
      const cvf = CvfSdk.create();
      const result = cvf.evaluate({
        requestId: 'sdk-1', phase: 'BUILD', riskLevel: 'R0',
        role: 'HUMAN', action: 'write_code',
        metadata: { ai_commit: VALID_AI_COMMIT },
      });
      expect(result.finalDecision).toBe('ALLOW');
    });

    it('blocks AI_AGENT in DISCOVERY', () => {
      const cvf = CvfSdk.create();
      const result = cvf.evaluate({
        requestId: 'sdk-2', phase: 'DISCOVERY', riskLevel: 'R0',
        role: 'AI_AGENT', agentId: 'claude', action: 'explore',
      });
      expect(result.finalDecision).toBe('BLOCK');
    });

    it('blocks AI_AGENT deploy (authority gate)', () => {
      const cvf = CvfSdk.create();
      const result = cvf.evaluate({
        requestId: 'sdk-3', phase: 'BUILD', riskLevel: 'R0',
        role: 'AI_AGENT', agentId: 'claude', action: 'deploy',
      });
      expect(result.finalDecision).toBe('BLOCK');
    });
  });

  describe('processEntry', () => {
    it('processes CLI entry', () => {
      const cvf = CvfSdk.create();
      const resp = cvf.processEntry('CLI', {
        requestId: 'sdk-cli-1', action: 'write_code', phase: 'BUILD',
        risk: 'R0', role: 'HUMAN', ai_commit: VALID_AI_COMMIT,
      });
      expect(resp.allowed).toBe(true);
    });

    it('processes MCP entry', () => {
      const cvf = CvfSdk.create();
      const resp = cvf.processEntry('MCP', {
        id: 'sdk-mcp-1', tool_name: 'write_file',
        arguments: { agentId: 'claude', ai_commit: VALID_AI_COMMIT },
      });
      expect(resp.entryPoint).toBe('MCP');
    });

    it('processes API entry', () => {
      const cvf = CvfSdk.create();
      const resp = cvf.processEntry('API', {
        requestId: 'sdk-api-1', phase: 'BUILD', riskLevel: 'R0',
        role: 'HUMAN', action: 'read',
      });
      expect(resp.allowed).toBe(true);
    });

    it('throws when gateway disabled', () => {
      const cvf = CvfSdk.create({ enableGateway: false });
      expect(() => cvf.processEntry('CLI', {})).toThrow('Gateway is not enabled');
    });
  });

  describe('runConformance', () => {
    it('runs conformance and returns report', () => {
      const cvf = CvfSdk.create({ guards: 'core' });
      const report = cvf.runConformance();
      expect(report.totalScenarios).toBeGreaterThan(0);
      expect(report.passRate).toBeGreaterThan(0);
    });

    it('throws when conformance disabled', () => {
      const cvf = CvfSdk.create({ enableConformance: false });
      expect(() => cvf.runConformance()).toThrow('Conformance is not enabled');
    });
  });

  describe('createPipeline', () => {
    it('creates a governance pipeline', () => {
      const cvf = CvfSdk.create();
      const p = cvf.createPipeline({
        id: 'p1', intent: 'Test feature', riskLevel: 'R1', role: 'HUMAN',
      });
      expect(p.id).toBe('p1');
      expect(p.status).toBe('CREATED');
    });
  });

  describe('extension bridge defaults', () => {
    it('bootstraps default bridge extensions', () => {
      const cvf = CvfSdk.create();
      expect(cvf.bridge?.getExtension('v1.1.1')).toBeDefined();
      expect(cvf.bridge?.getExtension('v3.0')).toBeDefined();
      expect(cvf.bridge?.getExtension('v1.9')).toBeDefined();
    });

    it('executes a governed workflow through default runtime bindings', async () => {
      const cvf = CvfSdk.create();
      const workflow = cvf.bridge!.createWorkflow({
        id: 'sdk-wf-runtime',
        name: 'SDK runtime bridge',
        steps: [
          {
            extensionId: 'v1.1.1',
            action: 'guard_check',
            input: {
              requestId: 'sdk-wf-guard',
              phase: 'BUILD',
              riskLevel: 'R1',
              role: 'HUMAN',
              action: 'write_code',
              ai_commit: VALID_AI_COMMIT,
            },
          },
          {
            extensionId: 'v1.1.1',
            action: 'pipeline_create',
            input: {
              pipelineId: 'sdk-wf-runtime-pipeline',
              intent: 'Close workflow realism gap',
              riskLevel: 'R1',
              role: 'HUMAN',
            },
          },
          {
            extensionId: 'v1.1.1',
            action: 'pipeline_record_artifact',
            input: {
              pipelineId: 'sdk-wf-runtime-pipeline',
              type: 'PLAN',
              details: { spec: 'approved plan' },
            },
          },
          {
            extensionId: 'v1.1.1',
            action: 'pipeline_advance',
            input: {
              pipelineId: 'sdk-wf-runtime-pipeline',
              advanceCount: 3,
            },
          },
          {
            extensionId: 'v1.1.1',
            action: 'pipeline_record_artifact',
            input: {
              pipelineId: 'sdk-wf-runtime-pipeline',
              type: 'EXECUTION',
              details: { artifact: 'build-log' },
            },
          },
          {
            extensionId: 'v1.1.1',
            action: 'pipeline_advance',
            input: {
              pipelineId: 'sdk-wf-runtime-pipeline',
              advanceCount: 1,
            },
          },
          {
            extensionId: 'v1.1.1',
            action: 'pipeline_record_artifact',
            input: {
              pipelineId: 'sdk-wf-runtime-pipeline',
              type: 'REVIEW',
              details: { accepted: true },
            },
          },
          {
            extensionId: 'v1.1.1',
            action: 'pipeline_advance',
            input: {
              pipelineId: 'sdk-wf-runtime-pipeline',
              advanceCount: 1,
            },
          },
          {
            extensionId: 'v1.1.1',
            action: 'pipeline_record_artifact',
            input: {
              pipelineId: 'sdk-wf-runtime-pipeline',
              type: 'FREEZE',
              details: { receipt: 'freeze-1' },
            },
          },
          {
            extensionId: 'v1.1.1',
            action: 'pipeline_complete',
            input: {
              pipelineId: 'sdk-wf-runtime-pipeline',
            },
          },
          {
            extensionId: 'v3.0',
            action: 'skill_validate',
            input: {
              pipelineId: 'sdk-wf-runtime-pipeline',
              skill: 'workflow-remediation',
            },
          },
          {
            extensionId: 'v1.9',
            action: 'checkpoint',
            input: {
              pipelineId: 'sdk-wf-runtime-pipeline',
            },
          },
        ],
      });

      const result = await cvf.bridge!.executeWorkflow('sdk-wf-runtime');
      expect(result.success).toBe(true);
      expect(result.workflow?.status).toBe('COMPLETED');
      expect(result.workflow?.steps.every((step) => step.status === 'COMPLETED')).toBe(true);
      expect(result.workflow?.steps[0]?.guardResult?.finalDecision).toBe('ALLOW');
      expect(result.workflow?.steps[3]?.output?.status).toBe('BUILD');
      expect(result.workflow?.steps[7]?.output?.status).toBe('FREEZE');
      expect(result.workflow?.steps[11]?.output?.checkpointId).toBeDefined();
      expect(result.workflow?.steps[11]?.evidence?.runtime).toBe('deterministic_reference');
      expect(workflow.metadata?.linkedPipelineId).toBe('sdk-wf-runtime-pipeline');
    });

    it('supports governed approval checkpoints through default bridge handlers', async () => {
      const cvf = CvfSdk.create();
      cvf.bridge!.createWorkflow({
        id: 'sdk-wf-approval',
        name: 'SDK governed approval',
        steps: [
          {
            extensionId: 'v1.1.1',
            action: 'pipeline_create',
            input: {
              pipelineId: 'sdk-wf-approval-pipeline',
              intent: 'High-risk governed build',
              riskLevel: 'R2',
              role: 'HUMAN',
            },
          },
          {
            extensionId: 'v1.1.1',
            action: 'pipeline_record_artifact',
            input: {
              pipelineId: 'sdk-wf-approval-pipeline',
              type: 'PLAN',
            },
          },
          {
            extensionId: 'v1.1.1',
            action: 'pipeline_advance',
            input: {
              pipelineId: 'sdk-wf-approval-pipeline',
              advanceCount: 2,
            },
          },
          {
            extensionId: 'v1.1.1',
            action: 'pipeline_advance',
            input: {
              pipelineId: 'sdk-wf-approval-pipeline',
              advanceCount: 1,
            },
          },
          {
            extensionId: 'v1.1.1',
            action: 'pipeline_approve_checkpoint',
            input: {
              pipelineId: 'sdk-wf-approval-pipeline',
              reviewerId: 'governor-1',
              reviewerRole: 'GOVERNOR',
              comment: 'Approved for BUILD',
            },
          },
          {
            extensionId: 'v1.1.1',
            action: 'pipeline_advance',
            input: {
              pipelineId: 'sdk-wf-approval-pipeline',
              advanceCount: 1,
            },
          },
        ],
      });

      const result = await cvf.bridge!.executeWorkflow('sdk-wf-approval');
      expect(result.success).toBe(true);
      expect(result.workflow?.steps[3]?.status).toBe('SKIPPED');
      expect(result.workflow?.steps[3]?.output?.pendingApprovalId).toBeDefined();
      expect(result.workflow?.steps[4]?.output?.approvalStatus).toBe('APPROVED');
      expect(result.workflow?.steps[5]?.output?.status).toBe('BUILD');
    });

    it('runs the reference governed loop helper end-to-end', async () => {
      const cvf = CvfSdk.create();

      const result = await cvf.runReferenceGovernedLoop({
        workflowId: 'sdk-reference-loop',
        pipelineId: 'sdk-reference-pipeline',
        intent: 'Deliver a governed reference execution path',
        riskLevel: 'R2',
        requireApproval: true,
        fileScope: ['src/features/reference-loop.ts'],
        targetFiles: ['src/features/reference-loop.ts'],
        reviewerId: 'governor-42',
        reviewerComment: 'Approved via reference helper.',
      });

      expect(result.success).toBe(true);
      expect(result.workflowStatus).toBe('COMPLETED');
      expect(result.pipelineStatus).toBe('COMPLETED');
      expect(result.guardDecision).toBe('ALLOW');
      expect(result.approvalCheckpointId).toBeDefined();
      expect(result.checkpointId).toBeDefined();
      expect(result.freezeReceipt).toBeDefined();
      expect(result.workflow?.steps.every((step) => step.status === 'COMPLETED' || step.status === 'SKIPPED')).toBe(true);
      expect(result.pipeline?.artifacts.some((artifact) => artifact.type === 'FREEZE')).toBe(true);
    });
  });

  describe('audit', () => {
    it('returns audit log after evaluation', () => {
      const cvf = CvfSdk.create();
      cvf.evaluate({
        requestId: 'audit-1', phase: 'BUILD', riskLevel: 'R0',
        role: 'HUMAN', action: 'read',
      });
      const log = cvf.getAuditLog();
      expect(log.length).toBe(1);
      expect(log[0]!.requestId).toBe('audit-1');
    });
  });
});

// --- CI/CD Config ---

describe('CI/CD Configuration', () => {
  describe('generateCIPipeline', () => {
    it('generates default pipeline', () => {
      const config = generateCIPipeline();
      expect(config.provider).toBe('github-actions');
      expect(config.stages.length).toBeGreaterThan(0);
      expect(config.triggers).toContain('push');
    });

    it('uses custom options', () => {
      const config = generateCIPipeline({
        projectName: 'my-app', nodeVersion: '22', conformanceThreshold: 0.95,
      });
      expect(config.name).toContain('my-app');
      expect(config.env?.NODE_VERSION).toBe('22');
      expect(config.env?.CVF_CONFORMANCE_THRESHOLD).toBe('0.95');
    });

    it('includes guard-evaluation stage', () => {
      const config = generateCIPipeline();
      expect(config.stages.some((s) => s.name === 'guard-evaluation')).toBe(true);
    });

    it('includes conformance-test stage', () => {
      const config = generateCIPipeline();
      expect(config.stages.some((s) => s.name === 'conformance-test')).toBe(true);
    });

    it('includes audit-report stage', () => {
      const config = generateCIPipeline();
      const audit = config.stages.find((s) => s.name === 'audit-report');
      expect(audit).toBeDefined();
      expect(audit!.condition).toBe('always()');
    });
  });

  describe('generateGitHubActionsYaml', () => {
    it('generates valid YAML string', () => {
      const config = generateCIPipeline();
      const yaml = generateGitHubActionsYaml(config);
      expect(yaml).toContain('name:');
      expect(yaml).toContain('on:');
      expect(yaml).toContain('jobs:');
      expect(yaml).toContain('runs-on: ubuntu-latest');
      expect(yaml).toContain('actions/checkout@v4');
    });

    it('includes all stages', () => {
      const config = generateCIPipeline();
      const yaml = generateGitHubActionsYaml(config);
      for (const stage of config.stages) {
        expect(yaml).toContain(stage.name);
      }
    });

    it('includes env variables', () => {
      const config = generateCIPipeline();
      const yaml = generateGitHubActionsYaml(config);
      expect(yaml).toContain('NODE_VERSION');
      expect(yaml).toContain('CVF_STRICT_MODE');
    });
  });

  describe('generateProjectTemplate', () => {
    it('generates template files', () => {
      const files = generateProjectTemplate();
      expect(Object.keys(files).length).toBeGreaterThan(0);
      expect(files['scripts/cvf-guard-check.ts']).toBeDefined();
      expect(files['scripts/cvf-audit-report.ts']).toBeDefined();
    });

    it('guard check script references CvfSdk', () => {
      const files = generateProjectTemplate();
      expect(files['scripts/cvf-guard-check.ts']).toContain('CvfSdk');
      expect(files['scripts/cvf-guard-check.ts']).toContain('runConformance');
    });

    it('audit report script outputs JSON', () => {
      const files = generateProjectTemplate();
      expect(files['scripts/cvf-audit-report.ts']).toContain('JSON.stringify');
    });
  });
});
