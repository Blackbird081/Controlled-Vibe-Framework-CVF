export interface InvocationEvent {
  skillId: string
  versionHash: string
  model: string
  tokensUsed: number
  durationMs: number
  timestamp: number
  cancelled?: boolean
}

export const invocationLog: InvocationEvent[] = []

export function logInvocation(event: InvocationEvent) {
  invocationLog.push(event)
}