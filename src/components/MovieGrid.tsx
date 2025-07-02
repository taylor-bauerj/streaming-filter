import tmdbApi, {type Movie, type TMDBResponse} from "../services/tmdbApi.ts";
import {useEffect, useState} from "react";
import MovieCard from "./MovieCard.tsx";

const MovieGrid = () => {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
       const fetchTopMovies = async () => {
           try {
               setLoading(true);
               setError(null);

               const response: TMDBResponse<Movie> = await tmdbApi.getPopularMovies();
               setMovies(response.results.slice(0, 10));
           } catch (error) {
               console.error('Error fetching movies: ', error);
               setError('Failed to fetch movies');
           } finally {
               setLoading(false);
           }
       };

       fetchTopMovies();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white text-2xl">Loading top movies...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-red-500 text-2xl">{error}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black py-8">
            <div className="container mx-auto px-4">
                <h1 className="text-4xl font-bold text-white mb-8 text-center">Top Movies</h1>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                    {movies.map(movie => (<MovieCard key={movie.id} movie={movie} />))}
                </div>
            </div>
        </div>
    );
}

export default MovieGrid;