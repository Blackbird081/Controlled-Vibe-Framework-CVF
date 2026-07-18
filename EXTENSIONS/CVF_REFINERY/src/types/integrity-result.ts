export type IntegrityStatus = "PASS" | "FAIL";

export interface IntegrityResult {
  source_id: string;
  status: IntegrityStatus;
  expected_hash: string;
  actual_hash: string;
  failure_token: string | null;
}
