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
/**
 * Parse CSV text into CountyData objects
 * Handles empty values and type conversion
 */
function parseCSV(csvText: string): CountyData[] {
  const lines = csvText.trim().split('\n');

  return lines.slice(1).map((line) => {
    // Handle potential quoted values in CSV, though simple split works if no commas in values
    const values = line.split(',');

    // Helper to safely parse numbers, returning null for empty/invalid values
    const parseNumber = (value: string | undefined): number | null => {
      if (!value) return null;
      const trimmed = value.trim();
      if (trimmed === '') return null;
      const parsed = parseFloat(trimmed);
      return isNaN(parsed) ? null : parsed;
    };

    return {
      stateName: values[0]?.trim() || '',
      countyName: values[1]?.trim() || '',
      year: parseNumber(values[2]) || 0, // Year should probably not be null
      farms: parseNumber(values[3]),
      croplandAcres: parseNumber(values[4]),
      harvestedCroplandAcres: parseNumber(values[5]),
      irrigatedAcres: parseNumber(values[6]),
      marketValueTotalDollars: parseNumber(values[7]),
      cropsSalesDollars: parseNumber(values[8]),
      livestockSalesDollars: parseNumber(values[9]),
      govPaymentsDollars: parseNumber(values[10]),
      applesAcres: parseNumber(values[11]),
      wheatAcres: parseNumber(values[12]),
      riceAcres: parseNumber(values[13]),
      hazelnutsAcres: parseNumber(values[14]),
      grassSeedBentgrassAcres: parseNumber(values[15]),
      grassSeedBermudagrassAcres: parseNumber(values[16]),
      grassSeedBluegrassAcres: parseNumber(values[17]),
      grassSeedBromegrassAcres: parseNumber(values[18]),
      grassSeedFescueAcres: parseNumber(values[19]),
      grassSeedOrchardgrassAcres: parseNumber(values[20]),
      grassSeedRyegrassAcres: parseNumber(values[21]),
      grassSeedSudangrassAcres: parseNumber(values[22]),
      grassSeedTimothyAcres: parseNumber(values[23]),
      grassSeedWheatgrassAcres: parseNumber(values[24]),
      cornAcres: parseNumber(values[25]),
      cornSilageAcres: parseNumber(values[26]),
      hayAcres: parseNumber(values[27]),
      haylageAcres: parseNumber(values[28]),
      beefCattleHead: parseNumber(values[29]),
      dairyCattleHead: parseNumber(values[30]),
      // grass_seed_acres (aggregated in CSV) is at index 31, but we will aggregate manually as requested
      // or should we use the CSV provided one if it matches? 
      // User said: "aggregation should be done inside of some place other than the fetch data"
      // So we ignore column 31 if it exists and compute it ourselves
    };
  });
}

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
  // Note: landInFarmsAcres was removed, so we can't calculate croplandPercentage exactly as before if that was the denominator
  // Let's check what was removed.
  // Previous: croplandPercentage = county.landInFarmsAcres > 0 ? (county.croplandAcres / county.landInFarmsAcres) * 100 : 0;
  // Since landInFarmsAcres is gone, maybe we use croplandAcres vs total land? 
  // Wait, I removed landInFarmsAcres based on my plan because it wasn't in the new CSV list I seemingly read?
  // Let's re-read the CSV header I printed earlier:
  // state_name,county_name,year,farms,cropland_acres,harvested_cropland_acres,irrigated_acres,market_value_total_dollars,crops_sales_dollars,livestock_sales_dollars,gov_payments_dollars,apples_acres,wheat_acres,rice_acres,hazelnuts_acres,...
  // It seems 'land_in_farms_acres' is indeed NOT in the new CSV headers I saw.
  // So croplandPercentage cannot be calculated as per old formula.
  // I will set it to null for now or remove it from UI if not needed.
  // For now, let's just make it null to avoid errors.

  const croplandPercentage = null;

  const irrigationPercentage = (county.croplandAcres !== null && county.croplandAcres > 0 && county.irrigatedAcres !== null)
    ? (county.irrigatedAcres / county.croplandAcres) * 100
    : null;

  return {
    ...county,
    id: `${county.stateName}-${county.countyName}`,
    croplandPercentage,
    irrigationPercentage,
    grassSeedAcres,
  };
}
