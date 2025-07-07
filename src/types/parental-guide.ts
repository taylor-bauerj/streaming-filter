export type ParentalCategories = 'violence' | 'nudity' | 'profanity' | 'alcohol' | 'frightening';
export type SeverityType = 'none' | 'mild' | 'moderate' | 'severe';

export interface ParentalGuideContent {
    category: ParentalCategories;
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
    violence: SeverityType | 'any';
    nudity: SeverityType | 'any';
    profanity: SeverityType | 'any';
    alcohol: SeverityType | 'any';
    frightening: SeverityType | 'any';
}

export interface ContentFilterPresets {
    family: ContentFilter;
    teen: ContentFilter;
    mature: ContentFilter;
    any: ContentFilter;
}

export const CONTENT_FILTER_PRESETS: ContentFilterPresets = {
    family: {
        violence: 'none',
        nudity: 'none',
        profanity: 'none',
        alcohol: 'mild',
        frightening: 'mild'
    },
    teen: {
        violence: 'mild',
        nudity: 'none',
        profanity: 'mild',
        alcohol: 'moderate',
        frightening: 'moderate'
    },
    mature: {
        violence: 'moderate',
        nudity: 'mild',
        profanity: 'moderate',
        alcohol: 'any',
        frightening: 'any'
    },
    any: {
        violence: 'any',
        nudity: 'any',
        profanity: 'any',
        alcohol: 'any',
        frightening: 'any'
    }
};

export interface SeverityInfo {
    label: string;
    color: string;
    icon: string;
}

export const SEVERITY_INFO: Record<string, SeverityInfo> = {
    none: { label: 'None', color: 'text-green-400', icon: '✅' },
    mild: { label: 'Mild', color: 'text-yellow-400', icon: '⚠️' },
    moderate: { label: 'Moderate', color: 'text-orange-400', icon: '🔶' },
    severe: { label: 'Severe', color: 'text-red-400', icon: '🔴' }
};

export const CATEGORY_INFO = {
    violence: { label: 'Violence & Gore', icon: '⚔️' },
    nudity: { label: 'Nudity & Sexual Content', icon: '🔞' },
    profanity: { label: 'Profanity', icon: '🤬' },
    alcohol: { label: 'Alcohol, Drugs & Smoking', icon: '🚬' },
    frightening: { label: 'Frightening & Intense Scenes', icon: '😱' }
};
