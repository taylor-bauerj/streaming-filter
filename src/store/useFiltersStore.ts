import { create } from 'zustand'
import {devtools} from "zustand/middleware";
import type {AvailabilityType, FilterOptions} from "../types/models.ts";
import type {MovieWithProviders} from "../services/tmdbApi.ts";
import { useAppStore } from "./useAppStore.ts";

export interface ProviderFilter {
    providerIds: number[];
    availabilityType: AvailabilityType;
}

interface FiltersState {
    // state
    filters: FilterOptions;
    currentProviderFilter: ProviderFilter;

    // actions
    setFilters: (filters: FilterOptions) => void;
    setCurrentProviderFilter: (providerFilter: ProviderFilter) => void;
    clearAllFilters: () => void;

    // computed values
    getFilteredMovies: () => MovieWithProviders[];
}

export const useFiltersStore = create<FiltersState>()(
    devtools(
        (set, get) => ({
            // initial state
            filters: {
                title: '',
                releaseYear: '',
                maturityRating: '',
                streamingServices: [],
                availabilityType: 'all'
            },
            currentProviderFilter: {
                providerIds: [],
                availabilityType: 'all'
            },

            setFilters: (filters: FilterOptions) => set({ filters }),
            setCurrentProviderFilter: (providerFilter: ProviderFilter) => {
                set({ currentProviderFilter: providerFilter });

                const { fetchMoviesWithFilters } = useAppStore.getState();
                fetchMoviesWithFilters(providerFilter.providerIds, providerFilter.availabilityType);
            },
            clearAllFilters: () => {
                set({ filters: {
                    title: '',
                    releaseYear: '',
                    maturityRating: '',
                    streamingServices: [],
                    availabilityType: 'all'
                }});

                set({ currentProviderFilter: {
                    providerIds: [],
                    availabilityType: 'all'
                }});

                const { fetchMoviesWithFilters } = useAppStore.getState();
                fetchMoviesWithFilters([], 'all');
            },

            getFilteredMovies: () => {
                const { filters } = get();
                const { movies } = useAppStore.getState();

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
            }
        }),
        {
            name: 'filters-store'
        }
    )
)