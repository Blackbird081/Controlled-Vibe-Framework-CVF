export interface MemoryBoundary {
  forkId: string
  allowedScopes: string[]
}

export function canAccessScope(
  boundary: MemoryBoundary,
  scope: string
): boolean {

  return boundary.allowedScopes.includes(scope)
}