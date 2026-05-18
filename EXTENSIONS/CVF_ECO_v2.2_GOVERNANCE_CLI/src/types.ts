export type CLICommand =
  | "evaluate"
  | "execute"
  | "session"
  | "report"
  | "audit"
  | "status"
  | "help"
  | "version";

export interface CLIArgs {
  command: CLICommand;
  flags: Record<string, string | boolean>;
  positional: string[];
}

export interface CLIOutput {
  success: boolean;
  message: string;
  data?: unknown;
  exitCode: number;
}

export interface CLICommandHandler {
  name: CLICommand;
  description: string;
  usage: string;
  execute(args: CLIArgs): CLIOutput;
  executeAsync?(args: CLIArgs): Promise<CLIOutput>;
}

export interface CLIConfig {
  version: string;
  name: string;
  description: string;
}

export const DEFAULT_CLI_CONFIG: CLIConfig = {
  version: "2.2.0",
  name: "cvf-guard",
  description: "CVF Governance CLI — AI agent governance operations",
};
