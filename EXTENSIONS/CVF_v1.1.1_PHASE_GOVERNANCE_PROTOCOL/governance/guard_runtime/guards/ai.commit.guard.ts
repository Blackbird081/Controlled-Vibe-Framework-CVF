/**
 * AI Commit Guard — v1.1.3 Governance Runtime Hardening
 *
 * Enforces mandatory ai_commit for every agent action that produces output.
 * Without ai_commit, the action has no audit trail → governance violation.
 *
 * This guard is in the MANDATORY_GUARD_IDS list and cannot be disabled.
 *
 * Rules:
 *   - Every action with modification intent must include ai_commit metadata
 *   - ai_commit must contain: commitId, agentId, timestamp
 *   - Read-only actions are exempt from ai_commit requirement
 */

import {
  Guard,
  GuardRequestContext,
  GuardResult,
} from '../guard.runtime.types.js';

/** Actions that are read-only and exempt from ai_commit */
const READ_ONLY_ACTIONS = ['read', 'observe', 'ask', 'clarify', 'analyze', 'explain'];

export interface AiCommitMetadata {
  commitId: string;
  agentId: string;
  timestamp: number;
  description?: string;
}

export class AiCommitGuard implements Guard {
  id = 'ai_commit';
  name = 'AI Commit Guard';
  description = 'Enforces mandatory ai_commit declaration for every modifying agent action.';
  priority = 5;  // Highest priority — checked first
  enabled = true;

  evaluate(context: GuardRequestContext): GuardResult {
    const timestamp = new Date().toISOString();

    // Read-only actions are exempt
    const normalizedAction = context.action.toLowerCase().trim();
    const isReadOnly = READ_ONLY_ACTIONS.some((a) => normalizedAction.includes(a));
    if (isReadOnly) {
      return {
        guardId: this.id,
        decision: 'ALLOW',
        severity: 'INFO',
        reason: `Read-only action "${context.action}" is exempt from ai_commit requirement.`,
        timestamp,
      };
    }

    // Check for ai_commit in metadata
    const aiCommit = context.metadata?.ai_commit as AiCommitMetadata | undefined;

    if (!aiCommit) {
      return {
        guardId: this.id,
        decision: 'BLOCK',
        severity: 'CRITICAL',
        reason: `Missing ai_commit metadata. Every modifying action must include ai_commit ` +
          `with commitId, agentId, and timestamp. Action "${context.action}" blocked.`,
        timestamp,
        metadata: { action: context.action, agentId: context.agentId },
      };
    }

    // Validate ai_commit structure
    if (!aiCommit.commitId || !aiCommit.agentId || !aiCommit.timestamp) {
      return {
        guardId: this.id,
        decision: 'BLOCK',
        severity: 'ERROR',
        reason: `Invalid ai_commit metadata: missing required fields (commitId, agentId, timestamp).`,
        timestamp,
        metadata: { ai_commit: aiCommit },
      };
    }

    return {
      guardId: this.id,
      decision: 'ALLOW',
      severity: 'INFO',
      reason: `ai_commit verified: ${aiCommit.commitId}`,
      timestamp,
      metadata: { commitId: aiCommit.commitId },
    };
  }
}

export { READ_ONLY_ACTIONS };
