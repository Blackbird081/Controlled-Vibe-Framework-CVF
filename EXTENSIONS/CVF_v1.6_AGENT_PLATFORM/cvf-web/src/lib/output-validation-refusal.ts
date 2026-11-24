// Text Encoding Exception: Vietnamese user-facing refusal copy requires UTF-8.
/**
 * User-facing reason for a deterministic word-limit refusal (HTTP 422, WORD_LIMIT_EXCEEDED).
 * Reads only the server-measured facts; never invents a limit or a count.
 */
export interface WordLimitRefusal {
  observed: number;
  limit: number;
}

const positiveInteger = (value: unknown): value is number => Number.isInteger(value) && (value as number) > 0;

/** Returns the measured count and limit only for a real over-limit refusal; otherwise null. */
export function readWordLimitRefusal(outputValidation: unknown): WordLimitRefusal | null {
  if (!outputValidation || typeof outputValidation !== 'object') return null;
  const { issues, wordLimit } = outputValidation as { issues?: unknown; wordLimit?: { observed?: unknown; limit?: unknown } };
  if (!Array.isArray(issues) || !issues.includes('WORD_LIMIT_EXCEEDED') || !wordLimit) return null;
  const { observed, limit } = wordLimit;
  if (!positiveInteger(observed) || !positiveInteger(limit) || observed <= limit) return null;
  return { observed, limit };
}

export function wordLimitRefusalMessage(refusal: WordLimitRefusal, isVi: boolean): string {
  return isVi
    ? `Kết quả dài ${refusal.observed} từ, vượt giới hạn ${refusal.limit} từ trong yêu cầu của bạn. CVF không hiển thị kết quả này và không tự chạy lại. Bước tiếp theo: chạy lại, hoặc yêu cầu ít nội dung hơn hay nới giới hạn từ.`
    : `The result has ${refusal.observed} words, above the ${refusal.limit}-word limit in your request. CVF does not show this result and does not retry automatically. Next action: run again, or ask for less content or a higher word limit.`;
}
