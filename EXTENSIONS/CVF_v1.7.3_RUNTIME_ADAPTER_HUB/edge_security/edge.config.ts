export interface EdgeSecurityConfig {
  enablePIIMasking: boolean
  enableSecretMasking: boolean
  enableInjectionPrecheck: boolean
  enableAuditLog: boolean
  maskingTokenPrefix: string
}

export const defaultEdgeSecurityConfig: EdgeSecurityConfig = {
  enablePIIMasking: true,
  enableSecretMasking: true,
  enableInjectionPrecheck: true,
  enableAuditLog: true,
  maskingTokenPrefix: "__CVF_MASK__"
}