export interface SecretMatch {
  type: string
  value: string
  index: number
}

const secretPatterns = {
  apiKey: /(sk-[A-Za-z0-9]{20,})/g,
  jwt: /(eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/g,
  privateKey: /-----BEGIN PRIVATE KEY-----/g
}

export function detectSecrets(input: string): SecretMatch[] {
  const matches: SecretMatch[] = []

  Object.entries(secretPatterns).forEach(([type, regex]) => {
    for (const result of input.matchAll(regex)) {
      if (!result[0]) continue
      matches.push({
        type,
        value: result[0],
        index: result.index ?? 0
      })
    }
  })

  return matches
}
