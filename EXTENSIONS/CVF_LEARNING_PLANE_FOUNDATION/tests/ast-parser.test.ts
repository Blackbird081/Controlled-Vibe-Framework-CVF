import { describe, expect, it } from "vitest";
import { parseFileToAST } from "../src/knowledge/graph/ast/ast-parser";

describe("graph ast parser phase 1", () => {
  it("extracts file, import, class, method, function, and call signals", () => {
    const ast = parseFileToAST("src/sample.ts", `
      import { helper } from "./helper";
      export function run() { helper(); }
      class Worker { start() { run(); } }
    `);

    expect(ast.symbols.map((node) => `${node.kind}:${node.name}`)).toEqual(
      expect.arrayContaining([
        "file:src/sample.ts",
        "module:./helper",
        "function:run",
        "function:helper",
        "class:Worker",
        "method:start",
      ]),
    );
    expect(ast.dependencies.map((edge) => edge.kind)).toEqual(
      expect.arrayContaining(["imports", "declares", "calls"]),
    );
  });
});
