// @reference-only — This module is not wired into the main execution pipeline.
// src/version/version-lock.ts

import fs from "fs";

export function loadVersionLock(path: string): string {
  return fs.readFileSync(path, "utf8").trim();
}
