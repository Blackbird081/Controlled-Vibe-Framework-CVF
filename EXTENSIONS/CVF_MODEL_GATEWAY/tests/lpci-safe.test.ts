// LPCI1-WEB-R1 - package-safe Model Gateway entry regression proof.
//
// Proves that src/lpci-safe.ts exports exactly the symbols the LPCI query
// route and provider binding use, that those symbols are the same runtime
// values as the package root barrel exposes (no behavior fork), and that
// the safe entry's own source contains no monorepo-relative import outside
// this package (the exact failure class this repair fixes). Does not
// duplicate per-symbol behavior coverage already proven by
// credential-boundary.test.ts, provider-execution-bridge.test.ts,
// gateway-receipt.test.ts, and the other focused suites for these owners.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  CredentialBoundary,
  createCredentialBoundOpenAiCompatibleExecuteAdapter,
  GatewayReceiptBuilder,
  PROVIDER_CAPABILITY_REGISTRY,
  ProviderExecutionBridge,
  ProviderHealthMonitor,
  ProviderRegistry,
  QuotaLedger,
  RoutingPolicyEngine,
  assertRegistryProviderMethodSupported,
} from "../src/lpci-safe";
import { CredentialBoundary as DirectCredentialBoundary } from "../src/credential-boundary";

const LPCI_SAFE_SOURCE_PATH = fileURLToPath(new URL("../src/lpci-safe.ts", import.meta.url));
const MONOREPO_RELATIVE_PATTERN = /from\s+["']\.\.\/\.\.\/(?!CVF_MODEL_GATEWAY)/;

describe("LPCI-safe Model Gateway entry (package-safe barrel)", () => {
  it("exports every symbol the LPCI query route and provider binding import", () => {
    expect(typeof CredentialBoundary).toBe("function");
    expect(typeof GatewayReceiptBuilder).toBe("function");
    expect(typeof ProviderExecutionBridge).toBe("function");
    expect(typeof ProviderHealthMonitor).toBe("function");
    expect(typeof ProviderRegistry).toBe("function");
    expect(typeof PROVIDER_CAPABILITY_REGISTRY).toBe("object");
    expect(typeof QuotaLedger).toBe("function");
    expect(typeof RoutingPolicyEngine).toBe("function");
    expect(typeof assertRegistryProviderMethodSupported).toBe("function");
    expect(typeof createCredentialBoundOpenAiCompatibleExecuteAdapter).toBe("function");
  });

  it("re-exports the same runtime class identity as the canonical owner, not a duplicate implementation", () => {
    expect(CredentialBoundary).toBe(DirectCredentialBoundary);
  });

  it("contains no monorepo-relative import outside this package in its own source", () => {
    const source = readFileSync(LPCI_SAFE_SOURCE_PATH, "utf-8");
    expect(MONOREPO_RELATIVE_PATTERN.test(source)).toBe(false);
  });

  it("does not re-export the broad package-root barrel (Runtime Adapter Hub / External Integration owners)", () => {
    const source = readFileSync(LPCI_SAFE_SOURCE_PATH, "utf-8");
    expect(source).not.toMatch(/CVF_v1\.7\.3_RUNTIME_ADAPTER_HUB/);
    expect(source).not.toMatch(/CVF_v1\.2\.1_EXTERNAL_INTEGRATION/);
    expect(source).not.toMatch(/from ["']\.\/index["']/);
  });
});
