/**
 * AI Commit Guard
 *
 * Enforces mandatory ai_commit metadata for modifying actions.
 */

import type { Guard, GuardRequestContext, GuardResult } from '../types';
import { hasModifyIntent, isReadOnlyAction, MODIFY_ACTIONS, READ_ONLY_ACTIONS } from './action-intent';

export interface AiCommitMetadata {
  commitId: string;
  agentId: string;
  timestamp: number;
  description?: string;
}

export class AiCommitGuard implements Guard {
  id = 'ai_commit';
  name = 'AI Commit Guard';
  description = 'Enforces mandatory ai_commit metadata for modifying actions.';
  priority = 5;
  enabled = true;

  evaluate(context: GuardRequestContext): GuardResult {
    const timestamp = new Date().toISOString();

    if (isReadOnlyAction(context.action)) {
      return {
        guardId: this.id,
        decision: 'ALLOW',
        severity: 'INFO',
        reason: `Read-only action "${context.action}" is exempt from ai_commit requirement.`,
        timestamp,
      };
    }

    if (!hasModifyIntent(context.action)) {
      return {
        guardId: this.id,
        decision: 'ALLOW',
        severity: 'INFO',
        reason: `Action "${context.action}" does not express modification intent; ai_commit not required.`,
        timestamp,
      };
    }

    const aiCommit = context.metadata?.ai_commit as AiCommitMetadata | undefined;

    if (!aiCommit) {
      return {
        guardId: this.id,
        decision: 'BLOCK',
        severity: 'CRITICAL',
        reason: `Missing ai_commit metadata. Every modifying action must include ai_commit with commitId, agentId, and timestamp.`,
        timestamp,
        agentGuidance: 'Provide ai_commit metadata before performing modifying actions.',
        suggestedAction: 'attach_ai_commit_metadata',
        metadata: { action: context.action, agentId: context.agentId },
      };
    }

    if (!aiCommit.commitId || !aiCommit.agentId || !aiCommit.timestamp) {
      return {
        guardId: this.id,
        decision: 'BLOCK',
        severity: 'ERROR',
        reason: 'Invalid ai_commit metadata: required fields commitId, agentId, and timestamp must be present.',
        timestamp,
        agentGuidance: 'Repair the ai_commit payload before retrying this action.',
        suggestedAction: 'repair_ai_commit_metadata',
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

export { MODIFY_ACTIONS, READ_ONLY_ACTIONS };
