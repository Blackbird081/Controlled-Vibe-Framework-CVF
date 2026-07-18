"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArgParser = void 0;
const VALID_COMMANDS = [
    "evaluate", "execute", "run", "skill", "receipt", "trace", "provider",
    "benchmark", "session", "report", "audit", "status", "help", "version",
];
const BOOLEAN_FLAGS = new Set(["stream", "dry-run", "receipt", "verbose", "json", "certified", "count", "help"]);
class ArgParser {
    parse(argv) {
        const args = argv.slice(0);
        const command = this.extractCommand(args);
        const flags = {};
        const positional = [];
        let i = 0;
        while (i < args.length) {
            const arg = args[i];
            if (arg.startsWith("--")) {
                const key = arg.slice(2);
                const eqIdx = key.indexOf("=");
                if (eqIdx >= 0) {
                    flags[key.slice(0, eqIdx)] = key.slice(eqIdx + 1);
                }
                else if (!BOOLEAN_FLAGS.has(key) && i + 1 < args.length && !args[i + 1].startsWith("-")) {
                    flags[key] = args[i + 1];
                    i++;
                }
                else {
                    flags[key] = true;
                }
            }
            else if (arg.startsWith("-") && arg.length === 2) {
                const key = arg.slice(1);
                if (i + 1 < args.length && !args[i + 1].startsWith("-")) {
                    flags[key] = args[i + 1];
                    i++;
                }
                else {
                    flags[key] = true;
                }
            }
            else {
                positional.push(arg);
            }
            i++;
        }
        return { command, flags, positional };
    }
    isValidCommand(cmd) {
        return VALID_COMMANDS.includes(cmd);
    }
    getValidCommands() {
        return [...VALID_COMMANDS];
    }
    extractCommand(args) {
        if (args.length === 0)
            return "help";
        const first = args[0];
        if (this.isValidCommand(first)) {
            args.splice(0, 1);
            return first;
        }
        return "help";
    }
}
exports.ArgParser = ArgParser;
