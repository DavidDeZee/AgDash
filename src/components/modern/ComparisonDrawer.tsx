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