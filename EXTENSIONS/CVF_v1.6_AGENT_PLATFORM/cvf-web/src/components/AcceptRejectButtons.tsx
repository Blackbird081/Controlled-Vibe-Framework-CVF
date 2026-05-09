'use client';

interface AcceptRejectButtonsProps {
    onAccept?: () => void;
    onReject?: () => void;
    onRetry?: () => void;
    language?: 'vi' | 'en';
}

export function AcceptRejectButtons({
    onAccept,
    onReject,
    onRetry,
    language = 'vi',
}: AcceptRejectButtonsProps) {
    return (
        <div className="mt-3 flex gap-2">
            <button
                onClick={onAccept}
                className="flex-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
            >
                <span>✓</span>
                <span>{language === 'vi' ? 'Chấp nhận' : 'Accept'}</span>
            </button>
            <button
                onClick={onRetry}
                className="flex-1 px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
            >
                <span>🔄</span>
                <span>{language === 'vi' ? 'Thử lại' : 'Retry'}</span>
            </button>
            <button
                onClick={onReject}
                className="flex-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
            >
                <span>✕</span>
                <span>{language === 'vi' ? 'Từ chối' : 'Reject'}</span>
            </button>
        </div>
    );
}
