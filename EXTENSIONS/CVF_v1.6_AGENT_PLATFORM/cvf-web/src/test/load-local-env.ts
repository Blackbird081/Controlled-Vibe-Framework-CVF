import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_ENV_FILES = ['.env.local', '.env'];

function normalizeEnvValue(rawValue: string): string {
  const trimmed = rawValue.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    const unwrapped = trimmed.slice(1, -1);
    return trimmed.startsWith('"') ? unwrapped.replace(/\\n/g, '\n') : unwrapped;
  }

  return trimmed;
}

function parseEnvLine(line: string): [string, string] | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) {
    return null;
  }

  const normalized = trimmed.startsWith('export ') ? trimmed.slice(7).trim() : trimmed;
  const separatorIndex = normalized.indexOf('=');
  if (separatorIndex <= 0) {
    return null;
  }

  const key = normalized.slice(0, separatorIndex).trim();
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
    return null;
  }

  const value = normalizeEnvValue(normalized.slice(separatorIndex + 1));
  return [key, value];
}

export function loadLocalEnvFiles(
  cwd: string = process.cwd(),
  envFiles: string[] = DEFAULT_ENV_FILES,
): string[] {
  const loadedFiles: string[] = [];

  for (const envFile of envFiles) {
    const envPath = path.resolve(cwd, envFile);
    if (!fs.existsSync(envPath)) {
      continue;
    }

    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const parsed = parseEnvLine(line);
      if (!parsed) {
        continue;
      }

      const [key, value] = parsed;
      const currentValue = process.env[key];
      if (currentValue === undefined || currentValue.trim() === '') {
        process.env[key] = value;
      }
    }

    loadedFiles.push(envPath);
  }

  return loadedFiles;
}
