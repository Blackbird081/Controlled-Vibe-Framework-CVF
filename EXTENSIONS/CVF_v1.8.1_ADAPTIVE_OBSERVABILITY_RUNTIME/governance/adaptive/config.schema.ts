export interface AdaptiveConfig {
  enabled: boolean
  thresholds: {
    strict: number
    throttle: number
    block: number
  }
}