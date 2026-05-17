import { describe, it, expect, beforeEach } from "vitest";
import { CredentialStore, resetCredCounter } from "../src/credential.store";

describe("CredentialStore", () => {
  let store: CredentialStore;

  beforeEach(() => {
    store = new CredentialStore();
    resetCredCounter();
  });

  it("issues credential with unique ID", () => {
    const c1 = store.issue("AGT-0001", "api_key");
    const c2 = store.issue("AGT-0001", "token");
    expect(c1.id).toMatch(/^CRED-/);
    expect(c1.id).not.toBe(c2.id);
  });

  it("generates typed credential values", () => {
    expect(store.issue("A", "api_key").value).toMatch(/^cvf_ak_/);
    expect(store.issue("A", "token").value).toMatch(/^cvf_tk_/);
    expect(store.issue("A", "certificate").value).toMatch(/^cvf_cert_/);
    expect(store.issue("A", "signature").value).toMatch(/^cvf_sig_/);
  });

  it("retrieves credential by ID", () => {
    const cred = store.issue("AGT-0001", "token");
    expect(store.get(cred.id)).toBeDefined();
    expect(store.get(cred.id)!.agentId).toBe("AGT-0001");
  });

  it("finds credentials by agent", () => {
    store.issue("AGT-0001", "token");
    store.issue("AGT-0001", "api_key");
    store.issue("AGT-0002", "token");
    expect(store.findByAgent("AGT-0001").length).toBe(2);
  });

  it("validates active credential", () => {
    const cred = store.issue("AGT-0001", "token");
    const result = store.validate(cred.id);
    expect(result.valid).toBe(true);
  });

  it("rejects nonexistent credential", () => {
    const result = store.validate("CRED-9999");
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("not found");
  });

  it("rejects revoked credential", () => {
    const cred = store.issue("AGT-0001", "token");
    store.revoke(cred.id);
    expect(store.validate(cred.id).valid).toBe(false);
    expect(store.validate(cred.id).reason).toContain("revoked");
  });

  it("validates by value", () => {
    const cred = store.issue("AGT-0001", "token");
    const result = store.validateByValue(cred.value);
    expect(result.valid).toBe(true);
    expect(result.credential).toBeDefined();
  });

  it("revokes all credentials for agent", () => {
    store.issue("AGT-0001", "token");
    store.issue("AGT-0001", "api_key");
    const count = store.revokeAllForAgent("AGT-0001");
    expect(count).toBe(2);
    expect(store.findActiveByAgent("AGT-0001").length).toBe(0);
  });

  it("counts and clears", () => {
    store.issue("A", "token");
    store.issue("B", "token");
    expect(store.count()).toBe(2);
    store.clear();
    expect(store.count()).toBe(0);
  });
});
