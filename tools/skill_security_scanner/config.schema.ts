// /governance/security_scanner/config.schema.ts

export type ScannerSeverity =
  | 'safe'
  | 'low'
  | 'medium'
  | 'high'
  | 'critical'

export interface SecurityScannerThresholds {
  low: number
  medium: number
  high: number
  critical: number
}

export interface SecurityScannerConfig {
  /**
   * Enable or disable static skill scanning
   */
  enabled: boolean

  /**
   * If true, skill import will be blocked
   * when severity === 'critical'
   */
  blockOnCritical: boolean

  /**
   * Optional max allowed score.
   * If exceeded, scanner returns blocked state.
   */
  maxAllowedScore?: number

  /**
   * Optional webhook for alerts (future extension)
   */
  alertWebhook?: string

  /**
   * Risk classification thresholds
   */
  thresholds: SecurityScannerThresholds
}

/**
 * Default configuration (safe baseline)
 */
export const defaultSecurityScannerConfig: SecurityScannerConfig = {
  enabled: true,
  blockOnCritical: true,
  maxAllowedScore: 100,
  alertWebhook: undefined,
  thresholds: {
    low: 20,
    medium: 40,
    high: 60,
    critical: 80
  }
}