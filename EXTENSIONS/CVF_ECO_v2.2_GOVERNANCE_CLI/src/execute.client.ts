import { createHmac } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { CLIArgs, CLIOutput } from "./types";

export type FetchLike = (url: string, init: {
  method: string;
  headers: Record<string, string>;
  body: string;
}) => Promise<{
  ok: boolean;
  status: number;
  text(): Promise<string>;
}>;

export interface ExecuteRequestPayload {
  templateId: string;
  templateName: string;
  intent: string;
  inputs: Record<string, unknown>;
  provider?: string;
  model?: string;
  mode?: string;
  requestedRole: string;
  stream?: boolean;
}

const KNOWN_ROLES = new Set([
  "orchestrator", "builder", "reviewer", "ai_agent", "auditor", "designer",
]);

export function parseProviderMap(raw: string): Record<string, string> {
  if (!raw || !raw.trim()) {
    return {};
  }
  const result: Record<string, string> = {};
  const segments = raw.split(",");
  for (const segment of segments) {
    const colonIdx = segment.indexOf(":");
    if (colonIdx < 1) {
      continue;
    }
    const role = segment.slice(0, colonIdx).trim().toLowerCase();
    const provider = segment.slice(colonIdx + 1).trim();
    if (!role || !provider) {
      continue;
    }
    if (!KNOWN_ROLES.has(role)) {
      // Warning only — forward-compatible
      process.stderr.write(`[cvf] Warning: unknown role "${role}" in --providers map. Forwarding anyway.\n`);
    }
    result[role] = provider;
  }
  return result;
}

export function resolveProviderForRole(
  requestedRole: string,
  providerMap: Record<string, string>,
  fallback: string | undefined,
): string | undefined {
  const normalizedRole = requestedRole.toLowerCase();
  if (Object.prototype.hasOwnProperty.call(providerMap, normalizedRole)) {
    return providerMap[normalizedRole];
  }
  return fallback;
}

export function buildExecuteUrl(endpoint: string): string {
  const trimmed = endpoint.replace(/\/+$/, "");
  if (trimmed.endsWith("/api/execute")) {
    return trimmed;
  }
  return `${trimmed}/api/execute`;
}

export function parseExecuteInput(rawInput?: string | boolean): Record<string, unknown> {
  if (!rawInput || rawInput === true) {
    return {};
  }
  try {
    const parsed = JSON.parse(rawInput);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Input JSON must be an object.");
    }
    return parsed as Record<string, unknown>;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid JSON input.";
    throw new Error(`Invalid --input JSON: ${message}`);
  }
}

export function buildExecutePayload(args: CLIArgs): ExecuteRequestPayload {
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

  const globalProvider = stringFlag(args, "provider");
  const rawProvidersFlag = stringFlag(args, "providers");
  const providerMap = rawProvidersFlag ? parseProviderMap(rawProvidersFlag) : {};
  const resolvedProvider = resolveProviderForRole(requestedRole, providerMap, globalProvider);

  return {
    templateId,
    templateName: stringFlag(args, "templateName") || templateId,
    intent,
    inputs: routeInputs,
    provider: resolvedProvider,
    model: stringFlag(args, "model"),
    mode: stringFlag(args, "mode") || "simple",
    requestedRole,
    stream: args.flags.stream === true ? true : undefined,
  };
}

export function buildServiceHeaders(token: string | undefined, body: string, now = Date.now()): Record<string, string> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (!token) {
    return headers;
  }

  const timestamp = String(now);
  headers["x-cvf-service-token"] = token;
  headers["x-cvf-service-timestamp"] = timestamp;
  headers["x-cvf-service-signature"] = createHmac("sha256", token)
    .update(`${timestamp}.${body}`)
    .digest("hex");
  return headers;
}

export async function executeGovernedTemplateCommand(
  args: CLIArgs,
  fetchFn: FetchLike = globalThis.fetch as FetchLike,
): Promise<CLIOutput> {
  let payload: ExecuteRequestPayload;
  try {
    payload = buildExecutePayload(args);
  } catch (error) {
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
  let responseJson: Record<string, unknown> = {};
  try {
    const response = await fetchFn(buildExecuteUrl(endpoint), {
      method: "POST",
      headers,
      body,
    });
    responseText = await response.text();
    responseJson = responseText ? JSON.parse(responseText) as Record<string, unknown> : {};

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
  } catch (error) {
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

export function buildDryRunOutput(payload: ExecuteRequestPayload, headers: Record<string, string>): Record<string, unknown> {
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

export function appendExecuteReceipt(receipt: Record<string, unknown>, receiptPath: string): void {
  const dir = dirname(receiptPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  appendFileSync(receiptPath, JSON.stringify({ timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"), templateId: receipt.templateId, requestedRole: receipt.requestedRole, workflowId: receipt.workflowId ?? null, receiptBinding: receipt.receiptBinding ?? null }) + "\n", "utf8");
}

export function buildCliReceipt(payload: ExecuteRequestPayload, responseJson: Record<string, unknown>): Record<string, unknown> {
  return { templateId: payload.templateId, requestedRole: payload.requestedRole, governanceEvidenceReceipt: responseJson.governanceEvidenceReceipt, workflowId: responseJson.workflowId, stepTraces: Array.isArray(responseJson.stepTraces) ? responseJson.stepTraces : [], receiptBinding: responseJson.receiptBinding, rolePermission: responseJson.rolePermission, providerRouting: responseJson.providerRouting };
}

function stringFlag(args: CLIArgs, name: string): string | undefined {
  const value = args.flags[name];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function isVerbose(args: CLIArgs): boolean {
  return args.flags.verbose === true || args.flags.v === true;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
