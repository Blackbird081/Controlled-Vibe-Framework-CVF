export interface SecretMatch {
  type: string
  value: string
  index: number
}

const patterns: Record<string, RegExp> = {
  apiKey: /(sk-[A-Za-z0-9]{20,})/g,
  jwt: /(eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/g,
  privateKey: /-----BEGIN PRIVATE KEY-----/g,
}

export function detectSecrets(input: string): SecretMatch[] {
  const matches: SecretMatch[] = []

  for (const [type, regex] of Object.entries(patterns)) {
    for (const m of input.matchAll(regex)) {
      if (!m[0]) continue
      matches.push({
        type,
        value: m[0],
        index: m.index ?? 0,
      })
    }
  }

  return matches
}
