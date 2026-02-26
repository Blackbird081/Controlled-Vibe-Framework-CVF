export type LLMProvider = (input: Record<string, unknown>) => Promise<string>

export class LLMAdapter {
  constructor(
    private provider?: LLMProvider,
    private executionToken: symbol = Symbol("kernel_llm_execution_token")
  ) {}

  async generate(
    input: Record<string, unknown>,
    token?: symbol
  ): Promise<string> {
    if (token !== this.executionToken) {
      throw new Error(
        "Direct LLM access blocked: use KernelRuntimeEntrypoint execution path."
      )
    }

    if (this.provider) {
      return this.provider(input)
    }

    const message = typeof input.message === "string" ? input.message : ""
    if (message.length > 0) {
      return `CVF response: ${message}`
    }

    return "CVF response generated."
  }
}
