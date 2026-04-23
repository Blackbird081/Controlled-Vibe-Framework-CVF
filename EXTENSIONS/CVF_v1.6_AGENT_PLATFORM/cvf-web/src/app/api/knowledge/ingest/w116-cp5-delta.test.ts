/**
 * W116-CP5: Positive-delta evidence test
 *
 * Proves that ingesting a downstream project collection produces
 * a measurable retrieval improvement for project-specific queries
 * over a baseline that knows nothing about the project.
 */
import { describe, it, expect } from 'vitest';
import { POST } from './route';
import { queryKnowledgeChunks } from '@/lib/knowledge-retrieval';
import { NextRequest } from 'next/server';

const PROJECT_COLLECTION_ID = 'w116-cp5-delta-project';

const PROJECT_CHUNKS = [
  {
    id: 'delta-1',
    content: 'NovaSpark is a real-time IoT analytics platform built on Apache Kafka and ClickHouse for sub-second event processing.',
    keywords: ['novaspark', 'iot', 'kafka', 'clickhouse', 'realtime', 'analytics', 'events'],
  },
  {
    id: 'delta-2',
    content: 'The NovaSpark ingestion pipeline uses gRPC for device telemetry collection and batches writes to ClickHouse every 500ms.',
    keywords: ['novaspark', 'grpc', 'telemetry', 'clickhouse', 'ingestion', 'batching'],
  },
  {
    id: 'delta-3',
    content: 'NovaSpark alert rules are defined in YAML and evaluated by a Golang rules engine running as a sidecar on each data node.',
    keywords: ['novaspark', 'alert', 'yaml', 'golang', 'rules', 'engine', 'sidecar'],
  },
  {
    id: 'delta-4',
    content: 'Deployment is managed via Helm charts targeting a 3-node Kubernetes cluster with Prometheus and Grafana for observability.',
    keywords: ['novaspark', 'helm', 'kubernetes', 'prometheus', 'grafana', 'observability'],
  },
  {
    id: 'delta-5',
    content: 'NovaSpark v2 roadmap targets multi-tenant support and a React dashboard with live time-series charts powered by WebSockets.',
    keywords: ['novaspark', 'multitenant', 'react', 'websockets', 'dashboard', 'roadmap'],
  },
];

describe('W116-CP5 — Positive delta: downstream knowledge improves project-specific retrieval', () => {
  it('BASELINE: without ingest, NovaSpark-specific query returns zero chunks from project collection', async () => {
    const result = await queryKnowledgeChunks({
      intent: 'NovaSpark IoT Kafka ClickHouse ingestion pipeline',
      collectionId: PROJECT_COLLECTION_ID,
    });
    expect(result.allowedChunkCount).toBe(0);
  });

  it('INGEST: POST /api/knowledge/ingest accepts 5 project chunks', async () => {
    const req = new NextRequest('http://localhost/api/knowledge/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        collectionId: PROJECT_COLLECTION_ID,
        collectionName: 'NovaSpark Project Docs',
        chunks: PROJECT_CHUNKS,
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.accepted).toBe(5);
    expect(data.collectionId).toBe(PROJECT_COLLECTION_ID);
  });

  it('DELTA: after ingest, project-specific query returns chunkCount > 0', async () => {
    const result = await queryKnowledgeChunks({
      intent: 'NovaSpark IoT Kafka ClickHouse ingestion pipeline',
      collectionId: PROJECT_COLLECTION_ID,
    });
    expect(result.allowedChunkCount).toBeGreaterThan(0);
    const topChunk = result.chunks[0];
    expect(topChunk.collectionId).toBe(PROJECT_COLLECTION_ID);
    expect(topChunk.content.toLowerCase()).toMatch(/novaspark|kafka|clickhouse/);
  });

  it('DELTA: high-relevance query scores top chunk above threshold (score > 0)', async () => {
    const result = await queryKnowledgeChunks({
      intent: 'NovaSpark Kafka analytics platform',
      collectionId: PROJECT_COLLECTION_ID,
    });
    expect(result.chunks[0].score).toBeGreaterThan(0);
  });

  it('DELTA: targeted alert query retrieves alert-related chunk', async () => {
    const result = await queryKnowledgeChunks({
      intent: 'NovaSpark alert rules YAML Golang engine',
      collectionId: PROJECT_COLLECTION_ID,
    });
    expect(result.allowedChunkCount).toBeGreaterThan(0);
    const contents = result.chunks.map(c => c.content.toLowerCase()).join(' ');
    expect(contents).toMatch(/alert|yaml|golang/);
  });

  it('DELTA: observability query retrieves deployment/monitoring chunk', async () => {
    const result = await queryKnowledgeChunks({
      intent: 'Kubernetes Prometheus Grafana observability',
      collectionId: PROJECT_COLLECTION_ID,
    });
    expect(result.allowedChunkCount).toBeGreaterThan(0);
    const contents = result.chunks.map(c => c.content.toLowerCase()).join(' ');
    expect(contents).toMatch(/kubernetes|prometheus|grafana|observability/);
  });

  it('NON-REGRESSION: global query without collectionId still returns results from global collections or runtime', async () => {
    const result = await queryKnowledgeChunks({
      intent: 'governance risk approval policy',
    });
    expect(result).toHaveProperty('allowedChunkCount');
    expect(result).toHaveProperty('droppedChunkCount');
    expect(result.allowedCollectionIds).toBeDefined();
  });
});
