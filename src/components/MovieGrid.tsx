import { useEffect } from "react";
import MovieCard from "./MovieCard.tsx";
import { MovieFilters } from "./filters";
import { useAppStore, useFiltersStore } from "@/store";

const MovieGrid = () => {
    // app state
    const movies = useAppStore(state => state.movies);
    const loading = useAppStore(state => state.loading);
    const error = useAppStore(state => state.error);
    const loadingDetails = useAppStore(state => state.loadingDetails);
    const fetchStreamingProviders = useAppStore(state => state.fetchStreamingProviders);
    const fetchMoviesWithFilters = useAppStore(state => state.fetchMoviesWithFilters);

    // filter state
    const filters = useFiltersStore(state => state.filters);
    const currentProviderFilter = useFiltersStore(state => state.currentProviderFilter);

    // computed values
    const getFilteredMovies = useFiltersStore(state => state.getFilteredMovies);
    const filteredMovies = getFilteredMovies();

    useEffect(() => {
        fetchStreamingProviders();
        fetchMoviesWithFilters();
    }, [fetchStreamingProviders, fetchMoviesWithFilters]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <div className="text-white text-2xl mb-2">Loading movies...</div>
                    {loadingDetails && (
                        <div className="text-gray-400 text-sm">Fetching movie ratings and details...</div>
                    )}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-red-500 text-xl text-center max-w-md">
                    {error}
                    <button
                        onClick={() => fetchMoviesWithFilters()}
                        className="block mt-4 mx-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black py-8">
            <div className="container mx-auto px-4">
                <h1 className="text-4xl font-bold text-white mb-8 text-center">
                    Movies & Streaming
                </h1>

                <MovieFilters />

                {/* Result summary with streaming info */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <p className="text-gray-400 text-sm">
                        Showing {filteredMovies.length} of {movies.length} movies
                        {currentProviderFilter.providerIds.length > 0 && (
                            <span className="ml-2 text-blue-400">
                                • Filtered by {currentProviderFilter.providerIds.length} streaming service{currentProviderFilter.providerIds.length !== 1 ? 's' : ''}
                            </span>
                        )}
                    </p>

                    {/* Quick stats */}
                    <div className="flex gap-4 text-sm text-gray-400">
                        <span>
                            📺 {movies.filter(m => m.hasStreaming).length} streaming
                        </span>
                        <span>
                            💰 {movies.filter(m => m.rentProviders && m.rentProviders.length > 0).length} rent
                        </span>
                        <span>
                            🛒 {movies.filter(m => m.buyProviders && m.buyProviders.length > 0).length} buy
                        </span>
                    </div>
                </div>

                {filteredMovies.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                        {filteredMovies.map((movie) => (
                            <MovieCard movie={movie} key={movie.id} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="text-gray-400 text-xl mb-2">No movies found</div>
                        <div className="text-gray-500 text-sm mb-4">
                            Try adjusting your filters to see more results
                        </div>

                        {/* Suggestions based on current filters */}
                        {(filters.streamingServices.length > 0 || currentProviderFilter.providerIds.length > 0) && (
                            <div className="text-gray-400 text-sm">
                                <p>Suggestions:</p>
                                <ul className="mt-2 space-y-1">
                                    <li>• Try selecting different streaming services</li>
                                    <li>• Change the availability type (streaming, rent, buy)</li>
                                    <li>• Clear some filters to see more results</li>
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default MovieGrid;