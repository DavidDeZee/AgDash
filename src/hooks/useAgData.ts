// src/hooks/useAgData.ts
import { useState, useEffect } from 'react';
import type { CountyData, EnhancedCountyData } from '../types/ag';

/**
 * Custom hook to load and parse agricultural data from CSV
 * Handles CSV parsing, data transformation, and error states
 */
export function useAgData() {
  const [data, setData] = useState<EnhancedCountyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // Fetch CSV from public folder
        const response = await fetch('/data/ag_data.csv');
        if (!response.ok) {
          throw new Error(`Failed to load data: ${response.statusText}`);
        }

        const csvText = await response.text();
        const parsedData = parseCSV(csvText);
        const enhancedData = parsedData.map(enhanceCountyData);

        console.log('Parsed Data Sample:', enhancedData.slice(0, 3));
        console.log('Total Records:', enhancedData.length);

        setData(enhancedData);
        setError(null);
      } catch (err) {
        console.error('Error loading agricultural data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return { data, loading, error };
}

/**
 * Parse CSV text into CountyData objects
 * Handles empty values and type conversion
 */
function parseCSV(csvText: string): CountyData[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  // Parse headers (handle BOM if present)
  const headers = lines[0].split(',').map(h => h.trim().replace(/^\ufeff/, ''));
  const headerMap = new Map<string, number>();
  headers.forEach((h, i) => headerMap.set(h, i));

  // Mapping from CountyData keys to CSV header names
  const columnMapping: Record<keyof CountyData, string> = {
    stateName: 'state_name',
    countyName: 'county_name',
    year: 'year',
    farms: 'farms',
    croplandAcres: 'cropland_acres',
    harvestedCroplandAcres: 'harvested_cropland_acres',
    irrigatedAcres: 'irrigated_acres',
    marketValueTotalDollars: 'market_value_total_dollars',
    cropsSalesDollars: 'crops_sales_dollars',
    livestockSalesDollars: 'livestock_sales_dollars',
    govPaymentsDollars: 'gov_payments_dollars',
    applesAcres: 'apples_acres',
    wheatAcres: 'wheat_acres',
    riceAcres: 'rice_acres',
    hazelnutsAcres: 'hazelnuts_acres',
    grassSeedBentgrassAcres: 'grass_seed_bentgrass_acres',
    grassSeedBermudagrassAcres: 'grass_seed_bermudagrass_acres',
    grassSeedBluegrassAcres: 'grass_seed_bluegrass_acres',
    grassSeedBromegrassAcres: 'grass_seed_bromegrass_acres',
    grassSeedFescueAcres: 'grass_seed_fescue_acres',
    grassSeedOrchardgrassAcres: 'grass_seed_orchardgrass_acres',
    grassSeedRyegrassAcres: 'grass_seed_ryegrass_acres',
    grassSeedSudangrassAcres: 'grass_seed_sudangrass_acres',
    grassSeedTimothyAcres: 'grass_seed_timothy_acres',
    grassSeedWheatgrassAcres: 'grass_seed_wheatgrass_acres',
    cornAcres: 'corn_acres',
    cornSilageAcres: 'corn_silage_acres',
    hayAcres: 'hay_acres',
    haylageAcres: 'haylage_acres',
    beefCattleHead: 'beef_cattle_head',
    dairyCattleHead: 'dairy_cattle_head',
  };

  return lines.slice(1).map((line) => {
    // Handle potential quoted values in CSV, though simple split works if no commas in values
    const values = line.split(',');

    // Helper to safely parse numbers, returning null for empty/invalid values
    const parseNumber = (columnKey: keyof CountyData): number | null => {
      const csvHeader = columnMapping[columnKey];
      const index = headerMap.get(csvHeader);

      if (index === undefined) return null; // Column not in CSV

      const value = values[index];
      if (!value) return null;

      const trimmed = value.trim();
      if (trimmed === '') return null;

      const parsed = parseFloat(trimmed);
      return isNaN(parsed) ? null : parsed;
    };

    // Helper for string values
    const parseString = (columnKey: keyof CountyData): string => {
      const csvHeader = columnMapping[columnKey];
      const index = headerMap.get(csvHeader);

      if (index === undefined) return '';

      return values[index]?.trim() || '';
    };

    return {
      stateName: parseString('stateName'),
      countyName: parseString('countyName'),
      year: parseNumber('year') || 0,
      farms: parseNumber('farms'),
      croplandAcres: parseNumber('croplandAcres'),
      harvestedCroplandAcres: parseNumber('harvestedCroplandAcres'),
      irrigatedAcres: parseNumber('irrigatedAcres'),
      marketValueTotalDollars: parseNumber('marketValueTotalDollars'),
      cropsSalesDollars: parseNumber('cropsSalesDollars'),
      livestockSalesDollars: parseNumber('livestockSalesDollars'),
      govPaymentsDollars: parseNumber('govPaymentsDollars'),
      applesAcres: parseNumber('applesAcres'),
      wheatAcres: parseNumber('wheatAcres'),
      riceAcres: parseNumber('riceAcres'),
      hazelnutsAcres: parseNumber('hazelnutsAcres'),
      grassSeedBentgrassAcres: parseNumber('grassSeedBentgrassAcres'),
      grassSeedBermudagrassAcres: parseNumber('grassSeedBermudagrassAcres'),
      grassSeedBluegrassAcres: parseNumber('grassSeedBluegrassAcres'),
      grassSeedBromegrassAcres: parseNumber('grassSeedBromegrassAcres'),
      grassSeedFescueAcres: parseNumber('grassSeedFescueAcres'),
      grassSeedOrchardgrassAcres: parseNumber('grassSeedOrchardgrassAcres'),
      grassSeedRyegrassAcres: parseNumber('grassSeedRyegrassAcres'),
      grassSeedSudangrassAcres: parseNumber('grassSeedSudangrassAcres'),
      grassSeedTimothyAcres: parseNumber('grassSeedTimothyAcres'),
      grassSeedWheatgrassAcres: parseNumber('grassSeedWheatgrassAcres'),
      cornAcres: parseNumber('cornAcres'),
      cornSilageAcres: parseNumber('cornSilageAcres'),
      hayAcres: parseNumber('hayAcres'),
      haylageAcres: parseNumber('haylageAcres'),
      beefCattleHead: parseNumber('beefCattleHead'),
      dairyCattleHead: parseNumber('dairyCattleHead'),
    };
  });
}

const STATE_ABBR_TO_FULL: Record<string, string> = {
  'CA': 'CALIFORNIA',
  'OR': 'OREGON',
  'WA': 'WASHINGTON',
  'ID': 'IDAHO',
  'MT': 'MONTANA',
  'NV': 'NEVADA',
};

/**
 * Enhance county data with computed fields
 */
function enhanceCountyData(county: CountyData): EnhancedCountyData {
  // Aggregate Grass Seed Acres
  // Sum of all grass seed fields. If all are null, result is null.
  const grassSeedFields = [
    county.grassSeedBentgrassAcres,
    county.grassSeedBermudagrassAcres,
    county.grassSeedBluegrassAcres,
    county.grassSeedBromegrassAcres,
    county.grassSeedFescueAcres,
    county.grassSeedOrchardgrassAcres,
    county.grassSeedRyegrassAcres,
    county.grassSeedSudangrassAcres,
    county.grassSeedTimothyAcres,
    county.grassSeedWheatgrassAcres,
  ];

  let grassSeedAcres: number | null = null;
  let hasGrassData = false;

  let totalGrass = 0;
  for (const val of grassSeedFields) {
    if (val !== null) {
      totalGrass += val;
      hasGrassData = true;
    }
  }

  if (hasGrassData) {
    grassSeedAcres = totalGrass;
  }

  // Handle percentages with null checks
  const croplandPercentage = null;

  const irrigationPercentage = (county.croplandAcres !== null && county.croplandAcres > 0 && county.irrigatedAcres !== null)
    ? (county.irrigatedAcres / county.croplandAcres) * 100
    : null;

  // Convert state abbreviation to full name if needed
  const stateFull = STATE_ABBR_TO_FULL[county.stateName.toUpperCase()] || county.stateName;

  return {
    ...county,
    stateName: stateFull, // Override with full name
    id: `${stateFull}-${county.countyName}`,
    croplandPercentage,
    irrigationPercentage,
    grassSeedAcres,
  };
}
