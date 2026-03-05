// certification-state.ts

export type CertificationState =
  | "draft"
  | "validated"
  | "under_review"
  | "certified"
  | "rejected"
  | "revoked";

/**
 * Allowed state transitions
 *
 * This prevents governance bypass.
 */
const ALLOWED_TRANSITIONS: Record<CertificationState, CertificationState[]> = {
  draft: ["validated", "rejected"],
  validated: ["under_review", "certified", "rejected"],
  under_review: ["certified", "rejected"],
  certified: ["revoked"],
  rejected: [],
  revoked: []
};

export class CertificationStateMachine {

  static canTransition(
    from: CertificationState,
    to: CertificationState
  ): boolean {
    return ALLOWED_TRANSITIONS[from].includes(to);
  }

  static assertTransition(
    from: CertificationState,
    to: CertificationState
  ): void {
    if (!this.canTransition(from, to)) {
      throw new Error(
        `Invalid certification state transition: ${from} → ${to}`
      );
    }
  }

}