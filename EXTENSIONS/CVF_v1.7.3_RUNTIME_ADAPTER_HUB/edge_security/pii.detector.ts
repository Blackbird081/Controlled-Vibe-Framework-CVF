export interface PIIMatch {
  type: string
  value: string
  index: number
}

const patterns = {
  email: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  phone: /\b\d{9,11}\b/,
  creditCard: /\b\d{13,16}\b/
}

export function detectPII(input: string): PIIMatch[] {
  const matches: PIIMatch[] = []

  Object.entries(patterns).forEach(([type, regex]) => {
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