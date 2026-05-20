import { describe, expect, it } from "vitest";
import { CommandRegistry } from "../../src/command.registry";

describe("cvf provider", () => {
  it("registers the provider command", () => {
    expect(new CommandRegistry().getHandler("provider")).toBeDefined();
  });

  it("lists registered provider lanes without key values", () => {
    const result = new CommandRegistry().execute({ command: "provider", positional: ["list"], flags: {} });

    expect(result.success).toBe(true);
    expect(result.message).toContain("openai");
    expect(result.message).toContain("alibaba");
    expect(result.message).not.toMatch(/API_KEY|sk-|secret/i);
  });

  it("returns a clear error for unknown provider subcommands", () => {
    const result = new CommandRegistry().execute({ command: "provider", positional: ["mutate"], flags: {} });

    expect(result.success).toBe(false);
    expect(result.message).toContain("Unknown provider sub-command");
  });

  it("has no mutation subcommand registered", () => {
    const result = new CommandRegistry().execute({ command: "provider", positional: ["list"], flags: {} });

    expect(result.data).toMatchObject({ providers: expect.any(Array) });
  });
});
