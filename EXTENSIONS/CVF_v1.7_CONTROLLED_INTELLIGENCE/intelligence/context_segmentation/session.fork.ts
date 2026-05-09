export interface ForkedSession {
  forkId: string
  parentSessionId: string
  role: string
  createdAt: number
}

export function createFork(
  parentSessionId: string,
  role: string
): ForkedSession {

  const forkId = `${parentSessionId}::${role}::${Date.now()}`

  return {
    forkId,
    parentSessionId,
    role,
    createdAt: Date.now()
  }
}