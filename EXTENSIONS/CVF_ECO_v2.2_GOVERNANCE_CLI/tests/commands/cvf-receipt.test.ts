import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { CommandRegistry } from "../../src/command.registry";

function receiptPath(): string {
  const dir = mkdtempSync(join(tmpdir(), "cvf-receipt-"));
  const path = join(dir, "receipts.jsonl");
  writeFileSync(path, `${JSON.stringify({ receiptId: "rcpt-1", decision: "ALLOW" })}\n`);
  return path;
}

describe("cvf receipt", () => {
  it("registers the receipt command", () => {
    expect(new CommandRegistry().getHandler("receipt")).toBeDefined();
  });

  it("shows a matching receipt", () => {
    const input = receiptPath();
    try {
      const result = new CommandRegistry().execute({ command: "receipt", positional: ["show", "rcpt-1"], flags: { input } });
      expect(result.success).toBe(true);
      expect(result.message).toContain("ALLOW");
    } finally {
      rmSync(dirname(input), { recursive: true, force: true });
    }
  });

  it("returns a clear error for a missing receipt", () => {
    const input = receiptPath();
    try {
      const result = new CommandRegistry().execute({ command: "receipt", positional: ["show", "missing"], flags: { input } });
      expect(result.success).toBe(false);
      expect(result.message).toContain("Receipt not found");
    } finally {
      rmSync(dirname(input), { recursive: true, force: true });
    }
  });

  it("does not mutate the receipt log", () => {
    const input = receiptPath();
    try {
      new CommandRegistry().execute({ command: "receipt", positional: ["show", "rcpt-1"], flags: { input } });
      expect(readText(input).split(/\r?\n/).filter(Boolean)).toHaveLength(1);
    } finally {
      rmSync(dirname(input), { recursive: true, force: true });
    }
  });
});

function readText(path: string): string {
  return readFileSync(path, "utf8");
}
