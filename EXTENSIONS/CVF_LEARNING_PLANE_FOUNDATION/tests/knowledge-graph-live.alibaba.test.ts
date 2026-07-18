import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { evaluateRetrievalRequest } from "../src/memory-retrieval-policy";
import {
  buildKgrStore,
  createKgrNode,
} from "../src/knowledge-graph-store";

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

async function callAlibabaWithKgrContext(apiKey: string, context: string): Promise<string> {
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
            "Use only KGR_CONTEXT. If the answer is not in KGR_CONTEXT, say INSUFFICIENT_CONTEXT.",
        },
        {
          role: "user",
          content:
            `${context}\n\nQuestion: Which exact KGR concept and sourcePath were retrieved? ` +
            "Reply in one sentence and copy selectedName and selectedSourcePath exactly.",
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

describe("KGR1-T5 live provider proof", () => {
  (hasAlibabaKey() ? it : it.skip)("uses KGR graph_search context in a live Alibaba response without raw memory release", async () => {
    const apiKey = resolveAlibabaKey();
    const providerRouting = createKgrNode({
      kind: "concept",
      name: "providerRouting",
      sourcePath: "docs/CVF_ARCHITECTURE_DECISIONS.md",
      description: "KGR concept: deterministic provider routing owner surface.",
      confidence: 0.95,
      governanceTag: "CVF_COMPLIANT",
    });
    const unrelated = createKgrNode({
      kind: "concept",
      name: "unrelatedDraft",
      sourcePath: "docs/draft.md",
      description: "This node must not be selected for providerRouting.",
      confidence: 0.99,
      governanceTag: "PENDING_REVIEW",
    });
    const store = buildKgrStore([unrelated, providerRouting], []);

    const retrieval = evaluateRetrievalRequest(
      {
        method: "graph_search",
        query: "providerRouting",
        scope: "project",
        actorAuthorized: true,
        candidates: [],
        maxResults: 1,
      },
      { kgrStore: store },
    );

    expect(retrieval.status).toBe("allowed");
    expect(retrieval.rawMemoryReleased).toBe(false);
    expect(retrieval.selected).toHaveLength(1);
    expect(retrieval.selected[0]?.summary).toContain("providerRouting");
    expect(retrieval.selected[0]?.summary).toContain("docs/CVF_ARCHITECTURE_DECISIONS.md");

    const kgrContext = [
      "KGR_CONTEXT:",
      "- selectedName: providerRouting",
      "- selectedSourcePath: docs/CVF_ARCHITECTURE_DECISIONS.md",
      `- selectedSummary: ${retrieval.selected[0]?.summary}`,
      `- selectedContent: ${retrieval.selected[0]?.content}`,
      "- rawMemoryReleased: false",
    ].join("\n");
    const output = await callAlibabaWithKgrContext(apiKey, kgrContext);

    expect(output).toContain("providerRouting");
    expect(output).toContain("docs/CVF_ARCHITECTURE_DECISIONS.md");
    expect(output).not.toMatch(/INSUFFICIENT_CONTEXT/i);
  }, 45_000);
});
