import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        include: ["tests/**/*.test.ts"],
        coverage: {
            provider: "v8",
            include: [
                "ai_commit/**/*.ts",
                "artifact_staging/**/*.ts",
                "artifact_ledger/**/*.ts",
                "process_model/**/*.ts",
            ],
            exclude: ["**/index.ts", "**/*.schema.ts"],
            thresholds: {
                statements: 90,
                branches: 80,
                functions: 90,
                lines: 90,
            },
        },
    },
});
