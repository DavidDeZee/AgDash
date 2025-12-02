// src/types/ag.ts

/**
 * Core data structure matching the USDA CSV columns
 */
export interface CountyData {
  stateName: string;
  countyName: string;
  year: number;
  farms: number;
  landOwnedAcres: number;
  landRentedAcres: number;
  croplandAcres: number;
  harvestedCroplandAcres: number;
  irrigatedAcres: number;
  landInFarmsAcres: number;
  marketValueTotalDollars: number;
  cropsSalesDollars: number;
  livestockSalesDollars: number;
  govPaymentsDollars: number;
  netCashIncomeDollars: number;
  cattleHead: number;
  milkCowsHead: number;
  vegHarvestOps: number;
  internetAccessPct: number;
}

/**
 * Enhanced county data with computed fields for visualization
 */
export interface EnhancedCountyData extends CountyData {
  id: string; // Unique identifier: "STATE-COUNTY"
  totalLandAcres: number; // landOwnedAcres + landRentedAcres
  croplandPercentage: number; // croplandAcres / landInFarmsAcres * 100
  irrigationPercentage: number; // irrigatedAcres / croplandAcres * 100
}

/**
 * Filter options for county data
 */
export interface FilterOptions {
  states: string[];
  locations: string[];
  minCroplandAcres?: number;
  maxCroplandAcres?: number;
  minFarms?: number;
  maxFarms?: number;
  searchQuery?: string;
}

/**
 * Sort configuration
 */
export type SortField =
  | 'countyName'
  | 'farms'
  | 'croplandAcres'
  | 'landInFarmsAcres'
  | 'irrigatedAcres'
  | 'harvestedCroplandAcres'
  | 'marketValueTotalDollars'
  | 'cropsSalesDollars'
  | 'livestockSalesDollars';

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
