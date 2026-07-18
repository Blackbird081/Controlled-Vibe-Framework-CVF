"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildExecuteUrl = buildExecuteUrl;
exports.parseExecuteInput = parseExecuteInput;
exports.buildExecutePayload = buildExecutePayload;
exports.buildServiceHeaders = buildServiceHeaders;
exports.executeGovernedTemplateCommand = executeGovernedTemplateCommand;
exports.buildDryRunOutput = buildDryRunOutput;
exports.appendExecuteReceipt = appendExecuteReceipt;
exports.buildCliReceipt = buildCliReceipt;
const node_crypto_1 = require("node:crypto");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
function buildExecuteUrl(endpoint) {
    const trimmed = endpoint.replace(/\/+$/, "");
    if (trimmed.endsWith("/api/execute")) {
        return trimmed;
    }
    return `${trimmed}/api/execute`;
}
function parseExecuteInput(rawInput) {
    if (!rawInput || rawInput === true) {
        return {};
    }
    try {
        const parsed = JSON.parse(rawInput);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            throw new Error("Input JSON must be an object.");
        }
        return parsed;
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Invalid JSON input.";
        throw new Error(`Invalid --input JSON: ${message}`);
    }
}
function buildExecutePayload(args) {
    const templateId = stringFlag(args, "template");
    const requestedRole = stringFlag(args, "role");
    if (!templateId) {
        throw new Error("Missing required --template <id>.");
    }
    if (!requestedRole) {
        throw new Error("Missing required --role <role>.");
    }
    const parsedInput = parseExecuteInput(args.flags.input);
    const routeInputs = isRecord(parsedInput.inputs) ? parsedInput.inputs : parsedInput;
    const intentFromInput = typeof parsedInput.intent === "string" ? parsedInput.intent : undefined;
    const intent = stringFlag(args, "intent") || intentFromInput || `Execute governed template ${templateId}.`;
    return {
        templateId,
        templateName: stringFlag(args, "templateName") || templateId,
        intent,
        inputs: routeInputs,
        provider: stringFlag(args, "provider"),
        model: stringFlag(args, "model"),
        mode: stringFlag(args, "mode") || "simple",
        requestedRole,
        stream: args.flags.stream === true ? true : undefined,
    };
}
function buildServiceHeaders(token, body, now = Date.now()) {
    const headers = {
        "content-type": "application/json",
    };
    if (!token) {
        return headers;
    }
    const timestamp = String(now);
    headers["x-cvf-service-token"] = token;
    headers["x-cvf-service-timestamp"] = timestamp;
    headers["x-cvf-service-signature"] = (0, node_crypto_1.createHmac)("sha256", token)
        .update(`${timestamp}.${body}`)
        .digest("hex");
    return headers;
}
async function executeGovernedTemplateCommand(args, fetchFn = globalThis.fetch) {
    let payload;
    try {
        payload = buildExecutePayload(args);
    }
    catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "Invalid execute arguments.",
            exitCode: 1,
        };
    }
    if (!fetchFn) {
        return {
            success: false,
            message: "No fetch implementation is available for cvf execute.",
            exitCode: 1,
        };
    }
    const endpoint = stringFlag(args, "endpoint") || process.env.CVF_EXECUTE_ENDPOINT || "http://localhost:3000";
    const token = stringFlag(args, "token") || process.env.CVF_SERVICE_TOKEN;
    const body = JSON.stringify(payload);
    const headers = buildServiceHeaders(token, body);
    headers["x-cvf-cli-requested-role"] = payload.requestedRole;
    if (args.flags["dry-run"] === true) {
        const output = buildDryRunOutput(payload, headers);
        return {
            success: true,
            message: JSON.stringify(output, null, isVerbose(args) ? 2 : 0),
            data: output,
            exitCode: 0,
        };
    }
    let responseText = "";
    let responseJson = {};
    try {
        const response = await fetchFn(buildExecuteUrl(endpoint), {
            method: "POST",
            headers,
            body,
        });
        responseText = await response.text();
        responseJson = responseText ? JSON.parse(responseText) : {};
        if (!response.ok || responseJson.success === false) {
            return {
                success: false,
                message: JSON.stringify({
                    status: response.status,
                    error: responseJson.error ?? "Execute route returned a failure response.",
                    response: responseJson,
                }, null, isVerbose(args) ? 2 : 0),
                data: responseJson,
                exitCode: response.status >= 400 ? 1 : 2,
            };
        }
    }
    catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "Execute route call failed.",
            data: responseText ? { rawResponse: responseText } : undefined,
            exitCode: 1,
        };
    }
    const receipt = buildCliReceipt(payload, responseJson);
    if (args.flags.receipt === true || typeof args.flags.receipt === "string") {
        appendExecuteReceipt(receipt, typeof args.flags.receipt === "string" ? args.flags.receipt : "docs/evidence/cvf-execute-receipts.jsonl");
    }
    return {
        success: true,
        message: JSON.stringify(receipt, null, isVerbose(args) ? 2 : 0),
        data: receipt,
        exitCode: 0,
    };
}
function buildDryRunOutput(payload, headers) {
    const safeHeaders = { ...headers };
    delete safeHeaders["x-cvf-service-token"];
    delete safeHeaders["x-cvf-service-signature"];
    return {
        dryRun: true,
        templateId: payload.templateId,
        requestedRole: payload.requestedRole,
        endpoint: "[not sent]",
        payloadShape: Object.keys(payload),
        productOutcomeRuntime: isRecord(payload.inputs.cvfProductOutcomeRuntime)
            ? payload.inputs.cvfProductOutcomeRuntime
            : undefined,
        headerKeys: Object.keys(safeHeaders),
    };
}
function appendExecuteReceipt(receipt, receiptPath) {
    const dir = (0, node_path_1.dirname)(receiptPath);
    if (!(0, node_fs_1.existsSync)(dir))
        (0, node_fs_1.mkdirSync)(dir, { recursive: true });
    (0, node_fs_1.appendFileSync)(receiptPath, JSON.stringify({ timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"), templateId: receipt.templateId, requestedRole: receipt.requestedRole, workflowId: receipt.workflowId ?? null, receiptBinding: receipt.receiptBinding ?? null }) + "\n", "utf8");
}
function buildCliReceipt(payload, responseJson) {
    return { templateId: payload.templateId, requestedRole: payload.requestedRole, governanceEvidenceReceipt: responseJson.governanceEvidenceReceipt, workflowId: responseJson.workflowId, stepTraces: Array.isArray(responseJson.stepTraces) ? responseJson.stepTraces : [], receiptBinding: responseJson.receiptBinding, rolePermission: responseJson.rolePermission, providerRouting: responseJson.providerRouting };
}
function stringFlag(args, name) {
    const value = args.flags[name];
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
function isVerbose(args) {
    return args.flags.verbose === true || args.flags.v === true;
}
function isRecord(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
}
