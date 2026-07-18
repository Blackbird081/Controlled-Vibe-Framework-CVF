import type { RAGDocument, RAGResult } from "./types";
import type {
  GovernedContextPackRequest,
  GovernanceContextEnvelope,
} from "../../CVF_CONTROL_PLANE_FOUNDATION/src/dscp.governed.context.contract";
import type { ContextPackagerRequest } from "../../CVF_CONTROL_PLANE_FOUNDATION/src/context.packager.contract";
import type { KnowledgeItem } from "../../CVF_CONTROL_PLANE_FOUNDATION/src/knowledge.query.contract";

function mapRAGDocumentToKnowledgeItem(doc: RAGDocument): KnowledgeItem {
  return {
    itemId: doc.id,
    title: doc.title,
    content: doc.content,
    relevanceScore: doc.score ?? 1,
    source: doc.domain ?? doc.documentType,
  };
}

export function buildECOGovernedPackRequest(
  ragResult: RAGResult,
  envelope: GovernanceContextEnvelope,
): GovernedContextPackRequest {
  const knowledgeItems = ragResult.documents.map(mapRAGDocumentToKnowledgeItem);

  const packRequest: ContextPackagerRequest = {
    query: ragResult.query,
    contextId: ragResult.query,
    knowledgeItems,
  };

  return {
    packRequest,
    governanceEnvelope: envelope,
  };
}
