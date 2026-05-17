import { describe, expect, it } from "vitest";
import { evaluateDelegatedWriteBoundary } from "../src/delegation.boundary.guard.contract";

const boundary = {
  ownedFiles: ["src/owned.ts"],
  ownedModules: ["src/module"],
  forbiddenPaths: ["src/module/private", "secrets"],
};

describe("evaluateDelegatedWriteBoundary", () => {
  it("allows explicitly owned files", () => {
    expect(evaluateDelegatedWriteBoundary("src/owned.ts", boundary).allowed).toBe(true);
  });

  it("allows files inside owned modules", () => {
    expect(
      evaluateDelegatedWriteBoundary("src/module/component.ts", boundary).allowed,
    ).toBe(true);
  });

  it("rejects forbidden paths", () => {
    expect(
      evaluateDelegatedWriteBoundary("src/module/private/key.txt", boundary).allowed,
    ).toBe(false);
  });

  it("rejects out-of-scope paths", () => {
    expect(evaluateDelegatedWriteBoundary("src/other.ts", boundary).allowed).toBe(false);
  });

  it("normalizes Windows separators", () => {
    expect(evaluateDelegatedWriteBoundary("src\\owned.ts", boundary).allowed).toBe(true);
  });
});
