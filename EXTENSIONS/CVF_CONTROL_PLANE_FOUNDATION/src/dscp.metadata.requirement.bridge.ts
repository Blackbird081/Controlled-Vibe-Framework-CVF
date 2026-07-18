import type {
  DomainProfileId,
  DscpDomainProfile,
  DscpMetadataRequirement,
  MetadataEvidenceBasis,
} from "./dscp.domain.profile.contract";

export type DscpMetadataRequirementFailureToken =
  | "INVALID_PROFILE_ID"
  | "INVALID_REQUIREMENT_ID"
  | "INVALID_METADATA_KEY"
  | "OWNER_PROFILE_MISMATCH"
  | "DUPLICATE_REQUIREMENT_ID"
  | "EMPTY_ACCEPTABLE_EVIDENCE"
  | "INVALID_EVIDENCE_BASIS"
  | "INVALID_REQUIRED_FLAG";

export interface DscpMetadataRequirementBridgeResult {
  valid: boolean;
  profileId: DomainProfileId;
  requirements: readonly Readonly<DscpMetadataRequirement>[];
  requirementOwnerMap: Readonly<Record<string, DomainProfileId>>;
  failureToken?: DscpMetadataRequirementFailureToken;
  failureDetail?: string;
}

const EVIDENCE_BASIS_ORDER: readonly MetadataEvidenceBasis[] = [
  "SOURCE_EMBEDDED",
  "OPERATOR_SUPPLIED",
  "DERIVED_HINT",
  "NONE",
];

const EVIDENCE_BASIS_SET = new Set<string>(EVIDENCE_BASIS_ORDER);

function fail(
  profileId: DomainProfileId,
  failureToken: DscpMetadataRequirementFailureToken,
  failureDetail: string,
): DscpMetadataRequirementBridgeResult {
  return Object.freeze({
    valid: false,
    profileId,
    requirements: Object.freeze([]),
    requirementOwnerMap: Object.freeze({}),
    failureToken,
    failureDetail,
  });
}

function normalizeRequirement(
  requirement: DscpMetadataRequirement,
): Readonly<DscpMetadataRequirement> {
  const acceptableEvidenceBases = [...requirement.acceptableEvidenceBases].sort(
    (left, right) =>
      EVIDENCE_BASIS_ORDER.indexOf(left) - EVIDENCE_BASIS_ORDER.indexOf(right),
  );

  return Object.freeze({
    requirementId: requirement.requirementId,
    ownerProfileId: requirement.ownerProfileId,
    metadataKey: requirement.metadataKey,
    required: requirement.required,
    acceptableEvidenceBases: Object.freeze(acceptableEvidenceBases),
  });
}

export function buildDscpMetadataRequirementBridge(
  profile: DscpDomainProfile,
): DscpMetadataRequirementBridgeResult {
  const profileId = profile.domainProfileId;
  if (profileId.trim().length === 0) {
    return fail(profileId, "INVALID_PROFILE_ID", "profile ID must be non-empty");
  }

  const declarations = profile.metadataRequirements ?? [];
  const seenRequirementIds = new Set<string>();

  for (const declaration of declarations) {
    if (declaration.requirementId.trim().length === 0) {
      return fail(
        profileId,
        "INVALID_REQUIREMENT_ID",
        "requirement ID must be non-empty",
      );
    }
    if (declaration.metadataKey.trim().length === 0) {
      return fail(
        profileId,
        "INVALID_METADATA_KEY",
        `requirement '${declaration.requirementId}' has an empty metadata key`,
      );
    }
    if (declaration.ownerProfileId !== profileId) {
      return fail(
        profileId,
        "OWNER_PROFILE_MISMATCH",
        `requirement '${declaration.requirementId}' belongs to '${declaration.ownerProfileId}'`,
      );
    }
    if (seenRequirementIds.has(declaration.requirementId)) {
      return fail(
        profileId,
        "DUPLICATE_REQUIREMENT_ID",
        `requirement '${declaration.requirementId}' is declared more than once`,
      );
    }
    seenRequirementIds.add(declaration.requirementId);

    if (declaration.acceptableEvidenceBases.length === 0) {
      return fail(
        profileId,
        "EMPTY_ACCEPTABLE_EVIDENCE",
        `requirement '${declaration.requirementId}' has no acceptable evidence basis`,
      );
    }
    if (
      declaration.acceptableEvidenceBases.some(
        (basis) => !EVIDENCE_BASIS_SET.has(basis),
      )
    ) {
      return fail(
        profileId,
        "INVALID_EVIDENCE_BASIS",
        `requirement '${declaration.requirementId}' contains an unsupported evidence basis`,
      );
    }
    if (typeof declaration.required !== "boolean") {
      return fail(
        profileId,
        "INVALID_REQUIRED_FLAG",
        `requirement '${declaration.requirementId}' has a non-boolean required flag`,
      );
    }
  }

  const requirements = declarations
    .map(normalizeRequirement)
    .sort((left, right) => left.requirementId.localeCompare(right.requirementId));
  const requirementOwnerMap = Object.freeze(
    Object.fromEntries(
      requirements.map((requirement) => [
        requirement.requirementId,
        requirement.ownerProfileId,
      ]),
    ),
  );

  return Object.freeze({
    valid: true,
    profileId,
    requirements: Object.freeze(requirements),
    requirementOwnerMap,
  });
}
