import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const schemaRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "schemas");
const names = [
  "kernel-evaluation-request.schema.json",
  "kernel-decision.schema.json",
  "truth-receipt.schema.json",
  "truth-reference.schema.json",
  "evidence-record.schema.json",
  "obligation-record.schema.json",
  "verification-result.schema.json",
];

describe("T2 Kernel schema surfaces", () => {
  it("publishes seven parseable Draft 2020-12 schemas", () => {
    for (const name of names) {
      const schema = JSON.parse(readFileSync(join(schemaRoot, name), "utf8"));
      expect(schema.$schema).toBe("https://json-schema.org/draft/2020-12/schema");
      expect(schema.required.length).toBeGreaterThan(0);
    }
  });
});
