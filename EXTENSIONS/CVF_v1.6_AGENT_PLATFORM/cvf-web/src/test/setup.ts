import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { loadLocalEnvFiles } from './load-local-env';
import { createProviderExecutionFetchGuard } from './provider-execution-guard';

loadLocalEnvFiles();

// EAFR-R8. External-store access is a delegated capability, exactly like
// provider traffic: it must not follow from merely finding ambient credentials
// in a local env file. `CVF_RATE_LIMIT_STORE=redis`, `CVF_STORAGE_ADAPTER_TYPE`
// and the Upstash REST variables are legitimate local-development
// configuration, but they must not cause a non-live test run to select or
// construct a live external client.
//
// Reviewer correction (2026-08-26): the first version of this block gated
// clearing on `CVF_ALLOW_LIVE_TESTS === '1'` and the R8 return described that
// as an opt-in that "restores deliberate live external-store use". That claim
// was false. `CVF_ALLOW_LIVE_TESTS` is not read by
// `provider-execution-guard.ts`; the guard denies the Upstash destination
// unconditionally regardless of this variable, and the guard is not writable
// in this manifest. Setting `CVF_ALLOW_LIVE_TESTS=1` therefore reintroduced
// the ambient values while granting no real execution authority over them --
// exactly the selection/execution coupling EAFR-R1E separated. The
// clearing below is now unconditional for this reason: no in-manifest signal
// can legitimately gate it. Clearing the store selector, not only the
// credentials, matters: `getRateLimitBackendStatus` treats "redis requested
// but unconfigured" as a blocked backend, not a fallback, so clearing only the
// credentials denies every request instead of using the existing in-process
// fakes (`MemoryRateLimitStore`, `FileEventListAdapter`). Clearing the
// selector as well restores the code's own default fallback with no source
// change to either module.
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;
delete process.env.CVF_RATE_LIMIT_STORE;
delete process.env.CVF_STORAGE_ADAPTER_TYPE;

// Provider traffic is a delegated capability, not a consequence of collecting
// a live test or finding an ambient API key. The orchestrator must inject a
// bounded grant whose subject, delegation, provider, expiry, and call budget
// all match. Without it, known provider hosts fail before the network call.
globalThis.fetch = createProviderExecutionFetchGuard(globalThis.fetch.bind(globalThis));

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

if (!HTMLElement.prototype.scrollIntoView) {
    HTMLElement.prototype.scrollIntoView = () => { };
}

if (!window.matchMedia) {
    window.matchMedia = ((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => { },
        removeListener: () => { },
        addEventListener: () => { },
        removeEventListener: () => { },
        dispatchEvent: () => false,
    })) as typeof window.matchMedia;
}

Object.defineProperty(navigator, 'clipboard', {
    value: {
        writeText: vi.fn(),
    },
    configurable: true,
});

window.alert = vi.fn();
window.confirm = vi.fn(() => true);
