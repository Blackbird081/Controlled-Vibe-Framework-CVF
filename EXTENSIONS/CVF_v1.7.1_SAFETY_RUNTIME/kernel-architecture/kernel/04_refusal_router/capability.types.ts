export type Capability =
  | "read"
  | "write"
  | "execute"
  | "network"
  | "system"

export interface CapabilityRequest {
  capability: Capability
  source: string
  target?: string
}