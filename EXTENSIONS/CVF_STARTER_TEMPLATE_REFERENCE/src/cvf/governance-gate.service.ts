// src/cvf/governance-gate.service.ts

import { ExecutionContext } from "../core/execution-context";
import {
  GovernanceRejectedError,
  ProviderNotApprovedError,
  RiskNotClassifiedError,
} from "../core/error.types";

export interface ApprovedModel {
  provider: string;
  model: string;
  maxRisk: "LOW" | "MEDIUM" | "HIGH";
}

export class GovernanceGateService {
  constructor(private readonly approvedModels: ApprovedModel[]) {}

  approve(context: ExecutionContext) {
    if (!context.riskLevel) {
      throw new RiskNotClassifiedError();
    }

    const approved = this.approvedModels.find(
      (m) =>
        m.provider === context.metadata.provider &&
        m.model === context.metadata.model
    );

    if (!approved) {
      throw new ProviderNotApprovedError(
        context.metadata.provider,
        context.metadata.model
      );
    }

    const riskOrder = {
      LOW: 1,
      MEDIUM: 2,
      HIGH: 3,
    };

    if (
      riskOrder[context.riskLevel] >
      riskOrder[approved.maxRisk]
    ) {
      throw new GovernanceRejectedError(
        `Model not allowed for risk level ${context.riskLevel}`
      );
    }

    context.approveGovernance();
  }
}
