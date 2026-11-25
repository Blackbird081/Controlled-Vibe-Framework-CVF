import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import { HomeSpecClarificationProvider } from '@/components/home/HomeSpecClarification';
import { isOpenAIApiKeyConfigured } from '@/lib/openai-env';
import { hasHomeClarificationBudgetStore } from '@/lib/server/home-spec-clarification-budget';

export default async function HomeLayout({ children }: { children: ReactNode }) {
    const host = (await headers()).get('host') ?? '';
    const hostname = URL.parse(`http://${host}`)?.hostname ?? '';
    const availability = !isOpenAIApiKeyConfigured() ? 'missing_key'
        : hasHomeClarificationBudgetStore(hostname) ? 'ready' : 'unavailable';
    return <HomeSpecClarificationProvider availability={availability}>{children}</HomeSpecClarificationProvider>;
}
