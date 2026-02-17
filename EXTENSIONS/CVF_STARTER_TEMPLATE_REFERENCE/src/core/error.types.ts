// src/core/error.types.ts

export class CVFError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CVFError";
  }
}

export class RiskNotClassifiedError extends CVFError {
  constructor() {
    super("Risk level has not been classified.");
    this.name = "RiskNotClassifiedError";
  }
}

export class GovernanceRejectedError extends CVFError {
  constructor(reason: string) {
    super(`Governance rejected execution: ${reason}`);
    this.name = "GovernanceRejectedError";
  }
}

export class ProviderNotApprovedError extends CVFError {
  constructor(provider: string, model: string) {
    super(`Model ${model} from provider ${provider} is not approved.`);
    this.name = "ProviderNotApprovedError";
  }
}

export class ValidationFailedError extends CVFError {
  constructor(reason: string) {
    super(`Validation failed: ${reason}`);
    this.name = "ValidationFailedError";
  }
}
