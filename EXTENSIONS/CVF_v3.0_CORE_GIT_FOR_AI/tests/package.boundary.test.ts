import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

function loadPackageJson() {
    const packageUrl = new URL("../package.json", import.meta.url);
    return JSON.parse(readFileSync(packageUrl, "utf8")) as {
        exports?: Record<string, string>;
        files?: string[];
    };
}

describe("package boundary", () => {
    it("keeps the package surface root-barrel-first", () => {
        const packageJson = loadPackageJson();

        expect(packageJson.exports).toEqual({
            ".": "./index.ts",
        });
    });

    it("ships only the bounded primitive families needed by the root barrel", () => {
        const packageJson = loadPackageJson();

        expect(packageJson.files).toEqual([
            "README.md",
            "index.ts",
            "ai_commit",
            "artifact_staging",
            "artifact_ledger",
            "process_model",
            "skill_lifecycle",
        ]);
    });
});
