// conflict.detector.ts
// Lesson conflict detection — uses keyword similarity, not just exact string match.
// Detects: same-category duplicates, semantic overlap via keyword intersection.

import { Lesson } from "./lesson.schema"

/**
 * Extract keywords from a description for similarity comparison.
 * Strips common words, lowercases, splits by whitespace/punctuation.
 */
function extractKeywords(text: string): Set<string> {
  const stopWords = new Set([
    "the", "a", "an", "is", "are", "was", "were", "be", "been",
    "and", "or", "not", "no", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "as", "it", "this", "that",
    "should", "must", "will", "can", "may", "do", "does", "did",
    "có", "là", "và", "hoặc", "không", "của", "trong", "cho",
    "được", "sẽ", "đã", "nên", "phải", "khi", "nếu", "với"
  ])

  const words = text
    .toLowerCase()
    .replace(/[^\w\sàáảãạăắẳẵặâấẩẫậèéẻẽẹêếểễệìíỉĩịòóỏõọôốổỗộơớởỡợùúủũụưứửữựỳýỷỹỵđ]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w))

  return new Set(words)
}

/**
 * Jaccard similarity between two keyword sets.
 * Returns 0.0 (no overlap) to 1.0 (identical).
 */
function keywordSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0
  const intersection = new Set([...a].filter(x => b.has(x)))
  const union = new Set([...a, ...b])
  return intersection.size / union.size
}

const SIMILARITY_THRESHOLD = 0.4  // 40% keyword overlap = potential conflict

export function detectConflict(
  newLesson: Lesson,
  existingLessons: Lesson[]
): string[] {

  const conflicts: string[] = []
  const newKeywords = extractKeywords(newLesson.description)

  existingLessons.forEach(l => {
    // 1. Exact duplicate (same category + same description)
    if (
      l.category === newLesson.category &&
      l.description === newLesson.description &&
      l.version !== newLesson.version
    ) {
      conflicts.push(
        `EXACT conflict with lesson ${l.id} v${l.version} — identical description`
      )
      return
    }

    // 2. Semantic overlap (same category + similar keywords)
    if (l.category === newLesson.category) {
      const existingKeywords = extractKeywords(l.description)
      const similarity = keywordSimilarity(newKeywords, existingKeywords)

      if (similarity >= SIMILARITY_THRESHOLD) {
        conflicts.push(
          `SIMILAR conflict with lesson ${l.id} v${l.version} — ${(similarity * 100).toFixed(0)}% keyword overlap`
        )
      }
    }

    // 3. Root cause conflict (same rootCause across categories)
    if (
      l.rootCause && newLesson.rootCause &&
      l.rootCause === newLesson.rootCause &&
      l.id !== newLesson.id
    ) {
      conflicts.push(
        `ROOT-CAUSE conflict with lesson ${l.id} — same rootCause: "${l.rootCause}"`
      )
    }
  })

  return conflicts
}