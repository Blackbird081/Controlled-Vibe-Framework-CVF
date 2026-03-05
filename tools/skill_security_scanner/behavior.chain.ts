// /governance/security_scanner/behavior.chain.ts

export interface BehaviorChainFinding {
  id: string
  description: string
  weight: number
  matchedSequence: string[]
}

interface BehaviorChainRule {
  id: string
  description: string
  keywords: string[]
  weight: number
  proximityWindow: number
}

const behaviorChainRules: BehaviorChainRule[] = [
  {
    id: 'download_execute_chain',
    description: 'Download followed by execution pattern',
    keywords: ['download', 'curl', 'wget', 'execute', 'bash', 'sh -c'],
    weight: 45,
    proximityWindow: 300
  },
  {
    id: 'read_exfiltrate_chain',
    description: 'Read sensitive data followed by exfiltration',
    keywords: ['read', 'open', 'api_key', 'secret', 'token', 'send', 'upload', 'post'],
    weight: 60,
    proximityWindow: 400
  },
  {
    id: 'encode_exfiltrate_chain',
    description: 'Encoding content before sending externally',
    keywords: ['base64', 'encode', 'encrypt', 'send', 'http', 'upload'],
    weight: 50,
    proximityWindow: 350
  }
]

function normalize(content: string): string {
  return content.toLowerCase()
}

function keywordPositions(content: string, keyword: string): number[] {
  const positions: number[] = []
  let index = content.indexOf(keyword)
  while (index !== -1) {
    positions.push(index)
    index = content.indexOf(keyword, index + keyword.length)
  }
  return positions
}

export function detectBehaviorChains(content: string): BehaviorChainFinding[] {
  const normalized = normalize(content)
  const findings: BehaviorChainFinding[] = []

  for (const rule of behaviorChainRules) {
    const allMatches: { keyword: string; position: number }[] = []

    for (const keyword of rule.keywords) {
      const positions = keywordPositions(normalized, keyword)
      for (const pos of positions) {
        allMatches.push({ keyword, position: pos })
      }
    }

    if (allMatches.length < 2) continue

    allMatches.sort((a, b) => a.position - b.position)

    for (let i = 0; i < allMatches.length - 1; i++) {
      const current = allMatches[i]
      const next = allMatches[i + 1]

      if (next.position - current.position <= rule.proximityWindow) {
        findings.push({
          id: rule.id,
          description: rule.description,
          weight: rule.weight,
          matchedSequence: [current.keyword, next.keyword]
        })
        break
      }
    }
  }

  return findings
}