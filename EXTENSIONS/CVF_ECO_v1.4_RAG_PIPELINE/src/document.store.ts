import { RAGDocument, RetrievalTier, DocumentType } from "./types";

let docCounter = 0;

function nextDocId(): string {
  docCounter++;
  return `DOC-${String(docCounter).padStart(4, "0")}`;
}

export function resetDocCounter(): void {
  docCounter = 0;
}

export class DocumentStore {
  private documents: Map<string, RAGDocument> = new Map();

  add(doc: Omit<RAGDocument, "id"> & { id?: string }): RAGDocument {
    const id = doc.id ?? nextDocId();
    const full: RAGDocument = { ...doc, id, score: undefined };
    this.documents.set(id, full);
    return full;
  }

  addBatch(docs: Array<Omit<RAGDocument, "id">>): RAGDocument[] {
    return docs.map((d) => this.add(d));
  }

  get(id: string): RAGDocument | undefined {
    return this.documents.get(id);
  }

  remove(id: string): boolean {
    return this.documents.delete(id);
  }

  listAll(): RAGDocument[] {
    return [...this.documents.values()];
  }

  findByTier(tier: RetrievalTier): RAGDocument[] {
    return this.listAll().filter((d) => d.tier === tier);
  }

  findByDomain(domain: string): RAGDocument[] {
    return this.listAll().filter((d) => d.domain === domain);
  }

  findByType(type: DocumentType): RAGDocument[] {
    return this.listAll().filter((d) => d.documentType === type);
  }

  findByTags(tags: string[]): RAGDocument[] {
    return this.listAll().filter((d) =>
      tags.some((t) => d.tags.includes(t))
    );
  }

  count(): number {
    return this.documents.size;
  }

  clear(): void {
    this.documents.clear();
  }
}
