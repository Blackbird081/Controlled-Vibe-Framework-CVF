export interface PIIMatch {
  type: string
  value: string
  index: number
}

const patterns: Record<string, RegExp> = {
  email: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  phone: /\b\d{9,11}\b/g,
  creditCard: /\b\d{13,16}\b/g,
}

export function scanPII(input: string): PIIMatch[] {
  const matches: PIIMatch[] = []

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
