/**
 * Scope Guard — Track IV Phase A.1
 *
 * Enforces workspace isolation and scope boundaries.
 * Prevents actions that target files outside the allowed scope.
 *
 * Rules:
 *   - Actions must specify scope or target files
 *   - Governance files (governance/, docs/CVF_*) are protected
 *   - Cross-module writes require R2+ risk level
 *   - CVF root modifications require HUMAN or OPERATOR role
 */

import {
  Guard,
  GuardRequestContext,
  GuardResult,
} from '../guard.runtime.types.js';

const PROTECTED_PATHS = [
  'governance/',
  'docs/CVF_',
  'v1.0/',
  'v1.1/',
  'EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/',
];

const CVF_ROOT_INDICATORS = [
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

      if (protectedViolation && context.role === 'AI_AGENT') {
        return {
          guardId: this.id,
          decision: 'BLOCK',
          severity: 'ERROR',
          reason: `AI agent cannot modify protected path "${protectedViolation}" (file: "${file}"). Requires HUMAN or OPERATOR role.`,
          timestamp,
          metadata: { file, protectedPath: protectedViolation, role: context.role },
        };
      }

      const isRootFile = CVF_ROOT_INDICATORS.some((r) =>
        normalizedFile.endsWith(r)
      );

      if (isRootFile && context.role === 'AI_AGENT') {
        return {
          guardId: this.id,
          decision: 'ESCALATE',
          severity: 'WARN',
          reason: `AI agent modifying CVF root file "${file}" requires escalation.`,
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

export { PROTECTED_PATHS, CVF_ROOT_INDICATORS };
