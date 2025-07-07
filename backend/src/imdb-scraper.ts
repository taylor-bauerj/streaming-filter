import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import { setTimeout } from 'timers/promises';

export interface ParentalGuideContent {
    category: 'violence' | 'nudity' | 'profanity' | 'alcohol' | 'frightening';
    severity: SeverityType;
    items: string[];
    certified: boolean;
}

export interface IMDBParentalGuide {
    imdbId: string;
    tmdbId?: number;
    violence: ParentalGuideContent;
    nudity: ParentalGuideContent;
    profanity: ParentalGuideContent;
    alcohol: ParentalGuideContent;
    frightening: ParentalGuideContent;
    lastUpdated: Date;
    dataAvailable: boolean;
    certified: boolean;
}

export interface ContentFilter {
    violence: 'none' | 'mild' | 'moderate' | 'severe' | 'any';
    nudity: 'none' | 'mild' | 'moderate' | 'severe' | 'any';
    profanity: 'none' | 'mild' | 'moderate' | 'severe' | 'any';
    alcohol: 'none' | 'mild' | 'moderate' | 'severe' | 'any';
    frightening: 'none' | 'mild' | 'moderate' | 'severe' | 'any';
}

type SeverityType = 'none' | 'mild' | 'moderate' | 'severe';

class IMDBParentalGuideScraper {
    private readonly baseUrl = 'https://www.imdb.com';
    private readonly requestDelay = 1000; // 1 second between requests to be respectful
    private readonly maxRetries = 3;

    /**
     * Extract IMDB ID from a movie title and year by searching IMDB
     */
    async searchIMDBId(title: string, year?: number): Promise<string | null> {
        try {
            const searchQuery = year ? `${title} ${year}` : title;
            const searchUrl = `${this.baseUrl}/find?q=${encodeURIComponent(searchQuery)}&s=tt&ttype=ft`;

            const response = await this.makeRequest(searchUrl);
            const $ = cheerio.load(response);

            // Look for the first movie result
            const firstResult = $('.ipc-metadata-list-summary-item__t').first();
            const href = firstResult.attr('href');

            if (href) {
                const match = href.match(/\/title\/(tt\d+)\//);
                return match ? match[1] : null;
            }

            return null;
        } catch (error) {
            console.error(`Error searching for IMDB ID for "${title}":`, error);
            return null;
        }
    }

    /**
     * Scrape parental guide data from IMDB
     */
    async scrapeParentalGuide(imdbId: string): Promise<IMDBParentalGuide | null> {
        try {
            const url = `${this.baseUrl}/title/${imdbId}/parentalguide/`;
            const response = await this.makeRequest(url);
            const $ = cheerio.load(response);

            // Check if the page exists and has parental guide data
            if (!this.isValidParentalGuidePage($)) {
                console.log(`No parental guide data found for ${imdbId}`);
                return this.createEmptyGuide(imdbId);
            }

            // Try to extract from content rating summary first
            const summaryRatings = this.extractFromContentRatingSummary($);

            return {
                imdbId,
                violence: this.extractCategoryData($, 'violence', summaryRatings.violence),
                nudity: this.extractCategoryData($, 'nudity', summaryRatings.nudity),
                profanity: this.extractCategoryData($, 'profanity', summaryRatings.profanity),
                alcohol: this.extractCategoryData($, 'alcohol', summaryRatings.alcohol),
                frightening: this.extractCategoryData($, 'frightening', summaryRatings.frightening),
                lastUpdated: new Date(),
                dataAvailable: true,
                certified: false
            };
        } catch (error) {
            console.error(`Error scraping parental guide for ${imdbId}:`, error);
            return null;
        }
    }

    /**
     * Batch scrape multiple IMDB IDs with rate limiting
     */
    async scrapeMultipleGuides(imdbIds: string[]): Promise<(IMDBParentalGuide | null)[]> {
        const results: (IMDBParentalGuide | null)[] = [];

        for (let i = 0; i < imdbIds.length; i++) {
            const imdbId = imdbIds[i];
            console.log(`Scraping ${i + 1}/${imdbIds.length}: ${imdbId}`);

            const guide = await this.scrapeParentalGuide(imdbId);
            results.push(guide);

            // Rate limiting - wait between requests
            if (i < imdbIds.length - 1) {
                await setTimeout(this.requestDelay);
            }
        }

        return results;
    }

    /**
     * Check if a movie passes the content filters
     */
    static moviePassesFilters(guide: IMDBParentalGuide, filters: ContentFilter): boolean {
        if (!guide.dataAvailable) {
            // If no data available, decide whether to include or exclude
            // Default: include movies with no data (user preference)
            return true;
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

    /**
     * Convert TMDB movie data to search for IMDB ID
     */
    async getIMDBIdFromTMDB(_tmdbId: number, title: string, releaseDate?: string): Promise<string | null> {
        // First try to get IMDB ID from TMDB API if you have access to external IDs
        // If not available, fall back to search
        const year = releaseDate ? new Date(releaseDate).getFullYear() : undefined;
        return this.searchIMDBId(title, year);
    }

    private async makeRequest(url: string, retryCount = 0): Promise<string> {
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'DNT': '1',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.text();
        } catch (error) {
            if (retryCount < this.maxRetries) {
                console.log(`Request failed, retrying (${retryCount + 1}/${this.maxRetries})...`);
                await setTimeout(this.requestDelay * (retryCount + 1));
                return this.makeRequest(url, retryCount + 1);
            }
            throw error;
        }
    }

    private extractFromContentRatingSummary($: cheerio.CheerioAPI): { [key: string]: SeverityType } {
        const ratings: { [key: string]: SeverityType } = {};

        // Look for content rating summary links
        $('[data-testid="rating-item"]').each((_, element) => {
            const $element = $(element);
            const labelText = $element.find('a').first().text().toLowerCase();
            const ratingText = $element.find('.ipc-html-content-inner-div').text().toLowerCase().trim() as SeverityType;

            if (labelText.includes('nudity') || labelText.includes('sex')) {
                ratings.nudity = ratingText;
            } else if (labelText.includes('violence') || labelText.includes('gore')) {
                ratings.violence = ratingText;
            } else if (labelText.includes('profanity')) {
                ratings.profanity = ratingText;
            } else if (labelText.includes('alcohol') || labelText.includes('drug') || labelText.includes('smoking')) {
                ratings.alcohol = ratingText;
            } else if (labelText.includes('frightening') || labelText.includes('intense')) {
                ratings.frightening = ratingText;
            }
        });

        return ratings;
    }

    private isValidParentalGuidePage($: cheerio.CheerioAPI): boolean {
        const sections = $('[data-testid="sub-section-nudity"], [data-testid="sub-section-violence"], [data-testid="sub-section-profanity"], [data-testid="sub-section-alcohol"], [data-testid="sub-section-frightening"]');

        return sections.length > 0;
    }

    private extractCategoryData($: cheerio.CheerioAPI, category: string, summarySeverity: SeverityType = 'none'): ParentalGuideContent {
        const newSectionSelector = `[data-testid="sub-section-${category}"]`;
        let section = $(newSectionSelector);

        if (!section.length) {
            return {
                category: category as any,
                severity: 'none',
                items: [],
                certified: false
            };
        }

        // Extract individual items/descriptions
        const items = this.extractItems($, section);

        // Check if this is certified content
        const certified = this.isCertifiedContent($, section);

        return {
            category: category as any,
            severity: summarySeverity,
            items,
            certified
        };
    }

    private extractItems($: cheerio.CheerioAPI, section: cheerio.Cheerio<any>): string[] {
        const items: string[] = [];

        // Try new structure first - look for item cards
        const itemCards = section.find('[data-testid="item-id"]');
        if (itemCards.length) {
            itemCards.each((_, element) => {
                const itemElement = $(element);

                // Look for the item text in the new structure
                const itemText = itemElement.find('[data-testid="item-html"] .ipc-html-content-inner-div').text().trim();

                if (itemText && itemText.length > 3 && itemText !== 'None.') {
                    items.push(itemText);
                }
            });
        }

        // Fallback to old structure - look for list items
        if (items.length === 0) {
            section.find('li').each((_, element) => {
                const text = $(element).text().trim();
                if (text && text.length > 10) {
                    items.push(text);
                }
            });
        }

        // If still no items, try paragraphs
        if (items.length === 0) {
            section.find('p').each((_, element) => {
                const text = $(element).text().trim();
                if (text && text.length > 10) {
                    items.push(text);
                }
            });
        }

        return items.slice(0, 10); // Limit to 10 items to keep data manageable
    }

    private isCertifiedContent(_$: cheerio.CheerioAPI, section: cheerio.Cheerio<any>): boolean {
        // Check for indicators that this is official/certified content
        const sectionHtml = section.html() || '';

        // Look for severity voting components which indicate community content
        const hasSeverityVote = sectionHtml.includes('severity-vote-button') ||
            sectionHtml.includes('Vote') ||
            sectionHtml.includes('found this to have');

        // If it has voting, it's community content, not certified
        return !hasSeverityVote;
    }

    private createEmptyGuide(imdbId: string): IMDBParentalGuide {
        const emptyContent: ParentalGuideContent = {
            category: 'violence',
            severity: 'none',
            items: [],
            certified: false
        };

        return {
            imdbId,
            violence: { ...emptyContent, category: 'violence' },
            nudity: { ...emptyContent, category: 'nudity' },
            profanity: { ...emptyContent, category: 'profanity' },
            alcohol: { ...emptyContent, category: 'alcohol' },
            frightening: { ...emptyContent, category: 'frightening' },
            lastUpdated: new Date(),
            dataAvailable: false,
            certified: false
        };
    }

    private static severityMeetsFilter(movieSeverity: string, filterMax: string): boolean {
        const severityLevels = ['none', 'mild', 'moderate', 'severe'];
        const movieLevel = severityLevels.indexOf(movieSeverity);
        const filterLevel = severityLevels.indexOf(filterMax);

        return movieLevel <= filterLevel;
    }
}

export default IMDBParentalGuideScraper;