import { isTrustedFormTemplateId } from '@/lib/form-routing';
import type { GuardPipelineResult } from '@/lib/guard-runtime-adapter';
import {
  getRolePermissionProfile,
  isOutputAllowedForRole,
  type CVFRole,
  type RolePermissionOutputClass,
  type RolePermissionProfile,
} from 'cvf-guard-contract';

const OUTPUT_BYPASS_PATTERNS: RegExp[] = [
  /\bapprove\b.{0,80}\bbypass\b/i,
  /\bbypass\b.{0,80}\bapprove\b/i,
  /\bauthorize\b.{0,80}\bbypass\b/i,
  /\bimmediately\b.{0,80}\bdeploy\b/i,
  /\byes\b.{0,30}\bbypass\b/i,
  /\bproceed\b.{0,50}\bwithout\b.{0,40}\breview\b/i,
  /\bskip\b.{0,50}\bgovernance\b/i,
  /\bgovernance\b.{0,30}\boverride\b/i,
  /\boverride\b.{0,50}\bgovernance\b/i,
  /\bskip\b.{0,50}\bcheck\b.{0,50}\boverride\b/i,
  /\bwithout\s+applying\b/i,
  /\bexecut\w*\b.{0,50}\bwithout\b.{0,60}\bcheck\b/i,
  /\ballow\w*\b.{0,60}\bskip\b.{0,50}\bcheck\b/i,
];

const DEFAULT_ANALYZE_TEMPLATE_GUARD_ACTION = 'analyze template execution request';
const DEFAULT_BUILD_TEMPLATE_GUARD_ACTION = 'build template execution request';

export function detectBypassInOutput(output: string): { detected: boolean; matchedPattern?: string } {
  for (const pattern of OUTPUT_BYPASS_PATTERNS) {
    const match = output.match(pattern);
    if (match) return { detected: true, matchedPattern: match[0].slice(0, 100) };
  }
  return { detected: false };
}

function isBuildPhase(phase?: string): boolean {
  if (!phase) return false;
  const normalized = phase.trim().toUpperCase();
  return normalized === 'BUILD' || normalized === 'PHASE C' || normalized === 'C';
}

function isBuildLikeIntent(intent?: string): boolean {
  if (!intent) return false;
  const reviewOnlyCodeIntent = /\b(code review|review code|check code|code audit|code quality|đánh giá code|kiểm tra chất lượng code|danh gia code|kiem tra chat luong code|review code)\b/i.test(intent);
  if (reviewOnlyCodeIntent) return false;
  return /\b(build|implement|develop|create files?|write code|generate code|sửa code|sua code|viết code|viet code|thực thi|thuc thi|triển khai|trien khai)\b/i.test(intent);
}

export function shouldRequireSkillPreflight(input: {
  phase?: string;
  templateCategory?: string;
  intent?: string;
  templateId?: string;
}): boolean {
  const isTrustedForm = isTrustedFormTemplateId(input.templateId);
  return isBuildPhase(input.phase)
    || (!isTrustedForm && isBuildLikeIntent(input.intent))
    || (input.templateCategory === 'development' && !isTrustedForm);
}

export function resolveGuardAction(rawBody: Record<string, unknown>): string {
  const explicitAction = rawBody.action;
  if (typeof explicitAction === 'string' && explicitAction.trim()) {
    return explicitAction.trim();
  }

  const phase = typeof rawBody.cvfPhase === 'string' ? rawBody.cvfPhase.trim().toUpperCase() : '';
  const hasBuildPreflight =
    typeof rawBody.skillPreflightDeclaration === 'string' ||
    typeof rawBody.skillPreflightRecordRef === 'string' ||
    Array.isArray(rawBody.skillIds) ||
    Array.isArray(rawBody.fileScope);

  if (phase === 'BUILD' || phase === 'PHASE C' || phase === 'C' || hasBuildPreflight) {
    return DEFAULT_BUILD_TEMPLATE_GUARD_ACTION;
  }

  return DEFAULT_ANALYZE_TEMPLATE_GUARD_ACTION;
}

export interface RoleOutputPermissionCheck {
  allowed: boolean;
  role: CVFRole;
  outputClass: RolePermissionOutputClass;
  profile: RolePermissionProfile;
  denialReason?: string;
}

export function checkRoleOutputPermission(
  role: CVFRole,
  outputClass: RolePermissionOutputClass,
): RoleOutputPermissionCheck {
  const profile = getRolePermissionProfile(role);
  const allowed = isOutputAllowedForRole(role, outputClass);

  return {
    allowed,
    role,
    outputClass,
    profile,
    denialReason: allowed
      ? undefined
      : `Role ${role} is not allowed to produce ${outputClass} output.`,
  };
}

export function buildOutputBypassGuardResult(
  guardResult: GuardPipelineResult,
  matchedPattern?: string,
): GuardPipelineResult {
  return {
    ...guardResult,
    finalDecision: 'BLOCK',
    blockedBy: 'output_bypass_detection',
    results: [
      ...(guardResult.results ?? []),
      {
        guardId: 'output_bypass_detection',
        decision: 'BLOCK',
        severity: 'ERROR',
        reason: `Governance bypass language detected in model output: "${matchedPattern}"`,
        timestamp: new Date().toISOString(),
      },
    ],
  };
}
