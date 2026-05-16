export type GatewayRiskClass = "low" | "medium" | "high" | "critical";

export type ProviderStatus = "enabled" | "disabled" | "experimental";

export interface ProviderModel {
  id: string;
  displayName?: string;
  riskClass: GatewayRiskClass;
  maxContextTokens?: number;
  supportsStreaming?: boolean;
  metadata?: Record<string, unknown>;
}

export interface ProviderRecord {
  id: string;
  displayName: string;
  status: ProviderStatus;
  riskClass: GatewayRiskClass;
  models: ProviderModel[];
  credentialKeyIds?: string[];
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface ProviderSelectionOptions {
  allowExperimental?: boolean;
  allowedProviderIds?: string[];
  blockedProviderIds?: string[];
}

export class ProviderRegistry {
  private readonly providers = new Map<string, ProviderRecord>();

  constructor(records: ProviderRecord[] = []) {
    records.forEach((record) => this.register(record));
  }

  register(record: ProviderRecord): ProviderRecord {
    if (!record.id.trim()) {
      throw new Error("provider_id_required");
    }
    if (!record.models.length) {
      throw new Error(`provider_has_no_models:${record.id}`);
    }

    this.providers.set(record.id, {
      ...record,
      models: record.models.map((model) => ({ ...model })),
    });
    return this.get(record.id)!;
  }

  get(providerId: string): ProviderRecord | undefined {
    const record = this.providers.get(providerId);
    if (!record) {
      return undefined;
    }
    return {
      ...record,
      models: record.models.map((model) => ({ ...model })),
    };
  }

  listAll(): ProviderRecord[] {
    return Array.from(this.providers.keys()).map((id) => this.get(id)!);
  }

  listRoutable(options: ProviderSelectionOptions = {}): ProviderRecord[] {
    return this.listAll().filter((record) => this.isRoutable(record.id, options));
  }

  isRoutable(providerId: string, options: ProviderSelectionOptions = {}): boolean {
    const record = this.providers.get(providerId);
    if (!record) {
      return false;
    }
    if (options.blockedProviderIds?.includes(providerId)) {
      return false;
    }
    if (options.allowedProviderIds && !options.allowedProviderIds.includes(providerId)) {
      return false;
    }
    if (record.status === "disabled") {
      return false;
    }
    if (record.status === "experimental" && !options.allowExperimental) {
      return false;
    }
    return true;
  }

  findModel(providerId: string, modelId: string): ProviderModel | undefined {
    return this.providers.get(providerId)?.models.find((model) => model.id === modelId);
  }

  assertAllowed(
    providerId: string,
    modelId?: string,
    options: ProviderSelectionOptions = {},
  ): ProviderRecord {
    const record = this.providers.get(providerId);
    if (!record) {
      throw new Error(`provider_not_registered:${providerId}`);
    }
    if (!this.isRoutable(providerId, options)) {
      throw new Error(`provider_not_routable:${providerId}:${record.status}`);
    }
    if (modelId && !this.findModel(providerId, modelId)) {
      throw new Error(`model_not_registered:${providerId}:${modelId}`);
    }
    return this.get(providerId)!;
  }
}
