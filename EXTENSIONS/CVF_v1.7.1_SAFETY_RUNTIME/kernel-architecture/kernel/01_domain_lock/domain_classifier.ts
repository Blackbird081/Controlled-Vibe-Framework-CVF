// domain_classifier.ts

import { DomainType } from "./domain.types"

export class DomainClassifier {
  classify(input: string): DomainType {
    const lower = input.toLowerCase()

    if (lower.includes("sáng tác") || lower.includes("viết truyện")) return "creative"

    if (lower.includes("phân tích") || lower.includes("so sánh")) return "analytical"

    if (lower.includes("hướng dẫn") || lower.includes("cách làm")) return "procedural"

    if (lower.includes("nhạy cảm") || lower.includes("tài chính cá nhân"))
      return "sensitive"

    return "informational"
  }
}
