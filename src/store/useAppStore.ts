import { create } from 'zustand'
import tmdbApi, {
    type MovieWithProviders,
    type StreamingProvider, type TMDBResponse
} from "../services/tmdbApi.ts";
import { devtools } from "zustand/middleware";
import type {AvailabilityType} from "../types/models.ts";

interface AppState {
    // State
    movies: MovieWithProviders[];
    loading: boolean;
    error: string | null;
    loadingDetails: boolean;
    streamingProviders: StreamingProvider[];
    showAllProviders: boolean;

    // Actions
    setMovies: (movies: MovieWithProviders[]) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setLoadingDetails: (loading: boolean) => void;
    setStreamingProviders: (providers: StreamingProvider[]) => void;
    setShowAllProviders: (showAllProviders: boolean) => void;

    // Async actions
    fetchStreamingProviders: () => void;
    fetchMoviesWithFilters: (
        providerIds?: number[],
        availabilityType?: AvailabilityType
    ) => void;

    // Computed values
    getAvailableYears: () => number[];
    getAvailableRatings: () => string[];
    getAvailableStats: () => { streaming: number, rent: number, buy: number };
}

export const useAppStore = create<AppState>()(
    devtools(
        (set, get) => ({
            // initial state
            movies: [],
            loading: true,
            error: null,
            loadingDetails: false,
            streamingProviders: [],
            showAllProviders: false,

            // update state actions
            setMovies: (movies: MovieWithProviders[]) => set({ movies }),
            setLoading: (loading: boolean) => set({ loading }),
            setError: (error: string | null) => set({ error }),
            setLoadingDetails: (loading: boolean) => set({ loadingDetails: loading }),
            setStreamingProviders: (providers: StreamingProvider[]) => set({ streamingProviders: providers }),
            setShowAllProviders: (showAllProviders: boolean) => set({ showAllProviders }),

            fetchStreamingProviders: async () => {
                try {
                    const providers = tmdbApi.getPopularStreamingProviders();
                    set({ streamingProviders: providers });
                } catch (error) {
                    console.error('Error fetching streaming providers: ', error);
                    set({ streamingProviders: [] });
                }
            },

            fetchMoviesWithFilters: async(
                providerIds = [],
                availabilityType: AvailabilityType = 'all'
            ) => {
                try {
                    set({ loading: true, error: null, loadingDetails: true });

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

                    // Apply availability filter
                    switch (availabilityType) {
                        case 'streaming':
                            response.results = response.results.filter(m => m.hasStreaming);
                            break;
                        case 'rent':
                            response.results = response.results.filter(m => m.rentProviders && m.rentProviders.length > 0);
                            break;
                        case 'buy':
                            response.results = response.results.filter(m => m.buyProviders && m.buyProviders.length > 0);
                            break;
                    }

                    set({ movies: response.results })
                } catch (error) {
                    console.error('Error fetching movies: ', error);
                    set({ error: 'Failed to fetch movies', loading: false, loadingDetails: false });
                } finally {
                    set({ loading: false, loadingDetails: false });
                }
            },

            getAvailableYears: () => {
                const { movies } = get();

                return [...new Set(
                    movies
                        .map(movie => new Date(movie.release_date).getFullYear())
                        .filter(year => !isNaN(year))
                )].sort((a, b) => b - a);
            },

            getAvailableRatings: () => {
                const { movies } = get();

                return [...new Set(
                    movies
                        .map(movie => movie.certification)
                        .filter((rating): rating is string => rating !== undefined && rating !== 'Not Rated')
                )].sort();
            },

            getStreamingStats: () => {
                const { movies } = get();
                return {
                    streaming: movies.filter(m => m.hasStreaming).length,
                    rent: movies.filter(m => m.rentProviders && m.rentProviders.length > 0).length,
                    buy: movies.filter(m => m.buyProviders && m.buyProviders.length > 0).length,
                };
            }
        }),
        {
            name: 'app-store'
        }
    )
);