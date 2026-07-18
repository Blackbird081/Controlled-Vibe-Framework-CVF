#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const canonical_gateway_1 = require("../canonical.gateway");
async function main(argv) {
    const jsonMode = argv.includes("--json");
    const result = await (0, canonical_gateway_1.createCanonicalCvfGateway)().runAsync(argv);
    writeOutput(result, jsonMode);
    process.exitCode = result.exitCode;
}
function writeOutput(result, jsonMode) {
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
