export interface PIIMatch {
  type: string
  value: string
  index: number
}

const patterns = {
  email: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  phone: /\b\d{9,11}\b/g,
  creditCard: /\b\d{13,16}\b/g
}

export function detectPII(input: string): PIIMatch[] {
  const matches: PIIMatch[] = []

  Object.entries(patterns).forEach(([type, regex]) => {
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
