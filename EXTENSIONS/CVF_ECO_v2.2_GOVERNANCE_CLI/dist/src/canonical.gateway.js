"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CVFCanonicalGateway = exports.CVF_READ_ONLY_RUNTIME_COMMANDS = exports.CVF_CANONICAL_RUNTIME_COMMANDS = void 0;
exports.stripCvfGatewayPrefix = stripCvfGatewayPrefix;
exports.createCanonicalCvfGateway = createCanonicalCvfGateway;
const cli_1 = require("./cli");
const types_1 = require("./types");
exports.CVF_CANONICAL_RUNTIME_COMMANDS = [
    "run",
    "audit",
    "execute",
    "skill",
    "receipt",
    "trace",
    "provider",
];
exports.CVF_READ_ONLY_RUNTIME_COMMANDS = [
    "audit",
    "skill",
    "receipt",
    "trace",
    "provider",
];
class CVFCanonicalGateway {
    cli;
    constructor(config = {}) {
        this.cli = new cli_1.GovernanceCLI({ ...types_1.DEFAULT_CLI_CONFIG, ...config, name: "cvf" });
    }
    run(argv) {
        return this.cli.run(stripCvfGatewayPrefix(argv));
    }
    async runAsync(argv) {
        return this.cli.runAsync(stripCvfGatewayPrefix(argv));
    }
    inspect() {
        return {
            name: "cvf",
            legacyPrefix: "cvf-guard",
            canonicalRuntimeCommands: exports.CVF_CANONICAL_RUNTIME_COMMANDS,
            executionCommands: ["run", "execute"],
            readOnlyCommands: exports.CVF_READ_ONLY_RUNTIME_COMMANDS,
            routeOwner: "cvf-web /api/execute",
            providerOwner: "existing provider registries",
            receiptEnvelopeChanged: false,
        };
    }
    getGovernanceCLI() {
        return this.cli;
    }
}
exports.CVFCanonicalGateway = CVFCanonicalGateway;
function stripCvfGatewayPrefix(argv) {
    const [first, ...rest] = argv;
    if (first === "cvf" || first === "cvf-guard") {
        return rest;
    }
    return argv;
}
function createCanonicalCvfGateway(config = {}) {
    return new CVFCanonicalGateway(config);
}
