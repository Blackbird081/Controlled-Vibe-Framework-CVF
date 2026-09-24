import {
  isProviderApiKeyConfiguredFromEnv,
  resolveProviderApiKeyFromEnv,
  resolveProviderApiKeySourceNameFromEnv,
} from './provider-api-key-env';

export const OPENAI_API_KEY_ENV_NAMES = [
  'OPENAI_API_KEY',
  'CVF_OPENAI_API_KEY',
] as const;

export function resolveOpenAIApiKey(
  env: NodeJS.ProcessEnv = process.env,
): string | undefined {
  return resolveProviderApiKeyFromEnv(OPENAI_API_KEY_ENV_NAMES, env);
}

export function resolveOpenAIApiKeySourceName(
  env: NodeJS.ProcessEnv = process.env,
): string | null {
  return resolveProviderApiKeySourceNameFromEnv(OPENAI_API_KEY_ENV_NAMES, env);
}

export function isOpenAIApiKeyConfigured(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return isProviderApiKeyConfiguredFromEnv(OPENAI_API_KEY_ENV_NAMES, env);
}
