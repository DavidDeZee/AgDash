import { Card } from '../ui/Card';
import type { EnhancedCountyData } from '../../types/ag';
import { formatNumber, formatAcres, formatCurrency } from '../../lib/format';
import { MapPin, Settings2 } from 'lucide-react';
import type { SortField } from '../../types/ag';

interface CountyListProps {
  counties: EnhancedCountyData[];
  selectedCounty: EnhancedCountyData | null;
  onCountySelect: (county: EnhancedCountyData) => void;
  onConfigure: () => void;
  sortField: SortField;
}

export function CountyList({
  counties,
  selectedCounty,
  onCountySelect,
  onConfigure,
  sortField,
}: CountyListProps) {
  if (counties.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No counties match your filters.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">County Rankings</h3>
          <p className="text-xs text-muted-foreground">{counties.length} counties found</p>
        </div>
        <button
          onClick={onConfigure}
          className="p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground hover:text-foreground"
          title="Configure Rankings"
        >
          <Settings2 className="h-4 w-4" />
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