import {useFiltersStore} from "../../store";

const ClearFilters = () => {
    const hasActiveFilters = useFiltersStore(state => state.hasActiveFilters);
    const clearAllFilters = useFiltersStore(state => state.clearAllFilters);

    return (
        <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-white">Filters</h2>
            {hasActiveFilters() && (
                <button
                    onClick={clearAllFilters}
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors !bg-gray-800"
                >
                    Clear All
                </button>
            )}
        </div>
    );
}

export default ClearFilters;