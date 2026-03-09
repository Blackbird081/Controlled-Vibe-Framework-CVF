import { describe, it, expect } from "vitest";
import { ArgParser } from "../src/arg.parser";

describe("ArgParser", () => {
  const parser = new ArgParser();

  describe("command extraction", () => {
    it("parses command from first argument", () => {
      const result = parser.parse(["evaluate", "--domain", "finance"]);
      expect(result.command).toBe("evaluate");
    });

    it("defaults to help for empty args", () => {
      const result = parser.parse([]);
      expect(result.command).toBe("help");
    });

    it("defaults to help for unknown command", () => {
      const result = parser.parse(["unknown_cmd"]);
      expect(result.command).toBe("help");
    });

    it("recognizes all valid commands", () => {
      for (const cmd of parser.getValidCommands()) {
        const result = parser.parse([cmd]);
        expect(result.command).toBe(cmd);
      }
    });
  });

  describe("flag parsing", () => {
    it("parses --key value flags", () => {
      const result = parser.parse(["evaluate", "--domain", "finance", "--action", "transfer"]);
      expect(result.flags.domain).toBe("finance");
      expect(result.flags.action).toBe("transfer");
    });

    it("parses --key=value flags", () => {
      const result = parser.parse(["evaluate", "--domain=finance"]);
      expect(result.flags.domain).toBe("finance");
    });

    it("parses short -k value flags", () => {
      const result = parser.parse(["evaluate", "-d", "finance"]);
      expect(result.flags.d).toBe("finance");
    });

    it("parses boolean flags", () => {
      const result = parser.parse(["audit", "--count"]);
      expect(result.flags.count).toBe(true);
    });
  });

  describe("positional arguments", () => {
    it("captures positional args after command", () => {
      const result = parser.parse(["session", "start"]);
      expect(result.positional).toContain("start");
    });

    it("mixes positional and flags", () => {
      const result = parser.parse(["session", "start", "--agent", "bot-1"]);
      expect(result.positional).toContain("start");
      expect(result.flags.agent).toBe("bot-1");
    });
  });

  describe("validation", () => {
    it("validates known commands", () => {
      expect(parser.isValidCommand("evaluate")).toBe(true);
      expect(parser.isValidCommand("session")).toBe(true);
      expect(parser.isValidCommand("help")).toBe(true);
    });

    it("rejects unknown commands", () => {
      expect(parser.isValidCommand("foo")).toBe(false);
    });
  });
});
