export interface ParsedIntent {
  action: string
  confidence: number
  parameters: Record<string, any>
  simulateOnly?: boolean
}
