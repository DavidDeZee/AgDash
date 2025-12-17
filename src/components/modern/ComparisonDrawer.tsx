import { X, Sprout, Building2, Table } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import type { EnhancedCountyData } from '../../types/ag';
import type { PapeDataMap } from '../../hooks/usePapeData';
import { formatNumber, formatAcres, formatCurrencyMillions } from '../../lib/format';
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ComparisonDrawerProps {
  counties: EnhancedCountyData[];
  papeData: PapeDataMap;
  onRemove: (countyId: string) => void;
  onClear: () => void;
}

export function ComparisonDrawer({
  counties,
  papeData,
  onClear,
}: ComparisonDrawerProps) {
  const [activeTab, setActiveTab] = useState<'public' | 'pape'>('public');

  // Helper to parse formatted strings back to numbers
  const parsePapeValue = (val: string | undefined): number | null => {
    if (!val || val === 'N/A') return null;
    const cleaned = val.replace(/[$,%]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  };

  // Get metrics that have data in at least one comparison county
  const comparisonMetrics = useMemo(() => {
    if (counties.length === 0) return [];

    const metrics: { key: keyof EnhancedCountyData; label: string; format: (v: number) => string; color: string }[] = [
      { key: 'farms', label: 'Farms', format: formatNumber, color: 'bg-blue-500' },
      { key: 'croplandAcres', label: 'Cropland', format: (v) => formatAcres(v).replace(' acres', ''), color: 'bg-emerald-500' },
      { key: 'harvestedCroplandAcres', label: 'Harvested', format: (v) => formatAcres(v).replace(' acres', ''), color: 'bg-emerald-600' },
      { key: 'irrigatedAcres', label: 'Irrigated', format: (v) => formatAcres(v).replace(' acres', ''), color: 'bg-cyan-500' },
      { key: 'marketValueTotalDollars', label: 'Market Value', format: formatCurrencyMillions, color: 'bg-yellow-500' },
      { key: 'cropsSalesDollars', label: 'Crop Sales', format: formatCurrencyMillions, color: 'bg-lime-500' },
      { key: 'livestockSalesDollars', label: 'Livestock Sales', format: formatCurrencyMillions, color: 'bg-orange-500' },
      { key: 'beefCattleHead', label: 'Beef Cattle', format: formatNumber, color: 'bg-red-500' },
      { key: 'dairyCattleHead', label: 'Dairy Cattle', format: formatNumber, color: 'bg-pink-500' },
      { key: 'wheatAcres', label: 'Wheat', format: (v) => formatAcres(v).replace(' acres', ''), color: 'bg-amber-500' },
      { key: 'hayAcres', label: 'Hay', format: (v) => formatAcres(v).replace(' acres', ''), color: 'bg-green-600' },
      { key: 'cornAcres', label: 'Corn', format: (v) => formatAcres(v).replace(' acres', ''), color: 'bg-yellow-600' },
      { key: 'applesAcres', label: 'Apples', format: (v) => formatAcres(v).replace(' acres', ''), color: 'bg-red-600' },
      { key: 'riceAcres', label: 'Rice', format: (v) => formatAcres(v).replace(' acres', ''), color: 'bg-cyan-600' },
      { key: 'hazelnutsAcres', label: 'Hazelnuts', format: (v) => formatAcres(v).replace(' acres', ''), color: 'bg-amber-800' },
      { key: 'grassSeedAcres', label: 'Grass Seed', format: (v) => formatAcres(v).replace(' acres', ''), color: 'bg-lime-600' },
      { key: 'cornSilageAcres', label: 'Corn Silage', format: (v) => formatAcres(v).replace(' acres', ''), color: 'bg-yellow-700' },
      { key: 'haylageAcres', label: 'Haylage', format: (v) => formatAcres(v).replace(' acres', ''), color: 'bg-green-700' },
    ];

    // Only return metrics where at least one county has data
    return metrics.filter(metric =>
      counties.some(c => c[metric.key] !== null && c[metric.key] !== undefined)
    );
  }, [counties]);

  // Calculate max values for each public metric for bar scaling
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

  // Internal Data Logic
  const internalComparison = useMemo(() => {
    if (counties.length < 2) return null;

    // Define metrics to check
    const metricsDef = [
      { key: 'indDollars', label: 'IND Value', color: 'bg-blue-500' },
      { key: 'dlrDollars', label: 'DLR Value', color: 'bg-green-500' },
      { key: 'sharePercentage', label: 'Market Share', color: 'bg-indigo-500' },
      { key: 'paesPercent', label: 'PAES %', color: 'bg-purple-500' },
      { key: 'eaBreadth', label: 'EA Breadth', color: 'bg-orange-500' },
      { key: 'heaDepth', label: 'HEA Depth', color: 'bg-red-500' },
      { key: 'techAdoption', label: 'Tech Adoption', color: 'bg-cyan-500' },
    ] as const;

    // 1. Identify categories shared by >= 2 counties
    const allCategories = new Set<string>();
    counties.forEach(c => {
      const data = papeData[c.id] || [];
      data.forEach(d => allCategories.add(d.category));
    });

    const validCategories = Array.from(allCategories).filter(cat => {
      const count = counties.filter(c =>
        papeData[c.id]?.some(d => d.category === cat)
      ).length;
      return count >= 2;
    });

    // 2. Build display data for each category
    return validCategories.map(category => {
      // Find max values for this category across counties for scaling
      const categoryMaxes: Record<string, number> = {};

      metricsDef.forEach(metric => {
        const values = counties.map(c => {
          const item = papeData[c.id]?.find(d => d.category === category);
          return parsePapeValue(item?.[metric.key] as string | undefined);
        }).filter((v): v is number => v !== null);

        if (values.length > 0) {
          categoryMaxes[metric.key] = Math.max(...values, 1);
        }
      });

      return {
        category,
        maxes: categoryMaxes,
        metrics: metricsDef.filter(m => categoryMaxes[m.key] !== undefined)
      };
    }).filter(group => group.metrics.length > 0);
  }, [counties, papeData]);

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
    <div className="flex flex-col h-full p-4 space-y-3">
      <div className="flex-none flex items-center justify-between">
        <h3 className="font-semibold">
          Comparing {counties.length} {counties.length === 1 ? 'County' : 'Counties'}
        </h3>
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X className="h-4 w-4 mr-1" />
          Clear All
        </Button>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden min-h-0">
        {/* Tabs */}
        <div className="flex-none flex border-b border-border bg-secondary/30">
          <button
            onClick={() => setActiveTab('public')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${activeTab === 'public'
              ? 'bg-card text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
          >
            <Sprout className="h-4 w-4" />
            Public Data
          </button>
          <button
            onClick={() => setActiveTab('pape')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${activeTab === 'pape'
              ? 'bg-card text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
          >
            <Building2 className="h-4 w-4" />
            Internal Data
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-secondary scrollbar-track-transparent">
          <AnimatePresence mode="wait">
            {activeTab === 'public' ? (
              /* Public Data Comparison */
              <motion.div
                key="public"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
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
                {comparisonMetrics.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No overlapping data found for selected counties.
                  </div>
                )}
              </motion.div>
            ) : (
              /* Internal Data Comparison */
              <motion.div
                key="pape"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                {internalComparison && internalComparison.length > 0 ? (
                  internalComparison.map((group) => (
                    <div key={group.category} className="space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                        <Table className="h-4 w-4 text-primary" />
                        <h4 className="text-sm font-semibold">{group.category}</h4>
                      </div>

                      <div className="space-y-6">
                        {group.metrics.map((metric) => (
                          <div key={metric.key} className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              {metric.label}
                            </p>
                            <div className="space-y-1.5">
                              {counties.map((county, index) => {
                                const item = papeData[county.id]?.find(d => d.category === group.category);
                                // We use the raw string value for display, but parsed for bar width
                                const rawVal = item?.[metric.key as keyof typeof item] as string;
                                const valNum = parsePapeValue(rawVal);
                                const percentage = valNum !== null && group.maxes[metric.key]
                                  ? (valNum / group.maxes[metric.key]) * 100
                                  : 0;

                                const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-rose-500'];
                                const displayVal = (rawVal && rawVal !== 'N/A')
                                  ? rawVal.endsWith('%') || rawVal.startsWith('$') ? rawVal :
                                    // Add formatting if missing? PapeData usually has formatted strings. 
                                    // Based on usePapeData fmt: it adds commas but maybe not $ or %.
                                    // Let's assume rawVal is display-ready or close to it.
                                    // Actually usePapeData fmt result: '1,234.5678'. No $. No %.
                                    // So we should format it for display if needed.
                                    // For dollars: add $. For percent: add %.
                                    (metric.key.includes('Dollars') ? `$${rawVal}` :
                                      metric.key.includes('Percent') || metric.key.includes('Adoption') || metric.key.includes('Breadth') || metric.key.includes('Depth') ? `${rawVal}%` : rawVal)
                                  : 'N/A';

                                return (
                                  <div key={county.id} className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${colors[index]} flex-shrink-0`} />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between gap-2 mb-0.5">
                                        <span className="text-xs truncate">{county.countyName}</span>
                                        <span className="text-xs font-medium whitespace-nowrap">
                                          {displayVal}
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
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No overlapping internal data found for selected counties.
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </div>
  );
}
