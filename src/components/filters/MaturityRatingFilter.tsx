import {
    useAppStore,
    useFiltersStore
} from "@/store";

const MaturityRatingFilter = () => {
    const filters = useFiltersStore(state => state.filters);
    const handleFilterChange = useFiltersStore(state => state.handleFilterChange);
    const getAvailableRatings = useAppStore(state => state.getAvailableRatings);

    const availableRatings = getAvailableRatings();

    return (
        <div>
            <label htmlFor="maturity-rating" className="block text-sm font-medium text-gray-300 mb-2">
                Maturity Rating
            </label>
            <select
                id="maturity-rating"
                value={filters.maturityRating}
                onChange={(e) => handleFilterChange('maturityRating', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
                <option value="">All Ratings</option>
                {availableRatings.map((rating) => (
                    <option key={rating} value={rating}>
                        {rating}
                    </option>
                ))}
            </select>
        </div>
    );
}

export default MaturityRatingFilter;