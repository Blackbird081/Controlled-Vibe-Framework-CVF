// @reference-only — This module is not wired into the main execution pipeline.
// src/cvf/model-autoscale.service.ts

export interface AutoscaleConfig {
  tokenThreshold: number;
  downgradeModel: string;
}

const DEFAULT_CONFIGS: Record<string, AutoscaleConfig> = {
  "gpt-4o": { tokenThreshold: 15000, downgradeModel: "gpt-4o-mini" },
  "gpt-4.1": { tokenThreshold: 15000, downgradeModel: "gpt-4o-mini" },
  "claude-3-5-sonnet": { tokenThreshold: 15000, downgradeModel: "claude-3-haiku" },
  "gemini-1.5-pro": { tokenThreshold: 15000, downgradeModel: "gemini-1.5-flash" },
};

export class ModelAutoscaleService {
  private configs: Record<string, AutoscaleConfig>;

  constructor(configs?: Record<string, AutoscaleConfig>) {
    this.configs = configs || DEFAULT_CONFIGS;
  }

  downgradeIfNeeded(currentModel: string, tokens: number): string {
    const config = this.configs[currentModel];

    if (config && tokens > config.tokenThreshold) {
      return config.downgradeModel;
    }

    return currentModel;
  }

  registerConfig(model: string, config: AutoscaleConfig) {
    this.configs[model] = config;
  }
}
