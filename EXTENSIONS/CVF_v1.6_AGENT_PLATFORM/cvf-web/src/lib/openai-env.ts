export const OPENAI_API_KEY_ENV_NAMES = [
  'OPENAI_API_KEY',
  'CVF_OPENAI_API_KEY',
] as const;

export function resolveOpenAIApiKey(
  env: NodeJS.ProcessEnv = process.env,
): string | undefined {
  for (const envName of OPENAI_API_KEY_ENV_NAMES) {
    const raw = env[envName];
    if (typeof raw === 'string' && raw.trim()) {
      return raw.trim();
    }
  }

  return undefined;
}

export function resolveOpenAIApiKeySourceName(
  env: NodeJS.ProcessEnv = process.env,
): string | null {
  for (const envName of OPENAI_API_KEY_ENV_NAMES) {
    const raw = env[envName];
    if (typeof raw === 'string' && raw.trim()) {
      return envName;
    }
  }

  return null;
}

export function isOpenAIApiKeyConfigured(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return typeof resolveOpenAIApiKey(env) === 'string';
}
