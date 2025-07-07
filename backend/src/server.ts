import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import IMDBParentalGuideScraper, { IMDBParentalGuide } from './imdb-scraper';

const app = express();
const port = process.env.PORT || 3001;
const scraper = new IMDBParentalGuideScraper();

// In-memory cache and persistent storage
const dataDir = './data';
const cacheFile = path.join(dataDir, 'parental-guides.json');
let parentalGuidesCache: Map<string, IMDBParentalGuide> = new Map();

// Middleware
app.use(cors());
app.use(express.json());

// Ensure data directory exists
async function ensureDataDir() {
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir, { recursive: true });
    }
}

// Load cached data on startup
async function loadCache() {
    try {
        const data = await fs.readFile(cacheFile, 'utf-8');
        const parsed = JSON.parse(data);
        parentalGuidesCache = new Map(Object.entries(parsed));
        console.log(`Loaded ${parentalGuidesCache.size} cached parental guides`);
    } catch (error) {
        console.log('No existing cache file found, starting fresh');
    }
}

// Save cache to disk
async function saveCache() {
    try {
        const data = Object.fromEntries(parentalGuidesCache);
        await fs.writeFile(cacheFile, JSON.stringify(data, null, 2));
        console.log(`Saved ${parentalGuidesCache.size} parental guides to cache`);
    } catch (error) {
        console.error('Error saving cache:', error);
    }
}

// API Routes

/**
 * Get parental guide for a specific IMDB ID
 */
app.get('/api/parental-guide/:imdbId', async (req, res) => {
    try {
        const { imdbId } = req.params;

        // Check cache first
        if (parentalGuidesCache.has(imdbId)) {
            const cached = parentalGuidesCache.get(imdbId)!;
            // Check if cache is less than 7 days old
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            if (new Date(cached.lastUpdated) > weekAgo) {
                return res.json(cached);
            }
        }

        // Scrape fresh data
        console.log(`Scraping parental guide for ${imdbId}`);
        const guide = await scraper.scrapeParentalGuide(imdbId);

        if (guide) {
            //parentalGuidesCache.set(imdbId, guide);
            //await saveCache();
            return res.json(guide);
        } else {
            return res.status(404).json({ error: 'Parental guide not found' });
        }
    } catch (error) {
        console.error('Error fetching parental guide:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Search for IMDB ID by movie title and year
 */
app.get('/api/search-imdb', async (req, res) => {
    try {
        const { title, year } = req.query;

        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        const imdbId = await scraper.searchIMDBId(
            title as string,
            year ? parseInt(year as string) : undefined
        );

        if (imdbId) {
            return res.json({ imdbId, title, year });
        } else {
            return res.status(404).json({ error: 'IMDB ID not found' });
        }
    } catch (error) {
        console.error('Error searching IMDB:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Get parental guides for multiple movies (batch processing)
 */
app.post('/api/parental-guides/batch', async (req, res) => {
    try {
        const { movies } = req.body;

        if (!Array.isArray(movies)) {
            return res.status(400).json({ error: 'Movies array is required' });
        }

        const results: { [key: number]: IMDBParentalGuide | null } = {};

        for (const movie of movies) {
            const { title, releaseDate, imdbId } = movie;
            const tmdbId = movie.tmdbId;

            let movieImdbId = imdbId;

            // If no IMDB ID provided, search for it
            if (!movieImdbId) {
                const year = releaseDate ? new Date(releaseDate).getFullYear() : undefined;
                movieImdbId = await scraper.searchIMDBId(title, year);
            }

            if (movieImdbId) {
                // Check cache first
                if (parentalGuidesCache.has(movieImdbId)) {
                    const cached = parentalGuidesCache.get(movieImdbId)!;
                    cached.tmdbId = tmdbId;
                    results[tmdbId] = cached;
                } else {
                    // Scrape new data
                    const guide = await scraper.scrapeParentalGuide(movieImdbId);
                    if (guide) {
                        guide.tmdbId = tmdbId;
                        parentalGuidesCache.set(movieImdbId, guide);
                        results[tmdbId] = guide;
                    } else {
                        results[tmdbId] = null;
                    }
                }
            } else {
                results[tmdbId] = null;
            }
        }

        await saveCache();
        return res.json(results);
    } catch (error) {
        console.error('Error in batch processing:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Filter movies based on content filters
 */
app.post('/api/filter-movies', async (req, res) => {
    try {
        const { movies, filters } = req.body;

        if (!Array.isArray(movies) || !filters) {
            return res.status(400).json({ error: 'Movies array and filters are required' });
        }

        const filteredMovies = [];

        for (const movie of movies) {
            const { imdbId } = movie;

            if (imdbId && parentalGuidesCache.has(imdbId)) {
                const guide = parentalGuidesCache.get(imdbId)!;
                if (IMDBParentalGuideScraper.moviePassesFilters(guide, filters)) {
                    filteredMovies.push({
                        ...movie,
                        parentalGuide: guide
                    });
                }
            } else {
                // If no parental guide data, include by default (configurable)
                filteredMovies.push(movie);
            }
        }

        return res.json(filteredMovies);
    } catch (error) {
        console.error('Error filtering movies:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Get cache statistics
 */
app.get('/api/cache/stats', (_req, res) => {
    res.json({
        totalCached: parentalGuidesCache.size,
        cacheSize: `${JSON.stringify(Object.fromEntries(parentalGuidesCache)).length} bytes`,
        lastSaved: new Date()
    });
});

/**
 * Clear cache
 */
app.delete('/api/cache', async (_req, res) => {
    try {
        parentalGuidesCache.clear();
        await fs.unlink(cacheFile).catch(() => {}); // Ignore error if file doesn't exist
        res.json({ message: 'Cache cleared successfully' });
    } catch (error) {
        console.error('Error clearing cache:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Health check endpoint
 */
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date(),
        cacheSize: parentalGuidesCache.size
    });
});

// Error handling middleware
app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((_req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Startup
async function startServer() {
    try {
        await ensureDataDir();
        await loadCache();

        app.listen(port, () => {
            console.log(`🚀 Parental Guide API server running on port ${port}`);
            console.log(`📊 Loaded ${parentalGuidesCache.size} cached parental guides`);
            console.log(`🔍 IMDB Scraper ready for content filtering`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, saving cache...');
    await saveCache();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('Received SIGINT, saving cache...');
    await saveCache();
    process.exit(0);
});

startServer();

export default app;