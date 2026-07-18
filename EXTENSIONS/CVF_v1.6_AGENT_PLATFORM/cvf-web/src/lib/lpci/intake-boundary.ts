import { isAbsolute, relative, resolve, sep } from 'node:path';

export function normalizePath(relativePath: string): string {
  return relativePath
    .replace(/\\/g, '/')
    .replace(/^\/+|\/+$/g, '')
    .toLowerCase();
}

export function resolveCorpusInputPath(inputPath: string, repoRoot: string): string {
  return isAbsolute(inputPath) ? resolve(inputPath) : resolve(repoRoot, inputPath);
}

export function isPathInside(parentPath: string, candidatePath: string): boolean {
  const parent = resolve(parentPath);
  const candidate = resolve(candidatePath);
  const rel = relative(parent, candidate);
  return rel === '' || (!rel.startsWith('..') && !rel.includes(`..${sep}`) && !isAbsolute(rel));
}
