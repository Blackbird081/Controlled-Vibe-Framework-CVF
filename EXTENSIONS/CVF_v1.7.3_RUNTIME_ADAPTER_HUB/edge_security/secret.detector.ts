export interface SecretMatch {
  type: string
  value: string
  index: number
}

const secretPatterns = {
  apiKey: /(sk-[A-Za-z0-9]{20,})/,
  jwt: /(eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/,
  privateKey: /-----BEGIN PRIVATE KEY-----/
}

export function detectSecrets(input: string): SecretMatch[] {
  const matches: SecretMatch[] = []

  Object.entries(secretPatterns).forEach(([type, regex]) => {
    const result = input.match(regex)
    if (result) {
      matches.push({
        type,
        value: result[0],
        index: result.index || 0
      })
    }
  })

  return matches
}