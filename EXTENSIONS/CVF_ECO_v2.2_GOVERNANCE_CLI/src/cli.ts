import { CLIConfig, CLIOutput, DEFAULT_CLI_CONFIG } from "./types";
import { ArgParser } from "./arg.parser";
import { CommandRegistry } from "./command.registry";

export class GovernanceCLI {
  private parser: ArgParser;
  private registry: CommandRegistry;
  private config: CLIConfig;

  constructor(config: Partial<CLIConfig> = {}) {
    this.config = { ...DEFAULT_CLI_CONFIG, ...config };
    this.parser = new ArgParser();
    this.registry = new CommandRegistry(this.config);
  }

  run(argv: string[]): CLIOutput {
    const args = this.parser.parse(argv);
    return this.registry.execute(args);
  }

  getRegistry(): CommandRegistry {
    return this.registry;
  }

  getParser(): ArgParser {
    return this.parser;
  }
}
