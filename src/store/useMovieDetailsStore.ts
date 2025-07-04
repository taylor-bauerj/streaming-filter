import type {MovieDetails} from "../services/tmdbApi.ts";
import {create} from "zustand";
import {devtools} from "zustand/middleware";

interface MovieDetailsState {
    // state
    expandedMovieId: number | null;
    movieDetailsCache: Record<number, MovieDetails>;
    loadingMovies: Record<number, boolean>;

    // actions
    setExpandedMovie: (movieId: number | null) => void;
    setMovieDetails: (movieId: number, details: MovieDetails) => void;
    setLoading: (movieId: number, loading: boolean) => void;
    closeModal: () => void;

    // getters
    isMovieExpanded: (movieId: number) => boolean;
    getMovieDetails: (movieId: number) => MovieDetails | null;
    isMovieLoading: (movieId: number) => boolean;
}

export const useMovieDetailsStore = create<MovieDetailsState>()(
    devtools(
        (set, get) => ({
            // initial state
            expandedMovieId: null,
            movieDetailsCache: {},
            loadingMovies: {},

            // actions
            setExpandedMovie: (movieId: number | null) => set({ expandedMovieId: movieId }),

            setMovieDetails: (movieId: number, details: MovieDetails) => {
                set(state => ({
                    movieDetailsCache: {
                        ...state.movieDetailsCache,
                        [movieId]: details
                    }
                }));
            },

            setLoading: (movieId: number, loading: boolean) => {
                set(state => ({
                    loadingMovies: {
                        ...state.loadingMovies,
                        [movieId]: loading
                    }
                }));
            },

            closeModal: () => set({ expandedMovieId: null }),

            // helpers
            isMovieExpanded: (movieId: number) => get().expandedMovieId === movieId,
            getMovieDetails: (movieId: number) => get().movieDetailsCache[movieId],
            isMovieLoading: (movieId: number) => get().loadingMovies[movieId],
        }),
        {
            name: 'movie-details-store'
        }
    )
)