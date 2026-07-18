import { isPolicyAllowed, type GatewayPolicyContext } from "./gateway-policy";
import { ProviderHealthMonitor } from "./provider-health";
import { ProviderRegistry } from "./provider-registry";
import { QuotaLedger } from "./quota-ledger";
import type {
  GatewayEmbeddingRequest,
  GatewayEmbeddingResponse,
  GatewayErrorEnvelope,
  GatewayExecuteRequest,
  GatewayExecuteResponse,
  GatewayHealthResponse,
  GatewayStreamChunk,
  GatewayStreamRequest,
  UnifiedGatewayInterfaceContract,
} from "./unified-gateway-interface-contract";

export interface UnifiedGatewaySkeletonOptions {
  registry: ProviderRegistry;
  health: ProviderHealthMonitor;
  quota: QuotaLedger;
  localExecuteFn?: (request: GatewayExecuteRequest) => Promise<string>;
  now?: () => Date;
}

function makeDeniedEnvelope(traceId: string): GatewayErrorEnvelope {
  return {
    errorClass: "policy_denied",
    traceId,
    message: "Request denied by gateway policy.",
    credentialShielded: true,
    providerIdShielded: true,
    retryable: false,
  };
}

export class UnifiedGatewaySkeletonImpl implements UnifiedGatewayInterfaceContract {
  private readonly _registry: ProviderRegistry;
  private readonly _health: ProviderHealthMonitor;
  private readonly _quota: QuotaLedger;
  private readonly _localExecuteFn?: (request: GatewayExecuteRequest) => Promise<string>;
  private readonly _now: () => Date;

  constructor(options: UnifiedGatewaySkeletonOptions) {
    this._registry = options.registry;
    this._health = options.health;
    this._quota = options.quota;
    this._localExecuteFn = options.localExecuteFn;
    this._now = options.now ?? (() => new Date());
  }

  async execute(
    request: GatewayExecuteRequest,
  ): Promise<GatewayExecuteResponse | GatewayErrorEnvelope> {
    if (!isPolicyAllowed(request.policy)) {
      return makeDeniedEnvelope(request.traceId);
    }
    const text = this._localExecuteFn
      ? await this._localExecuteFn(request)
      : "";
    const response: GatewayExecuteResponse = {
      traceId: request.traceId,
      text,
      receiptObligation: "skeleton_execute_receipt_required",
    };
    return response;
  }

  async *stream(
    request: GatewayStreamRequest,
  ): AsyncGenerator<GatewayStreamChunk | GatewayErrorEnvelope> {
    if (!isPolicyAllowed(request.policy)) {
      yield makeDeniedEnvelope(request.traceId);
      return;
    }
    const text = this._localExecuteFn
      ? await this._localExecuteFn(request)
      : "";
    yield {
      traceId: request.traceId,
      chunk: text,
      done: true,
      receiptObligation: "skeleton_stream_receipt_required",
    } satisfies GatewayStreamChunk;
  }

  async embedding(
    request: GatewayEmbeddingRequest,
  ): Promise<GatewayEmbeddingResponse | GatewayErrorEnvelope> {
    if (!isPolicyAllowed(request.policy)) {
      return makeDeniedEnvelope(request.traceId);
    }
    const response: GatewayEmbeddingResponse = {
      traceId: request.traceId,
      embeddings: [[0, 0, 0]],
      dimensions: 3,
      receiptObligation: "skeleton_embedding_receipt_required",
    };
    return response;
  }

  async health(traceId: string): Promise<GatewayHealthResponse> {
    const providers = this._registry.listAll();
    const summary: Record<string, import("./provider-health").ProviderHealthState> = {};
    for (const provider of providers) {
      summary[provider.id] = this._health.get(provider.id).state;
    }
    const states = Object.values(summary);
    let status: "ok" | "degraded" | "unavailable";
    if (states.length === 0 || states.every((s) => s === "unavailable")) {
      status = "unavailable";
    } else if (states.some((s) => s === "degraded" || s === "rate_limited")) {
      status = "degraded";
    } else {
      status = "ok";
    }
    return {
      traceId,
      status,
      providerHealthSummary: summary,
      checkedAt: this._now().toISOString(),
    };
  }
}
