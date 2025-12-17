
// src/utils/dataUtils.ts
import type {
  EnhancedCountyData,
  FilterOptions,
  SortConfig,
  SortField,
} from '../types/ag';
import type { PapeDataMap } from '../hooks/usePapeData';
import { getCountyRegion } from '../components/modern/MapView';

// Reverse mapping from state name to FIPS code
export const STATE_TO_FIPS: Record<string, string> = {
  'CALIFORNIA': '06',
  'NEVADA': '32',
  'OREGON': '41',
  'WASHINGTON': '53',
};

/**
 * Filter counties based on provided criteria
 */
export function filterCounties(
  counties: EnhancedCountyData[],
  filters: FilterOptions,
  papeData?: PapeDataMap
): EnhancedCountyData[] {
  return counties.filter(county => {
    // 1. State Filter
    if (filters.states.length > 0 && !filters.states.includes(county.stateName)) {
      return false;
    }

    // 2. Region Filter (if locations are selected)
    if (filters.locations.length > 0) {
      const stateFips = STATE_TO_FIPS[county.stateName.toUpperCase()];
      if (stateFips) {
        const region = getCountyRegion(county.countyName, stateFips);
        if (!region || !filters.locations.includes(region)) {
          return false;
        }
      }
    }

    // 3. Metric Ranges
    if (filters.metricRanges) {
      for (const [metric, range] of Object.entries(filters.metricRanges)) {
        if (!range || (range[0] === null && range[1] === null)) continue;

        let value: number | undefined;

        if (metric.startsWith('internal|')) {
          if (!papeData) return false; // Cannot filter by internal data if missing

          const parts = metric.split('|');
          if (parts.length >= 3) {
            const cat = parts[1];
            const key = parts[2];
            const countyData = papeData[county.id];

            if (countyData) {
              const item = countyData.find(d => d.category === cat);
              if (item) {
                const rawVal = item[key as keyof typeof item];
                if (typeof rawVal === 'number') {
                  value = rawVal;
                } else if (typeof rawVal === 'string' && rawVal !== 'N/A') {
                  value = parseFloat(rawVal.replace(/[$,%]/g, ''));
                }
              }
            }
          }
        } else {
          value = county[metric as keyof EnhancedCountyData] as number | undefined;
        }

        if (value === undefined || value === null || isNaN(value)) {
          // Decide behavior for missing data: strict filtering means we exclude it
          return false;
        }

        const [min, max] = range;
        if (min !== null && value < min) return false;
        if (max !== null && value > max) return false;
      }
    }

    // 4. Search Query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      return (
        county.countyName.toLowerCase().includes(query) ||
        county.stateName.toLowerCase().includes(query)
      );
    }

    return true;
  });
}

/**
 * Sort counties based on configuration
 */
export function sortCounties(
  counties: EnhancedCountyData[],
  sortConfig: SortConfig,
  papeData?: PapeDataMap
): EnhancedCountyData[] {
  return [...counties].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    // Handle internal data lookup
    if (sortConfig.field.startsWith('internal|') && papeData) {
      const parts = sortConfig.field.split('|');
      if (parts.length >= 3) {
        const category = parts[1];
        const key = parts[2];

        const getVal = (countyId: string) => {
          const countyData = papeData[countyId];
          if (!countyData) return null;
          const item = countyData.find(d => d.category === category);
          if (!item) return null;
          const rawVal = item[key as keyof typeof item];

          if (typeof rawVal === 'number') return rawVal;
          if (typeof rawVal === 'string' && rawVal !== 'N/A') {
            return parseFloat(rawVal.replace(/[$,%]/g, ''));
          }
          return null;
        };

        aValue = getVal(a.id);
        bValue = getVal(b.id);
      }
    } else {
      aValue = a[sortConfig.field as keyof EnhancedCountyData];
      bValue = b[sortConfig.field as keyof EnhancedCountyData];
    }

    // Handle string comparison for county names
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const comparison = aValue.localeCompare(bValue);
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    }

    // Handle number comparison with nulls
    if (aValue === null && bValue === null) return 0;
    if (aValue === null) return 1; // Put nulls at the end
    if (bValue === null) return -1; // Put nulls at the end

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
    }

    return 0;
  });
}

/**
 * Get color for a county based on its cropland acres
 * Uses a gradient from light green (low) to dark green (high)
 */
export function getCountyColor(
  county: EnhancedCountyData,
  allCounties: EnhancedCountyData[],
  metric: 'croplandAcres' | 'farms' | 'irrigatedAcres' | 'marketValueTotalDollars' = 'croplandAcres'
): string {
  const val = county[metric];
  if (val === null || val === 0) {
    return '#f0f0f0'; // Gray for no data
  }

  // Find min and max values for normalization
  const values = allCounties
    .map((c) => c[metric])
    .filter((v): v is number => v !== null && v > 0);

  if (values.length === 0) return '#f0f0f0';

  const min = Math.min(...values);
  const max = Math.max(...values);

  // Normalize value to 0-1 range
  const normalized = (val - min) / (max - min);

  // Color scale: light green -> dark green
  const lightness = 90 - normalized * 50; // 90% to 40%
  return `hsl(120, 60%, ${lightness}%)`;
}

/**
 * Format number with commas for readability
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

/**
 * Format acres with appropriate units
 */
export function formatAcres(acres: number): string {
  if (acres === 0) return '0 acres';
  if (acres >= 1000000) {
    return `${(acres / 1000000).toFixed(2)}M acres`;
  }
  if (acres >= 1000) {
    return `${(acres / 1000).toFixed(1)}K acres`;
  }
  return `${formatNumber(acres)} acres`;
}

/**
 * Get unique states from county data
 */
export function getUniqueStates(counties: EnhancedCountyData[]): string[] {
  const states = new Set(counties.map((c) => c.stateName));
  return Array.from(states).sort();
}

/**
 * Get statistics for a metric across all counties
 */
export function getMetricStats(
  counties: EnhancedCountyData[],
  field: SortField
): {
  min: number;
  max: number;
  avg: number;
  total: number;
} {
  const values = counties
    .map((c) => c[field])
    .filter((v): v is number => typeof v === 'number' && v !== null && v > 0);

  if (values.length === 0) {
    return { min: 0, max: 0, avg: 0, total: 0 };
  }

  const total = values.reduce((sum, val) => sum + val, 0);
  const avg = total / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);

  return { min, max, avg, total };
}
