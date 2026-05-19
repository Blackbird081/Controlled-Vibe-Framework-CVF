import { describe, expect, it } from "vitest";
import {
  isEmbeddingContract,
  EMBEDDING_CONTRACT_REQUIRED_FIELDS,
  type EmbeddingCapableProvider,
  type EmbeddingContract,
  type EmbeddingRequest,
} from "../src/embedding-contract";

describe("embedding contract", () => {
  it("declares the required embedding envelope fields", () => {
    expect(EMBEDDING_CONTRACT_REQUIRED_FIELDS).toEqual(["embeddings", "dimensions", "done"]);
  });

  it("accepts a minimal embedding contract", () => {
    const result: EmbeddingContract = { embeddings: [[0.1, 0.2]], dimensions: 2, done: true };

    expect(isEmbeddingContract(result)).toBe(true);
  });

  it("accepts receipt obligation metadata and done=false", () => {
    expect(isEmbeddingContract({
      embeddings: [[0.1, 0.2]],
      dimensions: 2,
      done: false,
      receiptObligation: "emit_governance_receipt_on_done",
    })).toBe(true);
  });

  it("rejects incomplete or malformed embedding results", () => {
    expect(isEmbeddingContract({ dimensions: 2, done: true })).toBe(false);
    expect(isEmbeddingContract({ embeddings: [[0.1]], done: true })).toBe(false);
    expect(isEmbeddingContract({ embeddings: [["0.1"]], dimensions: 1, done: true })).toBe(false);
  });

  it("defines an embedding-capable provider method", async () => {
    const provider: EmbeddingCapableProvider = {
      embedding(_request: EmbeddingRequest) {
        return Promise.resolve({ embeddings: [[0.1, 0.2]], dimensions: 2, done: true });
      },
    };

    await expect(provider.embedding({ traceId: "trace-1", input: "CVF" }))
      .resolves.toEqual({ embeddings: [[0.1, 0.2]], dimensions: 2, done: true });
  });
});
