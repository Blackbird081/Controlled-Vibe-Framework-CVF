import {
  ALIBABA_DASHSCOPE_INTL_ENDPOINT,
  ALIBABA_DASHSCOPE_MAINLAND_ENDPOINT,
} from "./alibaba-free-quota-model-ledger";

// EAFR-R10. This module is the single, gateway-owned source of destination
// classification for both the gateway's own adapters and the cvf-web test
// guard, which already depends on this package. Its behavior canonicalizes
// (does not duplicate) the classification semantics previously local to
// cvf-web's provider-execution-guard.ts: relative paths, loopback hosts, and
// data:/blob:/file: protocols are permitted without provider authority; known
// provider endpoints resolve to their provider identity; everything else,
// including malformed input and external-store or unrecognized hostnames, is
// denied. Provider endpoint data is derived from gateway-owned constants only.

const NON_EGRESS_PROTOCOLS = new Set(["data:", "blob:", "file:"]);

const LOOPBACK_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "[::1]",
  "::1",
  "0.0.0.0",
]);

const GATEWAY_DERIVED_ENDPOINTS: ReadonlyArray<readonly [string, string]> = [
  [ALIBABA_DASHSCOPE_INTL_ENDPOINT, "alibaba"],
  [ALIBABA_DASHSCOPE_MAINLAND_ENDPOINT, "alibaba"],
];

/**
 * Provider hostnames with no gateway endpoint constant to derive from. These
 * are still destination-keyed, never identity-keyed.
 */
const ADDITIONAL_PROVIDER_HOSTS: ReadonlyArray<readonly [string, string]> = [
  ["api.openai.com", "openai"],
  ["api.anthropic.com", "claude"],
  ["generativelanguage.googleapis.com", "gemini"],
  ["openrouter.ai", "openrouter"],
  ["api.deepseek.com", "deepseek"],
];

function hostnameOf(endpoint: string): string | null {
  try {
    return new URL(endpoint).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function buildProviderHosts(): ReadonlyMap<string, string> {
  const hosts = new Map<string, string>();
  for (const [endpoint, provider] of GATEWAY_DERIVED_ENDPOINTS) {
    const hostname = hostnameOf(endpoint);
    if (hostname) hosts.set(hostname, provider);
  }
  for (const [hostname, provider] of ADDITIONAL_PROVIDER_HOSTS) {
    hosts.set(hostname.toLowerCase(), provider);
  }
  return hosts;
}

const PROVIDER_HOSTS = buildProviderHosts();

export type AdapterDestinationDecision =
  | { kind: "permit-non-provider" }
  | { kind: "provider"; provider: string }
  | { kind: "deny"; reason: string };

function parseUrl(input: string): URL | null {
  try {
    return new URL(input);
  } catch {
    return null;
  }
}

/**
 * Classify an adapter or guard destination. Anything that is not positively
 * recognised as a permitted non-provider destination or a known provider
 * endpoint is denied, so an unrecognised hostname can never reach the
 * network. This is the single source of truth for both the gateway adapter
 * and the cvf-web test guard.
 */
export function classifyAdapterDestination(input: string | URL): AdapterDestinationDecision {
  const raw = String(input);
  const url = input instanceof URL ? input : parseUrl(raw);

  if (!url) {
    if (
      (raw.startsWith("/") && !raw.startsWith("//"))
      || raw.startsWith("./")
      || raw.startsWith("../")
    ) {
      return { kind: "permit-non-provider" };
    }
    return { kind: "deny", reason: `unparseable request destination: ${raw}` };
  }

  if (NON_EGRESS_PROTOCOLS.has(url.protocol)) {
    return { kind: "permit-non-provider" };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { kind: "deny", reason: `unsupported protocol ${url.protocol}` };
  }

  const hostname = url.hostname.toLowerCase();

  const provider = PROVIDER_HOSTS.get(hostname);
  if (provider) {
    return { kind: "provider", provider };
  }

  if (LOOPBACK_HOSTNAMES.has(hostname) || hostname.endsWith(".localhost")) {
    return { kind: "permit-non-provider" };
  }

  return {
    kind: "deny",
    reason:
      `unrecognised egress destination ${hostname}; provider egress requires a `
      + "known provider endpoint and an orchestrator grant",
  };
}
