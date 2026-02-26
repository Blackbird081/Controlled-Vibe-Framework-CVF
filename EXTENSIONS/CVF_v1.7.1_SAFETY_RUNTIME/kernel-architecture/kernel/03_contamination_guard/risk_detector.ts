export class RiskDetector {

  detect(text: string): string[] {
    const flags: string[] = []

    const lower = text.toLowerCase()

    if (lower.includes("suicide") || lower.includes("kill myself"))
      flags.push("self_harm")

    if (lower.includes("lawsuit") || lower.includes("legal advice"))
      flags.push("legal")

    if (lower.includes("invest") || lower.includes("trading strategy"))
      flags.push("financial")

    if (lower.includes("medicine") || lower.includes("treatment"))
      flags.push("medical")

    return flags
  }
}
