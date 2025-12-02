import { Card } from '../ui/Card';
import type { EnhancedCountyData } from '../../types/ag';
import { formatNumber, formatAcres, formatCurrency } from '../../lib/format';
import { MapPin, Filter } from 'lucide-react';
import type { SortField } from '../../types/ag';
import { useStore } from '../../store/useStore';

interface CountyListProps {
  counties: EnhancedCountyData[];
  selectedCounty: EnhancedCountyData | null;
  onCountySelect: (county: EnhancedCountyData) => void;
  onConfigure: () => void;
  sortField: SortField;
}

const METRIC_LABELS: Record<string, string> = {
  farms: 'Farms',
  croplandAcres: 'Cropland',
  irrigatedAcres: 'Irrigated',
  landInFarmsAcres: 'Land in Farms',
  harvestedCroplandAcres: 'Harvested',
  marketValueTotalDollars: 'Total Sales',
  cropsSalesDollars: 'Crop Sales',
  livestockSalesDollars: 'Livestock Sales',
  countyName: 'Name'
};

export function CountyList({
  counties,
  selectedCounty,
  onCountySelect,
  onConfigure,
  sortField,
}: CountyListProps) {
  const { sortDirection, selectedStates, selectedLocations, croplandRange, farmsRange } = useStore();

  if (counties.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No counties match your filters.</p>
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

    if (croplandRange[0] !== null || croplandRange[1] !== null) parts.push('Cropland Filter');
    if (farmsRange[0] !== null || farmsRange[1] !== null) parts.push('Farms Filter');

    if (parts.length === 0) return 'All Locations';
    return parts.join(' • ');
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {METRIC_LABELS[sortField] || 'County Rankings'}
            <span className="text-muted-foreground font-normal ml-1">
              ({sortDirection === 'desc' ? 'High to Low' : 'Low to High'})
            </span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {getFilterSummary()} • {counties.length} results
          </p>
        </div>
        <button
          onClick={onConfigure}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary/50 hover:bg-secondary transition-colors text-sm font-medium text-foreground"
          title="Configure Rankings"
        >
          <Filter className="h-4 w-4" />
          Filter
        </button>
      </div>
      <div className="space-y-2 overflow-y-auto pr-2">
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
                <div className="font-medium">{formatNumber(county.farms)}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">
                  {sortField === 'farms' ? 'Ranked Value' :
                    sortField === 'croplandAcres' ? 'Cropland' :
                      sortField === 'irrigatedAcres' ? 'Irrigated' :
                        sortField === 'marketValueTotalDollars' ? 'Market Value' :
                          'Value'}
                </div>
                <div className="font-bold text-primary">
                  {sortField === 'croplandAcres' || sortField === 'irrigatedAcres' || sortField === 'landInFarmsAcres' || sortField === 'harvestedCroplandAcres'
                    ? formatAcres(county[sortField] as number)
                    : sortField === 'marketValueTotalDollars' || sortField === 'cropsSalesDollars' || sortField === 'livestockSalesDollars'
                      ? formatCurrency(county[sortField] as number)
                      : formatNumber(county[sortField] as number)}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}