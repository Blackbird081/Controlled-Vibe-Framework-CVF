/** Probe-only synthetic session owner. It stands in for Auth.js inside the bundled probe processes only;
 * actors resolved from it are LOCAL_TEST_SESSION and are not live login proof.
 */
export async function verifySessionCookie() {
    const raw = process.env.NIS_PROBE_SESSION;
    if (!raw) return null;
    return { ...JSON.parse(raw), authMode: 'session', expiresAt: Date.now() + 600000 };
}
