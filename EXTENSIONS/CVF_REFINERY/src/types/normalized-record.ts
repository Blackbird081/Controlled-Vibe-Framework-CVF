export interface NormalizationStep {
  step_id: string;
  operation: string;
  rule_version: string;
}

export interface NormalizedRecord {
  record_id: string;
  source_id: string;
  source_record_id: string | null;
  canonical_fields: Record<string, unknown>;
  original_fields: Record<string, unknown>;
  normalization_steps: NormalizationStep[];
  warnings: string[];
}
