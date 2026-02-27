export class AssumptionTracker {
  track(text: string): string[] {
    const assumptions: string[] = []
    const lower = text.toLowerCase()

    if (/\b(i assume|assuming|likely|probably|maybe)\b/.test(lower)) {
      assumptions.push("implicit_assumption")
    }

    if (/\b(can't guarantee|not sure|uncertain)\b/.test(lower)) {
      assumptions.push("confidence_uncertainty")
    }

    return assumptions
  }
}
