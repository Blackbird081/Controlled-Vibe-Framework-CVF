#!/usr/bin/env node
import { createCanonicalCvfGateway } from "../canonical.gateway";
import type { CLIOutput } from "../types";

async function main(argv: string[]): Promise<void> {
  const jsonMode = argv.includes("--json");
  const result = await createCanonicalCvfGateway().runAsync(argv);
  writeOutput(result, jsonMode);
  process.exitCode = result.exitCode;
}

function writeOutput(result: CLIOutput, jsonMode: boolean): void {
  if (jsonMode) {
    process.stdout.write(`${JSON.stringify({
      success: result.success,
      exitCode: result.exitCode,
      message: result.message,
      data: result.data ?? null,
    }, null, 2)}\n`);
    return;
  }

  const stream = result.success ? process.stdout : process.stderr;
  stream.write(`${result.message}\n`);
}

main(process.argv.slice(2)).catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : "CVF CLI failed."}\n`);
  process.exitCode = 1;
});
