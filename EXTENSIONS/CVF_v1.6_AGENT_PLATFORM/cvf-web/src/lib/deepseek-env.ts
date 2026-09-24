import {
  isProviderApiKeyConfiguredFromEnv,
  resolveProviderApiKeyFromEnv,
  resolveProviderApiKeySourceNameFromEnv,
} from './provider-api-key-env';

export const DEEPSEEK_API_KEY_ENV_NAMES = [
  'DEEPSEEK_API_KEY',
  'CVF_BENCHMARK_DEEPSEEK_KEY',
  'CVF_DEEPSEEK_API_KEY',
] as const;

export function resolveDeepSeekApiKey(
  env: NodeJS.ProcessEnv = process.env,
): string | undefined {
  return resolveProviderApiKeyFromEnv(DEEPSEEK_API_KEY_ENV_NAMES, env);
}

export function resolveDeepSeekApiKeySourceName(
  env: NodeJS.ProcessEnv = process.env,
): string | null {
  return resolveProviderApiKeySourceNameFromEnv(DEEPSEEK_API_KEY_ENV_NAMES, env);
}

export function isDeepSeekApiKeyConfigured(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return isProviderApiKeyConfiguredFromEnv(DEEPSEEK_API_KEY_ENV_NAMES, env);
}
