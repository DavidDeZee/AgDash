import { Card } from '../ui/Card';
import type { EnhancedCountyData } from '../../types/ag';
import { formatNumber, formatAcres, formatCurrency } from '../../lib/format';
import { MapPin, Filter, ArrowUp, ArrowDown, RotateCcw } from 'lucide-react';
import type { SortField } from '../../types/ag';
import { METRIC_OPTIONS } from './RankingConfigurationModal';
import { useStore } from '../../store/useStore';
import type { PapeDataMap } from '../../hooks/usePapeData';

interface CountyListProps {
  counties: EnhancedCountyData[];
  selectedCounty: EnhancedCountyData | null;
  onCountySelect: (county: EnhancedCountyData) => void;
  onConfigure: () => void;
  sortField: SortField;
  papeData?: PapeDataMap;
}

export function CountyList({
  counties,
  selectedCounty,
  onCountySelect,
  onConfigure,
  sortField,
  papeData
}: CountyListProps) {
  const {
    sortDirection,
    selectedStates,
    selectedLocations,
    metricRanges,
    setSortDirection,
    setSortField,
    resetFilters
  } = useStore();

  const getFriendlyName = (key: string) => {
    switch (key) {
      case 'indDollars': return 'IND';
      case 'dlrDollars': return 'DLR';
      case 'sharePercentage': return 'Market Share';
      case 'paesPercent': return 'PAES %';
      case 'eaBreadth': return 'EA Breadth';
      case 'heaDepth': return 'HEA Depth';
      case 'techAdoption': return 'Tech Adoption';
      default: return key;
    }
  };

  const getMetricDisplayContext = () => {
    if (sortField.startsWith('internal|')) {
      const parts = sortField.split('|');
      if (parts.length >= 3) {
        const category = parts[1];
        const key = parts[2];
        const friendlyName = getFriendlyName(key);
        // Ensure category name is nicely formatted (it usually is from the source)
        return {
          // Title for top of panel: "CATEGORY - Metric Name"
          title: `${category} - ${friendlyName}`,
          // Label for the specific value row: "Metric Name"
          label: friendlyName,
          isInternal: true
        };
      }
      return { title: 'Internal Value', label: 'Value', isInternal: true };
    }
    const publicLabel = METRIC_OPTIONS.find(opt => opt.value === sortField)?.label || 'Value';
    return {
      title: publicLabel, // Public metrics usually just use the label as title
      label: publicLabel,
      isInternal: false
    };
  };

  const getDisplayValue = (county: EnhancedCountyData) => {
    if (sortField.startsWith('internal|') && papeData) {
      const parts = sortField.split('|');
      if (parts.length >= 3) {
        const category = parts[1];
        const key = parts[2];
        const countyData = papeData[county.id];
        if (countyData) {
          const item = countyData.find(d => d.category === category);
          if (item) {
            const rawVal = item[key as keyof typeof item];
            // Format logic
            if (typeof rawVal === 'number') {
              if (key.includes('Dollars')) return formatCurrency(rawVal);
              if (key.includes('Percent') || key.includes('Share') || key.includes('Rate') || key === 'paesPercent' || key === 'techAdoption' || key === 'eaBreadth' || key === 'heaDepth') {
                return `${rawVal}%`;
              }
              return formatNumber(rawVal);
            }
            if (typeof rawVal === 'string') {
              // Check if it should be a percent but isn't
              const isPercentMetric = key.includes('Percent') || key.includes('Share') || key === 'eaBreadth' || key === 'heaDepth' || key === 'techAdoption';
              if (isPercentMetric && rawVal !== 'N/A' && !rawVal.includes('%')) {
                return `${rawVal}%`;
              }
              return rawVal;
            }
          }
        }
        return 'N/A';
      }
    }

    // Standard Metrics
    const val = county[sortField as keyof EnhancedCountyData] as number | null;
    if (val === null || val === undefined) return 'N/A';

    if (sortField === 'croplandAcres' || sortField === 'irrigatedAcres' || sortField === 'harvestedCroplandAcres') {
      return formatAcres(val);
    }
    if (sortField === 'marketValueTotalDollars' || sortField === 'cropsSalesDollars' || sortField === 'livestockSalesDollars') {
      return formatCurrency(val);
    }
    return formatNumber(val);
  };

  const metricContext = getMetricDisplayContext();

  // ... (omitting intermediate code, jumping to render)
  // I need to use replace appropriately. The file is small enough I can probably replace the interface and the helper, and then the render block.
  // Let's replace the top part first to add props/imports and helpers.

  if (counties.length === 0) {
    // ...

    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No counties match your filters.</p>
        <button
          onClick={() => {
            resetFilters();
            setSortField('croplandAcres');
          }}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          Reset Filters
        </button>
      </Card>
    );
  }

  const getFilterSummary = () => {
    const parts = [];

    if (selectedStates.length > 0) {
      parts.push(selectedStates.join(', '));
    }

    if (selectedLocations.length > 0) {
      parts.push(`${selectedLocations.length} Regions`);
    }

    if (Object.keys(metricRanges).length > 0) {
      parts.push(`${Object.keys(metricRanges).length} Metric Filters`);
    }

    if (parts.length === 0) return 'All Locations';
    return parts.join(' • ');
  };

  const handleReset = () => {
    resetFilters();
    setSortField('croplandAcres');
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {metricContext.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {getFilterSummary()} • {counties.length} results
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* ... buttons ... */}
          <button
            onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
            className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            title={sortDirection === 'asc' ? "Switch to High to Low" : "Switch to Low to High"}
          >
            {sortDirection === 'asc' ? (
              <ArrowUp className="h-4 w-4" />
            ) : (
              <ArrowDown className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={handleReset}
            className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            title="Reset Filters"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={onConfigure}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary/50 hover:bg-secondary transition-colors text-sm font-medium text-foreground"
            title="Configure Rankings"
          >
            <Filter className="h-4 w-4" />
            Filter
          </button>
        </div>
      </div>
      <div className="space-y-2 overflow-y-auto">
        {counties.slice(0, 50).map((county) => (
          <Card
            key={county.id}
            className={`p-4 cursor-pointer transition-all hover:shadow-md ${selectedCounty?.id === county.id
              ? 'ring-2 ring-primary bg-accent'
              : 'hover:bg-accent/50'
              }`}
            onClick={() => onCountySelect(county)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <h4 className="font-semibold">{county.countyName}</h4>
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/20 text-primary">
                {county.stateName}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Farms</div>
                <div className="font-medium">{formatNumber(county.farms || 0)}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">
                  {metricContext.label}
                </div>
                <div className="font-bold text-primary">
                  {getDisplayValue(county)}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}