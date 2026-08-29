/**
 * Build Authority Guard (RFR-R1)
 *
 * Makes mutating BUILD fail closed unless typed evidence proves an accepted
 * SPEC and a valid, non-revoked, non-expired, target-bounded WORK ORDER.
 * This guard only ever grants its own prerequisite; it never overrides or
 * widens the decision of any other guard.
 */

import type { BuildAuthorityEvidence, Guard, GuardRequestContext, GuardResult } from '../types';
import { hasModifyIntent } from './action-intent';

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/+/g, '/').toLowerCase();
}

function isAbsoluteOrTraversal(path: string): boolean {
  const normalized = normalizePath(path);
  if (normalized.startsWith('/')) {
    return true;
  }
  if (/^[a-z]:/i.test(path.replace(/\\/g, '/'))) {
    return true;
  }
  const segments = normalized.split('/');
  return segments.some((segment) => segment === '..' || segment === '.');
}

function isPathWithinScope(targetFile: string, allowedScope: string): boolean {
  if (targetFile !== targetFile.trim() || allowedScope !== allowedScope.trim()) {
    return false;
  }
  if (isAbsoluteOrTraversal(targetFile) || isAbsoluteOrTraversal(allowedScope)) {
    return false;
  }

  const target = normalizePath(targetFile);
  const scope = normalizePath(allowedScope).replace(/\/$/, '');

  if (!scope || !target) {
    return false;
  }

  return target === scope || target.startsWith(`${scope}/`);
}

function isValidExpiry(expiresAt: string | undefined, evaluatedAt: Date): boolean {
  if (expiresAt === undefined) {
    return true;
  }

  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(expiresAt)) {
    return false;
  }

  const parsed = new Date(expiresAt);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  return parsed.getTime() > evaluatedAt.getTime();
}

export class BuildAuthorityGuard implements Guard {
  id = 'build_authority';
  name = 'Build Authority Guard';
  description = 'Enforces typed accepted-SPEC and valid-WORK-ORDER prerequisite evidence for mutating BUILD actions.';
  priority = 32;
  enabled = true;

  evaluate(context: GuardRequestContext): GuardResult {
    const timestamp = new Date().toISOString();
    const rawContext = context as unknown as Record<string, unknown>;
    const phase = typeof rawContext.phase === 'string'
      ? rawContext.phase.trim().toUpperCase()
      : '';

    if (phase !== 'BUILD') {
      return {
        guardId: this.id,
        decision: 'ALLOW',
        severity: 'INFO',
        reason: `Phase "${String(rawContext.phase ?? '')}" is not BUILD; build authority evidence not required.`,
        timestamp,
      };
    }

    if (typeof rawContext.action !== 'string' || rawContext.action.trim() === '') {
      return {
        guardId: this.id,
        decision: 'BLOCK',
        severity: 'CRITICAL',
        reason: 'Mutating BUILD evaluation has a missing or malformed action and cannot establish non-mutation safely.',
        timestamp,
        agentGuidance: 'Provide a non-empty action so BUILD mutation intent can be evaluated.',
        suggestedAction: 'specify_build_action',
      };
    }

    const action = rawContext.action;
    if (!hasModifyIntent(action)) {
      return {
        guardId: this.id,
        decision: 'ALLOW',
        severity: 'INFO',
        reason: `Action "${action}" is read-only, non-mutating, or a phase transition; build authority evidence not required.`,
        timestamp,
      };
    }

    const evidence = rawContext.buildAuthority as BuildAuthorityEvidence | undefined;

    if (!evidence || typeof evidence !== 'object' || Array.isArray(evidence)) {
      return {
        guardId: this.id,
        decision: 'BLOCK',
        severity: 'CRITICAL',
        reason: 'Missing buildAuthority evidence. A mutating BUILD action requires an accepted SPEC and a valid WORK ORDER.',
        timestamp,
        agentGuidance: 'Attach buildAuthority evidence with an accepted SPEC reference and a valid WORK ORDER reference before retrying.',
        suggestedAction: 'attach_build_authority_evidence',
        metadata: { action },
      };
    }

    const specInvalid = evidence.specStatus !== 'ACCEPTED'
      || typeof evidence.acceptedSpecRef !== 'string'
      || evidence.acceptedSpecRef.trim() === '';
    if (specInvalid) {
      return {
        guardId: this.id,
        decision: 'BLOCK',
        severity: 'ERROR',
        reason: `SPEC is not accepted: specStatus="${evidence.specStatus}", acceptedSpecRef="${evidence.acceptedSpecRef || ''}".`,
        timestamp,
        agentGuidance: 'Obtain an accepted SPEC with a non-empty reference before mutating in BUILD.',
        suggestedAction: 'obtain_accepted_spec',
        metadata: { specStatus: evidence.specStatus, acceptedSpecRef: evidence.acceptedSpecRef },
      };
    }

    const workOrderInvalid = evidence.workOrderStatus !== 'VALID'
      || typeof evidence.workOrderRef !== 'string'
      || evidence.workOrderRef.trim() === '';
    if (workOrderInvalid) {
      return {
        guardId: this.id,
        decision: 'BLOCK',
        severity: 'ERROR',
        reason: `WORK ORDER is not valid: workOrderStatus="${evidence.workOrderStatus}", workOrderRef="${evidence.workOrderRef || ''}".`,
        timestamp,
        agentGuidance: 'Obtain a valid, non-empty WORK ORDER reference before mutating in BUILD.',
        suggestedAction: 'obtain_valid_work_order',
        metadata: { workOrderStatus: evidence.workOrderStatus, workOrderRef: evidence.workOrderRef },
      };
    }

    if (evidence.revoked !== false) {
      return {
        guardId: this.id,
        decision: 'BLOCK',
        severity: 'ERROR',
        reason: 'WORK ORDER authority has been revoked.',
        timestamp,
        agentGuidance: 'A revoked WORK ORDER cannot authorize mutation. Obtain a fresh non-revoked WORK ORDER.',
        suggestedAction: 'obtain_non_revoked_work_order',
        metadata: { workOrderRef: evidence.workOrderRef },
      };
    }

    const evaluatedAt = new Date(timestamp);
    if (evidence.expiresAt !== undefined && typeof evidence.expiresAt !== 'string') {
      return {
        guardId: this.id,
        decision: 'BLOCK',
        severity: 'ERROR',
        reason: 'WORK ORDER authority carries a malformed non-string expiry timestamp.',
        timestamp,
        agentGuidance: 'Use a valid ISO-8601 string for expiresAt, or omit it.',
        suggestedAction: 'obtain_unexpired_work_order',
      };
    }

    if (!isValidExpiry(evidence.expiresAt, evaluatedAt)) {
      return {
        guardId: this.id,
        decision: 'BLOCK',
        severity: 'ERROR',
        reason: `WORK ORDER authority is expired or carries an invalid expiry timestamp: expiresAt="${evidence.expiresAt ?? ''}".`,
        timestamp,
        agentGuidance: 'Obtain a fresh WORK ORDER with a valid future expiry, or omit expiresAt if the WORK ORDER does not expire.',
        suggestedAction: 'obtain_unexpired_work_order',
        metadata: { expiresAt: evidence.expiresAt },
      };
    }

    if (!Array.isArray(evidence.allowedScope)
      || evidence.allowedScope.length === 0
      || evidence.allowedScope.some((scope) => typeof scope !== 'string' || scope.trim() === '')) {
      return {
        guardId: this.id,
        decision: 'BLOCK',
        severity: 'ERROR',
        reason: 'WORK ORDER carries no allowed scope. Mutating BUILD requires an explicit list of allowed repo-relative file scopes.',
        timestamp,
        agentGuidance: 'Add an explicit allowedScope list of repo-relative file or directory paths to the WORK ORDER evidence.',
        suggestedAction: 'declare_allowed_scope',
        metadata: { workOrderRef: evidence.workOrderRef },
      };
    }

    const targetFiles = rawContext.targetFiles;
    if (!Array.isArray(targetFiles)
      || targetFiles.length === 0
      || targetFiles.some((file) => typeof file !== 'string' || file.trim() === '')) {
      return {
        guardId: this.id,
        decision: 'BLOCK',
        severity: 'ERROR',
        reason: 'Mutating BUILD action has no target files. A bounded target set is required to verify WORK ORDER scope.',
        timestamp,
        agentGuidance: 'Specify targetFiles for this mutating BUILD action so scope can be verified.',
        suggestedAction: 'specify_target_files',
        metadata: { action },
      };
    }

    const outOfScope = targetFiles.filter(
      (file) => !evidence.allowedScope.some((scope) => isPathWithinScope(file, scope)),
    );

    if (outOfScope.length > 0) {
      return {
        guardId: this.id,
        decision: 'BLOCK',
        severity: 'ERROR',
        reason: `Target files exceed WORK ORDER allowed scope: [${outOfScope.join(', ')}]. Allowed scope: [${evidence.allowedScope.join(', ')}].`,
        timestamp,
        agentGuidance: 'Restrict the change set to the WORK ORDER allowed scope before retrying.',
        suggestedAction: 'reduce_change_scope',
        metadata: { violations: outOfScope, allowedScope: evidence.allowedScope },
      };
    }

    return {
      guardId: this.id,
      decision: 'ALLOW',
      severity: 'INFO',
      reason: `Build authority evidence verified: SPEC "${evidence.acceptedSpecRef}" accepted; WORK ORDER "${evidence.workOrderRef}" valid and in scope.`,
      timestamp,
      metadata: { acceptedSpecRef: evidence.acceptedSpecRef, workOrderRef: evidence.workOrderRef },
    };
  }
}

export type { BuildAuthorityEvidence };
