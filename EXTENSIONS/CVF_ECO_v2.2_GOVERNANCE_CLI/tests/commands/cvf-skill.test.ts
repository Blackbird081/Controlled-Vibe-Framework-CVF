import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { CommandRegistry } from "../../src/command.registry";

function skillIndexPath(): string {
  const dir = mkdtempSync(join(tmpdir(), "cvf-skill-index-"));
  const path = join(dir, "skills-index.json");
  writeFileSync(path, JSON.stringify({
    categories: [{ id: "ops", skills: [{ id: "skill-a", title: "Skill A", domain: "ops", riskLevel: "R1" }] }],
  }));
  return path;
}

describe("cvf skill", () => {
  it("registers the skill command", () => {
    expect(new CommandRegistry().getHandler("skill")).toBeDefined();
  });

  it("lists skills from a read-only index", () => {
    const input = skillIndexPath();
    try {
      const result = new CommandRegistry().execute({ command: "skill", positional: ["list"], flags: { input } });
      expect(result.success).toBe(true);
      expect(result.message).toContain("skill-a");
    } finally {
      rmSync(dirname(input), { recursive: true, force: true });
    }
  });

  it("shows one skill by id", () => {
    const input = skillIndexPath();
    try {
      const result = new CommandRegistry().execute({ command: "skill", positional: ["show", "skill-a"], flags: { input } });
      expect(result.success).toBe(true);
      expect(result.message).toContain("Skill A");
    } finally {
      rmSync(dirname(input), { recursive: true, force: true });
    }
  });

  it("returns a clear error for a missing skill", () => {
    const input = skillIndexPath();
    try {
      const result = new CommandRegistry().execute({ command: "skill", positional: ["show", "missing"], flags: { input } });
      expect(result.success).toBe(false);
      expect(result.message).toContain("Skill not found");
    } finally {
      rmSync(dirname(input), { recursive: true, force: true });
    }
  });
});
