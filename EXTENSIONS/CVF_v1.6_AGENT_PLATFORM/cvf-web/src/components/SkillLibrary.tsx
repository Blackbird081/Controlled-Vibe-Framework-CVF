'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getSkillCategories, saveUatContent } from '../actions/skills';
import { Skill, SkillCategory } from '../types/skill';
import { trackEvent } from '@/lib/analytics';

export function SkillLibrary() {
    const router = useRouter();
    const [categories, setCategories] = useState<SkillCategory[]>([]);
    const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'skill' | 'uat'>('skill');
    const [uatEditMode, setUatEditMode] = useState(false);
    const [uatDraft, setUatDraft] = useState('');
    const [reportSort, setReportSort] = useState<'count' | 'coverage' | 'name' | 'specAvg'>('count');
    const [reportSortDir, setReportSortDir] = useState<'desc' | 'asc'>('desc');
    const [minCoverage, setMinCoverage] = useState(0);
    const [minCount, setMinCount] = useState(0);
    const [onlyWithUat, setOnlyWithUat] = useState(false);
    const [minSpecScore, setMinSpecScore] = useState(0);
    const [reportPage, setReportPage] = useState(1);
    const [reportPageSize, setReportPageSize] = useState(10);

    useEffect(() => {
        async function fetchSkills() {
            try {
                const data = await getSkillCategories();
                setCategories(data);
            } catch (error) {
                console.error('Failed to load skills', error);
            } finally {
                setLoading(false);
            }
        }
        fetchSkills();
    }, []);

    useEffect(() => {
        if (viewMode === 'uat') {
            setUatDraft(selectedSkill?.uatContent || '');
            if (selectedSkill?.specGate === 'FAIL') {
                setUatEditMode(false);
            }
        } else {
            setUatEditMode(false);
        }
    }, [viewMode, selectedSkill]);

    const filteredCategories = categories.map(cat => {
        const filteredSkills = cat.skills.filter(s =>
            s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return {
            ...cat,
            skills: filteredSkills,
            totalCount: cat.skills.length,
            visibleCount: filteredSkills.length
        };
    }).filter(cat => cat.skills.length > 0);

    const openSkillDetail = (domainId: string, skillId: string) => {
        router.push(`/skills/${domainId}/${skillId}`);
    };

    const uatBadgeClasses = (status?: string) => {
        switch ((status || '').toUpperCase()) {
            case 'PASS':
                return 'bg-emerald-100 text-emerald-800';
            case 'SOFT FAIL':
                return 'bg-amber-100 text-amber-800';
            case 'FAIL':
                return 'bg-rose-100 text-rose-800';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const specGateBadgeClasses = (status?: string) => {
        switch ((status || '').toUpperCase()) {
            case 'PASS':
                return 'bg-emerald-100 text-emerald-800';
            case 'CLARIFY':
                return 'bg-amber-100 text-amber-800';
            case 'FAIL':
                return 'bg-rose-100 text-rose-800';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const qualityBadges: Record<string, string> = {
        'Excellent': 'bg-emerald-100 text-emerald-800',
        'Good': 'bg-sky-100 text-sky-800',
        'Needs Review': 'bg-amber-100 text-amber-800',
        'Not Ready': 'bg-gray-100 text-gray-700',
    };

    const domainReports = categories.map(category => {
        const total = category.skills.length;
        const scores = category.skills
            .map(skill => skill.uatScore)
            .filter(score => typeof score === 'number') as number[];
        const scored = scores.filter(score => score > 0);
        const uatCompleted = category.skills.filter(skill => (skill.uatStatus && skill.uatStatus !== 'Not Run') || (typeof skill.uatScore === 'number' && skill.uatScore > 0)).length;
        const avgScore = scores.length > 0
            ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
            : null;
        const coverage = total > 0 ? Math.round((uatCompleted / total) * 100) : 0;
        const specScores = category.skills
            .map(skill => skill.specScore)
            .filter(score => typeof score === 'number') as number[];
        const specAvg = specScores.length > 0
            ? Math.round(specScores.reduce((sum, score) => sum + score, 0) / specScores.length)
            : null;
        const qualityCounts: Record<string, number> = {
            'Excellent': 0,
            'Good': 0,
            'Needs Review': 0,
            'Not Ready': 0,
        };
        category.skills.forEach(skill => {
            const quality = skill.specQuality || 'Not Ready';
            if (!qualityCounts[quality]) {
                qualityCounts[quality] = 0;
            }
            qualityCounts[quality] += 1;
        });
        return {
            id: category.id,
            name: category.name,
            total,
            avgScore,
            coverage,
            uatCompleted,
            specAvg,
            qualityCounts,
        };
    });

    const overallSkillCount = domainReports.reduce((sum, report) => sum + report.total, 0);
    const overallUatCount = domainReports.reduce((sum, report) => sum + report.uatCompleted, 0);
    const overallCoverage = overallSkillCount > 0 ? Math.round((overallUatCount / overallSkillCount) * 100) : 0;
    const overallSpecScores = domainReports.map(report => report.specAvg).filter(score => typeof score === 'number') as number[];
    const overallSpecAvg = overallSpecScores.length > 0
        ? Math.round(overallSpecScores.reduce((sum, score) => sum + score, 0) / overallSpecScores.length)
        : null;

    const filteredReports = domainReports.filter(report => {
        if (report.total < minCount) return false;
        if (report.coverage < minCoverage) return false;
        if (onlyWithUat && report.uatCompleted === 0) return false;
        if (minSpecScore > 0 && (report.specAvg === null || report.specAvg < minSpecScore)) return false;
        return true;
    }).sort((a, b) => {
        const dir = reportSortDir === 'desc' ? -1 : 1;
        if (reportSort === 'name') {
            return a.name.localeCompare(b.name) * dir;
        }
        if (reportSort === 'coverage') {
            return (b.coverage - a.coverage) * dir;
        }
        if (reportSort === 'specAvg') {
            return ((b.specAvg ?? -1) - (a.specAvg ?? -1)) * dir;
        }
        return (b.total - a.total) * dir;
    });

    useEffect(() => {
        setReportPage(1);
    }, [reportSort, reportSortDir, minCoverage, minCount, onlyWithUat, minSpecScore, categories.length]);

    const totalReportPages = Math.max(1, Math.ceil(filteredReports.length / reportPageSize));
    const safeReportPage = Math.min(reportPage, totalReportPages);
    const reportStart = (safeReportPage - 1) * reportPageSize;
    const reportEnd = reportStart + reportPageSize;
    const reportRangeStart = filteredReports.length === 0 ? 0 : reportStart + 1;
    const reportRangeEnd = Math.min(reportEnd, filteredReports.length);
    const paginatedReports = filteredReports.slice(reportStart, reportEnd);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row h-auto md:h-[calc(100vh-140px)] gap-6">
            {/* Sidebar - Skill Navigator */}
            <div className="w-full md:w-1/3 flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden max-h-[40vh] md:max-h-none">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-3">📚 Skill Library</h2>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search skills..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border-none focus:ring-2 focus:ring-emerald-500 text-sm"
                        />
                        <svg className="w-4 h-4 text-gray-500 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {filteredCategories.length === 0 ? (
                        <div className="text-center p-8 text-gray-500">
                            <p>No skills found matching "{searchTerm}"</p>
                        </div>
                    ) : (
                        filteredCategories.map(category => (
                            <div key={category.id} className="mb-4">
                                <div className="px-3 py-2 flex items-center justify-between">
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{category.name}</h3>
                                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                        {searchTerm ? `${category.visibleCount}/${category.totalCount}` : category.totalCount}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    {category.skills.map(skill => (
                                        <button
                                            key={skill.id}
                                            onClick={() => {
                                                setSelectedSkill(skill);
                                                setViewMode('skill');
                                                trackEvent('skill_viewed', {
                                                    skillId: skill.id,
                                                    skillTitle: skill.title,
                                                    domain: skill.domain,
                                                    difficulty: skill.difficulty,
                                                });
                                            }}
                                            onDoubleClick={() => openSkillDetail(category.id, skill.id)}
                                            title="Double click to open full page"
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${selectedSkill?.id === skill.id
                                                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-medium'
                                                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                                                }`}
                                        >
                                            <span className="truncate">{skill.title}</span>
                                            <span className="flex items-center gap-1">
                                                {skill.difficulty === 'Easy' && <span className="text-[10px] bg-green-100 text-green-800 px-1.5 py-0.5 rounded">Easy</span>}
                                                {skill.difficulty === 'Medium' && <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">Med</span>}
                                                {skill.difficulty === 'Advanced' && <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded">Adv</span>}
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${uatBadgeClasses(skill.uatStatus)}`}>
                                                    {skill.uatStatus || 'Not Run'}
                                                </span>
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Content - Report + Skill Viewer */}
            <div className="w-full md:w-2/3 flex flex-col gap-4 min-h-[40vh] md:min-h-0">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">📊 Domain Report</h3>
                        <p className="text-xs text-gray-500 mt-1">Số lượng + chất lượng input theo domain (Spec score/quality) + Output UAT coverage.</p>
                        <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-600">
                            <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">
                                Total skills: {overallSkillCount}
                            </span>
                            <span className="px-2 py-1 rounded-full bg-sky-50 text-sky-700">
                                Output UAT coverage: {overallCoverage}%
                            </span>
                            <span className="px-2 py-1 rounded-full bg-amber-50 text-amber-700">
                                Output UAT completed: {overallUatCount}
                            </span>
                            <span className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-700">
                                Spec avg: {overallSpecAvg !== null ? `${overallSpecAvg}%` : '—'}
                            </span>
                            {overallUatCount === 0 && (
                                <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                                    UAT chưa chạy → Output UAT score = 0
                                </span>
                            )}
                        </div>
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs text-gray-600 items-end relative z-10">
                            <label className="flex flex-col gap-1">
                                <span>Sort</span>
                                <select
                                    value={reportSort}
                                    onChange={(e) => setReportSort(e.target.value as typeof reportSort)}
                                    className="w-full border border-gray-200 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-sm"
                                >
                                    <option value="count">Count</option>
                                    <option value="coverage">Coverage</option>
                                    <option value="specAvg">Spec Avg</option>
                                    <option value="name">Name</option>
                                </select>
                            </label>
                            <div className="flex flex-col gap-1">
                                <span>Sort Dir</span>
                                <button
                                    onClick={() => setReportSortDir(prev => prev === 'desc' ? 'asc' : 'desc')}
                                    className="w-full px-3 py-2 rounded-md border border-gray-200 bg-white dark:bg-gray-800 text-sm"
                                >
                                    {reportSortDir === 'desc' ? 'Desc' : 'Asc'}
                                </button>
                            </div>
                            <label className="flex flex-col gap-1">
                                <span>Min Count</span>
                                <select
                                    value={minCount}
                                    onChange={(e) => setMinCount(Number(e.target.value))}
                                    className="w-full border border-gray-200 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-sm"
                                >
                                    <option value={0}>0</option>
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                </select>
                            </label>
                            <label className="flex flex-col gap-1">
                                <span>Min Coverage</span>
                                <select
                                    value={minCoverage}
                                    onChange={(e) => setMinCoverage(Number(e.target.value))}
                                    className="w-full border border-gray-200 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-sm"
                                >
                                    <option value={0}>0%</option>
                                    <option value={20}>20%</option>
                                    <option value={50}>50%</option>
                                    <option value={80}>80%</option>
                                </select>
                            </label>
                            <label className="flex flex-col gap-1">
                                <span>Min Spec Score</span>
                                <select
                                    value={minSpecScore}
                                    onChange={(e) => setMinSpecScore(Number(e.target.value))}
                                    className="w-full border border-gray-200 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-sm"
                                >
                                    <option value={0}>0</option>
                                    <option value={50}>50</option>
                                    <option value={70}>70</option>
                                    <option value={85}>85</option>
                                </select>
                            </label>
                            <label className="flex items-center gap-2 mt-2 sm:mt-6">
                                <input
                                    type="checkbox"
                                    checked={onlyWithUat}
                                    onChange={(e) => setOnlyWithUat(e.target.checked)}
                                    className="h-5 w-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <span>Only domains with Output UAT</span>
                            </label>
                        </div>
                        <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-gray-600 relative z-10">
                            <span>
                                Showing {reportRangeStart}-{reportRangeEnd} of {filteredReports.length}
                            </span>
                            <div className="flex flex-wrap items-center gap-2">
                                <span>Rows:</span>
                                <select
                                    value={reportPageSize}
                                    onChange={(e) => {
                                        setReportPageSize(Number(e.target.value));
                                        setReportPage(1);
                                    }}
                                    className="border border-gray-200 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-sm"
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                </select>
                                <button
                                    onClick={() => setReportPage(prev => Math.max(1, prev - 1))}
                                    disabled={safeReportPage === 1}
                                    className={`px-3 py-2 rounded-md border text-sm ${safeReportPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white dark:bg-gray-800'}`}
                                >
                                    Prev
                                </button>
                                <span>
                                    Page {safeReportPage} / {totalReportPages}
                                </span>
                                <button
                                    onClick={() => setReportPage(prev => Math.min(totalReportPages, prev + 1))}
                                    disabled={safeReportPage >= totalReportPages}
                                    className={`px-3 py-2 rounded-md border text-sm ${safeReportPage >= totalReportPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white dark:bg-gray-800'}`}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 overflow-x-auto">
                        {/* Mobile card layout */}
                        <div className="space-y-3 md:hidden">
                            {paginatedReports.map(report => (
                                <div key={report.id} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 p-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="font-semibold text-gray-800 dark:text-gray-100">{report.name}</div>
                                        <div className="text-xs text-gray-500">Count: {report.total}</div>
                                    </div>
                                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                        <div className="rounded-lg bg-gray-50 dark:bg-gray-900/50 p-2">
                                            <div className="text-gray-500">Spec Avg</div>
                                            <div className="font-semibold text-gray-800 dark:text-gray-100">
                                                {report.specAvg !== null ? `${report.specAvg}%` : '—'}
                                            </div>
                                        </div>
                                        <div className="rounded-lg bg-gray-50 dark:bg-gray-900/50 p-2">
                                            <div className="text-gray-500">Output UAT</div>
                                            <div className="font-semibold text-gray-800 dark:text-gray-100">{report.coverage}%</div>
                                            <div className="mt-2 h-2 rounded-full bg-gray-100 dark:bg-gray-700">
                                                <div
                                                    className="h-2 rounded-full bg-emerald-500"
                                                    style={{ width: `${report.coverage}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                        {Object.entries(report.qualityCounts).map(([quality, count]) => (
                                            <span
                                                key={quality}
                                                className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${qualityBadges[quality] || 'bg-gray-100 text-gray-700'}`}
                                            >
                                                {quality}: {count}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop table layout */}
                        <div className="hidden md:block">
                            <table className="w-full text-sm min-w-[640px]">
                                <thead>
                                    <tr className="text-left text-xs uppercase text-gray-500">
                                        <th className="py-2">Domain</th>
                                        <th className="py-2 text-right">Count</th>
                                        <th className="py-2 text-right">Spec Avg</th>
                                        <th className="py-2">Output UAT Coverage</th>
                                        <th className="py-2">Spec Quality</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedReports.map(report => (
                                        <tr key={report.id} className="border-t border-gray-100 dark:border-gray-700/60">
                                            <td className="py-3 font-medium text-gray-800 dark:text-gray-200">{report.name}</td>
                                            <td className="py-3 text-right text-gray-700 dark:text-gray-300">{report.total}</td>
                                            <td className="py-3 text-right text-gray-700 dark:text-gray-300">
                                                {report.specAvg !== null ? `${report.specAvg}%` : '—'}
                                            </td>
                                            <td className="py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-700">
                                                        <div
                                                            className="h-2 rounded-full bg-emerald-500"
                                                            style={{ width: `${report.coverage}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-gray-500 w-10 text-right">{report.coverage}%</span>
                                                </div>
                                            </td>
                                            <td className="py-3">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {Object.entries(report.qualityCounts).map(([quality, count]) => (
                                                        <span
                                                            key={quality}
                                                            className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${qualityBadges[quality] || 'bg-gray-100 text-gray-700'}`}
                                                        >
                                                            {quality}: {count}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col min-h-[40vh] md:min-h-0">
                    {selectedSkill ? (
                    <>
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-md uppercase">{selectedSkill.domain}</span>
                                    <span className="text-gray-400">•</span>
                                    <span className="text-xs text-gray-500 font-mono">{selectedSkill.id}.skill.md</span>
                                </div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedSkill.title}</h1>
                                {(selectedSkill.riskLevel || selectedSkill.autonomy || selectedSkill.allowedRoles) && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {selectedSkill.riskLevel && (
                                            <span className="px-2 py-1 text-[11px] font-semibold bg-rose-100 text-rose-800 rounded-full">
                                                Risk: {selectedSkill.riskLevel}
                                            </span>
                                        )}
                                        {selectedSkill.autonomy && (
                                            <span className="px-2 py-1 text-[11px] font-semibold bg-amber-100 text-amber-800 rounded-full">
                                                Autonomy: {selectedSkill.autonomy}
                                            </span>
                                        )}
                                        {selectedSkill.allowedRoles && (
                                            <span className="px-2 py-1 text-[11px] font-semibold bg-sky-100 text-sky-800 rounded-full">
                                                Roles: {selectedSkill.allowedRoles}
                                            </span>
                                        )}
                                        {selectedSkill.allowedPhases && (
                                            <span className="px-2 py-1 text-[11px] font-semibold bg-emerald-100 text-emerald-800 rounded-full">
                                                Phases: {selectedSkill.allowedPhases}
                                            </span>
                                        )}
                                        {selectedSkill.authorityScope && (
                                            <span className="px-2 py-1 text-[11px] font-semibold bg-indigo-100 text-indigo-800 rounded-full">
                                                Scope: {selectedSkill.authorityScope}
                                            </span>
                                        )}
                                        {selectedSkill.specGate && (
                                            <span className={`px-2 py-1 text-[11px] font-semibold rounded-full ${specGateBadgeClasses(selectedSkill.specGate)}`}>
                                                Spec Gate: {selectedSkill.specGate}
                                            </span>
                                        )}
                                        {selectedSkill.uatStatus && (
                                            <span className={`px-2 py-1 text-[11px] font-semibold rounded-full ${uatBadgeClasses(selectedSkill.uatStatus)}`}>
                                                Output UAT: {selectedSkill.uatStatus}
                                            </span>
                                        )}
                                        {typeof selectedSkill.uatScore === 'number' && (
                                            <span className="px-2 py-1 text-[11px] font-semibold bg-gray-100 text-gray-700 rounded-full">
                                                Score: {selectedSkill.uatScore}%
                                            </span>
                                        )}
                                        {selectedSkill.uatQuality && (
                                            <span className="px-2 py-1 text-[11px] font-semibold bg-slate-100 text-slate-700 rounded-full">
                                                Output Quality: {selectedSkill.uatQuality}
                                            </span>
                                        )}
                                        {typeof selectedSkill.specScore === 'number' && (
                                            <span className="px-2 py-1 text-[11px] font-semibold bg-indigo-100 text-indigo-800 rounded-full">
                                                Spec: {selectedSkill.specScore}%
                                            </span>
                                        )}
                                        {selectedSkill.specQuality && (
                                            <span className={`px-2 py-1 text-[11px] font-semibold rounded-full ${qualityBadges[selectedSkill.specQuality] || 'bg-gray-100 text-gray-700'}`}>
                                                Spec Quality: {selectedSkill.specQuality}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 p-1 shadow-inner">
                                    <button
                                        onClick={() => setViewMode('skill')}
                                        className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-colors ${viewMode === 'skill'
                                            ? 'bg-white text-emerald-700 shadow-sm'
                                            : 'text-gray-500 dark:text-gray-200'
                                            }`}
                                    >
                                        Skill
                                    </button>
                                    <button
                                        onClick={() => setViewMode('uat')}
                                        className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-colors ${viewMode === 'uat'
                                            ? 'bg-white text-emerald-700 shadow-sm'
                                            : 'text-gray-500 dark:text-gray-200'
                                            }`}
                                    >
                                        UAT
                                    </button>
                                </div>
                                {viewMode === 'uat' && (
                                    <div className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 p-1 shadow-inner">
                                        <button
                                            onClick={() => setUatEditMode(false)}
                                            className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${!uatEditMode
                                                ? 'bg-white text-emerald-700 shadow-sm'
                                                : 'text-gray-500 dark:text-gray-200'
                                                }`}
                                        >
                                            View
                                        </button>
                                        <button
                                            onClick={() => setUatEditMode(true)}
                                            disabled={selectedSkill?.specGate === 'FAIL'}
                                            className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${uatEditMode
                                                ? 'bg-white text-emerald-700 shadow-sm'
                                                : 'text-gray-500 dark:text-gray-200'
                                                } ${selectedSkill?.specGate === 'FAIL' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            Edit
                                        </button>
                                    </div>
                                )}
                                <button
                                    onClick={() => {
                                        const raw = viewMode === 'uat' ? (selectedSkill.uatContent || '') : (selectedSkill.content || '');
                                        navigator.clipboard.writeText(raw);
                                        trackEvent('skill_copied', {
                                            skillId: selectedSkill.id,
                                            skillTitle: selectedSkill.title,
                                            domain: selectedSkill.domain,
                                        });
                                        alert('Copied raw markdown!');
                                    }}
                                    className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                >
                                    📋 Copy Raw
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 md:p-8 prose dark:prose-invert max-w-none">
                            {viewMode === 'uat' ? (
                                selectedSkill.uatContent ? (
                                    (() => {
                                        const specGateWarning = selectedSkill.specGate === 'FAIL'
                                            ? (
                                                <div className="not-prose bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-lg text-sm mb-4">
                                                    Spec Gate = FAIL. UAT chỉ được chỉnh sửa khi Spec đạt chuẩn.
                                                </div>
                                            )
                                            : null;
                                        if (uatEditMode) {
                                            return (
                                                <div className="space-y-3 not-prose">
                                                    {specGateWarning}
                                                    <textarea
                                                        value={uatDraft}
                                                        onChange={(e) => setUatDraft(e.target.value)}
                                                        className="w-full min-h-[420px] p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-mono"
                                                        placeholder="Edit UAT markdown..."
                                                    />
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={async () => {
                                                                if (!selectedSkill) return;
                                                                const result = await saveUatContent(selectedSkill.id, uatDraft);
                                                                if (!result) return;
                                                                setSelectedSkill(prev => prev ? {
                                                                    ...prev,
                                                                    uatContent: result.content,
                                                                    uatStatus: result.status,
                                                                    uatScore: result.score,
                                                                    uatQuality: result.quality,
                                                                } : prev);
                                                                setCategories(prev => prev.map(cat => ({
                                                                    ...cat,
                                                                    skills: cat.skills.map(skill => skill.id === selectedSkill.id ? {
                                                                        ...skill,
                                                                        uatContent: result.content,
                                                                        uatStatus: result.status,
                                                                        uatScore: result.score,
                                                                        uatQuality: result.quality,
                                                                    } : skill),
                                                                })));
                                                                setUatEditMode(false);
                                                            }}
                                                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
                                                            disabled={selectedSkill.specGate === 'FAIL'}
                                                        >
                                                            Save UAT
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setUatDraft(selectedSkill?.uatContent || '');
                                                                setUatEditMode(false);
                                                            }}
                                                            className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                    <p className="text-xs text-gray-500">
                                                        UAT editor lưu trực tiếp vào file `.md`. Dùng markdown chuẩn.
                                                    </p>
                                                </div>
                                            );
                                        }

                                        return (
                                            <>
                                                {specGateWarning}
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                >
                                                    {selectedSkill.uatContent}
                                                </ReactMarkdown>
                                            </>
                                        );
                                    })()
                                ) : (
                                    <div className="text-sm text-gray-500">No UAT record found for this skill.</div>
                                )
                            ) : (
                                <ReactMarkdown>{selectedSkill.content || ''}</ReactMarkdown>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4 text-3xl">👈</div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Select a skill to view</h3>
                        <p className="max-w-xs text-sm">Browse the library on the left to view detailed skill documentation, inputs, and expected outputs.</p>
                    </div>
                )}
            </div>
            </div>
        </div>
    );
}
