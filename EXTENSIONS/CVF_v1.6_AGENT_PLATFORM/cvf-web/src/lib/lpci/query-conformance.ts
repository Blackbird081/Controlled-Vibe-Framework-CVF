import type {
  AnswerClass,
  FilterParams,
  LpciIndexRecord,
  ModelEvidenceProjection,
  RecordStatus,
  SensitivityLevel,
} from './types';

export const MODEL_EVIDENCE_SCHEMA_VERSION = 'cvf.lpci1Web.modelEvidence.v1' as const;
export const MAX_QUERY_BYTES = 4096;
export const MAX_CORPUS_ID_BYTES = 128;
export const MAX_FACET_BYTES = 256;
export const MAX_SNIPPET_CODE_POINTS = 512;
export const MAX_EVIDENCE_RECORDS = 4;
export const MAX_PROJECTION_BYTES = 16384;

const RECORD_STATUSES = new Set<RecordStatus>([
  'effective', 'draft', 'amended', 'superseded', 'repealed', 'obsolete', 'unknown',
]);
const ANSWER_CLASSES = new Set<AnswerClass>([
  'DIRECT_CITED_ANSWER', 'SUMMARY_WITH_SOURCE', 'PROCEDURAL_GUIDANCE', 'ESCALATE_OR_ABSTAIN',
]);
const SENSITIVITY_LEVELS = new Set<SensitivityLevel>([
  'public', 'restricted', 'confidential', 'classified', 'unknown',
]);
const FILTER_KEYS = new Set([
  'status', 'jurisdiction', 'documentType', 'authorityLevel', 'sensitivityClearance',
]);
const CORPUS_ID_PATTERN = /^[A-Za-z0-9._-]+$/;
const CONTROL_PATTERN = /[\u0000-\u001f\u007f]/;

export interface ValidatedQueryRequest {
  query: string;
  corpusId: string;
  effectiveServerFilters: FilterParams;
}

export type RequestValidationResult =
  | { ok: true; value: ValidatedQueryRequest }
  | { ok: false };

export type IndexAdmissionResult =
  | { ok: true; records: LpciIndexRecord[]; filteredOut: boolean }
  | { ok: false; sensitivityPreFilterApplied: boolean };

export type ProjectionResult =
  | { ok: true; projection: ModelEvidenceProjection; serialized: string; utf8Bytes: number }
  | { ok: false };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function hasOnlyUnicodeScalars(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return false;
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      return false;
    }
  }
  return true;
}

export function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function validScalarString(value: unknown): value is string {
  return typeof value === 'string' && hasOnlyUnicodeScalars(value);
}

function validateFacet(value: unknown): string | undefined | null {
  if (value === undefined) return undefined;
  if (!validScalarString(value)) return null;
  const normalized = value.trim();
  if (!normalized || utf8ByteLength(normalized) > MAX_FACET_BYTES) return null;
  return normalized;
}

export function validateQueryRequest(body: unknown): RequestValidationResult {
  if (!isObject(body)) return { ok: false };
  if (!validScalarString(body.query)) return { ok: false };
  const query = body.query.trim();
  if (!query || utf8ByteLength(query) > MAX_QUERY_BYTES) return { ok: false };

  if (!validScalarString(body.corpusId)) return { ok: false };
  const corpusId = body.corpusId;
  if (!CORPUS_ID_PATTERN.test(corpusId) || utf8ByteLength(corpusId) > MAX_CORPUS_ID_BYTES) {
    return { ok: false };
  }

  const rawFilters = body.filters;
  if (rawFilters !== undefined && !isObject(rawFilters)) return { ok: false };
  const filters = rawFilters ?? {};
  if (Object.keys(filters).some((key) => !FILTER_KEYS.has(key))) return { ok: false };

  let status: RecordStatus[] | undefined;
  if (filters.status !== undefined) {
    if (!Array.isArray(filters.status) || filters.status.length > RECORD_STATUSES.size) return { ok: false };
    const values = filters.status;
    if (values.some((value) => !validScalarString(value) || !RECORD_STATUSES.has(value as RecordStatus))) {
      return { ok: false };
    }
    if (new Set(values).size !== values.length) return { ok: false };
    status = values as RecordStatus[];
  }

  const jurisdiction = validateFacet(filters.jurisdiction);
  const documentType = validateFacet(filters.documentType);
  const authorityLevel = validateFacet(filters.authorityLevel);
  if (jurisdiction === null || documentType === null || authorityLevel === null) return { ok: false };
  if (filters.sensitivityClearance !== undefined && typeof filters.sensitivityClearance !== 'boolean') {
    return { ok: false };
  }

  const effectiveServerFilters: FilterParams = { sensitivityClearance: false };
  if (status !== undefined) effectiveServerFilters.status = status;
  if (jurisdiction !== undefined) effectiveServerFilters.jurisdiction = jurisdiction;
  if (documentType !== undefined) effectiveServerFilters.documentType = documentType;
  if (authorityLevel !== undefined) effectiveServerFilters.authorityLevel = authorityLevel;
  return { ok: true, value: { query, corpusId, effectiveServerFilters } };
}

function validGregorianDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function validNormalizedPath(value: unknown): value is string {
  if (!validScalarString(value) || !value || value.trim() !== value) return false;
  if (value.startsWith('/') || value.includes('\\') || CONTROL_PATTERN.test(value)) return false;
  if (utf8ByteLength(value) > 1024) return false;
  const segments = value.split('/');
  return segments.every((segment) => segment !== '' && segment !== '.' && segment !== '..');
}

function validatePublicRecord(raw: Record<string, unknown>): LpciIndexRecord | null {
  if (!validNormalizedPath(raw.normalizedPath)) return null;
  if (!validScalarString(raw.status) || !RECORD_STATUSES.has(raw.status as RecordStatus)) return null;
  if (!validScalarString(raw.answerClass) || !ANSWER_CLASSES.has(raw.answerClass as AnswerClass)) return null;
  if (!validGregorianDate(raw.effectiveDate)) return null;
  if (raw.authorityLevel !== undefined) {
    if (!validScalarString(raw.authorityLevel) || !raw.authorityLevel.trim() || utf8ByteLength(raw.authorityLevel) > 128) {
      return null;
    }
  }
  if (raw.contentSnippet !== undefined) {
    if (!validScalarString(raw.contentSnippet)) return null;
    const snippet = raw.contentSnippet.trim();
    if (!snippet || Array.from(snippet).length > MAX_SNIPPET_CODE_POINTS) return null;
    raw = { ...raw, contentSnippet: snippet };
  }
  return raw as unknown as LpciIndexRecord;
}

export function parseAndAdmitPublicIndex(rawText: string): IndexAdmissionResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return { ok: false, sensitivityPreFilterApplied: false };
  }
  if (!Array.isArray(parsed) || parsed.some((row) => !isObject(row))) {
    return { ok: false, sensitivityPreFilterApplied: false };
  }

  const rows = parsed as Array<Record<string, unknown>>;
  const sensitivity: SensitivityLevel[] = [];
  for (const row of rows) {
    const value = row.sensitivityLevel ?? 'unknown';
    if (!validScalarString(value) || !SENSITIVITY_LEVELS.has(value as SensitivityLevel)) {
      return { ok: false, sensitivityPreFilterApplied: false };
    }
    sensitivity.push(value as SensitivityLevel);
  }

  const publicRows = rows.filter((_, index) => sensitivity[index] === 'public');
  if (rows.length > 0 && publicRows.length === 0) {
    return { ok: true, records: [], filteredOut: true };
  }
  const records: LpciIndexRecord[] = [];
  for (const row of publicRows) {
    const record = validatePublicRecord(row);
    if (!record) return { ok: false, sensitivityPreFilterApplied: true };
    records.push(record);
  }
  return { ok: true, records, filteredOut: false };
}

function assertSerializable(value: unknown): void {
  if (typeof value === 'string') {
    if (!hasOnlyUnicodeScalars(value)) throw new Error('non-scalar string');
    return;
  }
  if (value === null || typeof value === 'boolean') return;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('non-finite number');
    return;
  }
  if (Array.isArray(value)) {
    value.forEach(assertSerializable);
    return;
  }
  if (isObject(value)) {
    Object.values(value).forEach(assertSerializable);
    return;
  }
  throw new Error('unsupported JSON value');
}

export function serializeExactJson(value: unknown): string {
  assertSerializable(value);
  return JSON.stringify(value);
}

export function buildModelEvidenceProjection(records: LpciIndexRecord[]): ProjectionResult {
  if (records.length === 0 || records.length > MAX_EVIDENCE_RECORDS) return { ok: false };
  const projected = [];
  for (const record of records) {
    if (!validNormalizedPath(record.normalizedPath) || !validGregorianDate(record.effectiveDate)) return { ok: false };
    if (!RECORD_STATUSES.has(record.status) || !ANSWER_CLASSES.has(record.answerClass)) return { ok: false };
    if (!validScalarString(record.contentSnippet)) return { ok: false };
    const contentSnippet = record.contentSnippet.trim();
    if (!contentSnippet || Array.from(contentSnippet).length > MAX_SNIPPET_CODE_POINTS) return { ok: false };
    projected.push({
      normalizedPath: record.normalizedPath,
      effectiveDate: record.effectiveDate,
      status: record.status,
      answerClass: record.answerClass,
      contentSnippet,
    });
  }
  const projection: ModelEvidenceProjection = {
    schemaVersion: MODEL_EVIDENCE_SCHEMA_VERSION,
    records: projected,
  };
  let serialized: string;
  try {
    serialized = serializeExactJson(projection);
  } catch {
    return { ok: false };
  }
  const utf8Bytes = utf8ByteLength(serialized);
  if (utf8Bytes > MAX_PROJECTION_BYTES) return { ok: false };
  return { ok: true, projection, serialized, utf8Bytes };
}
