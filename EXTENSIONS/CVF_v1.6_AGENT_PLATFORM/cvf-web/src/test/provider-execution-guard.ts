import {
  evaluateProviderExecutionAuthority,
  type ProviderExecutionGrant,
} from 'cvf-control-plane-foundation';
import {
  classifyAdapterDestination,
  type AdapterDestinationDecision,
} from 'cvf-model-gateway';

// EAFR-R7. Egress authority is decided by destination, never by provider
// identity. The previous control mapped six hardcoded hostnames to providers
// and returned the unwrapped fetch on a lookup miss, so every destination it
// had not been told about was permitted. That default is inverted here: a
// request either resolves to a permitted destination class, or it is denied
// before any network I/O.
//
// EAFR-R10. Destination classification is no longer duplicated here. This
// guard consumes the single, gateway-owned `classifyAdapterDestination` from
// `cvf-model-gateway` (already a dependency of this package) so that both the
// gateway adapter and this test guard share one source of truth for what
// counts as a permitted non-provider destination, a known provider endpoint,
// or a denied destination.

function requestUrl(input: RequestInfo | URL): string {
  if (input instanceof Request) return input.url;
  if (input instanceof URL) return input.toString();
  return String(input);
}

/**
 * Classify a request destination through the shared gateway policy. A thin
 * `Request`-to-string compatibility wrapper only; no classification logic or
 * provider-host data is defined in this file.
 */
export function classifyDestination(input: RequestInfo | URL): AdapterDestinationDecision {
  return classifyAdapterDestination(requestUrl(input));
}

function parseGrant(raw: string | undefined): ProviderExecutionGrant | undefined {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as ProviderExecutionGrant;
  } catch {
    return undefined;
  }
}

export function createProviderExecutionFetchGuard(
  fetchImpl: typeof fetch,
  env: Readonly<Record<string, string | undefined>> = process.env,
  now: () => Date = () => new Date(),
): typeof fetch {
  let consumedCalls = 0;

  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const decision = classifyDestination(input);

    if (decision.kind === 'deny') {
      throw new Error(`CVF_PROVIDER_EXECUTION_DENIED: ${decision.reason}`);
    }

    if (decision.kind === 'permit-non-provider') {
      return fetchImpl(input, init);
    }

    const grant = parseGrant(env.CVF_PROVIDER_EXECUTION_GRANT_JSON);
    const result = evaluateProviderExecutionAuthority(grant, {
      workerAgentId: env.CVF_AGENT_ID ?? '',
      delegationId: env.CVF_DELEGATION_ID ?? '',
      grantId: env.CVF_PROVIDER_EXECUTION_GRANT_ID ?? '',
      provider: decision.provider,
      consumedCalls,
      nowIso: now().toISOString(),
    });
    if (!result.allowed) {
      throw new Error(`CVF_PROVIDER_EXECUTION_DENIED: ${result.reason}`);
    }
    consumedCalls += 1;
    return fetchImpl(input, init);
  }) as typeof fetch;
}
