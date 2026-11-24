// Text Encoding Exception: Vietnamese copy gives the user a sign-in recovery action.
import Link from 'next/link';

export function SignInNotice({ message, vi }: { message: string; vi: boolean }) {
    return (
        <div role="status" className="rounded-xl border border-slate-200 p-4 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-200">
            <p>{message}</p>
            <Link href="/login" className="mt-1 inline-flex min-h-11 items-center rounded font-semibold text-indigo-700 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:text-indigo-300">
                {vi ? 'Đăng nhập' : 'Sign in'}
            </Link>
        </div>
    );
}

export function SessionExpiredNotice({ vi }: { vi: boolean }) {
    return <SignInNotice
        vi={vi}
        message={vi ? 'Phiên đăng nhập đã hết, vui lòng đăng nhập lại.' : 'Your session has expired. Please sign in again.'}
    />;
}
