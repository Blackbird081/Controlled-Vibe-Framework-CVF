'use client';

import { useRouter } from 'next/navigation';
import { TemplateMarketplace } from '@/components';

export default function MarketplacePage() {
    const router = useRouter();

    return (
        <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
            <TemplateMarketplace onBack={() => router.push('/')} />
        </div>
    );
}
