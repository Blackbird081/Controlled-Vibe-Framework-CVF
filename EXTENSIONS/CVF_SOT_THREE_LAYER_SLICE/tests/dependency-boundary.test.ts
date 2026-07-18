import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const srcDir = join(currentDir, "..", "src");

const FORBIDDEN_TOKEN_PATTERN =
  /openai|anthropic|langchain|\bprompt\(|\bagent[_-]?sdk\b|\bai[_-]?agent\b|fetch\(|axios|randomUUID|Math\.random|\bmongodb\b|\bpostgres\b|\bsqlite\b/i;

// Only forbids the orchestrator *defining* (not calling) a same-named
// business-logic function; the real layer packages' own methods
// (kernel.issueReference, flow.create, etc.) are legitimate calls.
const FORBIDDEN_STAGE_LOGIC_SYMBOLS =
  /\bfunction\s+(?:normalizeFields|computeStatus|admitRequest|computeDecision|issueReceipt|computeReceiptHash|issueReference|computeCurrentReferenceState|supersedeReference|validateRoutingScope|validateDose|isAllowedAcknowledgementTransition)\s*\(/;

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

describe("SOT3-T6 boundary scan", () => {
  it("package.json declares only the three owning package file: dependencies plus local tooling", () => {
    const pkg = JSON.parse(
      readFileSync(join(currentDir, "..", "package.json"), "utf8"),
    ) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };

    expect(pkg.dependencies).toEqual({
      "cvf-refinery": "file:../CVF_REFINERY",
      "cvf-truth-kernel": "file:../CVF_TRUTH_KERNEL",
      "cvf-truth-flow": "file:../CVF_TRUTH_FLOW",
    });

    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    for (const name of Object.keys(allDeps)) {
      expect(name).not.toMatch(/openai|anthropic|langchain|provider-sdk|express|mongodb|pg\b/i);
    }
  });

  it("no source file references a forbidden AI/agent/provider/network/database token", () => {
    const files = listTsFiles(srcDir);
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const content = readFileSync(file, "utf8");
      const match = content.match(FORBIDDEN_TOKEN_PATTERN);
      expect(match, `${file} contains forbidden token: ${match?.[0]}`).toBeNull();
    }
  });

  it("no source file imports a retained legacy root", () => {
    const files = listTsFiles(srcDir);
    const forbidden = /\.private_reference|legacy\//;
    for (const file of files) {
      const content = readFileSync(file, "utf8");
      expect(forbidden.test(content), `${file} imports a retained legacy root`).toBe(false);
    }
  });

  it("no source file reimplements Refinery/Kernel/Flow business-logic symbols", () => {
    const files = listTsFiles(srcDir);
    for (const file of files) {
      const content = readFileSync(file, "utf8");
      const match = content.match(FORBIDDEN_STAGE_LOGIC_SYMBOLS);
      expect(match, `${file} reimplements a layer business-logic symbol: ${match?.[0]}`).toBeNull();
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

  it("orchestrator only imports the three owning packages and local evidence modules", () => {
    const content = readFileSync(join(srcDir, "orchestrator.ts"), "utf8");
    const importLines = content
      .split("\n")
      .filter((line) => line.trim().startsWith("import"));
    const allowedSpecifiers = /^import .* from "(cvf-refinery|cvf-truth-kernel|cvf-truth-flow|\.\/evidence\/canonical-evidence\.js)";?$/;
    for (const line of importLines) {
      expect(allowedSpecifiers.test(line.trim()), `unexpected import: ${line}`).toBe(true);
    }
  });
});
