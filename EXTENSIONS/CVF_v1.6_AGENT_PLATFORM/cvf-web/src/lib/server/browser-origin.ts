const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

export function isLoopbackHostname(hostname: string): boolean {
    return LOOPBACK_HOSTS.has(hostname);
}

/** Checks the source of a state-changing browser request. */
export function isSameBrowserOrigin(request: Request): boolean {
    const origin = request.headers.get('origin');
    const site = request.headers.get('sec-fetch-site');
    if (!origin || (site !== null && site !== 'same-origin')) return false;

    try {
        const target = new URL(request.url);
        if (!isLoopbackHostname(target.hostname)) return origin === target.origin;

        // Next can normalize the local URL to localhost while retaining the browser's Host.
        const browser = new URL(origin);
        return origin === browser.origin
            && isLoopbackHostname(browser.hostname)
            && browser.host === request.headers.get('host')
            && browser.protocol === target.protocol
            && browser.port === target.port;
    } catch {
        return false;
    }
}
