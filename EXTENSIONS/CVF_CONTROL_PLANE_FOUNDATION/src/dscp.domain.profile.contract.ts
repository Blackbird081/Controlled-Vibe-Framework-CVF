import type { GovernedArtifactDescriptorInput } from "./dscp.governed.artifact.descriptor";

// --- DSCP-T10 Domain Profile And Scan Adapter Contract ---
// Tranche: DSCP-T10
// Authorization: docs/baselines/CVF_GC018_DSCP_T10_DOMAIN_PROFILE_AND_SCAN_ADAPTER_CONTRACT_2026-06-10.md

// Stable identifier for a registered domain profile.
export type DomainProfileId = string;

export type MetadataEvidenceBasis =
  | "SOURCE_EMBEDDED"
  | "OPERATOR_SUPPLIED"
  | "DERIVED_HINT"
  | "NONE";

export interface DscpMetadataRequirement {
  requirementId: string;
  ownerProfileId: DomainProfileId;
  metadataKey: string;
  required: boolean;
  acceptableEvidenceBases: readonly MetadataEvidenceBasis[];
}

// Union of recognized DSCP domain families.
// Extend with new string literals only via a governed tranche.
export type DscpDomainFamily =
  | "legal_policy"
  | "company_docs"
  | "technical_project"
  | "governance_docs"
  | "mixed_corpus";

// A deterministic, domain-specific profile that describes how CVF scan and
// memory packaging should behave for a given corpus domain.
// Profile fields are NOT injected into the global DSCP defaults - each profile
// is applied explicitly via applyDomainProfileToDescriptorInput().
export interface DscpDomainProfile {
  // Stable identifier for this profile instance.
  domainProfileId: DomainProfileId;

  // High-level domain family for grouping and routing.
  domainFamily: DscpDomainFamily;

  // ISO 639-1 language codes expected in this domain (e.g. ["vi"], ["en"], ["en","vi"]).
  languageCodes: string[];

  // Facet fields shared across all artifacts in this domain.
  // Keys map to GovernedArtifactDescriptor.metadata keys.
  commonFacetFields: Record<string, string>;

  // Facet fields specific to this domain (not promoted to the global schema).
  domainFacetFields: Record<string, string>;

  // Gate keys from domainGateKeys that this profile may write into customGates.
  // Only keys listed here are eligible for injection; others are rejected.
  domainGateKeys: string[];

  // Boundary rules encoded as key-value pairs (e.g. EC-02 hard boundaries).
  // Checked by applyDomainProfileToDescriptorInput() before gate injection.
  boundaryRules: Record<string, string>;

  // Default metadata merged into descriptors (lower priority than caller metadata).
  defaultMetadata: Record<string, string>;

  // Whether this domain profile supports the EC-02 documentStatus lifecycle field.
  // Non-regulatory domains omit this field (undefined = false posture, per EC-T1 D-03).
  supportsDocumentStatus?: boolean;

  // Profile-scoped metadata requirements. Omitted means this profile declares
  // no MEOR requirements; no global defaults are inferred.
  metadataRequirements?: readonly DscpMetadataRequirement[];
}

// Option bag for applyDomainProfileToDescriptorInput().
export interface DomainProfileApplyOptions {
  // When true, profile defaultMetadata overwrites caller-supplied metadata on key conflict.
  // Default: false (caller metadata wins).
  overwriteCallerMetadata?: boolean;
}

// Result of applying a domain profile to a descriptor input.
export interface DomainProfileApplyResult {
  // The enriched descriptor input ready for buildGovernedArtifactDescriptor().
  // null only when blocked=true.
  enrichedInput: GovernedArtifactDescriptorInput | null;

  // Whether the application was blocked (e.g. boundary rule violation or unknown gate key).
  blocked: boolean;

  // Reason for blocking, if blocked=true.
  blockReason?: string;

  // Gate keys from domainGateKeys that were successfully injected into customGates.
  injectedGateKeys: string[];

  // Gate keys supplied by the profile that were rejected (not in domainGateKeys allowlist).
  rejectedGateKeys: string[];

  // Diagnostic messages (non-blocking observations).
  diagnostics: string[];
}

// Apply a DscpDomainProfile to an existing GovernedArtifactDescriptorInput.
//
// Behavior contract:
//  1. Existing GovernedArtifactDescriptorInput fields are always preserved.
//  2. Profile defaultMetadata is merged BELOW caller metadata unless
//     options.overwriteCallerMetadata is explicitly true.
//  3. Only gate keys listed in profile.domainGateKeys are copied into
//     customGates; others produce a rejectedGateKeys entry.
//  4. Boundary rule violations produce a blocked=true result with exact reason.
//  5. All logic is local and deterministic; no I/O, provider call, or
//     external workspace dependency.
export function applyDomainProfileToDescriptorInput(
  profile: DscpDomainProfile,
  input: GovernedArtifactDescriptorInput,
  options: DomainProfileApplyOptions = {},
): DomainProfileApplyResult {
  const diagnostics: string[] = [];

  // Step 1: Check boundary rules.
  for (const [ruleKey, ruleValue] of Object.entries(profile.boundaryRules)) {
    // Boundary rules encoded as "KEY=BLOCKED_UNTIL_DATE" or "KEY=PROHIBITED" block injection.
    if (ruleValue.startsWith("BLOCKED") || ruleValue === "PROHIBITED") {
      return {
        enrichedInput: null,
        blocked: true,
        blockReason: `Boundary rule '${ruleKey}=${ruleValue}' blocks profile application for artifact ${input.artifactId}`,
        injectedGateKeys: [],
        rejectedGateKeys: [],
        diagnostics,
      };
    }
  }

  // Step 2: Merge metadata (caller wins by default).
  const callerMetadata: Record<string, string> = input.metadata ?? {};
  const mergedMetadata: Record<string, string> = options.overwriteCallerMetadata
    ? { ...callerMetadata, ...profile.defaultMetadata }
    : { ...profile.defaultMetadata, ...callerMetadata };

  // Add domain facet fields and common facet fields at lowest priority.
  const fullMetadata: Record<string, string> = {
    ...profile.commonFacetFields,
    ...profile.domainFacetFields,
    ...mergedMetadata,
  };

  // Record language codes in metadata if not already set by caller.
  if (!fullMetadata["languageCodes"]) {
    fullMetadata["languageCodes"] = profile.languageCodes.join(",");
  }

  if (!fullMetadata["domainFamily"]) {
    fullMetadata["domainFamily"] = profile.domainFamily;
  }

  if (!fullMetadata["domainProfileId"]) {
    fullMetadata["domainProfileId"] = profile.domainProfileId;
  }

  // Step 3: Inject only allowed gate keys into customGates.
  const existingCustomGates: Record<string, string> =
    input.governanceGates.customGates ?? {};
  const injectedGateKeys: string[] = [];
  const rejectedGateKeys: string[] = [];
  const newCustomGates: Record<string, string> = { ...existingCustomGates };

  for (const gateKey of profile.domainGateKeys) {
    // Gate value comes from boundaryRules or domainFacetFields if present,
    // otherwise from a default UNKNOWN sentinel with a diagnostic.
    const boundaryGateValue = profile.boundaryRules[gateKey];
    const facetGateValue = profile.domainFacetFields[gateKey];
    const gateValue = boundaryGateValue ?? facetGateValue ?? "UNKNOWN";

    if (boundaryGateValue === undefined && facetGateValue === undefined) {
      diagnostics.push(
        `Gate key '${gateKey}' has no boundaryRules or domainFacetFields value; injected UNKNOWN sentinel`,
      );
    }

    newCustomGates[gateKey] = gateValue;
    injectedGateKeys.push(gateKey);
  }

  // Check for any profile metadata keys that look like gate keys but are NOT
  // in domainGateKeys - surface as rejected for diagnostics.
  for (const key of Object.keys(profile.domainFacetFields)) {
    if (
      key.toLowerCase().includes("gate") &&
      !profile.domainGateKeys.includes(key)
    ) {
      rejectedGateKeys.push(key);
      diagnostics.push(
        `Gate-like key '${key}' in domainFacetFields is not in domainGateKeys - not injected into customGates`,
      );
    }
  }

  const enrichedGovernanceGates = {
    ...input.governanceGates,
    customGates: newCustomGates,
  };

  const enrichedInput: GovernedArtifactDescriptorInput = {
    ...input,
    metadata: fullMetadata,
    governanceGates: enrichedGovernanceGates,
  };

  return {
    enrichedInput,
    blocked: false,
    injectedGateKeys,
    rejectedGateKeys,
    diagnostics,
  };
}
