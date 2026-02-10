'use client';

interface SidebarToggleProps {
    onClick?: () => void;
}

export default function SidebarToggle({ onClick }: SidebarToggleProps) {
    return (
        <button
            onClick={onClick}
            aria-label="Open sidebar"
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
            ☰
        </button>
    );
}
