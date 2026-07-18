export type LineageStage =
  | "INTAKE"
  | "NORMALIZE"
  | "SCHEMA"
  | "DUPLICATE"
  | "CONFLICT"
  | "QUALITY"
  | "INTEGRITY"
  | "LINEAGE"
  | "PACKET";

export interface LineageEvent {
  lineage_event_id: string;
  stage: LineageStage;
  operation: string;
  input_references: string[];
  output_references: string[];
  rule_id: string | null;
  rule_version: string | null;
  performed_at_utc: string;
  performed_by: string;
  details: Record<string, unknown>;
}
