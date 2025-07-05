import {
    TitleFilter,
    ReleaseYearFilter,
    MaturityRatingFilter,
    AvailabilityTypeFilter,
    StreamingServicesFilter,
    ActiveFilters,
    ClearFilters
} from "./index";

const MovieFilters = () => {
    return (
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
            <ClearFilters />
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <TitleFilter />
                    <ReleaseYearFilter />
                    <MaturityRatingFilter />
                </div>
                <AvailabilityTypeFilter />
                <StreamingServicesFilter />
            </div>
            <ActiveFilters />
        </div>
    );
};

export default MovieFilters;