import { describe, expect, it } from "vitest";
import { CommandRegistry } from "../../src/command.registry";

describe("cvf run", () => {
  it("registers the run command", () => {
    expect(new CommandRegistry().getHandler("run")).toBeDefined();
  });

  it("delegates help to execute", () => {
    const result = new CommandRegistry().execute({ command: "run", positional: [], flags: { help: true } });

    expect(result.success).toBe(true);
    expect(result.message).toContain("cvf execute");
  });

  it("forwards positional template to the execute alias", () => {
    const result = new CommandRegistry().execute({
      command: "run",
      positional: ["documentation"],
      flags: { role: "BUILDER" },
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("runAsync");
  });

  it("does not execute network I/O through the sync path", () => {
    const result = new CommandRegistry().execute({
      command: "run",
      positional: ["documentation"],
      flags: { role: "BUILDER" },
    });

    expect(result.exitCode).toBe(1);
  });
});
