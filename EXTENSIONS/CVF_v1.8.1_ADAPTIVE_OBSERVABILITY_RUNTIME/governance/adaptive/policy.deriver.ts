export type EnforcementAction =
  | 'normal'
  | 'strict_mode'
  | 'throttle'
  | 'block'

export function derivePolicy(score: number): EnforcementAction {
  if (score >= 80) return 'block'
  if (score >= 60) return 'throttle'
  if (score >= 40) return 'strict_mode'
  return 'normal'
}