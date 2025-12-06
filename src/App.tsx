import { useMemo, useState, useEffect } from 'react';
import { useAgData } from './hooks/useAgData';
import { useMobileDetection } from './hooks/useMobileDetection';
import type { EnhancedCountyData } from './types/ag';
import { useStore } from './store/useStore';
import { MapView } from './components/modern/MapView';
import { KPICards } from './components/modern/KPICards';
import { FilterPanel } from './components/modern/FilterPanel';
import { CountyList } from './components/modern/CountyList';
import { ComparisonDrawer } from './components/modern/ComparisonDrawer';
import { MobileWarning } from './components/modern/MobileWarning';
import { CountyDetailModal } from './components/modern/CountyDetailModal';
import { RankingConfigurationModal } from './components/modern/RankingConfigurationModal';
import { SaveView } from './components/modern/SaveView';
import { filterCounties, sortCounties, getUniqueStates } from './utils/dataUtils';
import { parseQuery } from './utils/queryParser';
import papeLogo from './assets/pape-logo.svg';
// import { BarChart3 } from 'lucide-react';

export default function App() {
  // Mobile detection
  const isMobile = useMobileDetection(1024);

  // Load data
  const { data: allCounties, loading, error } = useAgData();

  // Get state from Zustand store
  const {
    selectedCounty,
    comparisonCounties,
    selectedStates,
    selectedLocations,
    metricRanges,
    sortField,
    sortDirection,
    searchQuery,
    setSelectedCounty,
    removeFromComparison,
    resetFilters,
    setSortField,
    setSortDirection,
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
      metricRanges,
      searchQuery,
    };

    const filtered = filterCounties(allCounties, filters);
    return sortCounties(filtered, { field: sortField, direction: sortDirection });
  }, [allCounties, selectedStates, selectedLocations, metricRanges, searchQuery, sortField, sortDirection, isNaturalLanguageQuery]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const counties = filteredAndSortedCounties.length > 0 ? filteredAndSortedCounties : allCounties;

    return {
      totalCounties: counties.length,
      totalFarms: counties.reduce((sum, c) => sum + (c.farms || 0), 0),
      totalCropland: counties.reduce((sum, c) => sum + (c.croplandAcres || 0), 0),
      totalIrrigated: counties.reduce((sum, c) => sum + (c.irrigatedAcres || 0), 0),
      totalMarketValue: counties.reduce((sum, c) => sum + (c.marketValueTotalDollars || 0), 0),
      totalCropsSales: counties.reduce((sum, c) => sum + (c.cropsSalesDollars || 0), 0),
      totalLivestockSales: counties.reduce((sum, c) => sum + (c.livestockSalesDollars || 0), 0),
      totalCattle: counties.reduce((sum, c) => sum + (c.beefCattleHead || 0), 0),
      totalMilkCows: counties.reduce((sum, c) => sum + (c.dairyCattleHead || 0), 0),
    };
  }, [filteredAndSortedCounties, allCounties]);

  const [detailCounty, setDetailCounty] = useState<EnhancedCountyData | null>(null);
  const [isRankingModalOpen, setIsRankingModalOpen] = useState(false);

  // Reset state when switching to mobile
  useEffect(() => {
    if (isMobile) {
      setIsRankingModalOpen(false);
      resetFilters();
      setSortField('croplandAcres');
      setSortDirection('desc');
    }
  }, [isMobile, resetFilters, setSortField, setSortDirection]);

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
    <>
      {/* Mobile Warning Overlay */}
      {isMobile && <MobileWarning />}

      {/* Detail Modal */}
      <CountyDetailModal
        county={detailCounty}
        allCounties={allCounties}
        onClose={() => setDetailCounty(null)}
      />

      {/* Ranking Configuration Modal */}
      <RankingConfigurationModal
        isOpen={isRankingModalOpen}
        onClose={() => setIsRankingModalOpen(false)}
        availableStates={availableStates}
        allCounties={allCounties}
      />

      <div className="h-screen w-screen flex flex-col bg-background text-foreground overflow-hidden">
        {/* Header */}
        <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={papeLogo} alt="Company Logo" className="h-12 w-auto" />
            <div>
              <h1 className="text-2xl font-bold agriculture-title">Agriculture & Turf</h1>
              <p className="text-sm text-muted-foreground">
                {/* Pacific Northwest, California & Nevada - USDA County Data 2022 */}
              </p>
            </div>
          </div>
          <SaveView />
        </header>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Filters */}
          <aside className="w-80 border-r border-border bg-card overflow-y-auto">
            <FilterPanel allCounties={allCounties} />
          </aside>

          {/* Center - Map & KPIs */}
          <main className="flex-1 flex flex-col overflow-hidden">
            {/* KPI Cards */}
            <div className="p-6 border-b border-border">
              <KPICards
                totalFarms={kpis.totalFarms}
                totalCropland={kpis.totalCropland}
                totalMarketValue={kpis.totalMarketValue}
              />
            </div>

            {/* Map */}
            <div className="flex-1 relative">
              <MapView
                counties={allCounties}
                filteredCounties={filteredAndSortedCounties}
                onCountyClick={(county) => {
                  setSelectedCounty(county);
                  setDetailCounty(county);
                }}
              />
            </div>
          </main>

          {/* Right Sidebar - County List / Comparison */}
          <aside className="w-96 border-l border-border bg-card flex flex-col overflow-y-auto">
            {comparisonCounties.length > 1 ? (
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
                  onCountySelect={(county) => {
                    setSelectedCounty(county);
                    setDetailCounty(county);
                  }}
                  onConfigure={() => setIsRankingModalOpen(true)}
                  sortField={sortField}
                />
              </div>
            )}
          </aside>
        </div>
      </div>
    </>
  );
}