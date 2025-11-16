import { useMemo } from 'react';
import { useAgData } from './hooks/useAgData';
import { useStore } from './store/useStore';
import { MapView } from './components/modern/MapView';
import { KPICards } from './components/modern/KPICards';
import { FilterPanel } from './components/modern/FilterPanel';
import { CountyList } from './components/modern/CountyList';
import { ComparisonDrawer } from './components/modern/ComparisonDrawer';
import { filterCounties, sortCounties, getUniqueStates } from './utils/dataUtils';
import { parseQuery } from './utils/queryParser';
// import { BarChart3 } from 'lucide-react';

export default function App() {
  // Load data
  const { data: allCounties, loading, error } = useAgData();

  // Get state from Zustand store
  const {
    selectedCounty,
    comparisonCounties,
    selectedStates,
    selectedLocations,
    croplandRange,
    farmsRange,
    sortField,
    sortDirection,
    searchQuery,
    setSelectedCounty,
    removeFromComparison,
  } = useStore();

  // Get available states
  const availableStates = useMemo(() => getUniqueStates(allCounties), [allCounties]);

  // Check if search query is a natural language query
  const isNaturalLanguageQuery = useMemo(() => {
    if (!searchQuery) return false;
    const query = searchQuery.toLowerCase();
    return (
      query.includes('highest') ||
      query.includes('lowest') ||
      query.includes('most') ||
      query.includes('fewest') ||
      query.includes('compare') ||
      query.includes('over') ||
      query.includes('more than')
    );
  }, [searchQuery]);

  // Apply filters and sorting
  const filteredAndSortedCounties = useMemo(() => {
    // If it's a natural language query, use the query parser
    if (isNaturalLanguageQuery && searchQuery) {
      const queryResult = parseQuery(searchQuery, allCounties);
      return queryResult.counties;
    }

    // Otherwise, use standard filtering
    const filters = {
      states: selectedStates,
      locations: selectedLocations,
      minCroplandAcres: croplandRange[0] ?? undefined,
      maxCroplandAcres: croplandRange[1] ?? undefined,
      minFarms: farmsRange[0] ?? undefined,
      maxFarms: farmsRange[1] ?? undefined,
      searchQuery,
    };

    const filtered = filterCounties(allCounties, filters);
    return sortCounties(filtered, { field: sortField, direction: sortDirection });
  }, [allCounties, selectedStates, selectedLocations, croplandRange, farmsRange, searchQuery, sortField, sortDirection, isNaturalLanguageQuery]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const counties = filteredAndSortedCounties.length > 0 ? filteredAndSortedCounties : allCounties;

    return {
      totalCounties: counties.length,
      totalFarms: counties.reduce((sum, c) => sum + c.farms, 0),
      totalCropland: counties.reduce((sum, c) => sum + c.croplandAcres, 0),
      totalIrrigated: counties.reduce((sum, c) => sum + c.irrigatedAcres, 0),
    };
  }, [filteredAndSortedCounties, allCounties]);

  // Loading state
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <h2 className="text-2xl font-semibold text-foreground">Loading agricultural data...</h2>
          <p className="text-muted-foreground">Parsing county-level USDA metrics</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-destructive text-5xl">⚠️</div>
          <h2 className="text-2xl font-semibold text-foreground">Error Loading Data</h2>
          <p className="text-muted-foreground">{error}</p>
          <p className="text-sm text-muted-foreground">
            Please ensure the CSV file is available at /data/ag_data.csv
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="src/assets/pape-logo.svg" alt="Company Logo" className="h-17 w-auto" />
          <div>
            <h1 className="text-2xl font-bold">Agriculture & Turf</h1>
            <p className="text-sm text-muted-foreground">
              {/* Pacific Northwest, California & Nevada - USDA County Data 2022 */}
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Filters */}
        <aside className="w-80 border-r border-border bg-card overflow-y-auto">
          <FilterPanel availableStates={availableStates} />
        </aside>

        {/* Center - Map & KPIs */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* KPI Cards */}
          <div className="p-6 border-b border-border">
            <KPICards
              totalCounties={kpis.totalCounties}
              totalFarms={kpis.totalFarms}
              totalCropland={kpis.totalCropland}
              totalIrrigated={kpis.totalIrrigated}
            />
          </div>

          {/* Map */}
          <div className="flex-1 relative">
            <MapView
              selectedCounty={selectedCounty}
              counties={allCounties}
              filteredCounties={filteredAndSortedCounties}
            />
          </div>
        </main>

        {/* Right Sidebar - County List / Comparison */}
        <aside className="w-96 border-l border-border bg-card flex flex-col overflow-hidden">
          {comparisonCounties.length > 0 ? (
            <ComparisonDrawer
              counties={comparisonCounties}
              onRemove={removeFromComparison}
              onClear={() => {
                // Clear all comparison counties
                comparisonCounties.forEach(c => removeFromComparison(c.id));
              }}
            />
          ) : (
            <div className="flex-1 overflow-y-auto p-6">
              <CountyList
                counties={filteredAndSortedCounties}
                selectedCounty={selectedCounty}
                onCountySelect={setSelectedCounty}
              />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}