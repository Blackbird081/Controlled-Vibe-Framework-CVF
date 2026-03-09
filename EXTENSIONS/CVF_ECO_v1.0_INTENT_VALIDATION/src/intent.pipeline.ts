import { ValidatedIntent } from "./types";
import { IntentParser } from "./intent.parser";
import { SchemaMapper, resetRuleCounter } from "./schema.mapper";
import { ConstraintGenerator, resetConstraintCounter } from "./constraint.generator";

const PIPELINE_VERSION = "1.0.0";
const MIN_CONFIDENCE = 0.3;

export class IntentPipeline {
  private parser: IntentParser;
  private mapper: SchemaMapper;
  private generator: ConstraintGenerator;

  constructor() {
    this.parser = new IntentParser();
    this.mapper = new SchemaMapper();
    this.generator = new ConstraintGenerator();
  }

  validate(vibe: string): ValidatedIntent {
    const errors: string[] = [];

    if (!vibe || vibe.trim().length === 0) {
      return this.emptyResult("Vibe input is empty", vibe);
    }

    if (vibe.trim().length < 5) {
      return this.emptyResult("Vibe input is too short (min 5 chars)", vibe);
    }

    const intent = this.parser.parse(vibe);

    if (intent.confidence < MIN_CONFIDENCE) {
      errors.push(`Low confidence (${intent.confidence.toFixed(2)}) — intent may be ambiguous`);
    }

    if (intent.action === "unknown") {
      errors.push("Could not determine specific action from vibe");
    }

    const rules = this.mapper.mapToRules(intent);
    const constraints = this.generator.generate(rules);

    return {
      intent,
      rules,
      constraints,
      timestamp: Date.now(),
      pipelineVersion: PIPELINE_VERSION,
      valid: errors.length === 0 && intent.confidence >= MIN_CONFIDENCE,
      errors,
    };
  }

  validateBatch(vibes: string[]): ValidatedIntent[] {
    return vibes.map((v) => this.validate(v));
  }

  private emptyResult(error: string, vibe: string): ValidatedIntent {
    return {
      intent: {
        domain: "general",
        action: "unknown",
        object: "unspecified",
        limits: {},
        requireApproval: false,
        confidence: 0,
        rawVibe: vibe,
      },
      rules: [],
      constraints: [],
      timestamp: Date.now(),
      pipelineVersion: PIPELINE_VERSION,
      valid: false,
      errors: [error],
    };
  }
}
