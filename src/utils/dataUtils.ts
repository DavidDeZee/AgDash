// src/utils/dataUtils.ts
import type {
  EnhancedCountyData,
  FilterOptions,
  SortConfig,
  SortField,
} from '../types/ag';
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
  filters: FilterOptions
): EnhancedCountyData[] {
  return counties.filter((county) => {
    // Search query filter (text search in county name and state)
    if (filters.searchQuery && filters.searchQuery.trim()) {
      const searchLower = filters.searchQuery.toLowerCase().trim();
      const countyMatch = county.countyName.toLowerCase().includes(searchLower);
      const stateMatch = county.stateName.toLowerCase().includes(searchLower);

      if (!countyMatch && !stateMatch) {
        return false;
      }
    }

    // State filter
    if (filters.states.length > 0 && !filters.states.includes(county.stateName)) {
      return false;
    }

    // Location/Region filter
    if (filters.locations.length > 0) {
      const stateFips = STATE_TO_FIPS[county.stateName.toUpperCase()];
      if (stateFips) {
        const region = getCountyRegion(county.countyName, stateFips);

        if (!region || !filters.locations.includes(region)) {
          return false;
        }
      } else {
        // If state not found in mapping, exclude this county
        return false;
      }
    }

    // Metric filters
    for (const [metric, range] of Object.entries(filters.metricRanges)) {
      const value = county[metric as keyof EnhancedCountyData];

      // If value is null (not available), we should probably exclude it if a filter is set
      // Or should we treat it as 0? Let's exclude for now as "not matching range" implies we need a value.
      if (value === null || typeof value !== 'number') {
        // However, if we filter by a range, we expect data to be present.
        return false;
      }

      const [min, max] = range;
      if (min !== null && value < min) return false;
      if (max !== null && value > max) return false;
    }

    return true;
  });
}

/**
 * Sort counties based on configuration
 */
export function sortCounties(
  counties: EnhancedCountyData[],
  sortConfig: SortConfig
): EnhancedCountyData[] {
  return [...counties].sort((a, b) => {
    const aValue = a[sortConfig.field];
    const bValue = b[sortConfig.field];

    // Handle string comparison for county names
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const comparison = aValue.localeCompare(bValue);
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    }

    // Handle number comparison with nulls
    // We treat null as -Infinity for desc sort (bottom) and +Infinity for asc sort? 
    // Usually missing data goes to bottom logic:
    // Asc: 0, 1, 2, NULL
    // Desc: 2, 1, 0, NULL
    // So let's treat null as -Infinity effectively for value comparison purposes relative to valid numbers?
    // Actually, simple approach:

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
