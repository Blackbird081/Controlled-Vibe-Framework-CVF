export function assignABVersion(
  sessionId: string,
  versionA: string,
  versionB: string
): string {
  const hash = sessionId
    .split("")
    .reduce((sum, c) => sum + c.charCodeAt(0), 0)

  return hash % 2 === 0 ? versionA : versionB
}