import { Search, X, Info, Sparkles, Plus, BarChart3, ChevronDown } from 'lucide-react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useStore } from '../../store/useStore';
import { useState, useMemo, useRef, useEffect } from 'react';
import type { EnhancedCountyData } from '../../types/ag';
import { formatNumber, formatAcres, formatCurrencyMillions } from '../../lib/format';

interface FilterPanelProps {
  allCounties: EnhancedCountyData[];
}

export function FilterPanel({ allCounties }: FilterPanelProps) {
  const {
    searchQuery,
    setSearchQuery,
    comparisonCounties,
    addToComparison,
    removeFromComparison,
    clearComparison,
  } = useStore();

  const [showExamples, setShowExamples] = useState(false);
  const [queryInput, setQueryInput] = useState('');
  const [countySearchQuery, setCountySearchQuery] = useState('');
  const [showCountyDropdown, setShowCountyDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter counties for search dropdown
  const filteredCountiesForSearch = useMemo(() => {
    if (!countySearchQuery.trim()) return [];
    const query = countySearchQuery.toLowerCase();
    return allCounties
      .filter(c =>
        !comparisonCounties.some(cc => cc.id === c.id) &&
        (c.countyName.toLowerCase().includes(query) ||
         c.stateName.toLowerCase().includes(query) ||
         `${c.countyName}, ${c.stateName}`.toLowerCase().includes(query))
      )
      .slice(0, 8);
  }, [countySearchQuery, allCounties, comparisonCounties]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCountyDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddCounty = (county: EnhancedCountyData) => {
    addToComparison(county);
    setCountySearchQuery('');
    setShowCountyDropdown(false);
  };

  // Get metrics that have data in at least one comparison county
  const comparisonMetrics = useMemo(() => {
    if (comparisonCounties.length === 0) return [];

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
      comparisonCounties.some(c => c[metric.key] !== null && c[metric.key] !== undefined)
    );
  }, [comparisonCounties]);

  // Calculate max values for each metric for bar scaling
  const maxValues = useMemo(() => {
    const maxes: Record<string, number> = {};
    comparisonMetrics.forEach(metric => {
      const values = comparisonCounties
        .map(c => c[metric.key] as number | null)
        .filter((v): v is number => v !== null);
      maxes[metric.key] = Math.max(...values, 1);
    });
    return maxes;
  }, [comparisonCounties, comparisonMetrics]);

  const exampleQueries = [
    'highest cropland in Oregon',
    'lowest farms in Washington',
    'most irrigated acres in California',
    'counties with over 500000 cropland acres',
    'compare Oregon and Washington',
    'highest farms in Nevada',
  ];

  const handleQuerySubmit = () => {
    if (queryInput.trim()) {
      setSearchQuery(queryInput.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleQuerySubmit();
    }
  };

  return (
    <div className="space-y-4 p-4">
      {/* Natural Language Query */}
      <Card className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Ask a Question</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowExamples(!showExamples)}
              className="h-7 w-7 p-0"
            >
              <Info className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="e.g., highest cropland in Oregon"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              onKeyDown={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={handleQuerySubmit} size="sm">
              <Search className="h-4 w-4" />
            </Button>
          </div>
          {showExamples && (
            <div className="mt-3 space-y-2 border-t border-border pt-3">
              <p className="text-xs font-medium text-muted-foreground">
                Example queries:
              </p>
              <div className="space-y-1">
                {exampleQueries.map((query) => (
                  <button
                    key={query}
                    onClick={() => {
                      setQueryInput(query);
                      setSearchQuery(query);
                      setShowExamples(false);
                    }}
                    className="block w-full text-left text-xs text-muted-foreground hover:text-primary hover:bg-accent px-2 py-1.5 rounded transition-colors"
                  >
                    {query}
                  </button>
                ))}
              </div>
            </div>
          )}
          {searchQuery && (
            <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-md px-3 py-2">
              <p className="text-xs text-foreground">
                Query: <strong>{searchQuery}</strong>
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setQueryInput('');
                }}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* County Comparison */}
      <Card className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Compare Counties</span>
            </div>
            {comparisonCounties.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearComparison}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
              >
                Clear all
              </Button>
            )}
          </div>

          {/* County Search */}
          <div className="relative" ref={dropdownRef}>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="Search counties..."
                  value={countySearchQuery}
                  onChange={(e) => {
                    setCountySearchQuery(e.target.value);
                    setShowCountyDropdown(true);
                  }}
                  onFocus={() => setShowCountyDropdown(true)}
                  className="pr-8"
                  disabled={comparisonCounties.length >= 5}
                />
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            {/* Dropdown */}
            {showCountyDropdown && filteredCountiesForSearch.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                {filteredCountiesForSearch.map((county) => (
                  <button
                    key={county.id}
                    onClick={() => handleAddCounty(county)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center justify-between group"
                  >
                    <span>
                      <span className="font-medium">{county.countyName}</span>
                      <span className="text-muted-foreground">, {county.stateName}</span>
                    </span>
                    <Plus className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {comparisonCounties.length >= 5 && (
            <p className="text-xs text-muted-foreground">Maximum 5 counties for comparison</p>
          )}

          {/* Selected Counties Tags */}
          {comparisonCounties.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {comparisonCounties.map((county, index) => {
                const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-rose-500'];
                return (
                  <div
                    key={county.id}
                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${colors[index]} text-white`}
                  >
                    <span className="max-w-[100px] truncate">{county.countyName}</span>
                    <button
                      onClick={() => removeFromComparison(county.id)}
                      className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Comparison Visualization */}
          {comparisonCounties.length >= 2 && (
            <div className="mt-4 space-y-4 border-t border-border pt-4">
              {comparisonMetrics.map((metric) => (
                <div key={metric.key} className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {metric.label}
                  </p>
                  <div className="space-y-1.5">
                    {comparisonCounties.map((county, index) => {
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

          {comparisonCounties.length === 1 && (
            <p className="text-xs text-muted-foreground text-center py-2">
              Add at least one more county to compare
            </p>
          )}

          {comparisonCounties.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">
              Search for counties or click a county on the map and select "compare"
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}