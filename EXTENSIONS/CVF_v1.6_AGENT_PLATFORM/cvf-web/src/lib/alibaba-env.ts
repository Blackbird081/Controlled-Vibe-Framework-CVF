import {
  isProviderApiKeyConfiguredFromEnv,
  resolveProviderApiKeyFromEnv,
  resolveProviderApiKeySourceNameFromEnv,
} from './provider-api-key-env';

export const ALIBABA_API_KEY_ENV_NAMES = [
  'ALIBABA_API_KEY',
  'DASHSCOPE_API_KEY',
  'CVF_BENCHMARK_ALIBABA_KEY',
  'CVF_ALIBABA_API_KEY',
] as const;

export function resolveAlibabaApiKey(
  env: NodeJS.ProcessEnv = process.env,
): string | undefined {
  return resolveProviderApiKeyFromEnv(ALIBABA_API_KEY_ENV_NAMES, env);
}

export function resolveAlibabaApiKeySourceName(
  env: NodeJS.ProcessEnv = process.env,
): string | null {
  return resolveProviderApiKeySourceNameFromEnv(ALIBABA_API_KEY_ENV_NAMES, env);
}

export function isAlibabaApiKeyConfigured(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return isProviderApiKeyConfiguredFromEnv(ALIBABA_API_KEY_ENV_NAMES, env);
}
