import { useAppStore, useFiltersStore } from "../../store";

const ReleaseYearFilter = () => {
    const filters = useFiltersStore(state => state.filters);
    const handleFilterChange = useFiltersStore(state => state.handleFilterChange);
    const getAvailableYears = useAppStore(state => state.getAvailableYears);

    const availableYears = getAvailableYears();

    return (
        <div>
            <label htmlFor="release-year" className="block text-sm font-medium text-gray-300 mb-2">
                Release Year
            </label>
            <select
                id="release-year"
                value={filters.releaseYear}
                onChange={(e) => handleFilterChange('releaseYear', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
                <option value="">All Years</option>
                {availableYears.map((year) => (
                    <option key={year} value={year.toString()}>
                        {year}
                    </option>
                ))}
            </select>
        </div>
    );
}

export default ReleaseYearFilter;