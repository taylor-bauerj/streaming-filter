import {useAppStore, useFiltersStore} from "@/store";

const ActiveFilters = () => {
    const filters = useFiltersStore(state => state.filters);
    const handleFilterChange = useFiltersStore(state => state.handleFilterChange);
    const handleProviderToggle = useFiltersStore(state => state.handleProviderToggle);
    const streamingProviders = useAppStore((state) => state.streamingProviders);
    const hasActiveFilters = useFiltersStore(state => state.hasActiveFilters);

    const getSelectedProviderNames = () => {
        if (!streamingProviders) return [];

        return streamingProviders
            .filter(provider => filters.streamingServices.includes(provider.id))
            .map(provider => provider.name);
    }

    if (!hasActiveFilters()) {
        return null;
    }

    return (
        <div className="mt-6 pt-4 border-t border-gray-700">
            <div className="flex flex-wrap gap-2">
                <span className="text-sm text-gray-400">Active filters:</span>

                {filters.title && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-600 text-white">
                            Title: "{filters.title}"
                            <button
                                onClick={() => handleFilterChange('title', '')}
                                className="ml-2 hover:text-gray-300 !bg-gray-600"
                            >
                                ×
                            </button>
                        </span>
                )}

                {filters.releaseYear && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-600 text-white">
                            Year: {filters.releaseYear}
                        <button
                            onClick={() => handleFilterChange('releaseYear', '')}
                            className="ml-2 hover:text-gray-300 !bg-gray-600"
                        >
                                ×
                            </button>
                        </span>
                )}

                {filters.maturityRating && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-600 text-white">
                            Rating: {filters.maturityRating}
                        <button
                            onClick={() => handleFilterChange('maturityRating', '')}
                            className="ml-2 hover:text-gray-300 !bg-gray-600"
                        >
                                ×
                            </button>
                        </span>
                )}

                {filters.availabilityType !== 'all' && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-600 text-white">
                            Type: {filters.availabilityType}
                        <button
                            onClick={() => handleFilterChange('availabilityType', 'all')}
                            className="ml-2 hover:text-gray-300 !bg-gray-600"
                        >
                                ×
                            </button>
                        </span>
                )}

                {getSelectedProviderNames().map((providerName, index) => (
                    <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-600 text-white">
                            {providerName}
                        <button
                            onClick={() => {
                                const provider = streamingProviders.find(p => p.name === providerName);
                                if (provider) handleProviderToggle(provider.id);
                            }}
                            className="ml-2 hover:text-gray-300 !bg-gray-600"
                        >
                                ×
                            </button>
                        </span>
                ))}
            </div>
        </div>
    );
}

export default ActiveFilters;