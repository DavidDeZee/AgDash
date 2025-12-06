import { X, TrendingUp } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import type { EnhancedCountyData } from '../../types/ag';
import { formatNumber, formatAcres } from '../../lib/format';

interface ComparisonDrawerProps {
  counties: EnhancedCountyData[];
  onRemove: (countyId: string) => void;
  onClear: () => void;
}

export function ComparisonDrawer({
  counties,
  onRemove,
  onClear,
}: ComparisonDrawerProps) {
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">
          Comparing {counties.length} {counties.length === 1 ? 'County' : 'Counties'}
        </h3>
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X className="h-4 w-4 mr-1" />
          Clear All
        </Button>
      </div>

      <div className="grid gap-4">
        {counties.map((county) => (
          <Card key={county.id} className="p-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-semibold text-lg">
                  {county.countyName}
                </h4>
                <p className="text-sm text-muted-foreground">{county.stateName}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemove(county.id)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Total Farms</div>
                <div className="font-semibold text-lg text-emerald-900">
                  {formatNumber(county.farms || 0)}
                </div>
              </div>
              <div>
                <div className="text-sm text-emerald-600 mb-1">Cropland</div>
                <div className="font-semibold text-lg text-emerald-900">
                  {formatAcres(county.croplandAcres || 0)}
                </div>
              </div>
              <div>
                <div className="text-sm text-emerald-600 mb-1">Irrigated</div>
                <div className="font-semibold text-lg text-emerald-900">
                  {formatAcres(county.irrigatedAcres || 0)}
                </div>
              </div>
              <div>
                <div className="text-sm text-emerald-600 mb-1">Avg Farm Size</div>
                <div className="font-semibold text-lg text-emerald-900">
                  {county.farms ? formatAcres(Math.round((county.croplandAcres || 0) / county.farms)) : 'N/A'}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-xs text-muted-foreground">Cropland %</div>
                  <div className="text-sm font-medium">
                    {county.croplandPercentage ? `${county.croplandPercentage.toFixed(1)}%` : 'N/A'}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Irrigation %</div>
                <div className="text-sm font-medium">
                  {county.irrigationPercentage ? `${county.irrigationPercentage.toFixed(1)}%` : 'N/A'}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {counties.length >= 2 && <ComparisonInsights counties={counties} />}
    </div>
  );
}

function ComparisonInsights({ counties }: { counties: EnhancedCountyData[] }) {
  const topByFarms = [...counties].sort((a, b) => (b.farms || 0) - (a.farms || 0))[0];
  const topByCropland = [...counties].sort(
    (a, b) => (b.croplandAcres || 0) - (a.croplandAcres || 0)
  )[0];

  return (
    <Card className="p-4 bg-primary/10 border-primary/20">
      <h4 className="font-semibold mb-3 flex items-center gap-2">
        <TrendingUp className="h-4 w-4" />
        Quick Insights
      </h4>
      <ul className="space-y-2 text-sm">
        <li className="flex items-start gap-2">
          <span className="text-primary">•</span>
          <span>
            <strong>{topByFarms.countyName}</strong> has the most farms (
            {formatNumber(topByFarms.farms || 0)})
          </span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-primary">•</span>
          <span>
            <strong>{topByCropland.countyName}</strong> has the most cropland (
            {formatAcres(topByCropland.croplandAcres || 0)})
          </span>
        </li>
      </ul>
    </Card>
  );
}