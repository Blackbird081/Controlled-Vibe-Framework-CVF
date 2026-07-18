export type QualitySeverity = "INFO" | "WARN" | "REVIEW" | "BLOCK";

export interface QualityFinding {
  finding_id: string;
  rule_id: string;
  severity: QualitySeverity;
  message: string;
  affected_records: string[];
  affected_fields: string[];
  failure_token: string | null;
  details: Record<string, unknown>;
  created_at_utc: string;
}
