export interface DepthLimitResult {
  exceeded: boolean
  reason?: string
}

export function checkTransitionDepth(
  transitionCount: number,
  maxDepth: number = 8
): DepthLimitResult {

  if (transitionCount > maxDepth) {
    return {
      exceeded: true,
      reason: `Maximum transition depth of ${maxDepth} exceeded.`
    }
  }

  return { exceeded: false }
}