import tmdbApi, {
    type MovieWithProviders,
    type StreamingProvider,
    type TMDBResponse
} from "../services/tmdbApi.ts";
import {useCallback, useEffect, useMemo, useState} from "react";
import MovieCard from "./MovieCard.tsx";
import MovieFilters, {type FilterOptions} from "./MovieFilters.tsx";

const MovieGrid = () => {
    const [movies, setMovies] = useState<MovieWithProviders[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
    const [streamingProviders, setStreamingProviders] = useState<StreamingProvider[]>([]);

    const [filters, setFilters] = useState<FilterOptions>({
        title: '',
        releaseYear: '',
        maturityRating: '',
        streamingServices: [],
        availabilityType: 'all'
    });

    const [currentProviderFilter, setCurrentProviderFilter] = useState<{
        providerIds: number[];
        availabilityType: 'all' | 'streaming' | 'rent' | 'buy';
    }>({
        providerIds: [],
        availabilityType: 'all'
    });

    useEffect(() => {
        const loadStreamingProviders = async () => {
            try {
                const providers = tmdbApi.getPopularStreamingProviders();
                setStreamingProviders(providers);
            } catch (error) {
                console.error('Error fetching streaming providers: ', error);
                setStreamingProviders([]);
            }
        }

        loadStreamingProviders();
    }, []);

    const fetchMoviesWithFilters = useCallback(async (
        providerIds: number[] = [],
        availabilityType: 'all' | 'streaming' | 'rent' | 'buy' = 'all'
    )=> {
        try {
            setLoading(true);
            setError(null);
            setLoadingDetails(true);

            let response: TMDBResponse<MovieWithProviders>;

            if (providerIds.length > 0 && availabilityType !== 'all') {
                const monetizationType = availabilityType === 'streaming' ? 'flatrate' : availabilityType;
                response = await tmdbApi.getMoviesWithProviderDetails(
                    providerIds,
                    monetizationType
                );
            } else if (providerIds.length > 0) {
                const [streamingMovies, rentMovies, buyMovies] = await Promise.all([
                    tmdbApi.getMoviesWithProviderDetails(providerIds, 'flatrate').catch(() => ({ results: [] })),
                    tmdbApi.getMoviesWithProviderDetails(providerIds, 'rent').catch(() => ({ results: [] })),
                    tmdbApi.getMoviesWithProviderDetails(providerIds, 'buy').catch(() => ({ results: [] }))
                ]);

                const allMovies = [...streamingMovies.results, ...rentMovies.results, ...buyMovies.results];

                const uniqueMovies = allMovies.filter((movie, index, self) =>
                    index === self.findIndex(m => m.id === movie.id)
                );

                response = {
                    page: 1,
                    results: uniqueMovies.slice(0, 20),
                    total_pages: Math.ceil(uniqueMovies.length / 20),
                    total_results: uniqueMovies.length
                }
            } else {
                const popularResponse = await tmdbApi.getPopularMovies();
                const topMovies = popularResponse.results.slice(0, 20);

                const moviesWithProviders: MovieWithProviders[] = await Promise.all(
                    topMovies.map(async movie => {
                        try {
                            const details = await tmdbApi.getMovieDetails(movie.id);
                            const certification = tmdbApi.getUSCertification(details);

                            const usProviders = details['watch/providers']?.results?.US;
                            const streamingProviders = usProviders?.flatrate || [];
                            const rentProviders = usProviders?.rent || [];
                            const buyProviders = usProviders?.buy || [];

                            return {
                                ...movie,
                                certification,
                                streamingProviders,
                                rentProviders,
                                buyProviders,
                                hasStreaming: streamingProviders.length > 0,
                            };
                        } catch (error) {
                            console.error(`Error fetching movie details for movie ${movie.id}:`, error);
                            return {
                                ...movie,
                                certification: 'Not Rated',
                                streamingProviders: [],
                                rentProviders: [],
                                buyProviders: [],
                                hasStreaming: false
                            };
                        }
                    })
                );

                response = {
                    ...popularResponse,
                    results: moviesWithProviders
                };
            }

            setMovies(response.results);
        } catch (error) {
            console.error('Error fetching movies: ', error);
            setError('Failed to fetch movies');
        } finally {
            setLoading(false);
            setLoadingDetails(false);
        }
    }, []);

    useEffect(() => {
       fetchMoviesWithFilters();
    }, [fetchMoviesWithFilters]);

    const handleProviderFilterChange = useCallback((
        providerIds: number[],
        availabilityType: 'all' | 'streaming' | 'rent' | 'buy'
    ) => {
        setCurrentProviderFilter({ providerIds, availabilityType });
        fetchMoviesWithFilters(providerIds, availabilityType);
    }, [fetchMoviesWithFilters]);

    const { availableYears, availableRatings } = useMemo(() => {
        const years = [...new Set(
            movies
                .map(movie => new Date(movie.release_date).getFullYear())
                .filter(year => !isNaN(year))
        )].sort((a, b) => b - a);

        const ratings = [...new Set(
            movies
                .map(movie => movie.certification)
                .filter((rating): rating is string => rating !== undefined && rating !== 'Not Rated')
        )].sort();

        return { availableYears: years, availableRatings: ratings };
    }, [movies]);

    const filteredMovies = useMemo(() => {
        return movies.filter(movie => {
            if (filters.title && !movie.title.toLowerCase().includes(filters.title.toLowerCase())) {
                return false;
            }

            if (filters.releaseYear) {
                const movieYear = new Date(movie.release_date).getFullYear();
                if (movieYear.toString() !== filters.releaseYear) {
                    return false;
                }
            }

            if (filters.maturityRating && movie.certification !== filters.maturityRating) {
                return false;
            }

            if (filters.streamingServices.length > 0) {
                const hasSelectedProvider =
                    movie.streamingProviders?.some(p => filters.streamingServices.includes(p.provider_id)) ||
                    movie.rentProviders?.some(p => filters.streamingServices.includes(p.provider_id)) ||
                    movie.buyProviders?.some(p => filters.streamingServices.includes(p.provider_id));

                if (!hasSelectedProvider) {
                    return false;
                }
            }

            return true;
        });
    }, [movies, filters]);

    const handleFiltersChange = (newFilters: FilterOptions) => {
        setFilters(newFilters);
    }

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

                <MovieFilters
                    onFiltersChange={handleFiltersChange}
                    availableYears={availableYears}
                    availableRatings={availableRatings}
                    streamingProviders={streamingProviders}
                    onProviderFilterChange={handleProviderFilterChange}
                />

                {/* NEW: Results summary with streaming info */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <p className="text-gray-400 text-sm">
                        Showing {filteredMovies.length} of {movies.length} movies
                        {currentProviderFilter.providerIds.length > 0 && (
                            <span className="ml-2 text-blue-400">
                                • Filtered by {currentProviderFilter.providerIds.length} streaming service{currentProviderFilter.providerIds.length !== 1 ? 's' : ''}
                            </span>
                        )}
                    </p>

                    {/* NEW: Quick stats */}
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

                        {/* NEW: Suggestions based on current filters */}
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