export type SatisfactionType =
  | "satisfied"
  | "correction"
  | "follow_up"
  | "neutral"

export function analyzeSatisfaction(message: string): SatisfactionType {
  const lower = message.toLowerCase()

  if (lower.includes("không") || lower.includes("sửa lại"))
    return "correction"

  if (lower.includes("quên") || lower.includes("thiếu"))
    return "follow_up"

  if (lower.includes("cảm ơn") || lower.includes("ok"))
    return "satisfied"

  return "neutral"
}