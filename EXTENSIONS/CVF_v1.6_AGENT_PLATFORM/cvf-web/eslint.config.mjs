import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import js from "@eslint/js";
import globals from "globals";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs.map(config => Object.keys(config).every(key => key === "ignores")
    ? config : { ...config, ignores: [...(config.ignores ?? []), "**/*.cjs"] }),
  {
    // Node --require preload helpers must patch APIs synchronously before app code.
    ...js.configs.recommended,
    files: ["**/*.cjs"],
    languageOptions: { sourceType: "commonjs", globals: globals.node },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".next-cvf-release-gate/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated artifacts
    "coverage/**",
  ]),
]);

export default eslintConfig;
