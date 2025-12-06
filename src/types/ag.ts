// src/types/ag.ts

/**
 * Core data structure matching the USDA CSV columns
 */
export interface CountyData {
  stateName: string;
  countyName: string;
  year: number;
  farms: number | null;
  croplandAcres: number | null;
  harvestedCroplandAcres: number | null;
  irrigatedAcres: number | null;
  marketValueTotalDollars: number | null;
  cropsSalesDollars: number | null;
  livestockSalesDollars: number | null;
  govPaymentsDollars: number | null;
  applesAcres: number | null;
  wheatAcres: number | null;
  riceAcres: number | null;
  hazelnutsAcres: number | null;
  grassSeedBentgrassAcres: number | null;
  grassSeedBermudagrassAcres: number | null;
  grassSeedBluegrassAcres: number | null;
  grassSeedBromegrassAcres: number | null;
  grassSeedFescueAcres: number | null;
  grassSeedOrchardgrassAcres: number | null;
  grassSeedRyegrassAcres: number | null;
  grassSeedSudangrassAcres: number | null;
  grassSeedTimothyAcres: number | null;
  grassSeedWheatgrassAcres: number | null;
  cornAcres: number | null;
  cornSilageAcres: number | null;
  hayAcres: number | null;
  haylageAcres: number | null;
  beefCattleHead: number | null;
  dairyCattleHead: number | null;
}

/**
 * Enhanced county data with computed fields for visualization
 */
export interface EnhancedCountyData extends CountyData {
  id: string; // Unique identifier: "STATE-COUNTY"
  croplandPercentage: number | null; // croplandAcres / landInFarmsAcres * 100 (Note: landInFarmsAcres is removed from base, checking usage)
  irrigationPercentage: number | null; // irrigatedAcres / croplandAcres * 100
  grassSeedAcres: number | null; // Aggregated grass seed acres
}

/**
 * Filter options for county data
 */
export interface FilterOptions {
  states: string[];
  locations: string[];
  metricRanges: Record<string, [number | null, number | null]>;
  searchQuery?: string;
}

/**
 * Sort configuration
 */
export type SortField =
  | 'countyName'
  | 'farms'
  | 'croplandAcres'
  | 'irrigatedAcres'
  | 'harvestedCroplandAcres'
  | 'marketValueTotalDollars'
  | 'cropsSalesDollars'
  | 'livestockSalesDollars'
  | 'applesAcres'
  | 'wheatAcres'
  | 'riceAcres'
  | 'hazelnutsAcres'
  | 'grassSeedAcres'
  | 'cornAcres'
  | 'cornSilageAcres'
  | 'hayAcres'
  | 'haylageAcres'
  | 'beefCattleHead'
  | 'dairyCattleHead';

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

/**
 * Natural language query result
 */
export interface QueryResult {
  counties: EnhancedCountyData[];
  queryType: 'highest' | 'lowest' | 'compare' | 'filter' | 'unknown';
  field?: SortField;
}
