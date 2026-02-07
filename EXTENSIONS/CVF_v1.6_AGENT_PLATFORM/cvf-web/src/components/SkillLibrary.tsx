'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { getSkillCategories } from '../actions/skills';
import { Skill, SkillCategory } from '../types/skill';
import { trackEvent } from '@/lib/analytics';

export function SkillLibrary() {
    const [categories, setCategories] = useState<SkillCategory[]>([]);
    const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

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

    const filteredCategories = categories.map(cat => ({
        ...cat,
        skills: cat.skills.filter(s =>
            s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.id.toLowerCase().includes(searchTerm.toLowerCase())
        )
    })).filter(cat => cat.skills.length > 0);

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
                                <h3 className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">{category.name}</h3>
                                <div className="space-y-1">
                                    {category.skills.map(skill => (
                                        <button
                                            key={skill.id}
                                            onClick={() => {
                                                setSelectedSkill(skill);
                                                trackEvent('skill_viewed', {
                                                    skillId: skill.id,
                                                    skillTitle: skill.title,
                                                    domain: skill.domain,
                                                    difficulty: skill.difficulty,
                                                });
                                            }}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${selectedSkill?.id === skill.id
                                                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-medium'
                                                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                                                }`}
                                        >
                                            <span className="truncate">{skill.title}</span>
                                            {skill.difficulty === 'Easy' && <span className="text-[10px] bg-green-100 text-green-800 px-1.5 py-0.5 rounded">Easy</span>}
                                            {skill.difficulty === 'Medium' && <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">Med</span>}
                                            {skill.difficulty === 'Advanced' && <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded">Adv</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Content - Skill Viewer */}
            <div className="w-full md:w-2/3 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col min-h-[40vh] md:min-h-0">
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
                            </div>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(selectedSkill.content || '');
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
                        <div className="flex-1 overflow-y-auto p-4 md:p-8 prose dark:prose-invert max-w-none">
                            <ReactMarkdown>{selectedSkill.content || ''}</ReactMarkdown>
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
    );
}
