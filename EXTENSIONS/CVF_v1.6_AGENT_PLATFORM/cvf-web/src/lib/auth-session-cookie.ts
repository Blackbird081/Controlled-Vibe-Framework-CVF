export function resolveAuthSessionCookie(request: Request): { secure: boolean; name: string } {
    // Match NextAuth's reqWithEnvURL before Auth.js selects its default cookie.
    const configuredUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL;
    const secure = new URL(configuredUrl || request.url).protocol === 'https:';
    const baseName = 'authjs.session-token';
    return { secure, name: secure ? `__Secure-${baseName}` : baseName };
}
