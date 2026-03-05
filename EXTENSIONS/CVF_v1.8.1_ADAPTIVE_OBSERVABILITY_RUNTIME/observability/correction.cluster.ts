import { invocationLog } from "./invocation.logger"

export function clusterCorrections(messages: string[]) {
  const keywordCount: Record<string, number> = {}

  messages.forEach(msg => {
    const words = msg.toLowerCase().split(/\s+/)
    words.forEach(word => {
      if (word.length > 4) {
        keywordCount[word] = (keywordCount[word] || 0) + 1
      }
    })
  })

  return Object.entries(keywordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
}