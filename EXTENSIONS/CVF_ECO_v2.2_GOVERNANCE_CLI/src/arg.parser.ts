import { CLIArgs, CLICommand } from "./types";

const VALID_COMMANDS: CLICommand[] = [
  "evaluate", "session", "report", "audit", "status", "help", "version",
];

export class ArgParser {
  parse(argv: string[]): CLIArgs {
    const args = argv.slice(0);
    const command = this.extractCommand(args);
    const flags: Record<string, string | boolean> = {};
    const positional: string[] = [];

    let i = 0;
    while (i < args.length) {
      const arg = args[i];

      if (arg.startsWith("--")) {
        const key = arg.slice(2);
        const eqIdx = key.indexOf("=");
        if (eqIdx >= 0) {
          flags[key.slice(0, eqIdx)] = key.slice(eqIdx + 1);
        } else if (i + 1 < args.length && !args[i + 1].startsWith("-")) {
          flags[key] = args[i + 1];
          i++;
        } else {
          flags[key] = true;
        }
      } else if (arg.startsWith("-") && arg.length === 2) {
        const key = arg.slice(1);
        if (i + 1 < args.length && !args[i + 1].startsWith("-")) {
          flags[key] = args[i + 1];
          i++;
        } else {
          flags[key] = true;
        }
      } else {
        positional.push(arg);
      }
      i++;
    }

    return { command, flags, positional };
  }

  isValidCommand(cmd: string): cmd is CLICommand {
    return VALID_COMMANDS.includes(cmd as CLICommand);
  }

  getValidCommands(): CLICommand[] {
    return [...VALID_COMMANDS];
  }

  private extractCommand(args: string[]): CLICommand {
    if (args.length === 0) return "help";
    const first = args[0];
    if (this.isValidCommand(first)) {
      args.splice(0, 1);
      return first;
    }
    return "help";
  }
}
