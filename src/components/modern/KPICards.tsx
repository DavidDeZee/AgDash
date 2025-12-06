import { TrendingUp, Sprout, DollarSign } from 'lucide-react';
import { Card } from '../ui/Card';
import { formatNumber, formatAcres, formatCurrency } from '../../lib/format';

interface KPICardsProps {
  totalFarms: number;
  totalCropland: number;
  totalMarketValue: number;
}

export function KPICards({
  totalFarms,
  totalCropland,
  totalMarketValue,
}: KPICardsProps) {
  const kpis = [

    {
      label: 'Total Farms',
      value: formatNumber(totalFarms),
      icon: TrendingUp,
      color: 'text-green-400',
    },
    {
      label: 'Total Cropland',
      value: formatAcres(totalCropland),
      icon: Sprout,
      color: 'text-emerald-400',
    },
    {
      label: 'Total Market Value',
      value: formatCurrency(totalMarketValue),
      icon: DollarSign,
      color: 'text-yellow-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Card
            key={kpi.label}
            className="p-6 hover:shadow-lg transition-shadow cursor-default"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {kpi.label}
                </p>
                <p className="text-3xl font-bold tracking-tight">{kpi.value}</p>
              </div>
              <div className={`p-2 rounded-lg bg-secondary ${kpi.color}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}