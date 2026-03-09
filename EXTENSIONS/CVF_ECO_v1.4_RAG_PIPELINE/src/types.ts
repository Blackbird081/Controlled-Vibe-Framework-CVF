export type RetrievalTier = "T1_DOCTRINE" | "T2_POLICY" | "T3_OPERATIONAL" | "T4_CONTEXTUAL";

export type DocumentType =
  | "doctrine"
  | "policy"
  | "guard_rule"
  | "template"
  | "operational_log"
  | "context_snippet";

export interface RAGDocument {
  id: string;
  title: string;
  content: string;
  tier: RetrievalTier;
  documentType: DocumentType;
  domain?: string;
  tags: string[];
  score?: number;
  metadata: Record<string, unknown>;
}

export interface RAGQuery {
  query: string;
  domain?: string;
  tiers?: RetrievalTier[];
  maxResults?: number;
  minScore?: number;
  tags?: string[];
}

export interface RAGResult {
  query: string;
  documents: RAGDocument[];
  tiersSearched: RetrievalTier[];
  totalCandidates: number;
  retrievalTimeMs: number;
}

export interface TierConfig {
  tier: RetrievalTier;
  priority: number;
  maxDocuments: number;
  boostFactor: number;
}

export const DEFAULT_TIER_CONFIG: TierConfig[] = [
  { tier: "T1_DOCTRINE", priority: 1, maxDocuments: 3, boostFactor: 1.5 },
  { tier: "T2_POLICY", priority: 2, maxDocuments: 5, boostFactor: 1.3 },
  { tier: "T3_OPERATIONAL", priority: 3, maxDocuments: 10, boostFactor: 1.0 },
  { tier: "T4_CONTEXTUAL", priority: 4, maxDocuments: 20, boostFactor: 0.8 },
];
