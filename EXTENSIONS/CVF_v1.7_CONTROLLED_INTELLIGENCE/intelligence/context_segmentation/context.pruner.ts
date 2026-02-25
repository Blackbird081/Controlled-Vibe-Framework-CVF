export interface ContextChunk {
  content: string
  timestamp: number
}

export function pruneContext(
  chunks: ContextChunk[],
  maxChunks: number = 20
): ContextChunk[] {

  if (chunks.length <= maxChunks) {
    return chunks
  }

  return chunks.slice(-maxChunks)
}