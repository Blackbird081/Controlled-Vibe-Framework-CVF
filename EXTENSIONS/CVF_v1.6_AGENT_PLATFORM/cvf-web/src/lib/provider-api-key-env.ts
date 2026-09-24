interface ProviderApiKeyLookup {
  value: string;
  sourceName: string;
}

function findProviderApiKeyInEnv(
  envNames: readonly string[],
  env: NodeJS.ProcessEnv,
): ProviderApiKeyLookup | undefined {
  for (const envName of envNames) {
    const raw = env[envName];
    if (typeof raw === 'string' && raw.trim()) {
      return { value: raw.trim(), sourceName: envName };
    }
  }

  return undefined;
}

export function resolveProviderApiKeyFromEnv(
  envNames: readonly string[],
  env: NodeJS.ProcessEnv,
): string | undefined {
  return findProviderApiKeyInEnv(envNames, env)?.value;
}

export function resolveProviderApiKeySourceNameFromEnv(
  envNames: readonly string[],
  env: NodeJS.ProcessEnv,
): string | null {
  return findProviderApiKeyInEnv(envNames, env)?.sourceName ?? null;
}

export function isProviderApiKeyConfiguredFromEnv(
  envNames: readonly string[],
  env: NodeJS.ProcessEnv,
): boolean {
  return typeof resolveProviderApiKeyFromEnv(envNames, env) === 'string';
}
