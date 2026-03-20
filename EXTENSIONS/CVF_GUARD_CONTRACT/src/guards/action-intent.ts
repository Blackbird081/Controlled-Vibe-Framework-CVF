/**
 * Action Intent Helpers
 *
 * Shared helpers for classifying actions without unsafe substring matches.
 */

export const READ_ONLY_ACTIONS = [
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
  'list',
];

export const MODIFY_ACTIONS = [
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
  'freeze',
];

export function tokenizeAction(action: string): string[] {
  return action
    .toLowerCase()
    .trim()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

export function isPhaseTransitionAction(action: string): boolean {
  return action.toLowerCase().trim().startsWith('phase_transition_to_');
}

export function hasModifyIntent(action: string): boolean {
  if (isPhaseTransitionAction(action)) {
    return false;
  }

  return tokenizeAction(action).some((token) => MODIFY_ACTIONS.includes(token));
}

export function isReadOnlyAction(action: string): boolean {
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
