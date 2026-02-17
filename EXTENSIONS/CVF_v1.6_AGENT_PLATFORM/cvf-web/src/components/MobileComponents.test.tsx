/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import {
    MobileMenu,
    MobileMenuItem,
    HamburgerButton,
    BottomNav,
    useIsMobile,
    SwipeableModal,
    ResponsiveGrid,
} from './MobileComponents';

/* -------------------------------------------------------------------------- */
/*  MobileMenu                                                                 */
/* -------------------------------------------------------------------------- */

describe('MobileMenu', () => {
    afterEach(() => {
        document.body.style.overflow = '';
    });

    it('renders nothing when isOpen is false', () => {
        const { container } = render(
            <MobileMenu isOpen={false} onClose={vi.fn()}>
                <span>Menu Content</span>
            </MobileMenu>
        );
        expect(container.innerHTML).toBe('');
    });

    it('renders children when isOpen is true', () => {
        render(
            <MobileMenu isOpen={true} onClose={vi.fn()}>
                <span>Menu Content</span>
            </MobileMenu>
        );
        expect(screen.getByText('Menu Content')).toBeTruthy();
    });

    it('renders close button', () => {
        render(
            <MobileMenu isOpen={true} onClose={vi.fn()}>
                <span>Child</span>
            </MobileMenu>
        );
        expect(screen.getByText('✕')).toBeTruthy();
    });

    it('calls onClose when close button is clicked', () => {
        const onClose = vi.fn();
        render(
            <MobileMenu isOpen={true} onClose={onClose}>
                <span>Child</span>
            </MobileMenu>
        );
        fireEvent.click(screen.getByText('✕'));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop is clicked', () => {
        const onClose = vi.fn();
        const { container } = render(
            <MobileMenu isOpen={true} onClose={onClose}>
                <span>Child</span>
            </MobileMenu>
        );
        // Backdrop is the first child div with bg-black/50
        const backdrop = container.querySelector('.bg-black\\/50');
        expect(backdrop).toBeTruthy();
        fireEvent.click(backdrop!);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('locks body scroll when open', () => {
        const { rerender } = render(
            <MobileMenu isOpen={true} onClose={vi.fn()}>
                <span>Child</span>
            </MobileMenu>
        );
        expect(document.body.style.overflow).toBe('hidden');

        rerender(
            <MobileMenu isOpen={false} onClose={vi.fn()}>
                <span>Child</span>
            </MobileMenu>
        );
        expect(document.body.style.overflow).toBe('');
    });

    it('restores body scroll on unmount', () => {
        const { unmount } = render(
            <MobileMenu isOpen={true} onClose={vi.fn()}>
                <span>Child</span>
            </MobileMenu>
        );
        expect(document.body.style.overflow).toBe('hidden');
        unmount();
        expect(document.body.style.overflow).toBe('');
    });
});

/* -------------------------------------------------------------------------- */
/*  MobileMenuItem                                                             */
/* -------------------------------------------------------------------------- */

describe('MobileMenuItem', () => {
    it('renders icon and label', () => {
        render(
            <MobileMenuItem icon="🏠" label="Home" onClick={vi.fn()} />
        );
        expect(screen.getByText('🏠')).toBeTruthy();
        expect(screen.getByText('Home')).toBeTruthy();
    });

    it('calls onClick when clicked', () => {
        const onClick = vi.fn();
        render(
            <MobileMenuItem icon="🏠" label="Home" onClick={onClick} />
        );
        fireEvent.click(screen.getByText('Home'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('applies active styles when active=true', () => {
        const { container } = render(
            <MobileMenuItem icon="🏠" label="Home" onClick={vi.fn()} active={true} />
        );
        const button = container.querySelector('button');
        expect(button?.className).toContain('bg-blue-100');
    });

    it('applies gradient when active with gradient prop', () => {
        const { container } = render(
            <MobileMenuItem
                icon="🏠"
                label="Home"
                onClick={vi.fn()}
                active={true}
                gradient="from-blue-500 to-purple-500"
            />
        );
        const button = container.querySelector('button');
        expect(button?.className).toContain('bg-gradient-to-r');
        expect(button?.className).toContain('from-blue-500 to-purple-500');
    });

    it('applies hover styles when not active', () => {
        const { container } = render(
            <MobileMenuItem icon="🏠" label="Home" onClick={vi.fn()} active={false} />
        );
        const button = container.querySelector('button');
        expect(button?.className).toContain('hover:bg-gray-100');
    });

    it('renders as full-width button', () => {
        const { container } = render(
            <MobileMenuItem icon="🏠" label="Home" onClick={vi.fn()} />
        );
        const button = container.querySelector('button');
        expect(button?.className).toContain('w-full');
    });
});

/* -------------------------------------------------------------------------- */
/*  HamburgerButton                                                            */
/* -------------------------------------------------------------------------- */

describe('HamburgerButton', () => {
    it('renders with aria-label', () => {
        render(<HamburgerButton onClick={vi.fn()} isOpen={false} />);
        expect(screen.getByLabelText('Menu')).toBeTruthy();
    });

    it('calls onClick when clicked', () => {
        const onClick = vi.fn();
        render(<HamburgerButton onClick={onClick} isOpen={false} />);
        fireEvent.click(screen.getByLabelText('Menu'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('renders 3 lines for hamburger icon', () => {
        const { container } = render(
            <HamburgerButton onClick={vi.fn()} isOpen={false} />
        );
        const spans = container.querySelectorAll('span');
        expect(spans.length).toBe(3);
    });

    it('applies transform classes when isOpen=true', () => {
        const { container } = render(
            <HamburgerButton onClick={vi.fn()} isOpen={true} />
        );
        const spans = container.querySelectorAll('span');
        expect(spans[0].className).toContain('rotate-45');
        expect(spans[1].className).toContain('opacity-0');
        expect(spans[2].className).toContain('-rotate-45');
    });

    it('does not apply transform classes when isOpen=false', () => {
        const { container } = render(
            <HamburgerButton onClick={vi.fn()} isOpen={false} />
        );
        const spans = container.querySelectorAll('span');
        expect(spans[0].className).not.toContain('rotate-45');
        expect(spans[1].className).not.toContain('opacity-0');
        expect(spans[2].className).not.toContain('-rotate-45');
    });

    it('is hidden on md+ screens via className', () => {
        const { container } = render(
            <HamburgerButton onClick={vi.fn()} isOpen={false} />
        );
        const button = container.querySelector('button');
        expect(button?.className).toContain('md:hidden');
    });
});

/* -------------------------------------------------------------------------- */
/*  BottomNav                                                                  */
/* -------------------------------------------------------------------------- */

describe('BottomNav', () => {
    const navItems = [
        { id: 'home', icon: '🏠', label: 'Home' },
        { id: 'chat', icon: '💬', label: 'Chat' },
        { id: 'settings', icon: '⚙️', label: 'Settings' },
    ];

    it('renders all nav items', () => {
        render(
            <BottomNav items={navItems} activeItem="home" onItemClick={vi.fn()} />
        );
        expect(screen.getByText('Home')).toBeTruthy();
        expect(screen.getByText('Chat')).toBeTruthy();
        expect(screen.getByText('Settings')).toBeTruthy();
    });

    it('renders icons for each item', () => {
        render(
            <BottomNav items={navItems} activeItem="home" onItemClick={vi.fn()} />
        );
        expect(screen.getByText('🏠')).toBeTruthy();
        expect(screen.getByText('💬')).toBeTruthy();
        expect(screen.getByText('⚙️')).toBeTruthy();
    });

    it('calls onItemClick with correct id when clicked', () => {
        const onItemClick = vi.fn();
        render(
            <BottomNav items={navItems} activeItem="home" onItemClick={onItemClick} />
        );
        fireEvent.click(screen.getByText('Chat'));
        expect(onItemClick).toHaveBeenCalledWith('chat');
    });

    it('highlights active item with blue color', () => {
        const { container } = render(
            <BottomNav items={navItems} activeItem="chat" onItemClick={vi.fn()} />
        );
        const buttons = container.querySelectorAll('button');
        // chat is at index 1
        expect(buttons[1].className).toContain('text-blue-600');
        // home is not active
        expect(buttons[0].className).toContain('text-gray-500');
    });

    it('is fixed to bottom and hidden on md+', () => {
        const { container } = render(
            <BottomNav items={navItems} activeItem="home" onItemClick={vi.fn()} />
        );
        const nav = container.querySelector('nav');
        expect(nav?.className).toContain('fixed');
        expect(nav?.className).toContain('bottom-0');
        expect(nav?.className).toContain('md:hidden');
    });

    it('handles single item', () => {
        render(
            <BottomNav
                items={[{ id: 'solo', icon: '🎯', label: 'Solo' }]}
                activeItem="solo"
                onItemClick={vi.fn()}
            />
        );
        expect(screen.getByText('Solo')).toBeTruthy();
    });
});

/* -------------------------------------------------------------------------- */
/*  useIsMobile hook                                                           */
/* -------------------------------------------------------------------------- */

describe('useIsMobile', () => {
    let originalInnerWidth: number;

    beforeEach(() => {
        originalInnerWidth = window.innerWidth;
    });

    afterEach(() => {
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: originalInnerWidth,
        });
    });

    function TestComponent({ breakpoint }: { breakpoint?: number }) {
        const isMobile = useIsMobile(breakpoint);
        return <div data-testid="result">{isMobile ? 'mobile' : 'desktop'}</div>;
    }

    it('returns false for wide viewport (default breakpoint 768)', () => {
        Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true });
        render(<TestComponent />);
        expect(screen.getByTestId('result').textContent).toBe('desktop');
    });

    it('returns true for narrow viewport', () => {
        Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true });
        render(<TestComponent />);
        expect(screen.getByTestId('result').textContent).toBe('mobile');
    });

    it('uses custom breakpoint', () => {
        Object.defineProperty(window, 'innerWidth', { value: 900, configurable: true });
        render(<TestComponent breakpoint={1024} />);
        expect(screen.getByTestId('result').textContent).toBe('mobile');
    });

    it('responds to resize events', () => {
        Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true });
        render(<TestComponent />);
        expect(screen.getByTestId('result').textContent).toBe('desktop');

        act(() => {
            Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true });
            window.dispatchEvent(new Event('resize'));
        });
        expect(screen.getByTestId('result').textContent).toBe('mobile');
    });

    it('cleans up resize listener on unmount', () => {
        const removeSpy = vi.spyOn(window, 'removeEventListener');
        const { unmount } = render(<TestComponent />);
        unmount();
        expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function));
        removeSpy.mockRestore();
    });
});

/* -------------------------------------------------------------------------- */
/*  SwipeableModal                                                             */
/* -------------------------------------------------------------------------- */

describe('SwipeableModal', () => {
    it('renders nothing when isOpen is false', () => {
        const { container } = render(
            <SwipeableModal isOpen={false} onClose={vi.fn()}>
                <span>Modal Content</span>
            </SwipeableModal>
        );
        expect(container.innerHTML).toBe('');
    });

    it('renders children when isOpen is true', () => {
        render(
            <SwipeableModal isOpen={true} onClose={vi.fn()}>
                <span>Modal Content</span>
            </SwipeableModal>
        );
        expect(screen.getByText('Modal Content')).toBeTruthy();
    });

    it('renders title when provided', () => {
        render(
            <SwipeableModal isOpen={true} onClose={vi.fn()} title="My Modal">
                <span>Content</span>
            </SwipeableModal>
        );
        expect(screen.getByText('My Modal')).toBeTruthy();
    });

    it('does not render title section when no title', () => {
        const { container } = render(
            <SwipeableModal isOpen={true} onClose={vi.fn()}>
                <span>Content</span>
            </SwipeableModal>
        );
        expect(container.querySelector('h3')).toBeNull();
    });

    it('calls onClose when backdrop is clicked', () => {
        const onClose = vi.fn();
        const { container } = render(
            <SwipeableModal isOpen={true} onClose={onClose}>
                <span>Content</span>
            </SwipeableModal>
        );
        const backdrop = container.querySelector('.bg-black\\/50');
        expect(backdrop).toBeTruthy();
        fireEvent.click(backdrop!);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when title close button is clicked', () => {
        const onClose = vi.fn();
        render(
            <SwipeableModal isOpen={true} onClose={onClose} title="Test">
                <span>Content</span>
            </SwipeableModal>
        );
        // There's a ✕ close button in the title bar
        const closeButtons = screen.getAllByText('✕');
        fireEvent.click(closeButtons[0]);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('renders drag handle for mobile', () => {
        const { container } = render(
            <SwipeableModal isOpen={true} onClose={vi.fn()}>
                <span>Content</span>
            </SwipeableModal>
        );
        // Drag handle is a small rounded div
        const dragHandle = container.querySelector('.w-12.h-1\\.5');
        expect(dragHandle).toBeTruthy();
    });

    it('calls onClose on swipe down gesture', () => {
        const onClose = vi.fn();
        const { container } = render(
            <SwipeableModal isOpen={true} onClose={onClose}>
                <span>Content</span>
            </SwipeableModal>
        );

        // Find the modal content div (the one with touch handlers)
        const modalContent = container.querySelector('.rounded-t-2xl');
        expect(modalContent).toBeTruthy();

        // Simulate swipe down (start at y=100, end at y=200 = 100px distance > 50px threshold)
        fireEvent.touchStart(modalContent!, {
            targetTouches: [{ clientY: 100 }],
        });
        fireEvent.touchMove(modalContent!, {
            targetTouches: [{ clientY: 200 }],
        });
        fireEvent.touchEnd(modalContent!);

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does NOT close on swipe up', () => {
        const onClose = vi.fn();
        const { container } = render(
            <SwipeableModal isOpen={true} onClose={onClose}>
                <span>Content</span>
            </SwipeableModal>
        );

        const modalContent = container.querySelector('.rounded-t-2xl');

        fireEvent.touchStart(modalContent!, {
            targetTouches: [{ clientY: 200 }],
        });
        fireEvent.touchMove(modalContent!, {
            targetTouches: [{ clientY: 100 }],
        });
        fireEvent.touchEnd(modalContent!);

        expect(onClose).not.toHaveBeenCalled();
    });

    it('does NOT close on short swipe (below threshold)', () => {
        const onClose = vi.fn();
        const { container } = render(
            <SwipeableModal isOpen={true} onClose={onClose}>
                <span>Content</span>
            </SwipeableModal>
        );

        const modalContent = container.querySelector('.rounded-t-2xl');

        fireEvent.touchStart(modalContent!, {
            targetTouches: [{ clientY: 100 }],
        });
        fireEvent.touchMove(modalContent!, {
            targetTouches: [{ clientY: 130 }], // Only 30px, below 50px threshold
        });
        fireEvent.touchEnd(modalContent!);

        expect(onClose).not.toHaveBeenCalled();
    });
});

/* -------------------------------------------------------------------------- */
/*  ResponsiveGrid                                                             */
/* -------------------------------------------------------------------------- */

describe('ResponsiveGrid', () => {
    it('renders children', () => {
        render(
            <ResponsiveGrid>
                <div>Card 1</div>
                <div>Card 2</div>
                <div>Card 3</div>
            </ResponsiveGrid>
        );
        expect(screen.getByText('Card 1')).toBeTruthy();
        expect(screen.getByText('Card 2')).toBeTruthy();
        expect(screen.getByText('Card 3')).toBeTruthy();
    });

    it('applies default grid columns (sm:1, md:2, lg:3)', () => {
        const { container } = render(
            <ResponsiveGrid>
                <div>Card</div>
            </ResponsiveGrid>
        );
        const grid = container.firstElementChild;
        expect(grid?.className).toContain('grid');
        expect(grid?.className).toContain('gap-4');
        expect(grid?.className).toContain('grid-cols-1');
        expect(grid?.className).toContain('md:grid-cols-2');
        expect(grid?.className).toContain('lg:grid-cols-3');
    });

    it('applies custom grid columns', () => {
        const { container } = render(
            <ResponsiveGrid cols={{ sm: 2, md: 3, lg: 4 }}>
                <div>Card</div>
            </ResponsiveGrid>
        );
        const grid = container.firstElementChild;
        expect(grid?.className).toContain('grid-cols-2');
        expect(grid?.className).toContain('md:grid-cols-3');
        expect(grid?.className).toContain('lg:grid-cols-4');
    });
});
