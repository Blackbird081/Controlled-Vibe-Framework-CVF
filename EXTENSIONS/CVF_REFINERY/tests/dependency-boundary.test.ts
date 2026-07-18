import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const srcDir = join(currentDir, "..", "src");

const FORBIDDEN_PATTERN =
  /openai|anthropic\/|\banthropic\(|provider|\bprompt\b|\bagent\b|fetch\(|axios|randomUUID|Date\.now|new Date\(\)|Math\.random/i;

function listTsFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...listTsFiles(full));
    } else if (entry.endsWith(".ts")) {
      files.push(full);
    }
  }
  return files;
}

describe("no-AI / no-provider / determinism dependency boundary", () => {
  it("package.json declares no AI, agent, or provider SDK dependency", () => {
    const pkg = JSON.parse(
      readFileSync(join(currentDir, "..", "package.json"), "utf8"),
    ) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    for (const name of Object.keys(allDeps)) {
      expect(name).not.toMatch(/openai|anthropic|langchain|provider-sdk/i);
    }
  });

  it("no source file references a forbidden AI/network/nondeterministic token", () => {
    const files = listTsFiles(srcDir);
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const content = readFileSync(file, "utf8");
      const match = content.match(FORBIDDEN_PATTERN);
      expect(match, `${file} contains forbidden token: ${match?.[0]}`).toBeNull();
    }
  });
});
