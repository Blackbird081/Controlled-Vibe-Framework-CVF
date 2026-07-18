"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LEGACY_GUARD_CLI_CONFIG = exports.DEFAULT_CLI_CONFIG = void 0;
exports.DEFAULT_CLI_CONFIG = {
    version: "2.2.0",
    name: "cvf",
    description: "CVF Canonical CLI Runtime Gateway",
};
exports.LEGACY_GUARD_CLI_CONFIG = {
    ...exports.DEFAULT_CLI_CONFIG,
    name: "cvf-guard",
    description: "CVF Governance CLI — AI agent governance operations",
};
