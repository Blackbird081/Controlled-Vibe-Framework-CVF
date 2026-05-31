import { NextResponse } from 'next/server';
import type { AIProvider, ExecutionRequest } from '@/lib/ai';
import { appendAuditEvent } from '@/lib/control-plane-events';
import type { SessionCookie } from '@/lib/middleware-auth';
import { withSessionAuditPayload } from '@/lib/middleware-auth';
import { buildEvidenceReceipt, type WebGovernanceEnvelope } from '@/lib/web-governance-envelope';
import type {
  ResolvedExecutionCVFRole,
  ResolvedExecutionOutputClass,
} from '@/lib/execute-role-resolver';
import type { RoleOutputPermissionCheck } from '@/lib/execute-route-guards';
import type { ExecutionIdentityDecision } from '@/lib/execution-identity';

interface BuildRolePermissionDeniedResponseInput {
  session: SessionCookie | null;
  body: Partial<ExecutionRequest>;
  provider: AIProvider;
  envelope: WebGovernanceEnvelope;
  resolvedRole: ResolvedExecutionCVFRole;
  resolvedOutputClass: ResolvedExecutionOutputClass;
  executionIdentity?: ExecutionIdentityDecision;
}

interface BuildRoleOutputDeniedResponseInput extends BuildRolePermissionDeniedResponseInput {
  rolePermission: RoleOutputPermissionCheck;
}

function targetResource(body: Partial<ExecutionRequest>): string {
  return body.templateName || body.templateId || 'unknown-template';
}

export async function buildRolePermissionDeniedResponse(
  input: BuildRolePermissionDeniedResponseInput,
): Promise<NextResponse> {
  const { session, body, provider, envelope, resolvedRole, resolvedOutputClass, executionIdentity } = input;

  await appendAuditEvent({
    eventType: 'ROLE_PERMISSION_DENIED',
    actorId: session?.userId ?? 'service-account',
    actorRole: session?.role ?? 'service',
    targetResource: targetResource(body),
    action: 'BLOCK_EXECUTION_ROLE',
    riskLevel: body.cvfRiskLevel ?? 'R1',
    phase: body.cvfPhase ?? 'PHASE E',
    outcome: 'BLOCKED',
    payload: withSessionAuditPayload(session, {
      reason: resolvedRole.denialReason,
      inputRole: resolvedRole.inputRole,
      resolvedRole: resolvedRole.role,
      resolvedOutputClass,
      executionIdentity,
    }),
  });

  return NextResponse.json(
    {
      success: false,
      error: resolvedRole.denialReason || 'Execution role is not authorized.',
      provider,
      model: 'role-permission-denied',
      rolePermission: {
        role: resolvedRole.role,
        permissionRole: resolvedRole.permissionRole,
        outputClass: resolvedOutputClass.outputClass,
        allowed: false,
        source: resolvedRole.source,
      },
      executionIdentity,
      governanceEnvelope: envelope,
      policySnapshotId: envelope.policySnapshotId,
      governanceEvidenceReceipt: buildEvidenceReceipt({
        envelope,
        decision: 'BLOCK',
        riskLevel: body.cvfRiskLevel,
        provider,
        model: 'role-permission-denied',
      }),
    },
    { status: 403 },
  );
}

export async function buildRoleOutputDeniedResponse(
  input: BuildRoleOutputDeniedResponseInput,
): Promise<NextResponse> {
  const { session, body, provider, envelope, resolvedRole, rolePermission, executionIdentity } = input;

  await appendAuditEvent({
    eventType: 'ROLE_OUTPUT_PERMISSION_DENIED',
    actorId: session?.userId ?? 'service-account',
    actorRole: session?.role ?? 'service',
    targetResource: targetResource(body),
    action: 'BLOCK_OUTPUT_CLASS',
    riskLevel: body.cvfRiskLevel ?? 'R1',
    phase: body.cvfPhase ?? 'PHASE E',
    outcome: 'BLOCKED',
    payload: withSessionAuditPayload(session, {
      resolvedBoundaryRole: resolvedRole.role,
      permissionRole: rolePermission.role,
      outputClass: rolePermission.outputClass,
      denialReason: rolePermission.denialReason,
      allowedOutputClasses: rolePermission.profile.allowedOutputClasses,
      executionIdentity,
    }),
  });

  return NextResponse.json(
    {
      success: false,
      error: rolePermission.denialReason,
      provider,
      model: 'role-output-denied',
      rolePermission: {
        role: resolvedRole.role,
        permissionRole: rolePermission.role,
        outputClass: rolePermission.outputClass,
        allowed: false,
        source: resolvedRole.source,
      },
      executionIdentity,
      governanceEnvelope: envelope,
      policySnapshotId: envelope.policySnapshotId,
      governanceEvidenceReceipt: buildEvidenceReceipt({
        envelope,
        decision: 'BLOCK',
        riskLevel: body.cvfRiskLevel,
        provider,
        model: 'role-output-denied',
      }),
    },
    { status: 403 },
  );
}
