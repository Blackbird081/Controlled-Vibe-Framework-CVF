import { describe, expect, it } from 'vitest';

import * as taxonomyModule from './tool-action-taxonomy.ts';
import {
  buildToolActionApprovalReadout,
  TOOL_ACTION_APPROVAL_READOUT_VERSION,
  evaluateToolActionTaxonomy,
  isRuntimeExecutionAuthorized,
  TOOL_ACTION_TAXONOMY_VERSION,
} from './tool-action-taxonomy.ts';

describe('tool-action-taxonomy', () => {
  it('allows a scoped read-only local utility as trace-required low risk', () => {
    const evaluation = evaluateToolActionTaxonomy({
      actionId: 'calculator.evaluate',
      surface: 'local_tool',
      sideEffect: 'read_only',
      traceBindingId: 'trace-local-read',
    });

    expect(evaluation.taxonomyVersion).toBe(TOOL_ACTION_TAXONOMY_VERSION);
    expect(evaluation.riskLevel).toBe('R1');
    expect(evaluation.decision).toBe('ALLOW');
    expect(evaluation.approvalLevel).toBe('none');
    expect(evaluation.traceRequired).toBe(true);
    expect(evaluation.auditReceiptRequired).toBe(true);
    expect(evaluation.runtimeExecutionAuthorized).toBe(false);
    expect(evaluation.diagnostic.class).toBe('none');
  });

  it('escalates local mutation until review approval and sandbox are present', () => {
    const evaluation = evaluateToolActionTaxonomy({
      actionId: 'file.write',
      surface: 'local_tool',
      sideEffect: 'local_write',
      scopeDeclared: true,
      traceBindingId: 'trace-local-write',
      sandboxDeclared: false,
    });

    expect(evaluation.riskLevel).toBe('R2');
    expect(evaluation.decision).toBe('ESCALATE');
    expect(evaluation.approvalLevel).toBe('review');
    expect(evaluation.sandboxRequired).toBe(true);
    expect(evaluation.mutationCaptureRequired).toBe(true);
    expect(evaluation.diagnostic.class).toBe('approval_required');
  });

  it('allows a fully bounded local mutation only as taxonomy posture, never runtime execution', () => {
    const evaluation = evaluateToolActionTaxonomy({
      actionId: 'file.write',
      surface: 'local_tool',
      sideEffect: 'local_write',
      scopeDeclared: true,
      traceBindingId: 'trace-local-write',
      sandboxDeclared: true,
      approvalSatisfied: true,
    });

    expect(evaluation.decision).toBe('ALLOW');
    expect(evaluation.runtimeExecutionAuthorized).toBe(false);
    expect(isRuntimeExecutionAuthorized(evaluation)).toBe(false);
  });

  it('blocks untraced workspace mutation before approval can matter', () => {
    const evaluation = evaluateToolActionTaxonomy({
      actionId: 'workspace.transform',
      surface: 'command_runtime',
      sideEffect: 'workspace_mutation',
      scopeDeclared: true,
      targetDeclared: true,
      sandboxDeclared: true,
      approvalSatisfied: true,
      rollbackDeclared: true,
    });

    expect(evaluation.riskLevel).toBe('R3');
    expect(evaluation.decision).toBe('BLOCK');
    expect(evaluation.diagnostic.class).toBe('receipt_missing');
    expect(evaluation.reasons).toContain('trace_binding_missing');
  });

  it('escalates remote MCP external mutation with explicit approval and sandbox posture', () => {
    const evaluation = evaluateToolActionTaxonomy({
      actionId: 'pancake.order.cancel',
      surface: 'mcp_tool',
      sideEffect: 'external_mutation',
      transport: 'remote_mcp',
      scopeDeclared: true,
      targetDeclared: true,
      traceBindingId: 'trace-mcp-order',
      sandboxDeclared: true,
      rollbackDeclared: true,
    });

    expect(evaluation.riskLevel).toBe('R3');
    expect(evaluation.decision).toBe('ESCALATE');
    expect(evaluation.approvalLevel).toBe('explicit');
    expect(evaluation.sandboxRequired).toBe(true);
    expect(evaluation.rollbackRequired).toBe(true);
    expect(evaluation.diagnostic.userAction).toBe('request_approval');
  });

  it('classifies database read as target-scoped and trace-bound', () => {
    const evaluation = evaluateToolActionTaxonomy({
      actionId: 'db.query.execute.read',
      surface: 'database',
      sideEffect: 'database_read',
      databaseFamily: 'read_execution',
      scopeDeclared: true,
      targetDeclared: true,
      traceBindingId: 'trace-db-read',
    });

    expect(evaluation.riskLevel).toBe('R1');
    expect(evaluation.decision).toBe('ALLOW');
    expect(evaluation.approvalLevel).toBe('none');
    expect(evaluation.sandboxRequired).toBe(false);
    expect(evaluation.mutationCaptureRequired).toBe(false);
  });

  it('escalates database export because it can move data outside the system', () => {
    const evaluation = evaluateToolActionTaxonomy({
      actionId: 'db.export.table',
      surface: 'database',
      sideEffect: 'database_export',
      databaseFamily: 'export_movement',
      scopeDeclared: true,
      targetDeclared: true,
      traceBindingId: 'trace-db-export',
      sandboxDeclared: true,
      rollbackDeclared: true,
      hasExternalDataTransfer: true,
    });

    expect(evaluation.riskLevel).toBe('R3');
    expect(evaluation.decision).toBe('ESCALATE');
    expect(evaluation.approvalLevel).toBe('explicit');
    expect(evaluation.diagnostic.class).toBe('approval_required');
  });

  it('treats database administration as critical privileged posture', () => {
    const evaluation = evaluateToolActionTaxonomy({
      actionId: 'db.admin.rotate-credentials',
      surface: 'database',
      sideEffect: 'database_admin',
      databaseFamily: 'administrative',
      scopeDeclared: true,
      targetDeclared: true,
      traceBindingId: 'trace-db-admin',
      sandboxDeclared: true,
      rollbackDeclared: true,
    });

    expect(evaluation.riskLevel).toBe('R4');
    expect(evaluation.decision).toBe('ESCALATE');
    expect(evaluation.approvalLevel).toBe('admin');
  });

  it('blocks destructive and privileged actions under W3 taxonomy boundary', () => {
    const destructive = evaluateToolActionTaxonomy({
      actionId: 'workspace.delete-recursive',
      surface: 'command_runtime',
      sideEffect: 'destructive',
      scopeDeclared: true,
      traceBindingId: 'trace-delete',
    });

    const privileged = evaluateToolActionTaxonomy({
      actionId: 'system.configure-token',
      surface: 'command_runtime',
      sideEffect: 'privileged',
      scopeDeclared: true,
      traceBindingId: 'trace-privileged',
    });

    expect(destructive.decision).toBe('BLOCK');
    expect(privileged.decision).toBe('BLOCK');
    expect(destructive.diagnostic.class).toBe('policy_blocked');
    expect(privileged.riskLevel).toBe('R4');
  });

  it('default-denies unknown or under-specified actions with actionable diagnostics', () => {
    const unknown = evaluateToolActionTaxonomy({
      actionId: 'mystery.run',
      surface: 'capability_provider',
      sideEffect: 'unknown',
    });

    const missingAction = evaluateToolActionTaxonomy({
      actionId: '',
      surface: 'local_tool',
      sideEffect: 'read_only',
    });

    expect(unknown.decision).toBe('BLOCK');
    expect(unknown.diagnostic.class).toBe('routing_unresolved');
    expect(unknown.diagnostic.userAction).toBe('revise_request');
    expect(missingAction.decision).toBe('BLOCK');
    expect(missingAction.diagnostic.class).toBe('invalid_input');
  });

  it('does not export runtime execution functions', () => {
    expect(Object.keys(taxonomyModule).sort()).toEqual([
      'TOOL_ACTION_APPROVAL_READOUT_VERSION',
      'TOOL_ACTION_TAXONOMY_VERSION',
      'buildToolActionApprovalReadout',
      'evaluateToolActionTaxonomy',
      'isRuntimeExecutionAuthorized',
    ]);
  });

  it('reports traced read-only local actions as approval-not-required readouts', () => {
    const evaluation = evaluateToolActionTaxonomy({
      actionId: 'calculator.evaluate',
      surface: 'local_tool',
      sideEffect: 'read_only',
      traceBindingId: 'trace-local-read',
    });

    const readout = buildToolActionApprovalReadout(evaluation);

    expect(readout.contractVersion).toBe(TOOL_ACTION_APPROVAL_READOUT_VERSION);
    expect(readout.approvalState).toBe('not_required');
    expect(readout.approvalLevel).toBe('none');
    expect(readout.requiredEvidence).toEqual([
      'trace_binding',
      'audit_receipt',
    ]);
    expect(readout.missingEvidence).toEqual([]);
    expect(readout.runtimeExecutionAuthorized).toBe(false);
  });

  it('keeps local mutation pending until review approval is present', () => {
    const evaluation = evaluateToolActionTaxonomy({
      actionId: 'file.write',
      surface: 'local_tool',
      sideEffect: 'local_write',
      scopeDeclared: true,
      traceBindingId: 'trace-local-write',
      sandboxDeclared: true,
    });

    const readout = buildToolActionApprovalReadout(evaluation);

    expect(readout.approvalState).toBe('pending_approval');
    expect(readout.requiredEvidence).toEqual(expect.arrayContaining([
      'approval_evidence',
      'sandbox_declaration',
      'mutation_capture_plan',
    ]));
    expect(readout.missingEvidence).toContain('approval_evidence');
    expect(readout.nextSafeAction).toContain('Request review approval');
  });

  it('marks fully controlled mutations as approval-satisfied but still not executable', () => {
    const evaluation = evaluateToolActionTaxonomy({
      actionId: 'file.write',
      surface: 'local_tool',
      sideEffect: 'local_write',
      scopeDeclared: true,
      traceBindingId: 'trace-local-write',
      sandboxDeclared: true,
      approvalSatisfied: true,
    });

    const readout = buildToolActionApprovalReadout(evaluation, {
      approvalEvidenceId: 'approval-1',
      approvedBy: 'operator',
      approvalReason: 'bounded artifact update',
    });

    expect(readout.taxonomyDecision).toBe('ALLOW');
    expect(readout.approvalState).toBe('satisfied_but_not_executable');
    expect(readout.missingEvidence).toEqual([]);
    expect(readout.runtimeExecutionAuthorized).toBe(false);
    expect(readout.safeMessage).toContain('grants no runtime execution authority');
  });

  it('blocks before approval when trace or target evidence is missing', () => {
    const evaluation = evaluateToolActionTaxonomy({
      actionId: 'workspace.transform',
      surface: 'command_runtime',
      sideEffect: 'workspace_mutation',
      scopeDeclared: true,
      targetDeclared: true,
      sandboxDeclared: true,
      approvalSatisfied: true,
      rollbackDeclared: true,
    });

    const readout = buildToolActionApprovalReadout(evaluation);

    expect(readout.approvalState).toBe('blocked_before_approval');
    expect(readout.missingEvidence).toContain('trace_binding');
    expect(readout.nextSafeAction).toContain('missing scope, target, or trace');
  });

  it('distinguishes policy-blocked destructive actions from approval-pending actions', () => {
    const evaluation = evaluateToolActionTaxonomy({
      actionId: 'workspace.delete-recursive',
      surface: 'command_runtime',
      sideEffect: 'destructive',
      scopeDeclared: true,
      traceBindingId: 'trace-delete',
    });

    const readout = buildToolActionApprovalReadout(evaluation);

    expect(readout.approvalState).toBe('blocked_by_policy');
    expect(readout.diagnostic.class).toBe('policy_blocked');
    expect(readout.nextSafeAction).toContain('fresh governed work order');
    expect(readout.boundaries).toContain('no_runtime_execution');
  });
});
