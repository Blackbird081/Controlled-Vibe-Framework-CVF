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
      if (name === "cvf-truth-kernel") continue;
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

  it("no source file constructs an unparameterized new Date() (global wall clock)", () => {
    const files = listTsFiles(srcDir);
    const zeroArgDatePattern = /new\s+Date\s*\(\s*\)/;
    for (const file of files) {
      const content = readFileSync(file, "utf8");
      expect(zeroArgDatePattern.test(content), `${file} calls new Date() with no arguments`).toBe(false);
    }
  });

  it("no source file outside kernel-reference/ imports or declares KernelDecision, TruthReceipt, or TruthReference as a runtime/type symbol", () => {
    // Matches only import specifiers and type/value usage positions, not
    // prose inside doc comments explaining the contract boundary in
    // English (for example "derives only from a bound TruthReference").
    const files = listTsFiles(srcDir).filter((file) => !file.replace(/\\/g, "/").includes("/kernel-reference/"));
    const forbidden = /\b(?:import\s+type\s*\{[^}]*\b(?:KernelDecision|TruthReceipt|TruthReference)\b|:\s*(?:KernelDecision|TruthReceipt|TruthReference)\b)/;
    for (const file of files) {
      const content = readFileSync(file, "utf8")
        .split("\n")
        .filter((line) => !line.trim().startsWith("*") && !line.trim().startsWith("//"))
        .join("\n");
      const match = content.match(forbidden);
      expect(match, `${file} imports or types against a Kernel authority symbol outside kernel-reference/: ${match?.[0]}`).toBeNull();
    }
  });

  it("no source file mentions RefineryPacket (no embedded second Refinery producer)", () => {
    const files = listTsFiles(srcDir);
    const forbidden = /RefineryPacket/;
    for (const file of files) {
      const content = readFileSync(file, "utf8");
      const match = content.match(forbidden);
      expect(match, `${file} references RefineryPacket: ${match?.[0]}`).toBeNull();
    }
  });
});
