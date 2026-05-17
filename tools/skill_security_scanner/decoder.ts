// /governance/security_scanner/decoder.ts

export interface DecodedBlock {
  original: string
  decoded: string
  isValid: boolean
}

/**
 * Detect potential base64 blocks in content
 * Very basic heuristic:
 * - Length > 20
 * - Only base64 charset
 */
function extractBase64Candidates(content: string): string[] {
  const base64Regex = /(?:[A-Za-z0-9+/]{20,}={0,2})/g
  const matches = content.match(base64Regex)
  return matches || []
}

function isLikelyBase64(str: string): boolean {
  const base64Pattern = /^[A-Za-z0-9+/]+={0,2}$/
  return base64Pattern.test(str) && str.length % 4 === 0
}

function safeDecodeBase64(str: string): string | null {
  try {
    const BufferCtor = (globalThis as any).Buffer
    if (!BufferCtor) return null

    const buffer = BufferCtor.from(str, 'base64')
    const decoded = buffer.toString('utf-8')

    // Reject if decoded contains too many non-printable chars
    const printableRatio =
      decoded.replace(/[\x20-\x7E]/g, '').length / decoded.length

    if (printableRatio > 0.3) {
      return null
    }

    return decoded
  } catch {
    return null
  }
}

export function decodeBase64Blocks(content: string): DecodedBlock[] {
  const candidates = extractBase64Candidates(content)

  const results: DecodedBlock[] = []

  for (const candidate of candidates) {
    if (!isLikelyBase64(candidate)) continue

    const decoded = safeDecodeBase64(candidate)

    results.push({
      original: candidate,
      decoded: decoded || '',
      isValid: decoded !== null
    })
  }

  return results
}

export function decodeSuspiciousContent(content: string): string | null {
  const decoded = decodeBase64Blocks(content)
    .filter(b => b.isValid && b.decoded.trim().length > 0)
    .map(b => b.decoded.trim())

  if (decoded.length === 0) return null
  return decoded.join('\n')
}
