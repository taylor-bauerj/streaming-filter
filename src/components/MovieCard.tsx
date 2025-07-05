import tmdbApi from '../services/tmdbApi';
import type { Movie } from "../types/models.ts";
import { useMovieDetailsStore } from "../store";

interface MovieCardProps {
    movie: Movie;
}

const MovieCard = ({ movie }: MovieCardProps) => {
    // movie detail state
    const expandedMovieId = useMovieDetailsStore(state => state.expandedMovieId);
    const movieDetailsCache = useMovieDetailsStore(state => state.movieDetailsCache);
    const loadingMovies = useMovieDetailsStore(state => state.loadingMovies);

    // actions
    const setExpandedMovie = useMovieDetailsStore(state => state.setExpandedMovie);
    const setMovieDetails = useMovieDetailsStore(state => state.setMovieDetails);
    const setLoading = useMovieDetailsStore(state => state.setLoading);
    const closeModal = useMovieDetailsStore(state => state.closeModal);

    // derived state for this movie
    const isExpanded = expandedMovieId === movie.id;
    const movieDetails = movieDetailsCache[movie.id] || null;
    const loading = loadingMovies[movie.id] || false;

    const handleCardClick = async (): Promise<void> => {
        setExpandedMovie(movie.id);

        // Fetch details if not already cached
        if (!movieDetails && !loading) {
            setLoading(movie.id, true);
            try {
                const details = await tmdbApi.getMovieDetails(movie.id);
                setMovieDetails(movie.id, details);
            } catch (error) {
                console.error('Error fetching movie details:', error);
            } finally {
                setLoading(movie.id, false);
            }
        }
    };

    const handleCloseModal = (): void => {
        closeModal();
    };

    const formatRuntime = (minutes: number | null): string => {
        if (!minutes) return 'N/A';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    const formatRating = (rating: number): string => {
        return rating ? rating.toFixed(1) : 'N/A';
    };

    const getRatingColor = (certification?: string): string => {
        switch (certification) {
            case 'G':
                return 'bg-green-500';
            case 'PG':
                return 'bg-blue-500';
            case 'PG-13':
                return 'bg-yellow-500';
            case 'R':
                return 'bg-red-500';
            default:
                return 'bg-gray-500';
        }
    };

    return (
        <>
            <div
                className="relative bg-gray-900 rounded-lg overflow-hidden cursor-pointer transition-all duration-300 ease-in-out hover:scale-105"
                onClick={handleCardClick}
            >
                <div className="aspect-[2/3] relative">
                    <img
                        src={tmdbApi.getImageUrl(movie.poster_path) || '/api/placeholder/300/450'}
                        alt={movie.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                    {/* Rating badge */}
                    <div className="absolute top-2 right-2 bg-yellow-500 text-black px-2 py-1 rounded-full text-sm font-bold">
                        ⭐ {formatRating(movie.vote_average)}
                    </div>

                    {/*Maturity Rating*/}
                    <div className={`absolute top-2 left-2 ${getRatingColor(movie.certification)} text-white px-2 py-1 rounded text-xs font-bold`}>
                        {movie.certification}
                    </div>
                </div>

                <div className="p-4">
                    <h3 className="text-white font-semibold text-lg mb-2 line-clamp-2">
                        {movie.title}
                    </h3>
                    <p className="text-gray-400 text-sm mb-2">
                        {new Date(movie.release_date).getFullYear()}
                    </p>
                    <p className="text-gray-300 text-sm line-clamp-3">
                        {movie.overview}
                    </p>
                </div>
            </div>

            {/* Fullscreen Modal */}
            {isExpanded && (
                <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 overflow-y-auto">
                    {/* Close button */}
                    <button
                        onClick={handleCloseModal}
                        className="absolute top-16 right-24 text-white hover:text-gray-300 z-60 !bg-gray-800"
                    >
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div className="bg-gray-900 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto relative">
                        {loading ? (
                            <div className="flex items-center justify-center h-96">
                                <div className="text-white text-xl">Loading details...</div>
                            </div>
                        ) : movieDetails ? (
                            <div className="relative">
                                {/* Backdrop */}
                                {movieDetails.backdrop_path && (
                                    <div className="relative h-96 w-full">
                                        <img
                                            src={tmdbApi.getBackdropUrl(movieDetails.backdrop_path) || '/api/placeholder/1920/1080'}
                                            alt={movieDetails.title}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
                                    </div>
                                )}

                                <div className="p-8 -mt-32 relative z-10">
                                    <div className="grid md:grid-cols-3 gap-8">
                                        {/* Poster */}
                                        <div className="md:col-span-1">
                                            <img
                                                src={tmdbApi.getImageUrl(movieDetails.poster_path) || '/api/placeholder/400/600'}
                                                alt={movieDetails.title}
                                                className="w-full rounded-lg shadow-2xl"
                                            />
                                        </div>

                                        {/* Details */}
                                        <div className="md:col-span-2 space-y-6 text-white">
                                            <div>
                                                <h1 className="text-4xl font-bold mb-2">{movieDetails.title}</h1>
                                                {movieDetails.tagline && (
                                                    <p className="text-xl text-gray-300 italic">{movieDetails.tagline}</p>
                                                )}
                                            </div>

                                            <div className="flex items-center space-x-6 text-lg">
                                                <span>{new Date(movieDetails.release_date).getFullYear()}</span>
                                                <span>•</span>
                                                <span>{formatRuntime(movieDetails.runtime)}</span>
                                                <span>•</span>
                                                <div className="flex items-center space-x-2">
                      <span className="bg-yellow-500 text-black px-3 py-1 rounded-full font-bold">
                        ⭐ {formatRating(movieDetails.vote_average)}
                      </span>
                                                    <span className="text-gray-400">({movieDetails.vote_count} votes)</span>
                                                </div>
                                            </div>

                                            {/* Genres */}
                                            <div className="flex flex-wrap gap-2">
                                                {movieDetails.genres?.map((genre) => (
                                                    <span
                                                        key={genre.id}
                                                        className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium"
                                                    >
                        {genre.name}
                      </span>
                                                ))}
                                            </div>

                                            {/* Overview */}
                                            <div>
                                                <h3 className="text-2xl font-semibold mb-3">Overview</h3>
                                                <p className="text-gray-300 leading-relaxed text-lg">
                                                    {movieDetails.overview}
                                                </p>
                                            </div>

                                            {/* Cast */}
                                            {movieDetails.credits?.cast && (
                                                <div>
                                                    <h3 className="text-2xl font-semibold mb-3">Cast</h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        {movieDetails.credits.cast.slice(0, 8).map((actor) => (
                                                            <div key={actor.id} className="flex items-center space-x-3">
                                                                {actor.profile_path && (
                                                                    <img
                                                                        src={tmdbApi.getImageUrl(actor.profile_path, 'w45') || '/api/placeholder/45/65'}
                                                                        alt={actor.name}
                                                                        className="w-12 h-12 rounded-full object-cover"
                                                                    />
                                                                )}
                                                                <div>
                                                                    <div className="font-medium">{actor.name}</div>
                                                                    <div className="text-gray-400 text-sm">{actor.character}</div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Watch Providers */}
                                            {movieDetails['watch/providers']?.results?.US && (
                                                <div>
                                                    <h3 className="text-2xl font-semibold mb-3">Available On</h3>
                                                    <div className="space-y-4">
                                                        {movieDetails['watch/providers'].results.US.flatrate && (
                                                            <div>
                                                                <h4 className="text-lg font-medium mb-2 text-green-400">Stream</h4>
                                                                <div className="flex flex-wrap gap-3">
                                                                    {movieDetails['watch/providers'].results.US.flatrate.map((provider) => (
                                                                        <div key={provider.provider_id} className="flex items-center space-x-2 bg-gray-800 rounded-lg p-3">
                                                                            <img
                                                                                src={tmdbApi.getImageUrl(provider.logo_path, 'w45') || '/api/placeholder/45/65'}
                                                                                alt={provider.provider_name}
                                                                                className="w-8 h-8 rounded"
                                                                            />
                                                                            <span>{provider.provider_name}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {movieDetails['watch/providers'].results.US.rent && (
                                                            <div>
                                                                <h4 className="text-lg font-medium mb-2 text-blue-400">Rent</h4>
                                                                <div className="flex flex-wrap gap-3">
                                                                    {movieDetails['watch/providers'].results.US.rent.map((provider) => (
                                                                        <div key={provider.provider_id} className="flex items-center space-x-2 bg-gray-800 rounded-lg p-3">
                                                                            <img
                                                                                src={tmdbApi.getImageUrl(provider.logo_path, 'w45') || '/api/placeholder/45/65'}
                                                                                alt={provider.provider_name}
                                                                                className="w-8 h-8 rounded"
                                                                            />
                                                                            <span>{provider.provider_name}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {movieDetails['watch/providers'].results.US.buy && (
                                                            <div>
                                                                <h4 className="text-lg font-medium mb-2 text-purple-400">Buy</h4>
                                                                <div className="flex flex-wrap gap-3">
                                                                    {movieDetails['watch/providers'].results.US.buy.map((provider) => (
                                                                        <div key={provider.provider_id} className="flex items-center space-x-2 bg-gray-800 rounded-lg p-3">
                                                                            <img
                                                                                src={tmdbApi.getImageUrl(provider.logo_path, 'w45') || '/api/placeholder/45/65'}
                                                                                alt={provider.provider_name}
                                                                                className="w-8 h-8 rounded"
                                                                            />
                                                                            <span>{provider.provider_name}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-96">
                                <div className="text-white text-xl">Failed to load details</div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default MovieCard;