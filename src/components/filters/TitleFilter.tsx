import { useFiltersStore } from "@/store";

const TitleFilter = () => {
    const filters = useFiltersStore(state => state.filters);
    const handleFilterChange = useFiltersStore(state => state.handleFilterChange);

    return (
        <div>
            <label htmlFor="title-search" className="block text-sm font-medium text-gray-300 mb-2">
                Movie Title
            </label>
            <input
                id="title-search"
                type="text"
                placeholder="Search by title"
                value={filters.title}
                onChange={(e) => handleFilterChange('title', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
        </div>
    );
}

export default TitleFilter;