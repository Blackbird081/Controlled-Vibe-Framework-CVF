// /governance/security_scanner/rule.registry.ts

import { ScannerSeverity } from './config.schema'

export interface SecurityRule {
  id: string
  description: string
  pattern?: RegExp
  weight: number
  severity: ScannerSeverity
  category: 'injection' | 'exfiltration' | 'execution' | 'obfuscation' | 'network'
}

export const securityRules: SecurityRule[] = [
  {
    id: 'prompt_ignore_previous',
    description: 'Attempt to ignore previous/system instructions',
    pattern: /ignore\s+(all\s+)?previous\s+instructions?/i,
    weight: 25,
    severity: 'medium',
    category: 'injection'
  },
  {
    id: 'override_system_prompt',
    description: 'Attempt to override system prompt',
    pattern: /override\s+(the\s+)?system\s+prompt/i,
    weight: 30,
    severity: 'high',
    category: 'injection'
  },
  {
    id: 'secret_exfiltration',
    description: 'Possible secret or key exfiltration pattern',
    pattern: /(api[_-]?key|secret|token|password).{0,20}(send|upload|post|exfiltrate)/i,
    weight: 50,
    severity: 'critical',
    category: 'exfiltration'
  },
  {
    id: 'dangerous_cli_execution',
    description: 'Potential shell or command execution',
    pattern: /(rm\s+-rf|curl\s+http|wget\s+http|bash\s+-c|sh\s+-c)/i,
    weight: 40,
    severity: 'high',
    category: 'execution'
  },
  {
    id: 'suspicious_external_url',
    description: 'Suspicious external URL reference',
    pattern: /(http:\/\/|https:\/\/).{0,100}/i,
    weight: 15,
    severity: 'low',
    category: 'network'
  }
]

/**
 * Helper to get rule by id
 */
export function getRuleById(id: string): SecurityRule | undefined {
  return securityRules.find(rule => rule.id === id)
}