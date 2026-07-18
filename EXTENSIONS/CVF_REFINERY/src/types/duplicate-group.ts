export type DuplicateMatchType = "EXACT" | "STRUCTURAL" | "PROBABLE";

export type DuplicateDisposition =
  | "OPEN"
  | "REVIEW_REQUIRED"
  | "CONFIRMED_DUPLICATE"
  | "NOT_DUPLICATE";

/**
 * Grouping is non-destructive: membership records overlap, no member is
 * removed or merged, and disposition never auto-promotes to
 * CONFIRMED_DUPLICATE without an EXACT match on every declared field.
 */
export interface DuplicateGroup {
  duplicate_group_id: string;
  scope_key: string;
  members: string[];
  match_type: DuplicateMatchType;
  fingerprint: string | null;
  confidence: number;
  reason_codes: string[];
  disposition: DuplicateDisposition;
}
