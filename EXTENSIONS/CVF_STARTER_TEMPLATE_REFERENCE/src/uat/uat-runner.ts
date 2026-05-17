// src/uat/uat-runner.ts

import { CVFOrchestrator, ExecutionInput } from "../cvf/cvf-orchestrator";

export interface UATScenario {
  name: string;
  input: ExecutionInput;
  expectedRisk?: string;
}

export class UATRunner {
  constructor(private readonly orchestrator: CVFOrchestrator) { }

  async run(scenarios: UATScenario[]) {
    const results = [];

    for (const scenario of scenarios) {
      try {
        const result = await this.orchestrator.run(scenario.input);

        results.push({
          scenario: scenario.name,
          status: "PASSED",
          output: result,
        });
      } catch (error) {
        results.push({
          scenario: scenario.name,
          status: "FAILED",
          error: (error as Error).message,
        });
      }
    }

    return results;
  }
}
