import { redirect } from 'next/navigation';

type RootSearchParams = Promise<Record<string, string | string[] | undefined>>;

const firstParam = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

export default async function RootPage({ searchParams }: { searchParams: RootSearchParams }) {
    const params = await searchParams;
    const template = firstParam(params.template);
    const category = firstParam(params.category);

    if (template) {
        redirect(`/home?template=${encodeURIComponent(template)}`);
    }

    if (category) {
        redirect(`/home?category=${encodeURIComponent(category)}`);
    }

    redirect('/home');
}
