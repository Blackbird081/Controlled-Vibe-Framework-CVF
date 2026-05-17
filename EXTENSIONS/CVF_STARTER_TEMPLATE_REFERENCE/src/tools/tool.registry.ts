// @reference-only — This module is not wired into the main execution pipeline.
// src/tools/tool.registry.ts

export interface Tool {
  name: string;
  description: string;
  execute(input: unknown): Promise<unknown>;
}

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  register(tool: Tool): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool ${tool.name} already registered.`);
    }

    this.tools.set(tool.name, tool);
  }

  get(toolName: string): Tool {
    const tool = this.tools.get(toolName);

    if (!tool) {
      throw new Error(`Tool ${toolName} not found.`);
    }

    return tool;
  }

  list(): string[] {
    return Array.from(this.tools.keys());
  }
}
