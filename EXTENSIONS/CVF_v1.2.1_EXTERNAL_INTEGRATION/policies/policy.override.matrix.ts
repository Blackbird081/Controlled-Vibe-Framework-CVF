// policy.override.matrix.ts

export type PolicyLayer =
  | "source"
  | "risk"
  | "phase"
  | "domain"
  | "validation"
  | "manual_override";

export interface PolicyOverrideMatrix {

  // Thứ tự ưu tiên từ cao xuống thấp
  precedence_order: PolicyLayer[];

  // Nếu có conflict, layer nào có quyền reject tuyệt đối?
  absolute_reject_layers: PolicyLayer[];

  // Nếu layer yêu cầu manual review, có được auto-override không?
  manual_review_is_blocking: boolean;

  // Production phase có phải là absolute lock?
  production_is_absolute: boolean;

}

export const policyOverrideMatrix: PolicyOverrideMatrix = {

  precedence_order: [
    "manual_override",
    "domain",
    "phase",
    "risk",
    "source",
    "validation"
  ],

  absolute_reject_layers: [
    "domain",
    "phase"
  ],

  manual_review_is_blocking: true,

  production_is_absolute: true

};