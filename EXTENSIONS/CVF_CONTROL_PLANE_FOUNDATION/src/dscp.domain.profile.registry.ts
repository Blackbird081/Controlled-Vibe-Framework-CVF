import type { DscpDomainProfile, DscpDomainFamily, DomainProfileId } from "./dscp.domain.profile.contract";

// --- DSCP-T11E Domain Profile Registry And Profile Selection ---
// Tranche: DSCP-T11E
// Authorization: operator direction 2026-06-10 to add profile registry/selector
// so scan layer can select domain profiles without hard-coding PolicyLocal.

// Criteria used to select a profile from the registry.
// All supplied fields are ANDed; omitted fields are wildcards.
export interface DomainProfileSelectionCriteria {
  // Select by exact domain family.
  domainFamily?: DscpDomainFamily;
  // Select by language code (profile must include this code).
  languageCode?: string;
  // Select by exact profile ID.
  domainProfileId?: DomainProfileId;
  // Select by a metadata key that must be present in commonFacetFields or domainFacetFields.
  requiredFacetKey?: string;
}

// Result of a profile selection attempt.
export interface DomainProfileSelectionResult {
  // The matched profile, or null when no match found.
  profile: DscpDomainProfile | null;
  // Whether exactly one profile matched (false = zero or multiple matches).
  matched: boolean;
  // Number of profiles that satisfied the criteria.
  matchCount: number;
  // IDs of all profiles that satisfied the criteria (diagnostic).
  matchedIds: DomainProfileId[];
  // Diagnostic messages (non-blocking).
  diagnostics: string[];
}

// Result of registering a profile.
export interface DomainProfileRegistrationResult {
  registered: boolean;
  profileId: DomainProfileId;
  // Reason registration was rejected, if registered=false.
  rejectionReason?: string;
}

// A deterministic in-memory registry of DscpDomainProfiles.
// Profiles are registered by ID; selection uses DomainProfileSelectionCriteria.
// All logic is local and deterministic with no I/O or provider call.
export class DscpDomainProfileRegistry {
  private readonly profiles: Map<DomainProfileId, DscpDomainProfile>;

  constructor(initialProfiles: DscpDomainProfile[] = []) {
    this.profiles = new Map();
    for (const profile of initialProfiles) {
      this.profiles.set(profile.domainProfileId, profile);
    }
  }

  // Register a profile. Rejects duplicate IDs unless replaceExisting=true.
  register(
    profile: DscpDomainProfile,
    options: { replaceExisting?: boolean } = {},
  ): DomainProfileRegistrationResult {
    if (this.profiles.has(profile.domainProfileId) && !options.replaceExisting) {
      return {
        registered: false,
        profileId: profile.domainProfileId,
        rejectionReason: `Profile '${profile.domainProfileId}' is already registered. Pass replaceExisting=true to overwrite.`,
      };
    }
    this.profiles.set(profile.domainProfileId, profile);
    return { registered: true, profileId: profile.domainProfileId };
  }

  // Unregister a profile by ID. Returns true if it existed.
  unregister(profileId: DomainProfileId): boolean {
    return this.profiles.delete(profileId);
  }

  // Return all registered profiles.
  listAll(): DscpDomainProfile[] {
    return Array.from(this.profiles.values());
  }

  // Get a profile by exact ID, or null.
  getById(profileId: DomainProfileId): DscpDomainProfile | null {
    return this.profiles.get(profileId) ?? null;
  }

  // Select profiles matching all supplied criteria.
  // Returns a DomainProfileSelectionResult with the first match when matchCount=1,
  // or null profile when matchCount != 1 (with diagnostics explaining why).
  select(criteria: DomainProfileSelectionCriteria): DomainProfileSelectionResult {
    const diagnostics: string[] = [];
    const candidates = Array.from(this.profiles.values()).filter((p) =>
      this._matches(p, criteria),
    );

    const matchedIds = candidates.map((p) => p.domainProfileId);

    if (candidates.length === 0) {
      diagnostics.push(
        `No profile matched criteria: ${JSON.stringify(criteria)}`,
      );
      return {
        profile: null,
        matched: false,
        matchCount: 0,
        matchedIds,
        diagnostics,
      };
    }

    if (candidates.length > 1) {
      diagnostics.push(
        `Ambiguous selection: ${candidates.length} profiles matched criteria ${JSON.stringify(criteria)}. ` +
          `Matched IDs: ${matchedIds.join(", ")}. Narrow criteria to select exactly one.`,
      );
      return {
        profile: null,
        matched: false,
        matchCount: candidates.length,
        matchedIds,
        diagnostics,
      };
    }

    return {
      profile: candidates[0],
      matched: true,
      matchCount: 1,
      matchedIds,
      diagnostics,
    };
  }

  // Returns true when a profile satisfies all non-null criteria fields.
  private _matches(
    profile: DscpDomainProfile,
    criteria: DomainProfileSelectionCriteria,
  ): boolean {
    if (
      criteria.domainProfileId !== undefined &&
      profile.domainProfileId !== criteria.domainProfileId
    ) {
      return false;
    }
    if (
      criteria.domainFamily !== undefined &&
      profile.domainFamily !== criteria.domainFamily
    ) {
      return false;
    }
    if (
      criteria.languageCode !== undefined &&
      !profile.languageCodes.includes(criteria.languageCode)
    ) {
      return false;
    }
    if (criteria.requiredFacetKey !== undefined) {
      const hasCommon = criteria.requiredFacetKey in profile.commonFacetFields;
      const hasDomain = criteria.requiredFacetKey in profile.domainFacetFields;
      if (!hasCommon && !hasDomain) {
        return false;
      }
    }
    return true;
  }
}

// Factory: create a pre-populated registry from a list of profiles.
export function createDscpDomainProfileRegistry(
  profiles: DscpDomainProfile[] = [],
): DscpDomainProfileRegistry {
  return new DscpDomainProfileRegistry(profiles);
}
