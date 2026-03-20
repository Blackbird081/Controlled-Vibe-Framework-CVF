/**
 * Scope Guard — Enforces workspace isolation and protected path boundaries
 * @module cvf-guard-contract/guards/scope
 */

import type { Guard, GuardRequestContext, GuardResult } from '../types';

export const PROTECTED_PATHS = [
  'governance/',
  'docs/CVF_',
  'v1.0/',
  'v1.1/',
  'EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/',
];

export const CVF_ROOT_INDICATORS = [
  'README.md',
  'CHANGELOG.md',
  'package.json',
  'CVF_LITE.md',
];

export class ScopeGuard implements Guard {
  id = 'scope_guard';
  name = 'Scope Guard';
  description = 'Enforces workspace isolation and protected path boundaries.';
  priority = 50;
  enabled = true;

  evaluate(context: GuardRequestContext): GuardResult {
    const timestamp = new Date().toISOString();
    const targetFiles = context.targetFiles ?? [];
    const isBuilderClassRole = ['AI_AGENT', 'BUILDER', 'OPERATOR'].includes(context.role);

    if (targetFiles.length === 0) {
      return {
        guardId: this.id,
        decision: 'ALLOW',
        severity: 'INFO',
        reason: 'No target files specified. Scope check skipped.',
        timestamp,
      };
    }

    for (const file of targetFiles) {
      const normalizedFile = file.replace(/\\/g, '/');

      const protectedViolation = PROTECTED_PATHS.find((p) =>
        normalizedFile.includes(p)
      );

      if (protectedViolation && isBuilderClassRole) {
        return {
          guardId: this.id,
          decision: 'BLOCK',
          severity: 'ERROR',
          reason: `Role "${context.role}" cannot modify protected path "${protectedViolation}" (file: "${file}"). Requires HUMAN or GOVERNOR authority.`,
          agentGuidance: `The file "${file}" is in a protected governance path ("${protectedViolation}"). This change requires a human or governor-controlled path.`,
          suggestedAction: 'suggest_change_to_human',
          timestamp,
          metadata: { file, protectedPath: protectedViolation, role: context.role },
        };
      }

      const isRootFile = CVF_ROOT_INDICATORS.some((r) =>
        normalizedFile.endsWith(r)
      );

      if (isRootFile && isBuilderClassRole) {
        return {
          guardId: this.id,
          decision: 'ESCALATE',
          severity: 'WARN',
          reason: `Role "${context.role}" modifying CVF root file "${file}" requires escalation.`,
          agentGuidance: `The file "${file}" is a CVF root file. Present the proposed changes for approval before continuing.`,
          suggestedAction: 'present_changes_for_approval',
          timestamp,
          metadata: { file, role: context.role },
        };
      }
    }

    return {
      guardId: this.id,
      decision: 'ALLOW',
      severity: 'INFO',
      reason: `All ${targetFiles.length} target file(s) within allowed scope.`,
      timestamp,
    };
  }
}
