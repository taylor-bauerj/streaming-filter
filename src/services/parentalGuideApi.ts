import type { IMDBParentalGuide, ContentFilter } from '@/types/parental-guide';
import type { MovieWithProviders } from '@/types/models';

const API_BASE_URL = import.meta.env.VITE_PARENTAL_GUIDE_API_URL || 'http://localhost:3001/api';

class ParentalGuideApi {
    async getParentalGuide(imdbId: string): Promise<IMDBParentalGuide | null> {
        try {
            const response = await fetch(`${API_BASE_URL}/parental-guide/${imdbId}`);

            if (!response.ok) {
                if (response.status === 404) {
                    return null;
                }

                throw new Error(`API request failed with status ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Error fetching parental guide for ${imdbId}:`, error);
            return null;
        }
    }

    async searchIMDBId(title: string, year?: number): Promise<string | null> {
        try {
            const params = new URLSearchParams({ title });
            if (year) {
                params.append('year', year.toString());
            }

            const response = await fetch(`${API_BASE_URL}/search-imdb?${params}`);

            if (!response.ok) {
                if (response.status === 404) {
                    return null;
                }
                throw new Error(`API request failed with status ${response.status}`);
            }

            const data = await response.json();
            return data.imdbId;
        } catch (error) {
            console.error(`Error searching IMDB ID for "${title}":`, error);
            return null;
        }
    }

    async getParentalGuidesForMovies(movies: MovieWithProviders[]): Promise<{ [tmdbId: number]: IMDBParentalGuide | null }> {
        try {
            const movieData = movies.map(movie => ({
                tmdbId: movie.id,
                title: movie.title,
                releaseDate: movie.release_date,
                imdbId: movie.imdbId
            }));

            const response = await fetch(`${API_BASE_URL}/parental-guides/batch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ movies: movieData })
            });

            if (!response.ok) {
                throw new Error(`Batch API request failed with status ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching parental guides batch:', error);
            return {};
        }
    }

    async filterMoviesByContent(movies: MovieWithProviders[], filters: ContentFilter): Promise<MovieWithProviders[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/filter-movies`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ movies, filters })
            });

            if (!response.ok) {
                throw new Error(`Filter API request failed with status ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error filtering movies by content:', error);
            return movies; // Return original list if filtering fails
        }
    }

    async getCacheStats(): Promise<{ totalCached: number; cacheSize: string; lastSaved: string }> {
        try {
            const response = await fetch(`${API_BASE_URL}/cache/stats`);

            if (!response.ok) {
                throw new Error(`Cache stats API request failed with status ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching cache stats:', error);
            return { totalCached: 0, cacheSize: '0 bytes', lastSaved: new Date().toISOString() };
        }
    }

    async clearCache(): Promise<boolean> {
        try {
            const response = await fetch(`${API_BASE_URL}/cache`, {
                method: 'DELETE'
            });

            return response.ok;
        } catch (error) {
            console.error('Error clearing cache:', error);
            return false;
        }
    }

    async healthCheck(): Promise<boolean> {
        try {
            const response = await fetch(`${API_BASE_URL}/health`);
            return response.ok;
        } catch (error) {
            console.error('Parental guide API health check failed:', error);
            return false;
        }
    }

    /**
     * Helper method to check if a movie passes content filters locally
     */
    static moviePassesFilters(guide: IMDBParentalGuide, filters: ContentFilter): boolean {
        if (!guide.dataAvailable) {
            return true; // Include movies with no data
        }

        const categories: (keyof ContentFilter)[] = ['violence', 'nudity', 'profanity', 'alcohol', 'frightening'];

        for (const category of categories) {
            const filterValue = filters[category];
            const movieValue = guide[category].severity;

            if (filterValue === 'any') continue;

            if (!this.severityMeetsFilter(movieValue, filterValue)) {
                return false;
            }
        }

        return true;
    }

    private static severityMeetsFilter(movieSeverity: string, filterMax: string): boolean {
        const severityLevels = ['none', 'mild', 'moderate', 'severe'];
        const movieLevel = severityLevels.indexOf(movieSeverity);
        const filterLevel = severityLevels.indexOf(filterMax);

        return movieLevel <= filterLevel;
    }
}

export { ParentalGuideApi };
export default new ParentalGuideApi();