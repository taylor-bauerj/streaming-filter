import { useFiltersStore } from "@/store";

const AvailabilityTypeFilter = () => {
    const filters = useFiltersStore(state => state.filters);
    const handleFilterChange = useFiltersStore(state => state.handleFilterChange);

    return (
        <div>
            <label className="text-left block text-sm font-medium text-gray-300 mb-2">
                Availability Type
            </label>
            <div className="flex flex-wrap gap-2">
                {[
                    { value: 'all', label: 'All' },
                    { value: 'streaming', label: 'Streaming' },
                    { value: 'rent', label: 'Rent' },
                    { value: 'buy', label: 'Buy' }
                ].map((type) => (
                    <button
                        key={type.value}
                        onClick={() => handleFilterChange('availabilityType', type.value)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                            filters.availabilityType === type.value
                                ? 'text-white !bg-gray-800 border border-gray-700'
                                : '!bg-blue-500 !bg-opacity-20 text-gray-300 hover:!bg-gray-600 border border-gray-600'
                        }`}
                    >
                        {type.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default AvailabilityTypeFilter;