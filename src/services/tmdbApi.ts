export interface Movie {
    id: number;
    title: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    release_date: string;
    vote_average: number;
    vote_count: number;
    genre_ids: number[];
    adult: boolean;
    original_language: string;
    original_title: string;
    popularity: number;
    video: boolean;
}

export interface MovieDetails extends Movie {
    genres: Genre[];
    runtime: number | null;
    budget: number;
    revenue: number;
    production_companies: ProductionCompany[];
    production_countries: ProductionCountry[];
    spoken_languages: SpokenLanguage[];
    status: string;
    tagline: string | null;
    credits?: Credits;
    videos?: Videos;
    'watch/providers'?: WatchProviders;
}

export interface Genre {
    id: number;
    name: string;
}

export interface ProductionCompany {
    id: number;
    logo_path: string | null;
    name: string;
    origin_country: string;
}

export interface ProductionCountry {
    iso_3166_1: string;
    name: string;
}

export interface SpokenLanguage {
    english_name: string;
    iso_639_1: string;
    name: string;
}

export interface Credits {
    cast: CastMember[];
    crew: CrewMember[];
}

export interface CastMember {
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
    order: number;
}

export interface CrewMember {
    id: number;
    name: string;
    job: string;
    department: string;
    profile_path: string | null;
}

export interface Videos {
    results: Video[];
}

export interface Video {
    id: string;
    key: string;
    name: string;
    site: string;
    type: string;
    official: boolean;
}

export interface WatchProviders {
    results: {
        [countryCode: string]: {
            link?: string;
            flatrate?: Provider[];
            rent?: Provider[];
            buy?: Provider[];
        };
    };
}

export interface Provider {
    provider_id: number;
    provider_name: string;
    logo_path: string;
    display_priority: number;
}

export interface TMDBResponse<T> {
    page: number;
    results: T[];
    total_pages: number;
    total_results: number;
}

export interface APIParams {
    [key: string]: string | number | boolean | undefined;
}

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
            append_to_response: 'watch/providers,credits,videos',
        });
    }

    getImageUrl(path: string | null, size: string ='w500'): string | null {
        if (!path) return null;

        return `${IMAGE_BASE_URL}${size}${path}`;
    }

    getBackdropUrl(path: string | null, size: string = 'w1280'): string | null {
        if (!path) return null;

        return `${IMAGE_BASE_URL}${size}${path}`;
    }
}

export default new TMDBApi();