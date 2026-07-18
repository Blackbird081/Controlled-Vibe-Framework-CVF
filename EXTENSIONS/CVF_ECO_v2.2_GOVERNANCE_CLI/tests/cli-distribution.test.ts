import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("CLI distribution contract", () => {
  it("declares cvf and cvf-guard package binaries", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
      bin?: Record<string, string>;
      scripts?: Record<string, string>;
    };

    expect(pkg.bin).toMatchObject({
      cvf: "dist/src/bin/cvf.js",
      "cvf-guard": "dist/src/bin/cvf.js",
    });
    expect(pkg.scripts?.build).toBe("tsc -p tsconfig.json");
    expect(pkg.scripts?.["smoke:bin"]).toContain("node dist/src/bin/cvf.js help --json");
  });
});
