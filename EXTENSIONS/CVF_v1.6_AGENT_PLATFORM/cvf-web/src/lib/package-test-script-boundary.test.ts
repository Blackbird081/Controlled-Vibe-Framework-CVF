import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * EAFR-R1A static regression.
 *
 * Proves the package.json test-script boundary is extension-complete for
 * every currently tracked live-test file suffix, without importing,
 * requiring, or executing any live test file. Only `fs.readdirSync` /
 * `fs.statSync` directory-entry and filename-string operations are used to
 * enumerate live-test files; no live-test module content is ever loaded.
 */

const CVF_WEB_ROOT = path.resolve(__dirname, "..", "..");
const SRC_ROOT = path.resolve(CVF_WEB_ROOT, "src");
const PACKAGE_JSON_PATH = path.resolve(CVF_WEB_ROOT, "package.json");

const LIVE_TEST_SUFFIX_TS = ".live.test.ts";
const LIVE_TEST_SUFFIX_TSX = ".live.test.tsx";
const LIVE_TEST_MARKER = ".live.test.";

interface PackageScripts {
  "test:run": string;
  "test:coverage": string;
  "test:live": string;
  [key: string]: string;
}

interface PackageJsonShape {
  scripts: PackageScripts;
  [key: string]: unknown;
}

function readPackageJson(): PackageJsonShape {
  const raw = fs.readFileSync(PACKAGE_JSON_PATH, "utf-8");
  return JSON.parse(raw) as PackageJsonShape;
}

/**
 * Enumerate live-test file paths under `src/` by filename string only.
 * This walks directory entries via `fs.readdirSync` and never imports,
 * requires, or executes any discovered file.
 */
function enumerateLiveTestFilenames(dir: string, results: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") {
        continue;
      }
      enumerateLiveTestFilenames(fullPath, results);
      continue;
    }
    if (
      entry.isFile() &&
      entry.name.includes(LIVE_TEST_MARKER)
    ) {
      results.push(fullPath);
    }
  }
  return results;
}

function extensionOf(filename: string): string {
  const markerIndex = filename.lastIndexOf(LIVE_TEST_MARKER);
  return filename.slice(markerIndex + LIVE_TEST_MARKER.length);
}

describe("package.json test-script live-test extension boundary (EAFR-R1A)", () => {
  it("test:run excludes both .live.test.ts and .live.test.tsx", () => {
    const pkg = readPackageJson();
    expect(pkg.scripts["test:run"]).toBe(
      'vitest run --exclude "src/**/*.live.test.ts" --exclude "src/**/*.live.test.tsx"'
    );
  });

  it("test:coverage excludes both .live.test.ts and .live.test.tsx", () => {
    const pkg = readPackageJson();
    expect(pkg.scripts["test:coverage"]).toBe(
      'vitest run --coverage --exclude "src/**/*.live.test.ts" --exclude "src/**/*.live.test.tsx"'
    );
  });

  it("test:live is list-only and cannot execute provider-capable tests", () => {
    const pkg = readPackageJson();
    expect(pkg.scripts["test:live"]).toBe(
      "vitest list --mode live live.test --filesOnly"
    );
  });

  it("enumerates tracked live-test files by filename only, without importing them", () => {
    const liveTestPaths = enumerateLiveTestFilenames(SRC_ROOT);
    // A real regression: there must be at least one live-test file present,
    // otherwise this proof would be vacuous.
    expect(liveTestPaths.length).toBeGreaterThan(0);

    for (const filePath of liveTestPaths) {
      // Filename-string assertion only. This loop never calls import()' or
      // require() on filePath, and never reads live-test file contents.
      const basename = path.basename(filePath);
      expect(basename).toContain(LIVE_TEST_MARKER);
    }
  });

  it("observed live-test extension set is exactly {ts, tsx}, both present", () => {
    const liveTestPaths = enumerateLiveTestFilenames(SRC_ROOT);
    const extensions = new Set(liveTestPaths.map((p) => extensionOf(p)));

    // Prove both extensions are actually present (not a tautology).
    expect(extensions.has("ts")).toBe(true);
    expect(extensions.has("tsx")).toBe(true);

    // Enumeration is marker-based rather than restricted to the two expected
    // suffixes, so a future third live-test extension is visible and fails.
    expect([...extensions].sort()).toEqual(["ts", "tsx"]);
  });

  it("current tracked live-test counts match the post-EAFR-R1D baseline (34 .ts + 1 .tsx)", () => {
    const liveTestPaths = enumerateLiveTestFilenames(SRC_ROOT);
    const tsCount = liveTestPaths.filter((p) => extensionOf(p) === "ts").length;
    const tsxCount = liveTestPaths.filter((p) => extensionOf(p) === "tsx").length;

    expect(tsCount).toBe(34);
    expect(tsxCount).toBe(1);
    expect(liveTestPaths.length).toBe(35);
  });
});
