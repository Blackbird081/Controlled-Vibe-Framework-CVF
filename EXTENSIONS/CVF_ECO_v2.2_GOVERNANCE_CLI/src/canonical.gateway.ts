import { GovernanceCLI } from "./cli";
import { CLIConfig, CLIOutput, DEFAULT_CLI_CONFIG } from "./types";

export const CVF_CANONICAL_RUNTIME_COMMANDS = [
  "run",
  "audit",
  "execute",
  "skill",
  "receipt",
  "trace",
  "provider",
] as const;

export const CVF_READ_ONLY_RUNTIME_COMMANDS = [
  "audit",
  "skill",
  "receipt",
  "trace",
  "provider",
] as const;

export type CVFCanonicalRuntimeCommand = typeof CVF_CANONICAL_RUNTIME_COMMANDS[number];
export type CVFGatewayPrefix = "cvf" | "cvf-guard";

export interface CVFCanonicalGatewayInspection {
  name: "cvf";
  legacyPrefix: "cvf-guard";
  canonicalRuntimeCommands: readonly CVFCanonicalRuntimeCommand[];
  executionCommands: readonly ["run", "execute"];
  readOnlyCommands: typeof CVF_READ_ONLY_RUNTIME_COMMANDS;
  routeOwner: "cvf-web /api/execute";
  providerOwner: "existing provider registries";
  receiptEnvelopeChanged: false;
}

export class CVFCanonicalGateway {
  private readonly cli: GovernanceCLI;

  constructor(config: Partial<CLIConfig> = {}) {
    this.cli = new GovernanceCLI({ ...DEFAULT_CLI_CONFIG, ...config, name: "cvf" });
  }

  run(argv: string[]): CLIOutput {
    return this.cli.run(stripCvfGatewayPrefix(argv));
  }

  async runAsync(argv: string[]): Promise<CLIOutput> {
    return this.cli.runAsync(stripCvfGatewayPrefix(argv));
  }

  inspect(): CVFCanonicalGatewayInspection {
    return {
      name: "cvf",
      legacyPrefix: "cvf-guard",
      canonicalRuntimeCommands: CVF_CANONICAL_RUNTIME_COMMANDS,
      executionCommands: ["run", "execute"],
      readOnlyCommands: CVF_READ_ONLY_RUNTIME_COMMANDS,
      routeOwner: "cvf-web /api/execute",
      providerOwner: "existing provider registries",
      receiptEnvelopeChanged: false,
    };
  }

  getGovernanceCLI(): GovernanceCLI {
    return this.cli;
  }
}

export function stripCvfGatewayPrefix(argv: string[]): string[] {
  const [first, ...rest] = argv;
  if (first === "cvf" || first === "cvf-guard") {
    return rest;
  }
  return argv;
}

export function createCanonicalCvfGateway(config: Partial<CLIConfig> = {}): CVFCanonicalGateway {
  return new CVFCanonicalGateway(config);
}
