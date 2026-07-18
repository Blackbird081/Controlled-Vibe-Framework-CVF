"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GovernanceCLI = void 0;
const types_1 = require("./types");
const arg_parser_1 = require("./arg.parser");
const command_registry_1 = require("./command.registry");
class GovernanceCLI {
    parser;
    registry;
    config;
    constructor(config = {}) {
        this.config = { ...types_1.DEFAULT_CLI_CONFIG, ...config };
        this.parser = new arg_parser_1.ArgParser();
        this.registry = new command_registry_1.CommandRegistry(this.config);
    }
    run(argv) {
        const args = this.parser.parse(argv);
        return this.registry.execute(args);
    }
    async runAsync(argv) {
        const args = this.parser.parse(argv);
        return this.registry.executeAsync(args);
    }
    getRegistry() {
        return this.registry;
    }
    getParser() {
        return this.parser;
    }
}
exports.GovernanceCLI = GovernanceCLI;
