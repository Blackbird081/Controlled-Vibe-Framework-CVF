import { describe, it, expect, beforeEach } from "vitest";
import { AgentRegistry, resetAgentCounter } from "../src/agent.registry";

describe("AgentRegistry", () => {
  let registry: AgentRegistry;

  beforeEach(() => {
    registry = new AgentRegistry();
    resetAgentCounter();
  });

  it("registers agent with unique ID", () => {
    const a1 = registry.register({ name: "Bot-1", role: "executor" });
    const a2 = registry.register({ name: "Bot-2", role: "reviewer" });
    expect(a1.agentId).toMatch(/^AGT-/);
    expect(a1.agentId).not.toBe(a2.agentId);
  });

  it("sets default status and trust level", () => {
    const agent = registry.register({ name: "Bot", role: "executor" });
    expect(agent.status).toBe("active");
    expect(agent.trustLevel).toBe("basic");
  });

  it("retrieves agent by ID", () => {
    const agent = registry.register({ name: "Bot", role: "planner" });
    expect(registry.get(agent.agentId)).toBeDefined();
    expect(registry.get(agent.agentId)!.name).toBe("Bot");
  });

  it("finds agent by name", () => {
    registry.register({ name: "Finance-Bot", role: "executor" });
    expect(registry.findByName("Finance-Bot")).toBeDefined();
    expect(registry.findByName("Nonexistent")).toBeUndefined();
  });

  it("finds agents by role", () => {
    registry.register({ name: "E1", role: "executor" });
    registry.register({ name: "E2", role: "executor" });
    registry.register({ name: "R1", role: "reviewer" });
    expect(registry.findByRole("executor").length).toBe(2);
    expect(registry.findByRole("reviewer").length).toBe(1);
  });

  it("finds agents by domain", () => {
    registry.register({ name: "FB", role: "executor", domains: ["finance"] });
    registry.register({ name: "PB", role: "executor", domains: ["privacy", "finance"] });
    expect(registry.findByDomain("finance").length).toBe(2);
    expect(registry.findByDomain("privacy").length).toBe(1);
  });

  it("updates agent status", () => {
    const agent = registry.register({ name: "Bot", role: "executor" });
    expect(registry.updateStatus(agent.agentId, "suspended")).toBe(true);
    expect(registry.get(agent.agentId)!.status).toBe("suspended");
  });

  it("updates trust level", () => {
    const agent = registry.register({ name: "Bot", role: "executor" });
    registry.updateTrust(agent.agentId, "elevated");
    expect(registry.get(agent.agentId)!.trustLevel).toBe("elevated");
  });

  it("removes agent", () => {
    const agent = registry.register({ name: "Bot", role: "executor" });
    expect(registry.remove(agent.agentId)).toBe(true);
    expect(registry.get(agent.agentId)).toBeUndefined();
  });

  it("lists all and active agents", () => {
    const a1 = registry.register({ name: "A1", role: "executor" });
    registry.register({ name: "A2", role: "reviewer" });
    registry.updateStatus(a1.agentId, "suspended");
    expect(registry.listAll().length).toBe(2);
    expect(registry.listActive().length).toBe(1);
  });

  it("counts agents", () => {
    registry.register({ name: "A1", role: "executor" });
    registry.register({ name: "A2", role: "executor" });
    expect(registry.count()).toBe(2);
  });

  it("clears all agents", () => {
    registry.register({ name: "A1", role: "executor" });
    registry.clear();
    expect(registry.count()).toBe(0);
  });
});
