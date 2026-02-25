export interface ProviderResponse {
  content: string
  tokensUsed?: number
}

export interface ProviderAdapter {
  name: string
  sendMessage(prompt: string): Promise<ProviderResponse>
}

const providers: Record<string, ProviderAdapter> = {}

export function registerProvider(adapter: ProviderAdapter) {
  providers[adapter.name] = adapter
}

export function getProvider(name: string): ProviderAdapter {
  const provider = providers[name]
  if (!provider) {
    throw new Error(`Provider ${name} not registered`)
  }
  return provider
}