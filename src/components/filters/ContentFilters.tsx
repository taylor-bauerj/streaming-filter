import { useState } from 'react';
import type { ContentFilter } from '@/types/parental-guide';
import { CONTENT_FILTER_PRESETS, SEVERITY_INFO, CATEGORY_INFO } from '@/types/parental-guide';
import {useAppStore} from "@/store";

const ContentFilters = () => {
    // local state
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedPreset, setSelectedPreset] = useState<keyof typeof CONTENT_FILTER_PRESETS | 'custom'>('any');

    // store state
    const filters = useAppStore(state => state.contentFilters);
    const setContentFilters = useAppStore(state => state.setContentFilters);
    const contentFilteringEnabled = useAppStore(state => state.contentFilteringEnabled);
    const setContentFilteringEnabled = useAppStore(state => state.setContentFilteringEnabled);

    const handlePresetChange = (preset: keyof typeof CONTENT_FILTER_PRESETS) => {
        const presetFilters = CONTENT_FILTER_PRESETS[preset];
        setContentFilters(presetFilters);
        setSelectedPreset(preset);
    };

    const handleCategoryChange = (category: keyof ContentFilter, severity: ContentFilter[keyof ContentFilter]) => {
        const newFilters = { ...filters, [category]: severity };
        setContentFilters(newFilters);
        setSelectedPreset('custom');
    };

    const severityOptions: Array<{ value: ContentFilter[keyof ContentFilter]; label: string }> = [
        { value: 'any', label: 'Any' },
        { value: 'severe', label: 'Up to Severe' },
        { value: 'moderate', label: 'Up to Moderate' },
        { value: 'mild', label: 'Up to Mild' },
        { value: 'none', label: 'None Only' }
    ];

    const getSeverityColor = (severity: string) => {
        return SEVERITY_INFO[severity]?.color || 'text-gray-400';
    };

    const getSeverityIcon = (severity: string) => {
        return SEVERITY_INFO[severity]?.icon || '❓';
    };

    return (
        <div className={contentFilteringEnabled ? `bg-gray-900 rounded-lg p-4 border border-gray-700` : ``}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="content-filtering"
                            checked={contentFilteringEnabled}
                            onChange={(e) => setContentFilteringEnabled(e.target.checked)}
                            className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="content-filtering" className="text-white font-medium">
                            🔞 Content Filtering
                        </label>
                    </div>

                    {contentFilteringEnabled && (
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-gray-300 hover:text-blue-300 text-sm transition-colors !bg-blue-500 hover:!bg-gray-600"
                        >
                            {isExpanded ? '▼ Hide Details' : '▶ Show Details'}
                        </button>
                    )}
                </div>

                {contentFilteringEnabled && (
                    <div className="text-xs text-gray-400">
                        Powered by IMDB Parental Guide
                    </div>
                )}
            </div>

            {contentFilteringEnabled && (
                <>
                    {/* Quick Presets */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Quick Presets
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {Object.keys(CONTENT_FILTER_PRESETS).map((preset) => (
                                <button
                                    key={preset}
                                    onClick={() => handlePresetChange(preset as keyof typeof CONTENT_FILTER_PRESETS)}
                                    className={`px-3 py-2 rounded-md text-sm transition-colors ${
                                        selectedPreset === preset
                                            ? '!bg-blue-600 text-white'
                                            : '!bg-gray-700 text-gray-300 hover:!bg-gray-600'
                                    }`}
                                >
                                    {preset.charAt(0).toUpperCase() + preset.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quick Summary */}
                    <div className="mb-4 p-3 bg-gray-800 rounded-md">
                        <div className="text-sm text-gray-300 mb-2">Current Content Limits:</div>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(filters).map(([category, severity]) => {
                                const categoryInfo = CATEGORY_INFO[category as keyof typeof CATEGORY_INFO];
                                return (
                                    <div
                                        key={category}
                                        className="flex items-center gap-1 text-xs px-2 py-1 bg-gray-700 rounded"
                                    >
                                        <span>{categoryInfo.icon}</span>
                                        <span className={getSeverityColor(severity)}>
                                            {severity === 'any' ? 'Any' : `≤ ${severity}`}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Detailed Controls */}
                    {isExpanded && (
                        <div className="space-y-4">
                            <div className="text-sm text-gray-400 mb-4">
                                Set maximum allowed content level for each category. Movies exceeding these limits will be hidden.
                            </div>

                            {Object.entries(filters).map(([category, currentSeverity]) => {
                                const categoryInfo = CATEGORY_INFO[category as keyof typeof CATEGORY_INFO];
                                return (
                                    <div key={category} className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                                            <span>{categoryInfo.icon}</span>
                                            {categoryInfo.label}
                                        </label>

                                        <div className="grid grid-cols-5 gap-1">
                                            {severityOptions.map(({ value, label }) => (
                                                <button
                                                    key={`${category}-${value}`}
                                                    onClick={() => handleCategoryChange(
                                                        category as keyof ContentFilter,
                                                        value
                                                    )}
                                                    className={`px-2 py-1 rounded text-xs transition-colors ${
                                                        currentSeverity === value
                                                            ? '!bg-blue-600 text-white'
                                                            : '!bg-gray-700 text-gray-300 hover:!bg-gray-600'
                                                    }`}
                                                    title={`Allow content up to ${label.toLowerCase()} level`}
                                                >
                                                    {value === 'any' ? '∞' : getSeverityIcon(value)}
                                                    <div className="text-xs mt-1">{label.split(' ')[0]}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Help Text */}
                            <div className="text-xs text-gray-500 mt-4 p-3 bg-gray-800 rounded">
                                <div className="font-medium mb-2">How it works:</div>
                                <ul className="space-y-1">
                                    <li>• Data is scraped from IMDB Parental Guide pages</li>
                                    <li>• Movies without parental guide data are included by default</li>
                                    <li>• Severity levels: None → Mild → Moderate → Severe</li>
                                    <li>• "Up to X" means X and all levels below it are allowed</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ContentFilters;