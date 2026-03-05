export type CreativityMode = "strict" | "balanced" | "exploratory";

export class CreativeController {
  private mode: CreativityMode = "balanced";

  setMode(mode: CreativityMode) {
    this.mode = mode;
  }

  getMode(): CreativityMode {
    return this.mode;
  }

  adjustRisk(baseRisk: number): number {
    switch (this.mode) {
      case "strict":
        return baseRisk * 0.8;
      case "balanced":
        return baseRisk;
      case "exploratory":
        return baseRisk * 1.2;
      default:
        return baseRisk;
    }
  }
}