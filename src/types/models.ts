export type AvailabilityType = 'all' | 'streaming' | 'rent' | 'buy';

export interface FilterOptions {
    title: string;
    releaseYear: string;
    maturityRating: string;
    streamingServices: number[];
    availabilityType: AvailabilityType;
}

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
    certification?: string;
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
    release_dates?: ReleaseDates;
}

export interface ReleaseDates {
    results: ReleaseDateResult[];
}

export interface ReleaseDateResult {
    iso_3166_1: string;
    release_dates: ReleaseDate[];
}

export interface ReleaseDate {
    certification: string;
    iso_639_1: string;
    release_date: string;
    type: number;
    note: string;
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

export interface MovieWithProviders extends Movie {
    certification?: string;
    streamingProviders?: Provider[];
    rentProviders?: Provider[];
    buyProviders?: Provider[];
    hasStreaming?: boolean;
}

export interface StreamingProvider {
    id: number;
    name: string;
    logo_path?: string;
}

export interface DiscoverParams {
    page?: number;
    sort_by?: string;
    'vote_average.gte'?: number;
    'vote_count.gte'?: number;
    with_watch_providers?: string;
    watch_region?: string;
    with_genres?: string;
    'primary_release_date.gte'?: string;
    'primary_release_date.lte'?: string;
    with_watch_monetization_types?: string;
    [key: string]: string | number | boolean | undefined;
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