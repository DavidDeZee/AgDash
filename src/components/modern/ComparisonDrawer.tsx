import { X } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import type { EnhancedCountyData } from '../../types/ag';
import { formatNumber, formatAcres, formatCurrencyMillions } from '../../lib/format';
import { useMemo } from 'react';

interface ComparisonDrawerProps {
  counties: EnhancedCountyData[];
  onRemove: (countyId: string) => void;
  onClear: () => void;
}

export function ComparisonDrawer({
  counties,
  onClear,
}: ComparisonDrawerProps) {
  // Get metrics that have data in at least one comparison county
  const comparisonMetrics = useMemo(() => {
    if (counties.length === 0) return [];

    const metrics: { key: keyof EnhancedCountyData; label: string; format: (v: number) => string; color: string }[] = [
      { key: 'farms', label: 'Farms', format: formatNumber, color: 'bg-blue-500' },
      { key: 'croplandAcres', label: 'Cropland', format: (v) => formatAcres(v).replace(' acres', ''), color: 'bg-emerald-500' },
      { key: 'irrigatedAcres', label: 'Irrigated', format: (v) => formatAcres(v).replace(' acres', ''), color: 'bg-cyan-500' },
      { key: 'marketValueTotalDollars', label: 'Market Value', format: formatCurrencyMillions, color: 'bg-yellow-500' },
      { key: 'cropsSalesDollars', label: 'Crop Sales', format: formatCurrencyMillions, color: 'bg-lime-500' },
      { key: 'livestockSalesDollars', label: 'Livestock Sales', format: formatCurrencyMillions, color: 'bg-orange-500' },
      { key: 'beefCattleHead', label: 'Beef Cattle', format: formatNumber, color: 'bg-red-500' },
      { key: 'dairyCattleHead', label: 'Dairy Cattle', format: formatNumber, color: 'bg-pink-500' },
      { key: 'wheatAcres', label: 'Wheat', format: (v) => formatAcres(v).replace(' acres', ''), color: 'bg-amber-500' },
      { key: 'hayAcres', label: 'Hay', format: (v) => formatAcres(v).replace(' acres', ''), color: 'bg-green-600' },
      { key: 'cornAcres', label: 'Corn', format: (v) => formatAcres(v).replace(' acres', ''), color: 'bg-yellow-600' },
    ];

    // Only return metrics where at least one county has data
    return metrics.filter(metric =>
      counties.some(c => c[metric.key] !== null && c[metric.key] !== undefined)
    );
  }, [counties]);

  // Calculate max values for each metric for bar scaling
  const maxValues = useMemo(() => {
    const maxes: Record<string, number> = {};
    comparisonMetrics.forEach(metric => {
      const values = counties
        .map(c => c[metric.key] as number | null)
        .filter((v): v is number => v !== null);
      maxes[metric.key] = Math.max(...values, 1);
    });
    return maxes;
  }, [counties, comparisonMetrics]);

  if (counties.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">
          Select counties to compare (up to 3)
        </p>
      </Card>
    );
  }
  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">
          Comparing {counties.length} {counties.length === 1 ? 'County' : 'Counties'}
        </h3>
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X className="h-4 w-4 mr-1" />
          Clear All
        </Button>
      </div>



      {/* Comparison Visualization */}
      <Card className="p-4">
        {counties.length >= 2 && (
          <div className="space-y-4">
            {comparisonMetrics.map((metric) => (
              <div key={metric.key} className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {metric.label}
                </p>
                <div className="space-y-1.5">
                  {counties.map((county, index) => {
                    const value = county[metric.key] as number | null;
                    const percentage = value !== null ? (value / maxValues[metric.key]) * 100 : 0;
                    const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-rose-500'];

                    return (
                      <div key={county.id} className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${colors[index]} flex-shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <span className="text-xs truncate">{county.countyName}</span>
                            <span className="text-xs font-medium whitespace-nowrap">
                              {value !== null ? metric.format(value) : 'N/A'}
                            </span>
                          </div>
                          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div
                              className={`h-full ${colors[index]} transition-all duration-300`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
