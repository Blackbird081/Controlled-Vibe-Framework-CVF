import { RAGQuery, RAGResult, TierConfig } from "./types";
import { DocumentStore } from "./document.store";
import { Retriever } from "./retriever";

export class RAGPipeline {
  private store: DocumentStore;
  private retriever: Retriever;

  constructor(tierConfig?: TierConfig[]) {
    this.store = new DocumentStore();
    this.retriever = new Retriever(tierConfig);
  }

  getStore(): DocumentStore {
    return this.store;
  }

  query(ragQuery: RAGQuery): RAGResult {
    const start = performance.now();

    const documents = this.retriever.retrieve(this.store, ragQuery);
    const totalCandidates = this.retriever.getTotalCandidates(this.store, ragQuery);

    const tiersSearched = [...new Set(documents.map((d) => d.tier))];

    const elapsed = performance.now() - start;

    return {
      query: ragQuery.query,
      documents,
      tiersSearched,
      totalCandidates,
      retrievalTimeMs: elapsed,
    };
  }

  querySimple(text: string, domain?: string, maxResults?: number): RAGResult {
    return this.query({
      query: text,
      domain,
      maxResults: maxResults ?? 5,
    });
  }
}
