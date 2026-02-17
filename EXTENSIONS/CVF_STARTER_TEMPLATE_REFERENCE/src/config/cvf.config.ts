// @reference-only — This module is not wired into the main execution pipeline.
// src/config/cvf.config.ts

export interface CVFConfig {
  requireValidationForMediumRisk: boolean;
  enableAudit: boolean;
  enableCostTracking: boolean;
}

export const cvfConfig: CVFConfig = {
  requireValidationForMediumRisk: false,
  enableAudit: true,
  enableCostTracking: true,
};
