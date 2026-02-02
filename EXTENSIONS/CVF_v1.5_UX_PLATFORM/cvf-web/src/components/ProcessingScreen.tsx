'use client';

import { useEffect, useState } from 'react';

interface ProcessingScreenProps {
    templateName: string;
    onComplete: (output: string) => void;
    onCancel: () => void;
}

export function ProcessingScreen({ templateName, onComplete, onCancel }: ProcessingScreenProps) {
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('Initializing...');

    useEffect(() => {
        const statuses = [
            'Initializing...',
            'Parsing intent...',
            'Generating response...',
            'Applying quality checks...',
            'Finalizing output...',
        ];

        const interval = setInterval(() => {
            setProgress((prev) => {
                const next = prev + Math.random() * 15;

                // Update status based on progress
                const statusIndex = Math.min(Math.floor(next / 25), statuses.length - 1);
                setStatus(statuses[statusIndex]);

                if (next >= 100) {
                    clearInterval(interval);
                    // Simulate completion with mock output
                    setTimeout(() => {
                        onComplete(generateMockOutput(templateName));
                    }, 500);
                    return 100;
                }
                return next;
            });
        }, 300);

        return () => clearInterval(interval);
    }, [templateName, onComplete]);

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
            <div className="text-center">
                {/* Spinning icon */}
                <div className="w-20 h-20 mx-auto mb-8 relative">
                    <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700" />
                    <div
                        className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-3xl">
                        ⏳
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Processing...
                </h2>

                <p className="text-gray-600 dark:text-gray-400 mb-8">
                    {status}
                </p>

                {/* Progress bar */}
                <div className="w-80 mx-auto">
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                        {Math.round(progress)}%
                    </p>
                </div>

                <p className="mt-4 text-sm text-gray-500">
                    Estimated: {Math.max(1, Math.round((100 - progress) / 10))} seconds
                </p>

                <button
                    onClick={onCancel}
                    className="mt-8 px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white
                     border border-gray-300 dark:border-gray-600 rounded-lg
                     hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}

function generateMockOutput(templateName: string): string {
    return `# ${templateName} Analysis

## Executive Summary

Based on the provided context and requirements, this analysis presents a comprehensive evaluation with actionable recommendations.

## Key Findings

### Strengths
- Clear strategic direction aligned with market opportunities
- Strong foundation for growth initiatives
- Competitive advantages in key areas

### Areas for Improvement
- Consider diversifying market approach
- Strengthen risk mitigation strategies
- Enhance stakeholder communication

## Detailed Analysis

### Option A: Organic Growth
| Aspect | Assessment |
|--------|------------|
| Risk Level | Low |
| Investment | Moderate |
| Timeline | 12-18 months |
| ROI Potential | 25-40% |

### Option B: Strategic Partnership
| Aspect | Assessment |
|--------|------------|
| Risk Level | Medium |
| Investment | Low |
| Timeline | 6-12 months |
| ROI Potential | 30-50% |

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Market volatility | Medium | High | Diversification strategy |
| Execution delays | Low | Medium | Milestone tracking |
| Resource constraints | Medium | Medium | Phased approach |

## Recommendations

1. **Short-term (0-6 months)**
   - Conduct detailed market analysis
   - Establish key partnerships
   - Set up monitoring framework

2. **Medium-term (6-12 months)**
   - Execute pilot programs
   - Measure and iterate
   - Scale successful initiatives

3. **Long-term (12+ months)**
   - Full market expansion
   - Continuous optimization
   - Strategic review and adjustment

## Next Steps

- [ ] Schedule stakeholder alignment meeting
- [ ] Develop detailed implementation roadmap
- [ ] Identify resource requirements
- [ ] Establish success metrics

---
*Generated by CVF v1.5 UX Platform*
`;
}
