import { useState } from 'react';
import type { IMDBParentalGuide } from '@/types/parental-guide';
import { SEVERITY_INFO, CATEGORY_INFO } from '@/types/parental-guide';

interface ParentalGuideDisplayProps {
    guide: IMDBParentalGuide;
}

const ParentalGuideDisplay = ({ guide }: ParentalGuideDisplayProps) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!guide.dataAvailable) {
        return (
            <div className="text-xs text-gray-500">
                <span className="opacity-50">🔞</span> No content info
            </div>
        );
    }

    const categories = ['violence', 'nudity', 'profanity', 'alcohol', 'frightening'] as const;

    return (
        <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-white flex items-center gap-2">
                    🔞 Content Guide
                    <span className="text-xs text-gray-400">
                        ({guide.certified ? 'Certified' : 'Community'})
                    </span>
                </h4>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-gray-800 hover:text-gray-400 text-xs transition-colors !bg-blue-500"
                >
                    {isExpanded ? '▼' : '▶'}
                </button>
            </div>

            {/* Summary View */}
            <div className="grid grid-cols-5 gap-1 mb-2">
                {categories.map(category => {
                    const content = guide[category];
                    const categoryInfo = CATEGORY_INFO[category];
                    const severityInfo = SEVERITY_INFO[content.severity];

                    return (
                        <div
                            key={category}
                            className="text-center p-1 bg-gray-700 rounded text-xs"
                            title={`${categoryInfo.label}: ${severityInfo.label}`}
                        >
                            <div className="text-sm">{categoryInfo.icon}</div>
                            <div className={`text-xs font-medium ${severityInfo.color}`}>
                                {content.severity === 'none' ? '✓' : severityInfo.icon}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Detailed View */}
            {isExpanded && (
                <div className="space-y-3 mt-3 pt-3 border-t border-gray-600">
                    {categories.map(category => {
                        const content = guide[category];
                        if (content.severity === 'none' && content.items.length === 0) {
                            return null;
                        }

                        const categoryInfo = CATEGORY_INFO[category];
                        const severityInfo = SEVERITY_INFO[content.severity];

                        return (
                            <div key={category} className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span>{categoryInfo.icon}</span>
                                    <span className="text-sm font-medium text-gray-300">
                                        {categoryInfo.label}
                                    </span>
                                    <span className={`text-xs px-2 py-0.5 rounded ${severityInfo.color} bg-gray-700`}>
                                        {severityInfo.label}
                                    </span>
                                </div>

                                {content.items.length > 0 && (
                                    <div className="text-xs text-gray-400 pl-6 space-y-1">
                                        {content.items.slice(0, 3).map((item, index) => (
                                            <div key={index} className="truncate">
                                                • {item}
                                            </div>
                                        ))}
                                        {content.items.length > 3 && (
                                            <div className="text-gray-500">
                                                ... and {content.items.length - 3} more
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    <div className="text-xs text-gray-500 pt-2 border-t border-gray-700">
                        Last updated: {new Date(guide.lastUpdated).toLocaleDateString()}
                        {guide.imdbId && (
                            <span className="ml-2">
                                • <a
                                href={`https://www.imdb.com/title/${guide.imdbId}/parentalguide/`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300"
                            >
                                    View on IMDB
                                </a>
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ParentalGuideDisplay;