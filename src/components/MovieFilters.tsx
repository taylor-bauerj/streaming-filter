import type {StreamingProvider} from "../services/tmdbApi.ts";
import { useAppStore } from "../store/useAppStore.ts";
import type {
    FilterOptions
} from "../types/models.ts";
import {useFiltersStore} from "../store/useFiltersStore.ts";

interface MovieFiltersProps {
    filters: FilterOptions;
    streamingProviders: StreamingProvider[];
}

const MovieFilters = ({
    filters,
    streamingProviders
}: MovieFiltersProps) => {
    // app store state
    const getAvailableYears = useAppStore(state => state.getAvailableYears);
    const getAvailableRatings = useAppStore(state => state.getAvailableRatings);
    const showAllProviders = useAppStore(state => state.showAllProviders);
    const setShowAllProviders = useAppStore(state => state.setShowAllProviders);

    // filter store state
    const setCurrentProviderFilter = useFiltersStore(state => state.setCurrentProviderFilter);
    const clearAllFilters = useFiltersStore(state => state.clearAllFilters);
    const setFilters = useFiltersStore(state => state.setFilters);

    // computed values
    const availableYears = getAvailableYears();
    const availableRatings = getAvailableRatings();

    const handleFilterChange = (key: keyof FilterOptions, value: FilterOptions[keyof FilterOptions]) => {
        const newFilters = { ...filters, [key]: value } as FilterOptions;
        setFilters(newFilters);

        if (key === 'streamingServices' || key === 'availabilityType') {
            setCurrentProviderFilter({
                providerIds: newFilters.streamingServices,
                availabilityType: newFilters.availabilityType
            });
        }
    };

    const handleProviderToggle = (providerId: number) => {
        const updatedProviders = filters.streamingServices.includes(providerId)
            ? filters.streamingServices.filter(id => id !== providerId)
            : [...filters.streamingServices, providerId];

        handleFilterChange('streamingServices', updatedProviders);
    }

    const hasActiveFilters =
        filters.title ||
        filters.releaseYear ||
        filters.maturityRating ||
        filters.streamingServices.length > 0 ||
        filters.availabilityType !== 'all';

    const getSelectedProviderNames = () => {
        if (!streamingProviders) return [];

        return streamingProviders
            .filter(provider => filters.streamingServices.includes(provider.id))
            .map(provider => provider.name);
    }

    const displayedProviders = showAllProviders || streamingProviders === undefined ? streamingProviders : streamingProviders.slice(0, 8);

    return (
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-white">Filters</h2>
                {hasActiveFilters && (
                    <button
                        onClick={clearAllFilters}
                        className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                    >
                        Clear All
                    </button>
                )}
            </div>

            <div className="space-y-6">
                {/* First Row: Title, Year, Rating */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Title Search */}
                    <div>
                        <label htmlFor="title-search" className="block text-sm font-medium text-gray-300 mb-2">
                            Movie Title
                        </label>
                        <input
                            id="title-search"
                            type="text"
                            placeholder="Search by title"
                            value={filters.title}
                            onChange={(e) => handleFilterChange('title', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Release Year Dropdown */}
                    <div>
                        <label htmlFor="release-year" className="block text-sm font-medium text-gray-300 mb-2">
                            Release Year
                        </label>
                        <select
                            id="release-year"
                            value={filters.releaseYear}
                            onChange={(e) => handleFilterChange('releaseYear', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">All Years</option>
                            {availableYears.map((year) => (
                                <option key={year} value={year.toString()}>
                                    {year}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Maturity Rating Dropdown */}
                    <div>
                        <label htmlFor="maturity-rating" className="block text-sm font-medium text-gray-300 mb-2">
                            Maturity Rating
                        </label>
                        <select
                            id="maturity-rating"
                            value={filters.maturityRating}
                            onChange={(e) => handleFilterChange('maturityRating', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">All Ratings</option>
                            {availableRatings.map((rating) => (
                                <option key={rating} value={rating}>
                                    {rating}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/*Availability Type Filter*/}
                <div>
                    <label className="text-left block text-sm font-medium text-gray-300 mb-2">
                        Availability Type
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { value: 'all', label: 'All' },
                            { value: 'streaming', label: 'Streaming' },
                            { value: 'rent', label: 'Rent' },
                            { value: 'buy', label: 'Buy' }
                        ].map((type) => (
                            <button
                                key={type.value}
                                onClick={() => handleFilterChange('availabilityType', type.value)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                    filters.availabilityType === type.value
                                        ? 'text-white !bg-gray-800 border border-gray-700'
                                        : '!bg-blue-500 !bg-opacity-20 text-gray-300 hover:!bg-gray-600 border border-gray-600'
                                }`}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Streaming Services Filter */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-medium text-gray-300">
                            Streaming Services
                        </label>
                        {streamingProviders?.length > 8 && (
                            <button
                                onClick={() => setShowAllProviders(!showAllProviders)}
                                className="text-sm text-gray-300 hover:!bg-gray-600 border border-gray-600 transition-colors !bg-blue-500"
                            >
                                {showAllProviders ? 'Show Less' : `Show All (${streamingProviders.length})`}
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {displayedProviders?.map((provider) => (
                            <div
                                key={provider.id}
                                onClick={() => handleProviderToggle(provider.id)}
                                className={`relative cursor-pointer rounded-lg p-3 border-2 transition-all duration-200 ${
                                    filters.streamingServices.includes(provider.id)
                                        ? 'border-blue-500 bg-blue-500/20'
                                        : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                                }`}
                            >
                                <div className="text-center">
                                    {provider.logo_path ? (
                                        <img
                                            src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
                                            alt={provider.name}
                                            className="w-8 h-8 mx-auto mb-2 rounded"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 mx-auto mb-2 bg-gray-600 rounded flex items-center justify-center">
                                            <span className="text-xs font-bold text-gray-300">
                                                {provider.name.slice(0, 2).toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                    <span className="text-xs text-gray-300 block leading-tight">
                                        {provider.name}
                                    </span>
                                </div>

                                {filters.streamingServices.includes(provider.id) && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
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
            )}
        </div>
    );
};

export default MovieFilters;