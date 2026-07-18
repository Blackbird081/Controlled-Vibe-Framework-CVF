import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function readSchema(name: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(root, "schemas", name), "utf8")) as Record<string, unknown>;
}

describe("canonical schema surfaces", () => {
  it("SourceEnvelope schema exposes every T2-required identity field", () => {
    const schema = readSchema("source-envelope.schema.json");
    expect(schema.$schema).toBe("https://json-schema.org/draft/2020-12/schema");
    expect(schema.required).toEqual(expect.arrayContaining([
      "source_id",
      "owner",
      "content_hash",
      "raw_reference",
      "status",
    ]));
  });

  it("RefineryPacket schema exposes every T2 field and fail-token coupling", () => {
    const schema = readSchema("refinery-packet.schema.json");
    expect(schema.$schema).toBe("https://json-schema.org/draft/2020-12/schema");
    expect(schema.required).toEqual(expect.arrayContaining([
      "refinery_packet_id",
      "source_envelopes",
      "transformation_lineage",
      "status",
      "failure_tokens",
    ]));
    expect(schema.allOf).toBeInstanceOf(Array);
  });
});
