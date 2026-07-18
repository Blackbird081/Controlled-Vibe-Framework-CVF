/**
 * Provider Adapter Admission
 *
 * Deterministic, provider-agnostic admission evidence above P4C conformance.
 * This module never calls an adapter, resolves a secret, or performs network IO.
 */

import type {
  ProviderAdapterConformanceReport,
  ProviderAdapterConformanceStatus,
} from "./provider-adapter-conformance";
import type { ProviderCapabilityFile, ProviderMethodName } from "./provider-method-contract";
import {
  findProviderCapability,
  listRegistrySupportedMethods,
  normalizeProviderMethodName,
} from "./provider-method-gate";

export const PROVIDER_ADAPTER_ADMISSION_VERSION =
  "cvf.providerAdapterAdmission.p5a.v1" as const;

export type AdapterAdmissionStatus =
  | "admitted"
  | "blocked"
  | "needs_operator_authorization";

export type AdapterAdmissionReasonCode =
  | "conformance_blocked"
  | "provider_not_in_registry"
  | "model_not_in_registry"
  | "method_not_supported"
  | "credential_metadata_required"
  | "live_execution_not_authorized";

export interface AdapterAdmissionRecord {
  status: AdapterAdmissionStatus;
  providerId: string;
  modelId: string;
  requestedMethod: string;
  normalizedMethod: string;
  supportedMethods: readonly string[];
  conformanceStatus: ProviderAdapterConformanceStatus;
  liveExecutionAuthorized: false;
  reasonCodes: readonly AdapterAdmissionReasonCode[];
  reasons: readonly string[];
  admissionTimestamp: string;
  traceId: string;
}

export interface AdapterAdmissionOptions {
  requireCredentialMetadata?: boolean;
}

export function admitProviderAdapter(
  conformanceReport: ProviderAdapterConformanceReport,
  capabilityRegistry: readonly ProviderCapabilityFile[],
  options: AdapterAdmissionOptions = {},
): AdapterAdmissionRecord {
  const reasonCodes: AdapterAdmissionReasonCode[] = [];
  const reasons: string[] = [];
  const normalizedMethod = normalizeProviderMethodName(conformanceReport.requestedMethod);
  const providerCapability = capabilityRegistry.find(
    (entry) => entry.providerId === conformanceReport.providerId,
  );
  const modelCapability = providerCapability?.models.find(
    (entry) => entry.modelId === conformanceReport.modelId,
  );

  if (conformanceReport.status === "blocked") {
    reasonCodes.push("conformance_blocked");
    reasons.push("p4c_conformance_blocked");
  }

  if (!providerCapability) {
    reasonCodes.push("provider_not_in_registry");
    reasons.push(`provider_not_in_registry:${conformanceReport.providerId}`);
  } else if (!modelCapability) {
    reasonCodes.push("model_not_in_registry");
    reasons.push(
      `model_not_in_registry:${conformanceReport.providerId}/${conformanceReport.modelId}`,
    );
  } else {
    const supportedMethods = listRegistrySupportedMethods(
      capabilityRegistry,
      conformanceReport.providerId,
      conformanceReport.modelId,
    );
    if (!methodIsSupported(supportedMethods, conformanceReport.requestedMethod, normalizedMethod)) {
      reasonCodes.push("method_not_supported");
      reasons.push(
        `method_not_supported:${conformanceReport.requestedMethod}:supported=${supportedMethods.join(",")}`,
      );
    }
  }

  if (options.requireCredentialMetadata && !conformanceReport.adapterExecutionAuthorized) {
    reasonCodes.push("credential_metadata_required");
    reasons.push("credential_metadata_required");
  }

  const supportedMethods = modelCapability
    ? listRegistrySupportedMethods(
      capabilityRegistry,
      conformanceReport.providerId,
      conformanceReport.modelId,
    )
    : [];
  const status = resolveAdmissionStatus(reasonCodes);

  return {
    status,
    providerId: conformanceReport.providerId,
    modelId: conformanceReport.modelId,
    requestedMethod: conformanceReport.requestedMethod,
    normalizedMethod,
    supportedMethods,
    conformanceStatus: conformanceReport.status,
    liveExecutionAuthorized: false,
    reasonCodes,
    reasons,
    admissionTimestamp: buildDeterministicAdmissionTimestamp(conformanceReport),
    traceId: buildDeterministicAdmissionTraceId(conformanceReport, normalizedMethod),
  };
}

function methodIsSupported(
  supportedMethods: readonly ProviderMethodName[],
  requestedMethod: ProviderMethodName,
  normalizedMethod: ProviderMethodName,
): boolean {
  return supportedMethods.includes(requestedMethod)
    || supportedMethods.includes(normalizedMethod)
    || (normalizedMethod === "complete" && supportedMethods.includes("chat"));
}

function resolveAdmissionStatus(
  reasonCodes: readonly AdapterAdmissionReasonCode[],
): AdapterAdmissionStatus {
  if (reasonCodes.includes("credential_metadata_required") && reasonCodes.length === 1) {
    return "needs_operator_authorization";
  }
  return reasonCodes.length === 0 ? "admitted" : "blocked";
}

function buildDeterministicAdmissionTraceId(
  report: ProviderAdapterConformanceReport,
  normalizedMethod: ProviderMethodName,
): string {
  return [
    "p5-admission",
    safeTracePart(report.providerId),
    safeTracePart(report.modelId),
    safeTracePart(normalizedMethod),
    safeTracePart(report.status),
  ].join(":");
}

function buildDeterministicAdmissionTimestamp(
  report: ProviderAdapterConformanceReport,
): string {
  const seed = `${report.providerId}/${report.modelId}/${report.requestedMethod}/${report.status}`;
  const offsetMs = [...seed].reduce((total, char) => total + char.charCodeAt(0), 0) * 1000;
  return new Date(offsetMs).toISOString();
}

function safeTracePart(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "unknown";
}
