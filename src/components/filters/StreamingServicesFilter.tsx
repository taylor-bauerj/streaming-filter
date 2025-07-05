import {useAppStore, useFiltersStore} from "@/store";

const StreamingServicesFilter = () => {
    const filters = useFiltersStore(state => state.filters);
    const streamingProviders = useAppStore((state) => state.streamingProviders);
    const setShowAllProviders = useAppStore(state => state.setShowAllProviders);
    const showAllProviders = useAppStore(state => state.showAllProviders);
    const handleProviderToggle = useFiltersStore(state => state.handleProviderToggle);

    const displayedProviders = showAllProviders || streamingProviders === undefined ? streamingProviders : streamingProviders.slice(0, 8);

    return (
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
    );
}

export default StreamingServicesFilter;