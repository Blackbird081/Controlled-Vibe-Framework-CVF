// --- MEOR Regulated-Domain Adapter ---
// Tranche: MEOR-RDA-T2
// Authorization: docs/baselines/CVF_GC018_MEOR_RDA_T2_DETERMINISTIC_ADAPTER_IMPLEMENTATION_2026-06-12.md
// Contract: docs/reference/CVF_MEOR_REGULATED_DOMAIN_ADAPTER_CONTRACT_2026-06-12.md
// Semantics: docs/reference/CVF_MEOR_REGULATED_DOMAIN_ADAPTER_SEMANTICS_2026-06-12.json

import type {
  DomainProfileId,
  DscpDomainProfile,
  DscpMetadataRequirement,
  MetadataEvidenceBasis,
} from "./dscp.domain.profile.contract";

export type RegulatedDomainAdapterFailureToken =
  | "REGULATED_FIELD_ON_NON_REGULATORY_PROFILE"
  | "REGULATED_PROFILE_ID_EMPTY";

export interface RegulatedDomainAdapterResult {
  eligible: boolean;
  profileId: DomainProfileId;
  generatedRequirements: readonly Readonly<DscpMetadataRequirement>[];
  failureToken?: RegulatedDomainAdapterFailureToken;
  failureDetail?: string;
}

interface RegulatedConceptMapping {
  requirementId: string;
  metadataKey: string;
  acceptableEvidenceBases: readonly MetadataEvidenceBasis[];
}

// Local mapping table mirroring RDA-T1 semantics JSON
// (docs/reference/CVF_MEOR_REGULATED_DOMAIN_ADAPTER_SEMANTICS_2026-06-12.json).
// These are the four regulated lifecycle concepts; values are read-only.
export const REGULATED_DOMAIN_REQUIREMENT_MAPPINGS: readonly RegulatedConceptMapping[] = Object.freeze([
  Object.freeze({
    requirementId: "regulated.document_status",
    metadataKey: "documentStatus",
    acceptableEvidenceBases: Object.freeze(["SOURCE_EMBEDDED", "OPERATOR_SUPPLIED"] as const),
  }),
  Object.freeze({
    requirementId: "regulated.promulgation_date",
    metadataKey: "promulgationDate",
    acceptableEvidenceBases: Object.freeze(["SOURCE_EMBEDDED", "OPERATOR_SUPPLIED"] as const),
  }),
  Object.freeze({
    requirementId: "regulated.effective_date",
    metadataKey: "effectiveDate",
    acceptableEvidenceBases: Object.freeze(["SOURCE_EMBEDDED", "OPERATOR_SUPPLIED"] as const),
  }),
  Object.freeze({
    requirementId: "regulated.jurisdiction",
    metadataKey: "jurisdiction",
    acceptableEvidenceBases: Object.freeze(["SOURCE_EMBEDDED", "OPERATOR_SUPPLIED"] as const),
  }),
]);

// Generate profile-scoped regulated MEOR metadata requirements for a
// DscpDomainProfile only when it explicitly declares regulated document
// lifecycle support (supportsDocumentStatus === true).
//
// Non-regulatory profiles receive an ineligible result with no generated
// requirements. Regulated lifecycle fields are never injected globally.
//
// All logic is local and deterministic; no I/O, provider call, or external
// workspace dependency.
export function buildRegulatedDomainMetadataRequirements(
  profile: DscpDomainProfile,
): RegulatedDomainAdapterResult {
  const profileId = profile.domainProfileId;

  if (profileId.trim().length === 0) {
    return Object.freeze({
      eligible: false,
      profileId,
      generatedRequirements: Object.freeze([]),
      failureToken: "REGULATED_PROFILE_ID_EMPTY" as const,
      failureDetail: "profile ID must be non-empty",
    });
  }

  if (profile.supportsDocumentStatus !== true) {
    return Object.freeze({
      eligible: false,
      profileId,
      generatedRequirements: Object.freeze([]),
      failureToken: "REGULATED_FIELD_ON_NON_REGULATORY_PROFILE" as const,
      failureDetail: `profile '${profileId}' does not declare supportsDocumentStatus=true; regulated lifecycle fields must not be injected`,
    });
  }

  const generatedRequirements: Readonly<DscpMetadataRequirement>[] =
    REGULATED_DOMAIN_REQUIREMENT_MAPPINGS.map((mapping) =>
      Object.freeze({
        requirementId: mapping.requirementId,
        ownerProfileId: profileId,
        metadataKey: mapping.metadataKey,
        required: true,
        acceptableEvidenceBases: mapping.acceptableEvidenceBases,
      } satisfies DscpMetadataRequirement),
    );

  return Object.freeze({
    eligible: true,
    profileId,
    generatedRequirements: Object.freeze(generatedRequirements),
  });
}
