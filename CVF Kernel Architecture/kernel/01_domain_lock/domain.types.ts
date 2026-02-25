// domain.types.ts

export type DomainType =
  | "informational"
  | "analytical"
  | "creative"
  | "procedural"
  | "sensitive"
  | "restricted"

export type InputClass =
  | "text"
  | "numeric"
  | "instruction"
  | "mixed"

export type RiskLevel = "low" | "medium" | "high" | "critical"