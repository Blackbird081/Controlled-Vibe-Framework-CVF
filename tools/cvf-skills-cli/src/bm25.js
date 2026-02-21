/**
 * BM25 Scoring Engine — pure Node.js, zero dependencies.
 */

export class BM25 {
  constructor(k1 = 1.5, b = 0.75) {
    this.k1 = k1;
    this.b = b;
    this.corpus = [];
    this.docCount = 0;
    this.avgLengths = {};
    this.idfCache = {};
    this.fieldWeights = {};
  }

  index(documents, fields, weights = null) {
    this.fieldWeights = weights || Object.fromEntries(fields.map(f => [f, 1.0]));
    this.corpus = [];

    for (const doc of documents) {
      const tokenized = {};
      for (const field of fields) {
        tokenized[field] = this._tokenize(doc[field] || '');
      }
      this.corpus.push(tokenized);
    }

    this.docCount = this.corpus.length;

    for (const field of fields) {
      const lengths = this.corpus.map(d => (d[field] || []).length);
      this.avgLengths[field] = lengths.reduce((a, b) => a + b, 0) / Math.max(lengths.length, 1);
    }

    this._computeIdf(fields);
  }

  search(query, topN = 10) {
    const queryTokens = this._tokenize(query);
    if (queryTokens.length === 0) return [];

    const scores = [];

    for (let i = 0; i < this.corpus.length; i++) {
      const doc = this.corpus[i];
      let score = 0;

      for (const [field, tokens] of Object.entries(doc)) {
        const weight = this.fieldWeights[field] || 1.0;
        score += this._scoreField(queryTokens, tokens, field) * weight;
      }

      if (score > 0) scores.push([i, score]);
    }

    scores.sort((a, b) => b[1] - a[1]);
    return scores.slice(0, topN);
  }

  _tokenize(text) {
    if (!text) return [];
    const matches = text.toLowerCase().match(/[a-zA-ZÀ-ỹ0-9]+/g);
    return matches ? matches.filter(t => t.length >= 2) : [];
  }

  _computeIdf(fields) {
    const termDocCount = {};

    for (const doc of this.corpus) {
      const docTerms = new Set();
      for (const field of fields) {
        for (const token of (doc[field] || [])) docTerms.add(token);
      }
      for (const term of docTerms) {
        termDocCount[term] = (termDocCount[term] || 0) + 1;
      }
    }

    for (const [term, df] of Object.entries(termDocCount)) {
      this.idfCache[term] = Math.log((this.docCount - df + 0.5) / (df + 0.5) + 1.0);
    }
  }

  _scoreField(queryTokens, fieldTokens, field) {
    if (fieldTokens.length === 0) return 0;

    const docLen = fieldTokens.length;
    const avgLen = this.avgLengths[field] || 1;

    const tfMap = {};
    for (const token of fieldTokens) {
      tfMap[token] = (tfMap[token] || 0) + 1;
    }

    let score = 0;
    for (const qt of queryTokens) {
      const idf = this.idfCache[qt];
      if (idf === undefined) continue;
      const tf = tfMap[qt] || 0;
      if (tf === 0) continue;

      const numerator = tf * (this.k1 + 1);
      const denominator = tf + this.k1 * (1 - this.b + this.b * docLen / Math.max(avgLen, 1));
      score += idf * numerator / denominator;
    }

    return score;
  }
}
