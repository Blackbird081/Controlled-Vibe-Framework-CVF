'use client';

import { useState, useEffect } from 'react';

interface MobileMenuProps {
    children: React.ReactNode;
    isOpen: boolean;
    onClose: () => void;
}

// Mobile slide-in menu
export function MobileMenu({ children, isOpen, onClose }: MobileMenuProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-40 md:hidden"
                onClick={onClose}
            />
            {/* Menu */}
            <div className="fixed right-0 top-0 h-full w-72 bg-white dark:bg-gray-900 shadow-xl z-50 md:hidden transform transition-transform animate-slide-in">
                <div className="p-4">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                    >
                        ✕
                    </button>
                    <nav className="mt-8 space-y-2">
                        {children}
                    </nav>
                </div>
            </div>
        </>
    );
}

// Mobile menu item
export function MobileMenuItem({
    icon,
    label,
    onClick,
    active = false,
    gradient
}: {
    icon: string;
    label: string;
    onClick: () => void;
    active?: boolean;
    gradient?: string;
}) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all
                       ${active
                    ? gradient
                        ? `bg-gradient-to-r ${gradient} text-white`
                        : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
        >
            <span className="text-xl">{icon}</span>
            <span className="font-medium">{label}</span>
        </button>
    );
}

// Hamburger menu button
export function HamburgerButton({ onClick, isOpen }: { onClick: () => void; isOpen: boolean }) {
    return (
        <button
            onClick={onClick}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg md:hidden"
            aria-label="Menu"
        >
            <div className="w-6 h-5 flex flex-col justify-between">
                <span className={`block h-0.5 bg-current transform transition-all ${isOpen ? 'rotate-45 translate-y-2' : ''}`} />
                <span className={`block h-0.5 bg-current transition-opacity ${isOpen ? 'opacity-0' : ''}`} />
                <span className={`block h-0.5 bg-current transform transition-all ${isOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </div>
        </button>
    );
}

// Bottom navigation for mobile
export function BottomNav({
    items,
    activeItem,
    onItemClick
}: {
    items: { id: string; icon: string; label: string }[];
    activeItem: string;
    onItemClick: (id: string) => void;
}) {
    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 md:hidden z-30 safe-area-pb">
            <div className="flex justify-around items-center py-2">
                {items.map(item => (
                    <button
                        key={item.id}
                        onClick={() => onItemClick(item.id)}
                        className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px]
                                   ${activeItem === item.id
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-gray-500 dark:text-gray-400'
                            }`}
                    >
                        <span className="text-xl">{item.icon}</span>
                        <span className="text-xs font-medium">{item.label}</span>
                    </button>
                ))}
            </div>
        </nav>
    );
}

// Hook for responsive detection
export function useIsMobile(breakpoint: number = 768) {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < breakpoint);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, [breakpoint]);

    return isMobile;
}

// Swipeable modal (for touch gestures)
export function SwipeableModal({
    children,
    isOpen,
    onClose,
    title
}: {
    children: React.ReactNode;
    isOpen: boolean;
    onClose: () => void;
    title?: string;
}) {
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientY);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientY);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchEnd - touchStart;
        if (distance > minSwipeDistance) {
            onClose(); // Swipe down to close
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 md:flex md:items-center md:justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div
                className="absolute bottom-0 left-0 right-0 md:relative md:max-w-lg md:w-full 
                          bg-white dark:bg-gray-900 rounded-t-2xl md:rounded-xl 
                          max-h-[90vh] overflow-hidden shadow-xl"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                {/* Drag handle */}
                <div className="flex justify-center py-2 md:hidden">
                    <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
                </div>

                {title && (
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <h3 className="font-bold text-lg">{title}</h3>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                            ✕
                        </button>
                    </div>
                )}

                <div className="overflow-auto max-h-[80vh]">
                    {children}
                </div>
            </div>
        </div>
    );
}

// Responsive card grid
export function ResponsiveGrid({
    children,
    cols = { sm: 1, md: 2, lg: 3 }
}: {
    children: React.ReactNode;
    cols?: { sm: number; md: number; lg: number };
}) {
    return (
        <div className={`grid gap-4 
                        grid-cols-${cols.sm} 
                        md:grid-cols-${cols.md} 
                        lg:grid-cols-${cols.lg}`}>
            {children}
        </div>
    );
}
