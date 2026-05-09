import type { SimulationContext } from "../types/index"
import { SimulationEngine } from "./simulation.engine"

export class ReplayService {
  constructor(private simulationEngine: SimulationEngine) {}

  async replay(proposalId: string, policyVersion: string) {
    const context: SimulationContext = {
      proposalId,
      policyVersion,
      simulateOnly: true,
    }

    return this.simulationEngine.simulate(context)
  }
}
