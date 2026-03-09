import { describe, it, expect, beforeEach } from "vitest";
import { IdentityManager, resetAgentCounter, resetCredCounter } from "../src/identity.manager";

describe("IdentityManager", () => {
  let mgr: IdentityManager;

  beforeEach(() => {
    mgr = new IdentityManager();
    resetAgentCounter();
    resetCredCounter();
  });

  describe("registration", () => {
    it("registers agent with credential", () => {
      const { agent, credential } = mgr.registerAgent({ name: "Bot-1", role: "executor" });
      expect(agent.agentId).toMatch(/^AGT-/);
      expect(credential.value).toMatch(/^cvf_tk_/);
    });
  });

  describe("verification", () => {
    it("verifies valid agent with correct credential", () => {
      const { agent, credential } = mgr.registerAgent({ name: "Bot", role: "executor" });
      const result = mgr.verify(agent.agentId, credential.value);
      expect(result.verified).toBe(true);
      expect(result.trustLevel).toBe("basic");
    });

    it("rejects unknown agent", () => {
      const result = mgr.verify("AGT-9999", "fake_token");
      expect(result.verified).toBe(false);
      expect(result.reason).toContain("not found");
    });

    it("rejects wrong credential", () => {
      const { agent } = mgr.registerAgent({ name: "Bot", role: "executor" });
      const result = mgr.verify(agent.agentId, "wrong_token");
      expect(result.verified).toBe(false);
    });

    it("rejects suspended agent", () => {
      const { agent, credential } = mgr.registerAgent({ name: "Bot", role: "executor" });
      mgr.suspendAgent(agent.agentId);
      const result = mgr.verify(agent.agentId, credential.value);
      expect(result.verified).toBe(false);
      expect(result.reason).toContain("suspended");
    });

    it("rejects credential from different agent", () => {
      const { agent: a1 } = mgr.registerAgent({ name: "Bot-1", role: "executor" });
      const { credential: c2 } = mgr.registerAgent({ name: "Bot-2", role: "executor" });
      const result = mgr.verify(a1.agentId, c2.value);
      expect(result.verified).toBe(false);
      expect(result.reason).toContain("does not belong");
    });
  });

  describe("permissions", () => {
    it("grants and checks permissions", () => {
      const { agent } = mgr.registerAgent({ name: "Bot", role: "executor", domains: ["finance"] });
      mgr.grantPermission(agent.agentId, "finance", ["read", "transfer"], "admin");
      expect(mgr.hasPermission(agent.agentId, "finance", "read")).toBe(true);
      expect(mgr.hasPermission(agent.agentId, "finance", "delete")).toBe(false);
    });

    it("lists permissions for agent", () => {
      const { agent } = mgr.registerAgent({ name: "Bot", role: "executor" });
      mgr.grantPermission(agent.agentId, "finance", ["read"], "admin");
      mgr.grantPermission(agent.agentId, "privacy", ["export"], "admin");
      expect(mgr.getPermissions(agent.agentId).length).toBe(2);
    });

    it("returns undefined for unknown agent", () => {
      expect(mgr.grantPermission("FAKE", "finance", ["read"], "admin")).toBeUndefined();
    });
  });

  describe("trust-based access", () => {
    it("allows access when trust meets requirement", () => {
      const { agent } = mgr.registerAgent({ name: "Bot", role: "executor" });
      mgr.getRegistry().updateTrust(agent.agentId, "verified");
      expect(mgr.checkAccess(agent.agentId, "basic").allowed).toBe(true);
      expect(mgr.checkAccess(agent.agentId, "verified").allowed).toBe(true);
    });

    it("denies access when trust is insufficient", () => {
      const { agent } = mgr.registerAgent({ name: "Bot", role: "executor" });
      expect(mgr.checkAccess(agent.agentId, "elevated").allowed).toBe(false);
    });

    it("denies access for suspended agent", () => {
      const { agent } = mgr.registerAgent({ name: "Bot", role: "executor" });
      mgr.suspendAgent(agent.agentId);
      expect(mgr.checkAccess(agent.agentId, "basic").allowed).toBe(false);
    });
  });

  describe("lifecycle", () => {
    it("suspends agent and revokes credentials", () => {
      const { agent, credential } = mgr.registerAgent({ name: "Bot", role: "executor" });
      mgr.suspendAgent(agent.agentId);
      expect(mgr.getRegistry().get(agent.agentId)!.status).toBe("suspended");
      expect(mgr.getCredentialStore().validate(credential.id).valid).toBe(false);
    });

    it("revokes agent and all credentials", () => {
      const { agent } = mgr.registerAgent({ name: "Bot", role: "executor" });
      mgr.revokeAgent(agent.agentId);
      expect(mgr.getRegistry().get(agent.agentId)!.status).toBe("revoked");
    });

    it("reissues credential", () => {
      const { agent, credential: oldCred } = mgr.registerAgent({ name: "Bot", role: "executor" });
      const newCred = mgr.reissueCredential(agent.agentId);
      expect(newCred).toBeDefined();
      expect(newCred!.value).not.toBe(oldCred.value);
      expect(mgr.getCredentialStore().validate(oldCred.id).valid).toBe(false);
    });

    it("cannot reissue for suspended agent", () => {
      const { agent } = mgr.registerAgent({ name: "Bot", role: "executor" });
      mgr.suspendAgent(agent.agentId);
      expect(mgr.reissueCredential(agent.agentId)).toBeUndefined();
    });
  });

  describe("end-to-end", () => {
    it("full agent identity lifecycle", () => {
      const { agent, credential } = mgr.registerAgent({
        name: "Finance-Bot", role: "executor", domains: ["finance"],
      });

      expect(mgr.verify(agent.agentId, credential.value).verified).toBe(true);

      mgr.grantPermission(agent.agentId, "finance", ["read", "transfer"], "admin");
      expect(mgr.hasPermission(agent.agentId, "finance", "transfer")).toBe(true);

      mgr.getRegistry().updateTrust(agent.agentId, "elevated");
      expect(mgr.checkAccess(agent.agentId, "verified").allowed).toBe(true);

      const newCred = mgr.reissueCredential(agent.agentId)!;
      expect(mgr.verify(agent.agentId, credential.value).verified).toBe(false);
      expect(mgr.verify(agent.agentId, newCred.value).verified).toBe(true);

      mgr.suspendAgent(agent.agentId);
      expect(mgr.verify(agent.agentId, newCred.value).verified).toBe(false);
    });
  });
});
