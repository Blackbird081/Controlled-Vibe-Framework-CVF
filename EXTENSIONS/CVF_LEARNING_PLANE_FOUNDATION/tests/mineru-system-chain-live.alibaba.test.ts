import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  MINERU_INTERNAL_SYSTEM_CHAIN_HARNESS_PASS_BOUNDED,
  runMineruInternalSystemChainHarness,
} from "../src/mineru-internal-system-chain-harness";

const DASHSCOPE_URL =
  "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions";
const MODEL = "qwen-turbo";
const KEY_NAMES = [
  "DASHSCOPE_API_KEY",
  "ALIBABA_API_KEY",
  "CVF_ALIBABA_API_KEY",
  "CVF_BENCHMARK_ALIBABA_KEY",
] as const;

function parseEnvLine(line: string): [string, string] | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) return null;
  const normalized = trimmed.startsWith("export ") ? trimmed.slice(7).trim() : trimmed;
  const [key, ...rest] = normalized.split("=");
  const raw = rest.join("=").trim();
  if (!key.trim()) return null;
  const value =
    (raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))
      ? raw.slice(1, -1)
      : raw;
  return [key.trim(), value];
}

function loadLocalEnv(): void {
  const repoRoot = resolve(__dirname, "../../..");
  const envPaths = [
    resolve(repoRoot, "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/.env.local"),
    resolve(repoRoot, "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/.env"),
    resolve(repoRoot, ".env.local"),
    resolve(repoRoot, ".env"),
  ];

  for (const envPath of envPaths) {
    if (!existsSync(envPath)) continue;
    for (const line of readFileSync(envPath, "utf8").split(/\r?\n/g)) {
      const parsed = parseEnvLine(line);
      if (!parsed) continue;
      const [key, value] = parsed;
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

function resolveAlibabaKey(): string {
  loadLocalEnv();
  for (const keyName of KEY_NAMES) {
    const value = process.env[keyName]?.trim();
    if (value) return value;
  }
  throw new Error("missing_dashscope_compatible_live_key");
}

function hasAlibabaKey(): boolean {
  loadLocalEnv();
  return KEY_NAMES.some((keyName) => Boolean(process.env[keyName]?.trim()));
}

async function callAlibabaWithMineruContext(
  apiKey: string,
  context: string,
): Promise<string> {
  const response = await fetch(DASHSCOPE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "Use only MINERU_SYSTEM_CHAIN_CONTEXT. Echo exact governance tokens. " +
            "Do not infer production authorization or public readiness.",
        },
        {
          role: "user",
          content:
            `${context}\n\n` +
            "Reply in exactly three lines:\n" +
            `boundedDisposition=${MINERU_INTERNAL_SYSTEM_CHAIN_HARNESS_PASS_BOUNDED}\n` +
            "heldToken=<copy heldToken exactly>\n" +
            "productionRouteAuthorized=false",
        },
      ],
      temperature: 0,
    }),
  });

  if (!response.ok) {
    throw new Error(`dashscope_http_${response.status}`);
  }

  const body = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return body.choices?.[0]?.message?.content ?? "";
}

describe("MSEA-R40-T1 MinerU system-chain live provider proof", () => {
  (hasAlibabaKey() ? it : it.skip)("uses summary-only MinerU harness context in a live Alibaba response without production release", async () => {
    const apiKey = resolveAlibabaKey();
    const harness = runMineruInternalSystemChainHarness();

    expect(harness.disposition).toBe(
      MINERU_INTERNAL_SYSTEM_CHAIN_HARNESS_PASS_BOUNDED,
    );
    expect(harness.productionRouteAuthorized).toBe(false);
    expect(harness.fileBackedPersistenceUsed).toBe(false);
    expect(harness.mineruRuntimeExecuted).toBe(false);
    expect(harness.privateOutputContentRead).toBe(false);
    expect(harness.retrievalUsed).toBe(false);
    expect(harness.vectorizationUsed).toBe(false);
    expect(harness.providerLiveProofUsed).toBe(false);
    expect(harness.publicRuntimeClaimed).toBe(false);

    const context = [
      "MINERU_SYSTEM_CHAIN_CONTEXT:",
      `- boundedDisposition: ${harness.disposition}`,
      `- sourceDisposition: ${harness.sourceDisposition}`,
      `- heldToken: ${harness.heldToken}`,
      "- productionRouteAuthorized: false",
      "- fileBackedPersistenceUsed: false",
      "- mineruRuntimeExecuted: false",
      "- privateOutputContentRead: false",
      "- retrievalUsed: false",
      "- vectorizationUsed: false",
      "- publicRuntimeClaimed: false",
      "- claimBoundary: bounded live provider proof only; no production Memory/RAG release",
    ].join("\n");

    const output = await callAlibabaWithMineruContext(apiKey, context);

    expect(output).toContain(MINERU_INTERNAL_SYSTEM_CHAIN_HARNESS_PASS_BOUNDED);
    expect(output).toContain(harness.heldToken);
    expect(output).toMatch(/productionRouteAuthorized\s*=\s*false/i);
    expect(output).not.toMatch(/productionRouteAuthorized\s*=\s*true/i);
    expect(output).not.toMatch(/production[- ]ready|public[- ]ready|hosted[- ]ready/i);
  }, 45_000);
});
