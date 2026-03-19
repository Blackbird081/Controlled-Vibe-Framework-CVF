/**
 * File Scope Guard — v1.1.3 Governance Runtime Hardening
 *
 * Enforces file-level access restrictions based on agent role.
 * Prevents agents from modifying governance/policy files or files outside their scope.
 *
 * Rules:
 *   - BUILDER: can modify src/, tests/ — blocked from governance/, docs/, .cvfrc/
 *   - REVIEWER: read-only — blocked from modifying any files
 *   - OBSERVER/ANALYST: read-only — blocked from modifying any files
 *   - GOVERNOR: full access (governance authority)
 */

import {
  Guard,
  GuardRequestContext,
  GuardResult,
  CVFRole,
} from '../guard.runtime.types.js';

/** File path patterns that are protected from non-Governor modification */
const PROTECTED_PATHS = [
  'governance/',
  '.cvfrc/',
  'docs/',
  'EXTENSIONS/',
];

/** Roles that are read-only (no file modifications) */
const READ_ONLY_ROLES: CVFRole[] = ['OBSERVER', 'ANALYST', 'REVIEWER'];

/** Actions that constitute file modification */
const MODIFY_ACTIONS = ['create', 'modify', 'write', 'delete', 'build', 'implement', 'code'];

export class FileScopeGuard implements Guard {
  id = 'file_scope';
  name = 'File Scope Guard';
  description = 'Enforces file-level access restrictions based on agent role.';
  priority = 35;
  enabled = true;

  evaluate(context: GuardRequestContext): GuardResult {
    const timestamp = new Date().toISOString();

    // Only check when target files are specified
    const targetFiles = context.targetFiles;
    if (!targetFiles || targetFiles.length === 0) {
      return {
        guardId: this.id,
        decision: 'ALLOW',
        severity: 'INFO',
        reason: 'No target files specified — file scope check skipped.',
        timestamp,
      };
    }

    const normalizedAction = context.action.toLowerCase().trim();
    const isModifyAction = MODIFY_ACTIONS.some((a) => normalizedAction.includes(a));

    // Read-only roles cannot modify any files
    if (isModifyAction && READ_ONLY_ROLES.includes(context.role)) {
      return {
        guardId: this.id,
        decision: 'BLOCK',
        severity: 'ERROR',
        reason: `Role "${context.role}" is read-only and cannot perform modification action "${context.action}".`,
        timestamp,
        metadata: { role: context.role, action: context.action, targetFiles },
      };
    }

    // GOVERNOR has full access
    if (context.role === 'GOVERNOR') {
      return {
        guardId: this.id,
        decision: 'ALLOW',
        severity: 'INFO',
        reason: `Governor role has full file access.`,
        timestamp,
      };
    }

    // BUILDER: check protected paths
    if (isModifyAction && context.role === 'BUILDER') {
      const violations = targetFiles.filter((file) => {
        const normalizedFile = file.replace(/\\/g, '/').toLowerCase();
        return PROTECTED_PATHS.some((p) => normalizedFile.includes(p.toLowerCase()));
      });

      if (violations.length > 0) {
        return {
          guardId: this.id,
          decision: 'BLOCK',
          severity: 'ERROR',
          reason: `Builder role cannot modify protected paths: [${violations.join(', ')}]. ` +
            `Protected paths: [${PROTECTED_PATHS.join(', ')}].`,
          timestamp,
          metadata: { role: context.role, violations, protectedPaths: PROTECTED_PATHS },
        };
      }
    }

    return {
      guardId: this.id,
      decision: 'ALLOW',
      severity: 'INFO',
      reason: `File access allowed for role "${context.role}" on specified targets.`,
      timestamp,
    };
  }
}

export { PROTECTED_PATHS, READ_ONLY_ROLES, MODIFY_ACTIONS };
