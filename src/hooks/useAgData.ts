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
function parseCSV(csvText: string): CountyData[] {
  const lines = csvText.trim().split('\n');

  return lines.slice(1).map((line) => {
    const values = line.split(',');

    // Helper to safely parse numbers, returning 0 for empty/invalid values
    const parseNumber = (value: string | undefined): number => {
      if (!value) return 0;
      const trimmed = value.trim();
      if (trimmed === '') return 0;
      const parsed = parseFloat(trimmed);
      return isNaN(parsed) ? 0 : parsed;
    };

    return {
      stateName: values[0]?.trim() || '',
      countyName: values[1]?.trim() || '',
      year: parseNumber(values[2]),
      farms: parseNumber(values[3]),
      landOwnedAcres: parseNumber(values[4]),
      landRentedAcres: parseNumber(values[5]),
      croplandAcres: parseNumber(values[6]),
      harvestedCroplandAcres: parseNumber(values[7]),
      irrigatedAcres: parseNumber(values[8]),
      landInFarmsAcres: parseNumber(values[9]),
      marketValueTotalDollars: parseNumber(values[10]),
      cropsSalesDollars: parseNumber(values[11]),
      livestockSalesDollars: parseNumber(values[12]),
      govPaymentsDollars: parseNumber(values[13]),
      netCashIncomeDollars: parseNumber(values[14]),
      cattleHead: parseNumber(values[15]),
      milkCowsHead: parseNumber(values[16]),
      vegHarvestOps: parseNumber(values[17]),
      internetAccessPct: parseNumber(values[18]),
    };
  });
}

/**
 * Enhance county data with computed fields
 */
function enhanceCountyData(county: CountyData): EnhancedCountyData {
  const totalLandAcres = county.landOwnedAcres + county.landRentedAcres;

  const croplandPercentage = county.landInFarmsAcres > 0
    ? (county.croplandAcres / county.landInFarmsAcres) * 100
    : 0;

  const irrigationPercentage = county.croplandAcres > 0
    ? (county.irrigatedAcres / county.croplandAcres) * 100
    : 0;

  return {
    ...county,
    id: `${county.stateName}-${county.countyName}`,
    totalLandAcres,
    croplandPercentage,
    irrigationPercentage,
  };
}
