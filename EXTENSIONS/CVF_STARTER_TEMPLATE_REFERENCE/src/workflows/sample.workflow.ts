// src/workflows/sample.workflow.ts

import { CVFOrchestrator, ExecutionInput } from "../cvf/cvf-orchestrator";
import { AIProvider } from "../ai/providers/provider.interface";

export interface SampleWorkflowInput {
  prompt: string;
  requestedBy: string;
  provider: AIProvider;
  model: string;
  projectName: string;
}

export class SampleWorkflow {
  constructor(private readonly orchestrator: CVFOrchestrator) { }

  async run(input: SampleWorkflowInput): Promise<unknown> {
    const executionInput: ExecutionInput = {
      prompt: input.prompt,
      provider: input.provider,
      model: input.model,
      metadata: {
        projectName: input.projectName,
        workflowName: "sample-workflow",
        requestedBy: input.requestedBy,
        provider: input.provider.providerName,
        model: input.model,
        timestamp: Date.now(),
        cvfVersion: "1.0.0",
      },
    };

    return this.orchestrator.run(executionInput);
  }
}
