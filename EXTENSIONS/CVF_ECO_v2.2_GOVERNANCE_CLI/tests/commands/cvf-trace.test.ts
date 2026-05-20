import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { CommandRegistry } from "../../src/command.registry";

function tracePath(): string {
  const dir = mkdtempSync(join(tmpdir(), "cvf-trace-"));
  const path = join(dir, "trace.jsonl");
  writeFileSync(path, [
    JSON.stringify({ sessionId: "ses-1", eventType: "execution_requested" }),
    JSON.stringify({ sessionId: "ses-2", eventType: "receipt_emitted" }),
  ].join("\n"));
  return path;
}

describe("cvf trace", () => {
  it("registers the trace command", () => {
    expect(new CommandRegistry().getHandler("trace")).toBeDefined();
  });

  it("dumps JSONL trace entries", () => {
    const input = tracePath();
    try {
      const result = new CommandRegistry().execute({ command: "trace", positional: ["dump"], flags: { input } });
      expect(result.success).toBe(true);
      expect(result.message).toContain("execution_requested");
    } finally {
      rmSync(dirname(input), { recursive: true, force: true });
    }
  });

  it("filters trace entries by session", () => {
    const input = tracePath();
    try {
      const result = new CommandRegistry().execute({ command: "trace", positional: ["dump"], flags: { input, session: "ses-2" } });
      expect(result.success).toBe(true);
      expect(result.message).toContain("ses-2");
      expect(result.message).not.toContain("ses-1");
    } finally {
      rmSync(dirname(input), { recursive: true, force: true });
    }
  });

  it("returns a clear error for missing input", () => {
    const result = new CommandRegistry().execute({ command: "trace", positional: ["dump"], flags: { input: "missing.jsonl" } });
    expect(result.success).toBe(false);
    expect(result.message).toContain("not found");
  });
});
