/**
 * PhaseContext
 *
 * Maintains runtime context for a development phase.
 * Tracks current stage and component identity.
 */

import { PhaseStage } from "./phase.protocol";

export class PhaseContext {
  private componentName: string;
  private stage: PhaseStage;

  constructor(componentName: string) {
    this.componentName = componentName;
    this.stage = "SPEC";
  }

  public getComponent(): string {
    return this.componentName;
  }

  public getStage(): PhaseStage {
    return this.stage;
  }

  public setStage(stage: PhaseStage): void {
    this.stage = stage;
  }

  public reset(): void {
    this.stage = "SPEC";
  }
}