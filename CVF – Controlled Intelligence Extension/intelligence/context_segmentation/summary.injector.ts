export interface PhaseSummary {
  role: string
  summary: string
  timestamp: number
}

export function injectSummary(
  summaries: PhaseSummary[],
  newSummary: PhaseSummary,
  maxSummaries: number = 10
): PhaseSummary[] {

  const updated = [...summaries, newSummary]

  if (updated.length > maxSummaries) {
    return updated.slice(-maxSummaries)
  }

  return updated
}