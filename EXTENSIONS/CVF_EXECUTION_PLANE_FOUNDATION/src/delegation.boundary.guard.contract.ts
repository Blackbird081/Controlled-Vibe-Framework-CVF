export interface ExecutionDelegationBoundary {
  ownedFiles: string[];
  ownedModules: string[];
  forbiddenPaths: string[];
}

export interface DelegatedWriteBoundaryResult {
  allowed: boolean;
  reason: string;
}

export function evaluateDelegatedWriteBoundary(
  path: string,
  boundary: ExecutionDelegationBoundary,
): DelegatedWriteBoundaryResult {
  const normalizedPath = normalizePath(path);

  if (!normalizedPath) {
    return { allowed: false, reason: "path is required" };
  }

  const forbiddenPath = boundary.forbiddenPaths.find((candidate) =>
    pathMatches(normalizedPath, candidate),
  );
  if (forbiddenPath) {
    return {
      allowed: false,
      reason: `delegated write rejected: ${normalizedPath} is forbidden by ${forbiddenPath}`,
    };
  }

  if (boundary.ownedFiles.some((candidate) => pathMatches(normalizedPath, candidate))) {
    return {
      allowed: true,
      reason: `delegated write allowed: ${normalizedPath} is explicitly owned`,
    };
  }

  if (boundary.ownedModules.some((candidate) => pathWithin(normalizedPath, candidate))) {
    return {
      allowed: true,
      reason: `delegated write allowed: ${normalizedPath} is inside an owned module`,
    };
  }

  return {
    allowed: false,
    reason: `delegated write rejected: ${normalizedPath} is outside delegated ownership`,
  };
}

function normalizePath(path: string): string {
  return path.trim().replace(/\\/g, "/").replace(/^\.\/+/, "");
}

function pathMatches(path: string, candidate: string): boolean {
  const normalizedCandidate = normalizePath(candidate);
  return path === normalizedCandidate || pathWithin(path, normalizedCandidate);
}

function pathWithin(path: string, directory: string): boolean {
  const normalizedDirectory = normalizePath(directory).replace(/\/+$/, "");
  return path === normalizedDirectory || path.startsWith(`${normalizedDirectory}/`);
}
