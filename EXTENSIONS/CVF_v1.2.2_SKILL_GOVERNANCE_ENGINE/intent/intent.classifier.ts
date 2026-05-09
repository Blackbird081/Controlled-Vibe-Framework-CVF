export interface IntentResult {
  rawIntent: string;
  normalizedIntent: string;
  confidence: number;
}

export class IntentClassifier {

  static classify(input: string): IntentResult {

    const normalized = input.trim().toLowerCase();

    // Simple rule-based baseline (production-ready placeholder for ML model)
    let confidence = 0.6;

    if (normalized.length > 20) confidence = 0.75;
    if (normalized.includes("optimize") || normalized.includes("improve"))
      confidence = 0.85;

    return {
      rawIntent: input,
      normalizedIntent: normalized,
      confidence
    };
  }

}