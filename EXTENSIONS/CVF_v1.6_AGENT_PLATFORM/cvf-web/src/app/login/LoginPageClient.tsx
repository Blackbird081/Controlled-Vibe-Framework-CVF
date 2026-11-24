'use client';

// Text Encoding Exception: source-faithful Vietnamese login copy is required for the existing UI.

import { Suspense, useEffect, useState, useSyncExternalStore } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage, LanguageToggle } from '@/lib/i18n';
import { signIn, useSession } from 'next-auth/react';
import type { OAuthProviderId } from '@/lib/oauth-identity-profile';

interface LoginPageProps {
    localMockAllowed: boolean;
    selectedOAuthProvider: OAuthProviderId | null;
}

const subscribeToHydration = () => () => {};
const emptyUsername = () => '';
function readRememberedUsername() {
    try { return localStorage.getItem('cvf_login_username') ?? ''; }
    catch { return ''; }
}

function isInternalPath(path: string): boolean {
    return path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/\\')
        && !Array.from(path).some(character => {
            const code = character.charCodeAt(0);
            return code < 32 || (code >= 127 && code <= 159);
        });
}

function loginReturnPath(path: string | null, origin: string): string {
    if (!path || !isInternalPath(path)) return '/home';
    try {
        const url = new URL(path, origin);
        if (url.origin === origin && isInternalPath(decodeURIComponent(url.pathname))) return path;
    } catch {
        // The supplied path or its percent encoding is invalid.
    }
    return '/home';
}

function LoginPageContent({ localMockAllowed, selectedOAuthProvider }: LoginPageProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const from = typeof window === 'undefined' ? '/home' : loginReturnPath(searchParams.get('from'), window.location.origin);
    const { language, mounted } = useLanguage();
    const { status } = useSession();
    const isVi = language === 'vi';
    const isLocalMockLogin = localMockAllowed;

    const savedUsername = useSyncExternalStore(subscribeToHydration, readRememberedUsername, emptyUsername);
    const [editedUsername, setUsername] = useState<string | null>(null);
    const username = editedUsername ?? savedUsername;
    const [password, setPassword] = useState('');
    const [editedRemember, setRememberUsername] = useState<boolean | null>(null);
    const rememberUsername = editedRemember ?? Boolean(savedUsername);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (status === 'authenticated') {
            router.replace(from);
        }
    }, [from, router, status]);



    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const res = await signIn('credentials', {
                username,
                password,
                callbackUrl: from,
                redirect: false,
            });

            if (res?.error) {
                setError(isVi ? 'Đăng nhập thất bại. Vui lòng kiểm tra lại.' : 'Login failed. Invalid credentials.');
                setIsSubmitting(false);
                return;
            }

            if (rememberUsername) {
                localStorage.setItem('cvf_login_username', username);
            } else {
                localStorage.removeItem('cvf_login_username');
            }

            router.replace(from);
        } catch (err) {
            setError(err instanceof Error ? err.message : (isVi ? 'Lỗi mạng' : 'Network error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!mounted) return <div aria-busy="true" className="min-h-screen bg-gray-50 dark:bg-gray-900" />;
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
                {/* Language toggle */}
                <div className="flex justify-end mb-2">
                    <LanguageToggle />
                </div>

                <div className="text-center mb-6">
                    <div className="text-3xl">🔐</div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{isVi ? 'Đăng Nhập CVF' : 'CVF Login'}</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {isVi ? 'Đăng nhập để truy cập toàn bộ giao diện.' : 'Sign in to access the full interface.'}
                    </p>
                </div>

                {isLocalMockLogin ? <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="cvf-login-username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {isVi ? 'Tên đăng nhập' : 'Username'}
                        </label>
                        <input
                            id="cvf-login-username"
                            autoComplete="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            type="text"
                            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="cvf-login-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {isVi ? 'Mật khẩu' : 'Password'}
                        </label>
                        <input
                            id="cvf-login-password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            type={showPassword ? 'text' : 'password'}
                            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={rememberUsername}
                                onChange={(e) => setRememberUsername(e.target.checked)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            {isVi ? 'Nhớ tài khoản' : 'Remember username'}
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showPassword}
                                onChange={(e) => setShowPassword(e.target.checked)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            {isVi ? 'Hiện mật khẩu' : 'Show password'}
                        </label>
                    </div>
                    {rememberUsername && (
                        <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
                            {isVi ? 'Lưu ý: Chỉ lưu username, không lưu mật khẩu.' : 'Note: Only the username is saved, not the password.'}
                        </div>
                    )}

                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/30 px-3 py-2 rounded-lg">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting || status === 'loading'}
                        className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium transition-colors"
                    >
                        {status === 'loading'
                            ? (isVi ? 'Đang kiểm tra phiên...' : 'Checking session...')
                            : isSubmitting
                            ? (isVi ? 'Đang đăng nhập...' : 'Signing in...')
                            : (isVi ? 'Đăng nhập' : 'Sign in')}
                    </button>
                </form> : <div className="space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        {isVi ? 'Đăng nhập bằng nhà cung cấp đã cấu hình.' : 'Sign in with a configured provider.'}
                    </p>
                    {selectedOAuthProvider === 'github' && <button type="button" onClick={() => void signIn('github', { callbackUrl: from })} className="w-full rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700">
                        {isVi ? 'Đăng nhập bằng GitHub' : 'Sign in with GitHub'}
                    </button>}
                    {selectedOAuthProvider === 'google' && <button type="button" onClick={() => void signIn('google', { callbackUrl: from })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-600 dark:text-white">
                        {isVi ? 'Đăng nhập bằng Google' : 'Sign in with Google'}
                    </button>}
                    {!selectedOAuthProvider && <p className="text-sm text-red-600 dark:text-red-400">
                        {isVi ? 'Chưa cấu hình nhà cung cấp đăng nhập.' : 'No sign-in provider is configured.'}
                    </p>}
                </div>}

                {isLocalMockLogin && <div className="mt-6 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/60 rounded-lg px-3 py-2 space-y-1">
                    <p className="font-semibold mb-1">{isVi ? 'Tài khoản thực hành trên máy này' : 'Local practice accounts'}</p>
                    <p><strong>owner</strong> / owner123 ({isVi ? 'chủ tài khoản' : 'owner'})</p>
                    <p><strong>admin</strong> / admin123 ({isVi ? 'quản trị viên' : 'administrator'})</p>
                    <p><strong>dev</strong> / dev123 ({isVi ? 'người phát triển' : 'developer'})</p>
                    <p><strong>reviewer</strong> / reviewer123 ({isVi ? 'người duyệt' : 'reviewer'})</p>
                </div>}
            </div>
        </div>
    );
}

export default function LoginPageClient(props: LoginPageProps) {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-gray-900" />}>
            <LoginPageContent {...props} />
        </Suspense>
    );
}
