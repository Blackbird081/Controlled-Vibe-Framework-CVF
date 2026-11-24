'use client';
// Text Encoding Exception: Vietnamese labels and examples are user-facing Skills copy.

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChevronDown } from 'lucide-react';
import { getSkillCategories } from '../actions/skills';
import type { Skill, SkillCategory } from '../types/skill';
import { trackEvent } from '@/lib/analytics';
import { domainToCategoryMap, getTemplatesForSkill } from '@/lib/skill-template-map';
import { ASSF_PACKAGE_CATEGORY as AGENT_GROUP_ID, getTemplatesForAssfPackage } from '@/lib/assf-template-recommendations';
import { templates } from '@/lib/template-loader';
import { useLanguage } from '@/lib/i18n';
import { fetchSkillIndex, normalizeSkillSearch, skillCategoryName, skillContentInLanguage, skillCopy, skillDifficulty, skillPresentation, SkillSessionExpired } from '@/lib/skill-presentation';
import { SkillLoadMessage, skillReadingParts, SkillTechnicalDetails } from './SkillReading';

const focusClass = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:focus-visible:outline-indigo-300';
// Per-tab library state so returning from a skill detail route (browser Back)
// restores the query and selected skill instead of an empty library.
export const SKILL_LIBRARY_STATE_KEY = 'cvf_skill_library_state';

interface SavedLibraryState {
    searchTerm?: unknown;
    categoryId?: unknown;
    skillId?: unknown;
}

function readSavedLibraryState(): SavedLibraryState | null {
    try {
        const raw = window.sessionStorage.getItem(SKILL_LIBRARY_STATE_KEY);
        if (!raw) return null;
        const parsed: unknown = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed as SavedLibraryState : null;
    } catch {
        return null;
    }
}

export function SkillLibrary() {
    const router = useRouter();
    const { t, language } = useLanguage();
    const [categories, setCategories] = useState<SkillCategory[]>([]);
    const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [stateRestored, setStateRestored] = useState(false);
    const [agentGroupPreference, setAgentGroupPreference] = useState<boolean | null>(null);

    const vi = language === 'vi';
    const [loadError, setLoadError] = useState<'expired' | 'unavailable' | null>(null);
    const openDetail = useRef<HTMLButtonElement>(null);
    const focusDetail = useRef(false);

    useEffect(() => {
        let active = true;
        async function fetchSkills() {
            try {
                const data = await fetchSkillIndex().catch((error: unknown) => {
                    if (error instanceof SkillSessionExpired) throw error;
                    return getSkillCategories().then(categories => {
                        if (!categories.length) throw new Error('Skill fallback returned no categories');
                        return categories;
                    });
                });
                if (!active) return;
                setCategories(data);
                const saved = readSavedLibraryState();
                if (saved) {
                    if (typeof saved.searchTerm === 'string') setSearchTerm(saved.searchTerm);
                    const category = data.find(c => c.id === saved.categoryId);
                    const skill = category?.skills.find(s => s.id === saved.skillId);
                    if (category && skill) {
                        setSelectedSkill(skill);
                        setSelectedCategoryId(category.id);
                    }
                }
                setStateRestored(true);
            } catch (error) {
                if (active) setLoadError(error instanceof SkillSessionExpired ? 'expired' : 'unavailable');
            } finally {
                if (active) setLoading(false);
            }
        }
        void fetchSkills();
        return () => { active = false; };
    }, []);

    useEffect(() => {
        if (focusDetail.current && openDetail.current) {
            focusDetail.current = false;
            openDetail.current.focus();
        }
    }, [selectedSkill, selectedCategoryId]);
    useEffect(() => {
        if (!stateRestored) return;
        try {
            window.sessionStorage.setItem(SKILL_LIBRARY_STATE_KEY, JSON.stringify({
                searchTerm,
                categoryId: selectedCategoryId,
                skillId: selectedSkill?.id ?? null,
            }));
        } catch {
            // Storage unavailable (private mode, quota): library still works without restore.
        }
    }, [stateRestored, searchTerm, selectedCategoryId, selectedSkill]);


    const query = normalizeSkillSearch(searchTerm);
    const filteredCategories = categories.map(category => {
        const viName = skillCategoryName(category.id, category.name, true);
        const enName = skillCategoryName(category.id, category.name, false);
        const group = [category.id, viName, enName];
        const groupMatches = group.some(value => normalizeSkillSearch(value).includes(query));
        const skills = category.skills.filter(skill => {
            const copy = skillCopy[`${category.id}/${skill.id}`];
            return groupMatches || [skill.title, skill.id, copy?.title ?? '', copy?.hint.vi ?? '', copy?.hint.en ?? '']
                .some(value => normalizeSkillSearch(value).includes(query));
        });
        return { ...category, viName, enName, skills, total: category.skills.length };
    }).filter(category => category.skills.length > 0);
    const agentGroup = filteredCategories.find(category => category.id === AGENT_GROUP_ID);
    const displayedCategories = filteredCategories.filter(category => category.id !== AGENT_GROUP_ID);
    if (agentGroup) displayedCategories.push(agentGroup);
    const agentGroupExpanded = agentGroupPreference ?? Boolean(query && agentGroup);

    const selected = selectedSkill && selectedCategoryId
        ? skillPresentation(selectedCategoryId, selectedSkill, vi)
        : null;
    const reading = skillReadingParts(skillContentInLanguage(selectedSkill, selectedCategoryId, language), Boolean(selectedSkill?.assfProjectionClass));
    const selectedDomain = selectedSkill?.domain?.toLowerCase().replace(/ /g, '_') ?? '';
    const linkedTemplateIds = selectedSkill
        ? (selectedCategoryId === AGENT_GROUP_ID
            ? getTemplatesForAssfPackage(selectedSkill.id)
            : getTemplatesForSkill(selectedDomain, selectedSkill.id))
        : [];
    const linkedTemplates = linkedTemplateIds.map(id => templates.find(template => template.id === id)).filter(Boolean);
    const domainCategory = domainToCategoryMap[selectedDomain];
    const searchLabel = vi ? 'Tìm theo tên kỹ năng hoặc việc cần làm' : 'Search by skill name or task';

    function selectSkill(categoryId: string, skill: Skill, keyboard: boolean) {
        const shouldFocus = keyboard || window.matchMedia?.('(max-width: 767px)').matches;
        if (selectedSkill === skill && selectedCategoryId === categoryId) {
            if (shouldFocus) openDetail.current?.focus();
        } else {
            focusDetail.current = Boolean(shouldFocus);
            setSelectedSkill(skill);
            setSelectedCategoryId(categoryId);
        }
        trackEvent('skill_viewed', { skillId: skill.id, skillTitle: skill.title, domain: skill.domain, difficulty: skill.difficulty });
    }

    if (loadError) return <SkillLoadMessage expired={loadError === 'expired'} vi={vi} />;

    return (
        <div className="grid items-start gap-4 md:grid-cols-[minmax(0,5fr)_minmax(0,4fr)] lg:gap-6">
            <section className="min-w-0 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-[#171b29]">
                <div className="border-b border-slate-200 p-4 focus-within:border-indigo-500 dark:border-slate-700 dark:focus-within:border-indigo-400">
                    <label htmlFor="skill-search" className="block text-sm font-semibold text-slate-800 dark:text-slate-100">{searchLabel}</label>
                    <input
                        id="skill-search"
                        type="search"
                        placeholder={vi ? 'Ví dụ: viết báo cáo' : 'For example: report writing'}
                        value={searchTerm}
                        onChange={event => {
                            setSearchTerm(event.target.value);
                            setAgentGroupPreference(null);
                        }}
                        className={`mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-600 dark:bg-[#10131d] dark:text-slate-100 ${focusClass}`}
                    />
                    <Link
                        href="/skills/suggest"
                        prefetch={false}
                        className={`mt-2 inline-block min-h-6 rounded text-sm font-medium text-indigo-700 underline underline-offset-4 dark:text-indigo-300 ${focusClass}`}
                    >
                        {vi ? 'Chưa biết chọn kỹ năng nào? Mô tả việc bạn cần' : 'Unsure which skill to choose? Describe what you need'}
                    </Link>
                </div>
                <div className="max-h-[48vh] scroll-py-4 divide-y divide-slate-200 overflow-y-auto px-4 dark:divide-slate-700 md:max-h-[67vh]" aria-label={vi ? 'Kết quả tìm kỹ năng' : 'Skill results'} role="region">
                    {loading ? (
                        <p role="status" className="py-6 text-sm text-slate-600 dark:text-slate-300">{vi ? 'Đang tải kỹ năng…' : 'Loading skills…'}</p>
                    ) : filteredCategories.length === 0 ? (
                        <div className="py-6 text-sm text-slate-600 dark:text-slate-300">
                            <p role="status">
                                {query ? (vi ? `Không có kỹ năng khớp với “${searchTerm}”. Thử cụm từ ngắn hơn.` : `No skills match “${searchTerm}”. Try a shorter phrase.`) : (vi ? 'Chưa có kỹ năng để hiển thị.' : 'There are no skills to show yet.')}
                            </p>
                            {query && (
                                <div className="mt-2 flex flex-wrap gap-x-4">
                                    <Link href="/home" className="inline-flex min-h-11 items-center font-semibold text-indigo-700 underline dark:text-indigo-300">
                                        {vi ? 'Mô tả nhu cầu ở Trang chủ' : 'Describe what you need on Home'}
                                    </Link>
                                    {/\b(hop dong|contracts?)\b/.test(query) && (
                                        <Link href="/home?outcome=review_contract" className="inline-flex min-h-11 items-center font-semibold text-indigo-700 underline dark:text-indigo-300">
                                            {vi ? 'Review hợp đồng' : 'Review a contract'}
                                        </Link>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : displayedCategories.map(category => (
                        <section key={category.id} className="py-3" aria-labelledby={`skill-group-${category.id}`}>
                            <div className="mb-2 flex items-start justify-between gap-2 px-2">
                                <h2 id={`skill-group-${category.id}`} className="font-semibold text-slate-900 dark:text-slate-100">
                                    {category.id === AGENT_GROUP_ID ? (
                                        <>
                                        <button
                                            type="button"
                                            aria-expanded={agentGroupExpanded}
                                            aria-controls="agent-skill-results"
                                            onClick={() => setAgentGroupPreference(!agentGroupExpanded)}
                                            className={`flex min-h-11 scroll-my-2 cursor-pointer items-center gap-2 rounded-md text-left ${focusClass}`}
                                        >
                                            {vi ? category.viName : category.enName}
                                            <ChevronDown size={16} aria-hidden="true" className={agentGroupExpanded ? 'rotate-180' : ''} />
                                        </button>
                                        {vi && <span lang="en" className="block text-xs font-normal text-slate-600 dark:text-slate-300">{category.enName}</span>}
                                        </>
                                    ) : (
                                        <>
                                            {vi ? category.viName : category.enName}
                                            {vi && category.viName !== category.enName && (
                                                <span lang="en" className="block text-xs font-normal text-slate-600 dark:text-slate-300">
                                                    {category.enName}
                                                </span>
                                            )}
                                        </>
                                    )}
                                </h2>
                                <span className="shrink-0 text-xs text-slate-600 dark:text-slate-300">{query ? `${category.skills.length}/${category.total}` : category.total}</span>
                            </div>
                            {category.id === AGENT_GROUP_ID && (
                                <p className="px-2 pb-2 text-sm text-slate-600 dark:text-slate-300">
                                    {vi ? 'Kỹ năng agent tự dùng khi làm việc; bạn không cần chọn.' : 'Skills agents use on their own; you do not need to pick these.'}
                                </p>
                            )}
                            <ul
                                id={category.id === AGENT_GROUP_ID ? 'agent-skill-results' : undefined}
                                hidden={category.id === AGENT_GROUP_ID && !agentGroupExpanded}
                                className="divide-y divide-slate-100 dark:divide-slate-800"
                            >
                                {category.skills.map(skill => {
                                    const copy = skillPresentation(category.id, skill, vi);
                                    const active = selectedSkill?.id === skill.id && selectedCategoryId === category.id;
                                    return (
                                        <li key={skill.id}>
                                            <button
                                                type="button"
                                                onClick={event => selectSkill(category.id, skill, event.detail === 0)}
                                                aria-pressed={active}
                                                aria-controls="skill-preview"
                                                className={`flex min-h-11 w-full scroll-my-2 items-start justify-between gap-3 rounded-md border-l-2 px-2.5 py-2.5 text-left ${focusClass} ${active
                                                    ? 'border-indigo-300 bg-blue-50/50 dark:border-indigo-500 dark:bg-indigo-950/40'
                                                    : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                            >
                                                <span className="min-w-0">
                                                    <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">{copy.title}</span>
                                                    {vi && copy.title !== copy.english && <span lang="en" className="block text-xs text-slate-600 dark:text-slate-300">{copy.english}</span>}
                                                    {copy.hint && <span data-skill-hint className="mt-1 block text-sm leading-5 text-slate-700 dark:text-slate-200">{copy.hint}</span>}
                                                </span>
                                                {skill.difficulty && (
                                                    <span className="shrink-0 px-1 py-0.5 text-xs text-slate-600 dark:text-slate-300">
                                                        {skillDifficulty(skill.difficulty, vi)}
                                                    </span>
                                                )}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </section>
                    ))}
                </div>
            </section>

            <section id="skill-preview" aria-label={vi ? 'Xem kỹ năng' : 'Skill preview'} className="min-w-0 rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-[#171b29]">
                {selected && selectedSkill && selectedCategoryId ? (
                    <>
                        <div className="border-b border-slate-200 p-4 sm:p-5 dark:border-slate-700">
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{selected.title}</h2>
                            {vi && selected.title !== selected.english && <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">{selected.english}</p>}
                            <div className="mt-3 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    ref={openDetail}
                                    onClick={() => router.push(`/skills/${selectedCategoryId}/${selectedSkill.id}`)}
                                    className={`min-h-11 scroll-mt-24 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 ${focusClass}`}
                                    title={t('skills.open')}
                                >
                                    {vi ? 'Mở trang chi tiết' : 'Open detail page'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        navigator.clipboard.writeText(skillContentInLanguage(selectedSkill, selectedCategoryId, 'en'));
                                        trackEvent('skill_copied', { skillId: selectedSkill.id, skillTitle: selectedSkill.title });
                                        alert(t('skills.copied'));
                                    }}
                                    className={`min-h-11 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-600 dark:text-slate-200 ${focusClass}`}
                                >
                                    {t('skills.copyRaw')}
                                </button>
                            </div>
                            {(linkedTemplates.length > 0 || domainCategory) && (
                                <div className="mt-3 flex flex-wrap gap-2 text-sm">
                                    {linkedTemplates.length > 0 ? (
                                        <>
                                            <span className="text-slate-600 dark:text-slate-300">{vi ? 'Mẫu hướng dẫn' : 'Guided forms'}</span>
                                            {linkedTemplates.map(template => template && (
                                                <Link
                                                    key={template.id}
                                                    href={`/home?template=${encodeURIComponent(template.id)}`}
                                                    title={`${t('skills.useTemplate')}: ${template.name}`}
                                                    className={`rounded text-indigo-700 underline underline-offset-2 dark:text-indigo-300 ${focusClass}`}
                                                >
                                                    {template.name}
                                                </Link>
                                            ))}
                                        </>
                                    ) : (
                                        <Link href={`/home?category=${encodeURIComponent(domainCategory)}`} className={`rounded text-indigo-700 underline underline-offset-2 dark:text-indigo-300 ${focusClass}`}>
                                            {t('skills.browseTemplates')} {domainCategory}
                                        </Link>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="min-w-0 p-4 sm:p-5">
                            <SkillTechnicalDetails skill={selectedSkill} metadata={reading.metadata} vi={vi} />
                            <div className="prose prose-sm max-w-none overflow-x-auto dark:prose-invert">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{reading.body}</ReactMarkdown>
                            </div>
                        </div>
                    </>
                ) : (
                    <p className="p-5 text-sm text-slate-600 dark:text-slate-300">{vi ? 'Chọn một kỹ năng để xem hướng dẫn.' : 'Choose a skill to read its guidance.'}</p>
                )}
            </section>
        </div>
    );
}
