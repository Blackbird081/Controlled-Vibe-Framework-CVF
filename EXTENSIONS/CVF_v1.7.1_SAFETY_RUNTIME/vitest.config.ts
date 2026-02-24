import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
    test: {
        globals: true,
        include: ["**/*.test.ts"],
        coverage: {
            provider: "v8",
            include: ["core/**", "policy/**", "ai/**", "simulation/**", "adapters/**"],
        },
    },
    resolve: {
        alias: {
            "@cvf/types": path.resolve(__dirname, "./types/index.ts"),
        },
    },
})
