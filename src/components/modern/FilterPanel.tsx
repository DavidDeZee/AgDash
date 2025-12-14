import { X, Plus, BarChart3, Clock, MapPin } from 'lucide-react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useStore } from '../../store/useStore';
import { formatNumber, formatAcres } from '../../lib/format';
import { useState, useMemo, useRef, useEffect } from 'react';
import type { EnhancedCountyData } from '../../types/ag';


import { HeatmapControl } from './HeatmapControl';
import { RegionControl } from './RegionControl';

import { getUniqueStates } from '../../utils/dataUtils';

interface FilterPanelProps {
  allCounties: EnhancedCountyData[];
  onOpenRankingModal: () => void;
}

export function FilterPanel({ allCounties, onOpenRankingModal }: FilterPanelProps) {
  const {
    comparisonCounties,
    addToComparison,
    removeFromComparison,
    clearComparison,
    showPapeLocations,
    togglePapeLocations,
  } = useStore();

  const availableStates = useMemo(() => getUniqueStates(allCounties), [allCounties]);


  const [countySearchQuery, setCountySearchQuery] = useState('');
  const [showCountyDropdown, setShowCountyDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter counties for search dropdown
  const filteredCountiesForSearch = useMemo(() => {
    if (!countySearchQuery.trim()) return [];
    const query = countySearchQuery.toLowerCase();
    return allCounties
      .filter(c =>
        !comparisonCounties.some(cc => cc.id === c.id) &&
        (c.countyName.toLowerCase().startsWith(query) ||
          c.stateName.toLowerCase().startsWith(query) ||
          `${c.countyName}, ${c.stateName}`.toLowerCase().startsWith(query))
      )
      .slice(0, 8);
  }, [countySearchQuery, allCounties, comparisonCounties]);

  // Reset active index when search results change
  useEffect(() => {
    setActiveIndex(0);
  }, [filteredCountiesForSearch]);

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showCountyDropdown || filteredCountiesForSearch.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1) % filteredCountiesForSearch.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 + filteredCountiesForSearch.length) % filteredCountiesForSearch.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCountiesForSearch[activeIndex]) {
        handleAddCounty(filteredCountiesForSearch[activeIndex]);
      }
    }
  };

  const handleAddCounty = (county: EnhancedCountyData) => {
    addToComparison(county);
    setCountySearchQuery('');
    setShowCountyDropdown(false);
  };





  return (
    <div className="space-y-4 p-4">



      {/* County Comparison */}

      <Card className={`p-4 relative overflow-visible transition-all duration-300 before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-primary before:transition-all before:duration-300 before:rounded-l-lg ${comparisonCounties.length >= 2 ? 'before:opacity-100' : 'before:opacity-0'}`}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className={`h-5 w-5 ${comparisonCounties.length >= 2 ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className="font-semibold">Compare</span>
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
                  onKeyDown={handleKeyDown}
                  className="pr-8"
                  disabled={comparisonCounties.length >= 5}
                />
              </div>
            </div>

            {/* Dropdown */}
            {showCountyDropdown && filteredCountiesForSearch.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                {filteredCountiesForSearch.map((county, index) => (
                  <button
                    key={county.id}
                    onClick={() => handleAddCounty(county)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between group ${index === activeIndex ? 'bg-accent' : 'hover:bg-accent'
                      }`}
                  >
                    <span>
                      <span className="font-medium">{county.countyName}</span>
                      <span className="text-muted-foreground">, {county.stateName}</span>
                    </span>
                    <Plus className={`h-4 w-4 text-muted-foreground transition-opacity ${index === activeIndex ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`} />
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

          {comparisonCounties.length >= 2 && <ComparisonInsights counties={comparisonCounties} />}
        </div>
      </Card>

      {/* Heatmap Control */}
      <HeatmapControl
        availableStates={availableStates}
        allCounties={allCounties}
        onOpenRankingModal={onOpenRankingModal}
      />

      {/* Region Control */}
      <RegionControl />

      {/* Dealership Locations Control */}
      <Card className={`p-4 relative overflow-hidden transition-all duration-300 before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-yellow-500 before:transition-all before:duration-300 ${showPapeLocations ? 'before:opacity-100' : 'before:opacity-0'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className={`h-5 w-5 ${showPapeLocations ? 'text-yellow-500' : 'text-muted-foreground'}`} />
            <span className="font-semibold">Dealerships</span>
          </div>
          <button
            onClick={togglePapeLocations}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 ${showPapeLocations ? 'bg-yellow-500' : 'bg-input'
              }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showPapeLocations ? 'translate-x-6' : 'translate-x-1'
                }`}
            />
          </button>
        </div>
      </Card>
    </div>
  );
}

// Quick insights
function ComparisonInsights({ counties }: { counties: EnhancedCountyData[] }) {
  const topByFarms = [...counties].sort((a, b) => (b.farms || 0) - (a.farms || 0))[0];
  const topByCropland = [...counties].sort(
    (a, b) => (b.croplandAcres || 0) - (a.croplandAcres || 0)
  )[0];

  return (
    <Card className="p-2 bg-primary/10 border-primary/20">
      <h4 className="font-semibold mb-3 flex items-center gap-2">
        <Clock className="h-4 w-4" />
        Quick Insights
      </h4>
      <ul className="space-y-2 text-sm">
        <li className="flex items-start gap-2">
          <span>
            <strong>{topByFarms.countyName}</strong> has the most farms (
            {formatNumber(topByFarms.farms || 0)})
          </span>
        </li>
        <li className="flex items-start gap-2">
          <span>
            <strong>{topByCropland.countyName}</strong> has the most cropland (
            {formatAcres(topByCropland.croplandAcres || 0)})
          </span>
        </li>
      </ul>
    </Card>
  );
}