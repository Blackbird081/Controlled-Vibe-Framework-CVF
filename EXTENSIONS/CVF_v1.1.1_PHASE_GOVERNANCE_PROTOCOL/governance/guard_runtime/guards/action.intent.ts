/**
 * Action Intent Helpers
 *
 * Shared helpers for classifying agent actions without unsafe substring matches.
 */

const READ_ONLY_ACTIONS = [
  'read',
  'observe',
  'ask',
  'clarify',
  'analyze',
  'explain',
  'review',
  'inspect',
  'explore',
  'discover',
  'critique',
  'audit',
];

const MODIFY_ACTIONS = [
  'create',
  'modify',
  'write',
  'delete',
  'build',
  'implement',
  'edit',
  'update',
  'patch',
  'refactor',
  'generate',
  'commit',
  'merge',
  'deploy',
  'release',
  'override',
  'approve',
  'lock',
  'change',
];

function tokenizeAction(action: string): string[] {
  return action
    .toLowerCase()
    .trim()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function isPhaseTransitionAction(action: string): boolean {
  return action.toLowerCase().trim().startsWith('phase_transition_to_');
}

function hasModifyIntent(action: string): boolean {
  if (isPhaseTransitionAction(action)) {
    return false;
  }
  return tokenizeAction(action).some((token) => MODIFY_ACTIONS.includes(token));
}

function isReadOnlyAction(action: string): boolean {
  if (isPhaseTransitionAction(action)) {
    return true;
  }

  const tokens = tokenizeAction(action);
  if (tokens.length === 0) {
    return false;
  }

  if (tokens.some((token) => MODIFY_ACTIONS.includes(token))) {
    return false;
  }

  return tokens.some((token) => READ_ONLY_ACTIONS.includes(token));
}

export {
  READ_ONLY_ACTIONS,
  MODIFY_ACTIONS,
  tokenizeAction,
  hasModifyIntent,
  isReadOnlyAction,
  isPhaseTransitionAction,
};
