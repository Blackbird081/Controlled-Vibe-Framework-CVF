export enum ReasoningMode {
  STRICT = "STRICT",
  CONTROLLED = "CONTROLLED",
  CREATIVE = "CREATIVE"
}

export function resolveTemperature(mode: ReasoningMode): number {

  switch (mode) {
    case ReasoningMode.STRICT:
      return 0.0
    case ReasoningMode.CONTROLLED:
      return 0.2
    case ReasoningMode.CREATIVE:
      return 0.6
    default:
      return 0.2
  }
}