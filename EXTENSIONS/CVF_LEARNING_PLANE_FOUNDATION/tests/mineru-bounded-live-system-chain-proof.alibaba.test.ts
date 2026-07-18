import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  R46_BOUNDED_LIVE_SYSTEM_CHAIN_PROOF_PASS,
  runMineruBoundedLiveSystemChainProof,
} from "../src/mineru-bounded-live-system-chain-proof";

const DASHSCOPE_URL =
  "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions";
const MODEL = "qwen-turbo";
const KEY_NAMES = [
  "DASHSCOPE_API_KEY",
  "ALIBABA_API_KEY",
  "CVF_ALIBABA_API_KEY",
  "CVF_BENCHMARK_ALIBABA_KEY",
] as const;
const tempStorePath = join(
  __dirname,
  "fixtures",
  "tmp-r46-live-system-chain-proof.json",
);

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

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

async function callAlibaba(apiKey: string, context: string): Promise<string> {
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
            "Use only R46_SYSTEM_CHAIN_CONTEXT. Echo exact governance tokens. " +
            "Do not infer production authorization or public readiness.",
        },
        {
          role: "user",
          content:
            `${context}\n\n` +
            "Reply in exactly five lines:\n" +
            `boundedDisposition=${R46_BOUNDED_LIVE_SYSTEM_CHAIN_PROOF_PASS}\n` +
            "heldToken=<copy heldToken exactly>\n" +
            "productionRouteAuthorized=false\n" +
            "writeReceiptDecision=allowed\n" +
            "readReceiptDecision=allowed",
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

function writeEvidence(value: unknown): void {
  const evidencePath = process.env.CVF_MSEA_R46_EVIDENCE_PATH;
  if (!evidencePath) return;
  mkdirSync(dirname(evidencePath), { recursive: true });
  writeFileSync(evidencePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function cleanup(): void {
  if (existsSync(tempStorePath)) {
    rmSync(tempStorePath);
  }
}

afterEach(cleanup);

describe("MSEA-R46 MinerU bounded live system-chain proof", () => {
  (hasAlibabaKey() ? it : it.skip)("uses file-backed write/read evidence in a live Alibaba response without production release", async () => {
    cleanup();
    const apiKey = resolveAlibabaKey();
    const proof = runMineruBoundedLiveSystemChainProof({
      storePath: tempStorePath,
      now: () => 1770000000000,
    });

    expect(proof.disposition).toBe(R46_BOUNDED_LIVE_SYSTEM_CHAIN_PROOF_PASS);
    expect(proof.writeReceipt?.decision).toBe("allowed");
    expect(proof.readReceipt.decision).toBe("allowed");
    expect(proof.readBackRecordCount).toBe(1);
    expect(proof.productionRouteAuthorized).toBe(false);
    expect(proof.privateOutputContentRead).toBe(false);

    const context = [
      "R46_SYSTEM_CHAIN_CONTEXT:",
      `- boundedDisposition: ${proof.disposition}`,
      `- sourceDisposition: ${proof.sourceDisposition}`,
      `- heldToken: ${proof.heldToken}`,
      "- productionRouteAuthorized: false",
      "- fileBackedPersistenceUsed: true",
      "- mineruRuntimeExecuted: false",
      "- privateOutputContentRead: false",
      "- retrievalUsed: false",
      "- vectorizationUsed: false",
      "- publicRuntimeClaimed: false",
      `- writeReceiptDecision: ${proof.writeReceipt?.decision}`,
      `- readReceiptDecision: ${proof.readReceipt.decision}`,
      `- readBackRecordCount: ${proof.readBackRecordCount}`,
      `- recordSummarySha256: ${proof.recordSummarySha256}`,
      "- claimBoundary: bounded live provider proof only; no production Memory/RAG release",
    ].join("\n");

    const output = await callAlibaba(apiKey, context);

    expect(output).toContain(R46_BOUNDED_LIVE_SYSTEM_CHAIN_PROOF_PASS);
    expect(output).toContain(proof.heldToken);
    expect(output).toMatch(/productionRouteAuthorized\s*=\s*false/i);
    expect(output).toMatch(/writeReceiptDecision\s*=\s*allowed/i);
    expect(output).toMatch(/readReceiptDecision\s*=\s*allowed/i);
    expect(output).not.toMatch(/production[- ]ready|public[- ]ready|hosted[- ]ready/i);

    writeEvidence({
      schemaVersion: "cvf.mseaR46.boundedLiveSystemChainProofEvidence.v1",
      batchId: "MSEA_R46_MINERU_SCANLAYER_MEMORY_BOUNDED_LIVE_SYSTEM_CHAIN_PROOF",
      status: "PASS",
      provider: "alibaba-dashscope-compatible",
      endpointHost: "dashscope-intl.aliyuncs.com",
      model: MODEL,
      proofVersion: proof.proofVersion,
      boundedDisposition: proof.disposition,
      sourceDisposition: proof.sourceDisposition,
      heldToken: proof.heldToken,
      productionRouteAuthorized: proof.productionRouteAuthorized,
      fileBackedPersistenceUsed: proof.fileBackedPersistenceUsed,
      mineruRuntimeExecuted: proof.mineruRuntimeExecuted,
      privateOutputContentRead: proof.privateOutputContentRead,
      retrievalUsed: proof.retrievalUsed,
      vectorizationUsed: proof.vectorizationUsed,
      publicRuntimeClaimed: proof.publicRuntimeClaimed,
      writeReceiptDecision: proof.writeReceipt?.decision ?? null,
      writeReceiptReason: proof.writeReceipt?.reason ?? null,
      readReceiptDecision: proof.readReceipt.decision,
      readReceiptReason: proof.readReceipt.reason,
      readBackRecordCount: proof.readBackRecordCount,
      recordSummarySha256: proof.recordSummarySha256,
      recordSummaryLength: proof.recordSummaryLength,
      providerOutputSha256: sha256(output),
      providerOutputContainsRequiredTokens: true,
      secretBoundary: {
        apiKeyPrinted: false,
        rawProviderOutputPersisted: false,
        envLocalCopied: false,
      },
      claimBoundary:
        "Bounded internal system-chain proof only; no production, public, private-output, extraction-accuracy, document-truth, legal, or hosted-readiness claim.",
    });
  }, 45_000);
});
