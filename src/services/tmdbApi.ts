import type {
    APIParams,
    DiscoverParams,
    Movie,
    MovieDetails,
    MovieWithProviders, Provider,
    StreamingProvider,
    TMDBResponse
} from "../types/models.ts";

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = import.meta.env.VITE_TMDB_BASE_URL;
const IMAGE_BASE_URL = import.meta.env.VITE_TMDB_IMAGE_BASE_URL;

class TMDBApi {
    async makeRequest<T>(endpoint: string, params: APIParams): Promise<T> {
        const url = new URL(`${BASE_URL}${endpoint}`);
        url.searchParams.append('api_key', API_KEY);

        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                url.searchParams.append(key, value.toString());
            }
        });

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`TMDB API request failed with status ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async getPopularMovies(page: number = 1): Promise<TMDBResponse<Movie>> {
        return this.makeRequest<TMDBResponse<Movie>>('/movie/popular', { page });
    }

    async getMovieDetails(movieId: number): Promise<MovieDetails> {
        return this.makeRequest<MovieDetails>(`/movie/${movieId}`, {
            append_to_response: 'watch/providers,credits,videos,release_dates',
        });
    }

    async getMoviesWithProviderDetails(
        providerIds?: number[],
        monetizationType: 'flatrate' | 'rent' | 'buy' = 'flatrate',
        page: number = 1
    ): Promise<TMDBResponse<MovieWithProviders>> {
        const params: DiscoverParams = {
            page,
            sort_by: 'popularity.desc',
            watch_region: 'US',
            with_watch_monetization_types: monetizationType
        };

        if (providerIds && providerIds.length > 0) {
            params.with_watch_providers = providerIds.join('|');
        }

        const response = await this.makeRequest<TMDBResponse<Movie>>('/discover/movie', params);

        const enhancedMovies: MovieWithProviders[] = await Promise.all(
            response.results.slice(0, 20).map(async movie => {
                try {
                    const details = await this.getMovieDetails(movie.id);
                    const certification = this.getUSCertification(details);
                    const providers = this.extractProviders(details);

                    return {
                        ...movie,
                        certification,
                        streamingProviders: providers.streaming,
                        rentProviders: providers.rent,
                        buyProviders: providers.buy,
                        hasStreaming: providers.streaming.length > 0
                    }
                } catch (error) {
                    console.error(`Error fetching movie details for movie ${movie.id}: `, error);
                    return {
                        ...movie,
                        certification: 'Not Rated',
                        streamingProviders: [],
                        rentProviders: [],
                        buyProviders: [],
                        hasStreaming: false
                    }
                }
            })
        );

        return {
            ...response,
            results: enhancedMovies
        }
    }

    getImageUrl(path: string | null, size: string ='w500'): string | null {
        if (!path) return null;

        return `${IMAGE_BASE_URL}${size}${path}`;
    }

    getBackdropUrl(path: string | null, size: string = 'w1280'): string | null {
        if (!path) return null;

        return `${IMAGE_BASE_URL}${size}${path}`;
    }

    getUSCertification(movieDetails: MovieDetails): string {
        if (!movieDetails.release_dates?.results) return 'Not Rated';

        const usRelease = movieDetails.release_dates.results.find(result => result.iso_3166_1 === 'US');

        if (!usRelease?.release_dates?.length) return 'Not Rated';

        const theatricalRelease = usRelease.release_dates.find(
            release => release.type === 3 || release.type === 2
        );

        return theatricalRelease?.certification || usRelease.release_dates[0].certification || 'Not Rated';
    }

    getPopularStreamingProviders(): StreamingProvider[] {
        return [
            { id: 8, name: 'Netflix' },
            { id: 9, name: 'Amazon Prime Video' },
            { id: 15, name: 'Hulu' },
            { id: 337, name: 'Disney Plus' },
            { id: 384, name: 'HBO Max' },
            { id: 350, name: 'Apple TV Plus' },
            { id: 387, name: 'Peacock' },
            { id: 531, name: 'Paramount Plus' },
            { id: 546, name: 'Showtime' },
            { id: 279, name: 'Crunchyroll' },
            { id: 257, name: 'Funimation' },
            { id: 192, name: 'YouTube' },
            { id: 10, name: 'Amazon Video' },
            { id: 2, name: 'Apple iTunes' },
            { id: 3, name: 'Google Play Movies' }
        ];
    }

    private extractProviders(movieDetails: MovieDetails): {
        streaming: Provider[];
        rent: Provider[];
        buy: Provider[];
    } {
        const usProviders = movieDetails['watch/providers']?.results?.US;

        return {
            streaming: usProviders?.flatrate || [],
            rent: usProviders?.rent || [],
            buy: usProviders?.buy || []
        }
    }
}

export default new TMDBApi();