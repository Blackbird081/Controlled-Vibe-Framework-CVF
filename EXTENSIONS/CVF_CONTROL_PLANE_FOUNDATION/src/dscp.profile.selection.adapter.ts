import type { GovernedArtifactDescriptorInput } from "./dscp.governed.artifact.descriptor";
import type { DomainProfileId } from "./dscp.domain.profile.contract";
import { applyDomainProfileToDescriptorInput } from "./dscp.domain.profile.contract";
import type { DomainProfileSelectionCriteria } from "./dscp.domain.profile.registry";
import { DscpDomainProfileRegistry } from "./dscp.domain.profile.registry";

// --- DSCP-T11F Profile Selection Adapter ---
// Tranche: DSCP-T11F
// Authorization: docs/baselines/CVF_GC018_DSCP_T11F_PROFILE_SELECTION_ADAPTER_2026-06-10.md
// Deterministic local adapter combining registry selection + profile application.
// No I/O, provider call, external workspace dependency, or corpus ingestion.

// Status tokens for the adapter result.
export type DscpProfileSelectionStopReason =
  | "PROFILE_APPLIED"
  | "PROFILE_SELECTION_NO_MATCH"
  | "PROFILE_SELECTION_AMBIGUOUS"
  | "PROFILE_APPLICATION_BLOCKED";

// Input to the profile selection adapter.
export interface DscpProfileSelectionAdapterInput {
  // The registry to select from.
  registry: DscpDomainProfileRegistry;
  // Selection criteria forwarded to registry.select().
  criteria: DomainProfileSelectionCriteria;
  // The raw descriptor input to enrich when exactly one profile is selected and not blocked.
  descriptorInput: GovernedArtifactDescriptorInput;
}

// Result of a profile selection adapter call.
export interface DscpProfileSelectionAdapterResult {
  // Overall status token.
  status: DscpProfileSelectionStopReason;
  // Selected profile ID, or null when selection fails.
  selectedProfileId: DomainProfileId | null;
  // Number of profiles that matched the criteria.
  matchCount: number;
  // All profile IDs that matched the criteria (diagnostic).
  matchedIds: DomainProfileId[];
  // The enriched descriptor input, present only when status=PROFILE_APPLIED.
  enrichedDescriptorInput: GovernedArtifactDescriptorInput | null;
  // Injected gate keys from profile application (present on PROFILE_APPLIED).
  injectedGateKeys: string[];
  // Diagnostic messages from selection and/or application stages.
  diagnostics: string[];
}

// Select one domain profile from a registry and apply it to a descriptor input.
//
// Behavior contract:
//  1. If selection returns zero matches, stop with PROFILE_SELECTION_NO_MATCH.
//  2. If selection returns multiple matches, stop with PROFILE_SELECTION_AMBIGUOUS.
//  3. If profile application returns blocked=true, stop with PROFILE_APPLICATION_BLOCKED.
//  4. Success (PROFILE_APPLIED) is allowed only when exactly one profile matches
//     and profile application succeeds.
//  5. All logic is local and deterministic; no I/O or provider call.
export function selectAndApplyDscpDomainProfile(
  input: DscpProfileSelectionAdapterInput,
): DscpProfileSelectionAdapterResult {
  const { registry, criteria, descriptorInput } = input;
  const allDiagnostics: string[] = [];

  // Stage 1: registry selection.
  const selectionResult = registry.select(criteria);
  allDiagnostics.push(...selectionResult.diagnostics);

  if (selectionResult.matchCount === 0) {
    return {
      status: "PROFILE_SELECTION_NO_MATCH",
      selectedProfileId: null,
      matchCount: 0,
      matchedIds: [],
      enrichedDescriptorInput: null,
      injectedGateKeys: [],
      diagnostics: allDiagnostics,
    };
  }

  if (selectionResult.matchCount > 1) {
    return {
      status: "PROFILE_SELECTION_AMBIGUOUS",
      selectedProfileId: null,
      matchCount: selectionResult.matchCount,
      matchedIds: selectionResult.matchedIds,
      enrichedDescriptorInput: null,
      injectedGateKeys: [],
      diagnostics: allDiagnostics,
    };
  }

  // Stage 2: profile application (exactly one match).
  const profile = selectionResult.profile!;
  const applyResult = applyDomainProfileToDescriptorInput(profile, descriptorInput);
  allDiagnostics.push(...applyResult.diagnostics);

  if (applyResult.blocked) {
    allDiagnostics.push(
      `Profile application blocked: ${applyResult.blockReason ?? "no reason recorded"}`,
    );
    return {
      status: "PROFILE_APPLICATION_BLOCKED",
      selectedProfileId: profile.domainProfileId,
      matchCount: 1,
      matchedIds: selectionResult.matchedIds,
      enrichedDescriptorInput: null,
      injectedGateKeys: [],
      diagnostics: allDiagnostics,
    };
  }

  return {
    status: "PROFILE_APPLIED",
    selectedProfileId: profile.domainProfileId,
    matchCount: 1,
    matchedIds: selectionResult.matchedIds,
    enrichedDescriptorInput: applyResult.enrichedInput,
    injectedGateKeys: applyResult.injectedGateKeys,
    diagnostics: allDiagnostics,
  };
}
