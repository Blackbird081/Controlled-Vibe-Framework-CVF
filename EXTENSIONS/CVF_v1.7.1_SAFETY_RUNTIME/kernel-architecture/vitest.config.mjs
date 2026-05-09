import { dirname } from "path"
import { fileURLToPath } from "url"

const projectRoot = dirname(fileURLToPath(import.meta.url))
const toPosix = (path) => path.replace(/\\/g, "/")

const coverageScopeIncludes = [
  `${projectRoot}/kernel/**/*.ts`,
  `${projectRoot}/runtime/**/*.ts`,
  `${projectRoot}/internal_ledger/**/*.ts`
].map(toPosix)

const coreThresholdPatterns = [
  "**/runtime/execution_orchestrator.ts",
  "**/runtime/kernel_runtime_entrypoint.ts",
  "**/runtime/llm_adapter.ts",
  "**/kernel/01_domain_lock/domain_guard.ts",
  "**/kernel/02_contract_runtime/contract_runtime_engine.ts",
  "**/kernel/03_contamination_guard/risk_scorer.ts",
  "**/kernel/04_refusal_router/refusal.router.ts"
]

const coreThreshold = {
  statements: 90,
  branches: 90,
  functions: 90,
  lines: 90
}

export default {
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    coverage: {
      provider: "v8",
      allowExternal: true,
      include: coverageScopeIncludes,
      exclude: [
        "tests/**",
        "**/*.d.ts",
        "**/golden/**",
        "**/*.types.ts",
        "**/*.schema.ts",
        "**/domain_context_object.ts",
        "**/refusal.registry.ts"
      ],
      reporter: ["text", "json-summary"],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
        ...Object.fromEntries(
          coreThresholdPatterns.map((file) => [file, { ...coreThreshold }])
        )
      }
    }
  }
}
