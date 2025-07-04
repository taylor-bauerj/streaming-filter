export type AvailabilityType = 'all' | 'streaming' | 'rent' | 'buy';

export interface FilterOptions {
    title: string;
    releaseYear: string;
    maturityRating: string;
    streamingServices: number[];
    availabilityType: AvailabilityType;
}