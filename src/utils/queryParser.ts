// src/utils/queryParser.ts
import type { EnhancedCountyData, QueryResult, SortField } from '../types/ag';
import { sortCounties } from './dataUtils';

/**
 * Parse natural language queries into structured results
 * Supports simple queries like:
 * - "highest cropland in Oregon"
 * - "lowest farms in Washington"
 * - "most irrigated acres in California"
 * - "counties with over 500000 cropland acres"
 */
export function parseQuery(
  query: string,
  allCounties: EnhancedCountyData[]
): QueryResult {
  const lowerQuery = query.toLowerCase().trim();

  // Check for "highest" or "most" queries
  if (lowerQuery.includes('highest') || lowerQuery.includes('most')) {
    return handleHighestQuery(lowerQuery, allCounties);
  }

  // Check for "lowest" or "fewest" queries
  if (lowerQuery.includes('lowest') || lowerQuery.includes('fewest')) {
    return handleLowestQuery(lowerQuery, allCounties);
  }

  // Check for "compare" queries
  if (lowerQuery.includes('compare')) {
    return handleCompareQuery(lowerQuery, allCounties);
  }

  // Check for threshold queries (e.g., "over 500000 cropland")
  if (lowerQuery.includes('over') || lowerQuery.includes('more than')) {
    return handleThresholdQuery(lowerQuery, allCounties);
  }

  // Default: return all counties
  return {
    counties: allCounties,
    queryType: 'unknown',
  };
}

/**
 * Handle "highest" or "most" queries
 */
function handleHighestQuery(
  query: string,
  counties: EnhancedCountyData[]
): QueryResult {
  const field = extractField(query);
  const state = extractState(query);

  let filtered = counties;
  if (state) {
    filtered = counties.filter((c) => c.stateName.toLowerCase() === state);
  }

  const sorted = sortCounties(filtered, { field, direction: 'desc' });

  // Return top 10 results
  return {
    counties: sorted.slice(0, 10),
    queryType: 'highest',
    field,
  };
}

/**
 * Handle "lowest" or "fewest" queries
 */
function handleLowestQuery(
  query: string,
  counties: EnhancedCountyData[]
): QueryResult {
  const field = extractField(query);
  const state = extractState(query);

  let filtered = counties;
  if (state) {
    filtered = counties.filter((c) => c.stateName.toLowerCase() === state);
  }

  // Filter out zeros for lowest queries
  const nonZero = filtered.filter((c) => {
    const value = c[field];
    return typeof value === 'number' && value > 0;
  });

  const sorted = sortCounties(nonZero, { field, direction: 'asc' });

  // Return bottom 10 results
  return {
    counties: sorted.slice(0, 10),
    queryType: 'lowest',
    field,
  };
}

/**
 * Handle "compare" queries (e.g., "compare Oregon and Washington")
 */
function handleCompareQuery(
  query: string,
  counties: EnhancedCountyData[]
): QueryResult {
  const states = extractMultipleStates(query);

  const filtered = counties.filter((c) =>
    states.includes(c.stateName.toLowerCase())
  );

  return {
    counties: filtered,
    queryType: 'compare',
  };
}

/**
 * Handle threshold queries (e.g., "over 500000 cropland acres")
 */
function handleThresholdQuery(
  query: string,
  counties: EnhancedCountyData[]
): QueryResult {
  const field = extractField(query);
  const threshold = extractNumber(query);

  const filtered = counties.filter((c) => {
    const value = c[field];
    return typeof value === 'number' && value > threshold;
  });

  const sorted = sortCounties(filtered, { field, direction: 'desc' });

  return {
    counties: sorted,
    queryType: 'filter',
    field,
  };
}

/**
 * Extract the field/metric from query
 */
function extractField(query: string): SortField {
  const lowerQuery = query.toLowerCase();

  if (lowerQuery.includes('cropland')) return 'croplandAcres';
  if (lowerQuery.includes('farm')) return 'farms';
  if (lowerQuery.includes('irrigat')) return 'irrigatedAcres';
  if (lowerQuery.includes('harvest')) return 'harvestedCroplandAcres';

  // Default to cropland
  return 'croplandAcres';
}

/**
 * Extract state name from query
 */
function extractState(query: string): string | null {
  const lowerQuery = query.toLowerCase();

  const states = ['oregon', 'washington', 'california', 'idaho', 'nevada'];

  for (const state of states) {
    if (lowerQuery.includes(state)) {
      return state;
    }
  }

  return null;
}

/**
 * Extract multiple states from query (for comparison)
 */
function extractMultipleStates(query: string): string[] {
  const lowerQuery = query.toLowerCase();
  const states = ['oregon', 'washington', 'california', 'idaho', 'nevada'];

  return states.filter((state) => lowerQuery.includes(state));
}

/**
 * Extract number from query
 */
function extractNumber(query: string): number {
  const match = query.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

/**
 * Get example queries for user guidance
 */
export function getExampleQueries(): string[] {
  return [
    'highest cropland in Oregon',
    'lowest farms in Washington',
    'most irrigated acres in California',
    'counties with over 500000 cropland acres',
    'compare Oregon and Washington',
    'highest farms in Nevada',
  ];
}
