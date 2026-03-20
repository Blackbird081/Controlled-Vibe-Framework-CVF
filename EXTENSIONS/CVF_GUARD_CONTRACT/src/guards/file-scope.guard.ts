/**
 * File Scope Guard
 *
 * Enforces file-level access restrictions and explicit file scope boundaries.
 */

import type { Guard, GuardRequestContext, GuardResult, CVFRole } from '../types';
import { MODIFY_ACTIONS, hasModifyIntent } from './action-intent';

const PROTECTED_PATHS = [
  'governance/',
  '.cvfrc/',
  'docs/',
  'extensions/',
];

const READ_ONLY_ROLES: CVFRole[] = ['OBSERVER', 'ANALYST', 'REVIEWER'];
const BUILDER_CLASS_ROLES: CVFRole[] = ['BUILDER', 'AI_AGENT', 'OPERATOR'];

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/+/g, '/').toLowerCase();
}

function isPathWithinScope(targetFile: string, allowedScope: string): boolean {
  const target = normalizePath(targetFile);
  const scope = normalizePath(allowedScope).replace(/\/$/, '');

  if (!scope) {
    return false;
  }

  return target === scope || target.startsWith(`${scope}/`);
}

export class FileScopeGuard implements Guard {
  id = 'file_scope';
  name = 'File Scope Guard';
  description = 'Enforces file-level boundaries, fileScope limits, and protected path restrictions.';
  priority = 35;
  enabled = true;

  evaluate(context: GuardRequestContext): GuardResult {
    const timestamp = new Date().toISOString();
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

    if (!hasModifyIntent(context.action)) {
      return {
        guardId: this.id,
        decision: 'ALLOW',
        severity: 'INFO',
        reason: `Action "${context.action}" is read-only or non-mutating — file scope restriction not required.`,
        timestamp,
      };
    }

    if (READ_ONLY_ROLES.includes(context.role)) {
      return {
        guardId: this.id,
        decision: 'BLOCK',
        severity: 'ERROR',
        reason: `Role "${context.role}" is read-only and cannot perform modification action "${context.action}".`,
        timestamp,
        agentGuidance: 'Switch to an authorized modifying role or keep the action read-only.',
        suggestedAction: 'request_authorized_modifier',
        metadata: { role: context.role, action: context.action, targetFiles },
      };
    }

    if (context.fileScope && context.fileScope.length > 0 && context.role !== 'GOVERNOR' && context.role !== 'HUMAN') {
      const outOfScope = targetFiles.filter((file) =>
        !context.fileScope!.some((scope) => isPathWithinScope(file, scope))
      );

      if (outOfScope.length > 0) {
        return {
          guardId: this.id,
          decision: 'BLOCK',
          severity: 'ERROR',
          reason: `Target files exceed assigned fileScope: [${outOfScope.join(', ')}]. Allowed scope: [${context.fileScope.join(', ')}].`,
          timestamp,
          agentGuidance: 'Restrict the change set to the approved fileScope before retrying.',
          suggestedAction: 'reduce_change_scope',
          metadata: { role: context.role, violations: outOfScope, fileScope: context.fileScope },
        };
      }
    }

    if (context.role === 'GOVERNOR' || context.role === 'HUMAN') {
      return {
        guardId: this.id,
        decision: 'ALLOW',
        severity: 'INFO',
        reason: `${context.role} role has full file access for this request.`,
        timestamp,
      };
    }

    if (BUILDER_CLASS_ROLES.includes(context.role)) {
      const violations = targetFiles.filter((file) => {
        const normalizedFile = normalizePath(file);
        return PROTECTED_PATHS.some((p) => normalizedFile.includes(p));
      });

      if (violations.length > 0) {
        return {
          guardId: this.id,
          decision: 'BLOCK',
          severity: 'ERROR',
          reason: `Builder-class role cannot modify protected paths: [${violations.join(', ')}]. Protected paths: [${PROTECTED_PATHS.join(', ')}].`,
          timestamp,
          agentGuidance: 'Remove protected files from the change set or escalate to an authorized governor.',
          suggestedAction: 'remove_protected_targets',
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

export { BUILDER_CLASS_ROLES, MODIFY_ACTIONS, PROTECTED_PATHS, READ_ONLY_ROLES };
