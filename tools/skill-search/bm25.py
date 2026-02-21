#!/usr/bin/env python
"""BM25 scoring engine for CVF Skill Library search.

Pure Python implementation — no external dependencies.
"""
from __future__ import annotations

import math
from typing import Dict, List, Tuple


class BM25:
    """Okapi BM25 ranking algorithm.

    Parameters:
        k1: Term frequency saturation (default 1.5)
        b:  Document length normalization (default 0.75)
    """

    def __init__(self, k1: float = 1.5, b: float = 0.75):
        self.k1 = k1
        self.b = b
        self.corpus: List[Dict[str, List[str]]] = []  # [{field: [tokens]}]
        self.doc_count = 0
        self.avg_lengths: Dict[str, float] = {}
        self.idf_cache: Dict[str, float] = {}
        self.field_weights: Dict[str, float] = {}

    def index(
        self,
        documents: List[Dict[str, str]],
        fields: List[str],
        weights: Dict[str, float] | None = None,
    ) -> None:
        """Build index from list of document dicts.

        Args:
            documents: List of {field_name: text_value}
            fields: Fields to index
            weights: Field name → weight multiplier
        """
        self.field_weights = weights or {f: 1.0 for f in fields}
        self.corpus = []

        for doc in documents:
            tokenized = {}
            for field in fields:
                text = doc.get(field, "")
                tokenized[field] = self._tokenize(text)
            self.corpus.append(tokenized)

        self.doc_count = len(self.corpus)

        # Average field lengths
        for field in fields:
            lengths = [len(d.get(field, [])) for d in self.corpus]
            self.avg_lengths[field] = sum(lengths) / max(len(lengths), 1)

        # Pre-compute IDF for all terms
        self._compute_idf(fields)

    def search(
        self,
        query: str,
        top_n: int = 10,
    ) -> List[Tuple[int, float]]:
        """Search the indexed corpus.

        Args:
            query: Search query string
            top_n: Maximum results to return

        Returns:
            List of (doc_index, score) tuples, sorted by score descending
        """
        query_tokens = self._tokenize(query)
        if not query_tokens:
            return []

        scores: List[Tuple[int, float]] = []

        for doc_idx, doc in enumerate(self.corpus):
            score = 0.0
            for field, tokens in doc.items():
                weight = self.field_weights.get(field, 1.0)
                field_score = self._score_field(query_tokens, tokens, field)
                score += field_score * weight
            if score > 0:
                scores.append((doc_idx, score))

        scores.sort(key=lambda x: x[1], reverse=True)
        return scores[:top_n]

    def _tokenize(self, text: str) -> List[str]:
        """Tokenize text into lowercase words."""
        if not text:
            return []
        # Split on non-alphanumeric (keep Vietnamese diacritics)
        import re
        tokens = re.findall(r"[a-zA-ZÀ-ỹ0-9]+", text.lower())
        return [t for t in tokens if len(t) >= 2]

    def _compute_idf(self, fields: List[str]) -> None:
        """Pre-compute inverse document frequency for all terms."""
        term_doc_count: Dict[str, int] = {}

        for doc in self.corpus:
            # Collect unique terms across all fields in this doc
            doc_terms: set = set()
            for field in fields:
                doc_terms.update(doc.get(field, []))

            for term in doc_terms:
                term_doc_count[term] = term_doc_count.get(term, 0) + 1

        for term, df in term_doc_count.items():
            # Standard BM25 IDF with smoothing
            self.idf_cache[term] = math.log(
                (self.doc_count - df + 0.5) / (df + 0.5) + 1.0
            )

    def _score_field(
        self,
        query_tokens: List[str],
        field_tokens: List[str],
        field: str,
    ) -> float:
        """Score a single field against query tokens."""
        if not field_tokens:
            return 0.0

        doc_len = len(field_tokens)
        avg_len = self.avg_lengths.get(field, 1.0)

        # Term frequency in this field
        tf_map: Dict[str, int] = {}
        for token in field_tokens:
            tf_map[token] = tf_map.get(token, 0) + 1

        score = 0.0
        for qt in query_tokens:
            if qt not in self.idf_cache:
                continue
            idf = self.idf_cache[qt]
            tf = tf_map.get(qt, 0)
            if tf == 0:
                continue

            # BM25 formula
            numerator = tf * (self.k1 + 1)
            denominator = tf + self.k1 * (1 - self.b + self.b * doc_len / max(avg_len, 1))
            score += idf * numerator / denominator

        return score
