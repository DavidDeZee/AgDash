import { useRef, useEffect, useState, useMemo } from 'react';
import Map, { Source, Layer } from 'react-map-gl/maplibre';
import type { MapRef, MapLayerMouseEvent } from 'react-map-gl/maplibre';
import type { EnhancedCountyData } from '../../types/ag';
import { useStore } from '../../store/useStore';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapViewProps {

  onCountyClick?: (county: EnhancedCountyData) => void;
  counties?: EnhancedCountyData[];
  filteredCounties?: EnhancedCountyData[];
}

interface HoverInfo {
  countyName: string;
  stateName: string;
  x: number;
  y: number;
  countyData?: EnhancedCountyData;
}

// FIPS code to state name mapping
const FIPS_TO_STATE: Record<string, string> = {
  '06': 'CALIFORNIA',
  '32': 'NEVADA',
  '41': 'OREGON',
  '53': 'WASHINGTON',
  '16': 'IDAHO',
  '30': 'MONTANA',
};

export const MAP_BOUNDS = {
  SOUTHWEST: [-130.0, 32.4] as [number, number],
  NORTHEAST: [-93.6, 49.9] as [number, number],
};

// Region definitions
export const REGIONS = {
  PUGET_SOUND: {
    name: 'Puget Sound',
    color: 'hsl(270, 70%, 50%)',
    opacity: 0.4,
  },
  INLAND_NW: {
    name: 'Inland NW',
    color: 'hsl(217, 91%, 60%)',
    opacity: 0.4,
  },
  NORTHERN_OREGON: {
    name: 'Northern Oregon',
    color: 'hsl(48, 96%, 53%)',
    opacity: 0.4,
  },
  SOUTHERN_OREGON: {
    name: 'Southern Oregon',
    color: 'hsl(142, 76%, 36%)',
    opacity: 0.4,
  },
  SUTTER_BUTTE: {
    name: 'Sutter Butte',
    color: 'hsl(25, 95%, 53%)',
    opacity: 0.4,
  },
  SACRAMENTO: {
    name: 'Sacramento',
    color: 'hsl(195, 70%, 60%)',
    opacity: 0.4,
  },
} as const;

// County color mapping by region - using "CountyName|StateFIPS" format to handle duplicate county names
const COUNTY_COLORS: Record<string, { color: string; opacity: number }> = {
  // Purple - Washington (53)
  'Whatcom|53': { color: 'hsl(270, 70%, 50%)', opacity: 0.4 },
  'Skagit|53': { color: 'hsl(270, 70%, 50%)', opacity: 0.4 },
  'San Juan|53': { color: 'hsl(270, 70%, 50%)', opacity: 0.4 },
  'Clallam|53': { color: 'hsl(270, 70%, 50%)', opacity: 0.4 },
  'Island|53': { color: 'hsl(270, 70%, 50%)', opacity: 0.4 },
  'Jefferson|53': { color: 'hsl(270, 70%, 50%)', opacity: 0.4 },
  'Snohomish|53': { color: 'hsl(270, 70%, 50%)', opacity: 0.4 },
  'Kitsap|53': { color: 'hsl(270, 70%, 50%)', opacity: 0.4 },
  'Skamania|53': { color: 'hsl(270, 70%, 50%)', opacity: 0.4 },
  'Lewis|53': { color: 'hsl(270, 70%, 50%)', opacity: 0.4 },
  'Pacific|53': { color: 'hsl(270, 70%, 50%)', opacity: 0.4 },
  'Grays Harbor|53': { color: 'hsl(270, 70%, 50%)', opacity: 0.4 },
  'Mason|53': { color: 'hsl(270, 70%, 50%)', opacity: 0.4 },
  'King|53': { color: 'hsl(270, 70%, 50%)', opacity: 0.4 },
  'Thurston|53': { color: 'hsl(270, 70%, 50%)', opacity: 0.4 },
  'Pierce|53': { color: 'hsl(270, 70%, 50%)', opacity: 0.4 },

  // Blue - Washington (53)
  'Okanogan|53': { color: 'hsl(217, 91%, 60%)', opacity: 0.4 },
  'Chelan|53': { color: 'hsl(217, 91%, 60%)', opacity: 0.4 },
  'Douglas|53': { color: 'hsl(217, 91%, 60%)', opacity: 0.4 },
  'Grant|53': { color: 'hsl(217, 91%, 60%)', opacity: 0.4 },
  'Kittitas|53': { color: 'hsl(217, 91%, 60%)', opacity: 0.4 },
  'Yakima|53': { color: 'hsl(217, 91%, 60%)', opacity: 0.4 },
  'Ferry|53': { color: 'hsl(217, 91%, 60%)', opacity: 0.4 },
  'Stevens|53': { color: 'hsl(217, 91%, 60%)', opacity: 0.4 },
  'Lincoln|53': { color: 'hsl(217, 91%, 60%)', opacity: 0.4 },
  'Spokane|53': { color: 'hsl(217, 91%, 60%)', opacity: 0.4 },
  'Pend Oreille|53': { color: 'hsl(217, 91%, 60%)', opacity: 0.4 },
  'Whitman|53': { color: 'hsl(217, 91%, 60%)', opacity: 0.4 },
  'Garfield|53': { color: 'hsl(217, 91%, 60%)', opacity: 0.4 },
  'Asotin|53': { color: 'hsl(217, 91%, 60%)', opacity: 0.4 },
  'Columbia|53': { color: 'hsl(217, 91%, 60%)', opacity: 0.4 },
  'Walla Walla|53': { color: 'hsl(217, 91%, 60%)', opacity: 0.4 },
  'Umatilla|41': { color: 'hsl(217, 91%, 60%)', opacity: 0.4 },

  // Yellow - Oregon (41) and Washington (53)
  'Clatsop|41': { color: 'hsl(48, 96%, 53%)', opacity: 0.4 },
  'Tillamook|41': { color: 'hsl(48, 96%, 53%)', opacity: 0.4 },
  'Multnomah|41': { color: 'hsl(48, 96%, 53%)', opacity: 0.4 },
  'Wahkiakum|53': { color: 'hsl(48, 96%, 53%)', opacity: 0.4 },
  'Cowlitz|53': { color: 'hsl(48, 96%, 53%)', opacity: 0.4 },
  'Clark|53': { color: 'hsl(48, 96%, 53%)', opacity: 0.4 },
  'Yamhill|41': { color: 'hsl(48, 96%, 53%)', opacity: 0.4 },
  'Washington|41': { color: 'hsl(48, 96%, 53%)', opacity: 0.4 },
  'Hood River|41': { color: 'hsl(48, 96%, 53%)', opacity: 0.4 },
  'Clackamas|41': { color: 'hsl(48, 96%, 53%)', opacity: 0.4 },
  'Marion|41': { color: 'hsl(48, 96%, 53%)', opacity: 0.4 },
  'Polk|41': { color: 'hsl(48, 96%, 53%)', opacity: 0.4 },
  'Columbia|41': { color: 'hsl(48, 96%, 53%)', opacity: 0.4 },


  // Green - Oregon (41) and California (06)
  'Lane|41': { color: 'hsl(142, 76%, 36%)', opacity: 0.4 },
  'Klamath|41': { color: 'hsl(142, 76%, 36%)', opacity: 0.4 },
  'Wasco|41': { color: 'hsl(142, 76%, 36%)', opacity: 0.4 },
  'Wheeler|41': { color: 'hsl(142, 76%, 36%)', opacity: 0.4 },
  'Crook|41': { color: 'hsl(142, 76%, 36%)', opacity: 0.4 },
  'Linn|41': { color: 'hsl(142, 76%, 36%)', opacity: 0.4 },
  'Deschutes|41': { color: 'hsl(142, 76%, 36%)', opacity: 0.4 },
  'Benton|41': { color: 'hsl(142, 76%, 36%)', opacity: 0.4 },
  'Lake|41': { color: 'hsl(142, 76%, 36%)', opacity: 0.4 },
  'Harney|41': { color: 'hsl(142, 76%, 36%)', opacity: 0.4 },
  'Jackson|41': { color: 'hsl(142, 76%, 36%)', opacity: 0.4 },
  'Josephine|41': { color: 'hsl(142, 76%, 36%)', opacity: 0.4 },
  'Curry|41': { color: 'hsl(142, 76%, 36%)', opacity: 0.4 },
  'Coos|41': { color: 'hsl(142, 76%, 36%)', opacity: 0.4 },
  'Siskiyou|06': { color: 'hsl(142, 76%, 36%)', opacity: 0.4 },
  'Modoc|06': { color: 'hsl(142, 76%, 36%)', opacity: 0.4 },
  'Douglas|41': { color: 'hsl(142, 76%, 36%)', opacity: 0.4 },
  'Jefferson|41': { color: 'hsl(142, 76%, 36%)', opacity: 0.4 },
  'Lincoln|41': { color: 'hsl(142, 76%, 36%)', opacity: 0.4 },




  // Orange - California (06)
  'Del Norte|06': { color: 'hsl(25, 95%, 53%)', opacity: 0.4 },
  'Humboldt|06': { color: 'hsl(25, 95%, 53%)', opacity: 0.4 },
  'Trinity|06': { color: 'hsl(25, 95%, 53%)', opacity: 0.4 },
  'Shasta|06': { color: 'hsl(25, 95%, 53%)', opacity: 0.4 },
  'Lassen|06': { color: 'hsl(25, 95%, 53%)', opacity: 0.4 },
  'Tehama|06': { color: 'hsl(25, 95%, 53%)', opacity: 0.4 },
  'Plumas|06': { color: 'hsl(25, 95%, 53%)', opacity: 0.4 },
  'Glenn|06': { color: 'hsl(25, 95%, 53%)', opacity: 0.4 },
  'Colusa|06': { color: 'hsl(25, 95%, 53%)', opacity: 0.4 },
  'Butte|06': { color: 'hsl(25, 95%, 53%)', opacity: 0.4 },
  'Sierra|06': { color: 'hsl(25, 95%, 53%)', opacity: 0.4 },
  'Nevada|06': { color: 'hsl(25, 95%, 53%)', opacity: 0.4 },
  'Yuba|06': { color: 'hsl(25, 95%, 53%)', opacity: 0.4 },

  // Light Blue - Nevada (32) and California (06)
  'Washoe|32': { color: 'hsl(195, 70%, 60%)', opacity: 0.4 },
  'Pershing|32': { color: 'hsl(195, 70%, 60%)', opacity: 0.4 },
  'Churchill|32': { color: 'hsl(195, 70%, 60%)', opacity: 0.4 },
  'Lander|32': { color: 'hsl(195, 70%, 60%)', opacity: 0.4 },
  'Eureka|32': { color: 'hsl(195, 70%, 60%)', opacity: 0.4 },
  'Storey|32': { color: 'hsl(195, 70%, 60%)', opacity: 0.4 },
  'Lyon|32': { color: 'hsl(195, 70%, 60%)', opacity: 0.4 },
  'Carson City|32': { color: 'hsl(195, 70%, 60%)', opacity: 0.4 },
  'Douglas|32': { color: 'hsl(195, 70%, 60%)', opacity: 0.4 },
  'Humboldt|32': { color: 'hsl(195, 70%, 60%)', opacity: 0.4 },
  'Nye|32': { color: 'hsl(195, 70%, 60%)', opacity: 0.4 },
  'Mineral|32': { color: 'hsl(195, 70%, 60%)', opacity: 0.4 },
  'Esmeralda|32': { color: 'hsl(195, 70%, 60%)', opacity: 0.4 },
  'Mono|06': { color: 'hsl(195, 70%, 60%)', opacity: 0.4 },
  'Alpine|06': { color: 'hsl(195, 70%, 60%)', opacity: 0.4 },
  'Tuolumne|06': { color: 'hsl(195, 70%, 60%)', opacity: 0.4 },
  'El Dorado|06': { color: 'hsl(195, 70%, 60%)', opacity: 0.4 },
  'Placer|06': { color: 'hsl(195, 70%, 60%)', opacity: 0.4 },
  'Sutter|06': { color: 'hsl(195, 70%, 60%)', opacity: 0.4 },
  'Yolo|06': { color: 'hsl(195, 70%, 60%)', opacity: 0.4 },
  'Sacramento|06': { color: 'hsl(195, 70%, 60%)', opacity: 0.4 },
  'Solano|06': { color: 'hsl(195, 70%, 60%)', opacity: 0.4 },
  'Contra Costa|06': { color: 'hsl(195, 70%, 60%)', opacity: 0.4 },
  // ID and MT Counties
  'Boundary|16': { color: 'hsl(217, 91%, 60%)', opacity: 0.4 },
  'Bonner|16': { color: 'hsl(217, 91%, 60%)', opacity: 0.4 },
  'Kootenai|16': { color: 'hsl(217, 91%, 60%)', opacity: 0.4 },
  'Shoshone|16': { color: 'hsl(217, 91%, 60%)', opacity: 0.4 },
  'Benewah|16': { color: 'hsl(217, 91%, 60%)', opacity: 0.4 },
  'Latah|16': { color: 'hsl(217, 91%, 60%)', opacity: 0.4 },
  'Nez Perce|16': { color: 'hsl(217, 91%, 60%)', opacity: 0.4 },
  'Lewis|16': { color: 'hsl(217, 91%, 60%)', opacity: 0.4 },
  'Lincoln|30': { color: 'hsl(217, 91%, 60%)', opacity: 0.4 },
  'Sanders|30': { color: 'hsl(217, 91%, 60%)', opacity: 0.4 },
};

// Helper function to get region for a county (case-insensitive)
export function getCountyRegion(countyName: string, stateFips: string): keyof typeof REGIONS | null {
  // Try exact match first
  const exactKey = `${countyName}|${stateFips}`;
  if (COUNTY_TO_REGION_INTERNAL[exactKey]) {
    return COUNTY_TO_REGION_INTERNAL[exactKey];
  }

  // Try with title case (capitalize first letter of each word)
  const titleCaseName = countyName.split(' ').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
  const titleCaseKey = `${titleCaseName}|${stateFips}`;

  return COUNTY_TO_REGION_INTERNAL[titleCaseKey] || null;
}

// County to region mapping (internal - use getCountyRegion function for lookups)
const COUNTY_TO_REGION_INTERNAL: Record<string, keyof typeof REGIONS> = {
  // Puget Sound
  'Whatcom|53': 'PUGET_SOUND',
  'Skagit|53': 'PUGET_SOUND',
  'San Juan|53': 'PUGET_SOUND',
  'Clallam|53': 'PUGET_SOUND',
  'Island|53': 'PUGET_SOUND',
  'Jefferson|53': 'PUGET_SOUND',
  'Snohomish|53': 'PUGET_SOUND',
  'Kitsap|53': 'PUGET_SOUND',
  'Skamania|53': 'PUGET_SOUND',
  'Lewis|53': 'PUGET_SOUND',
  'Pacific|53': 'PUGET_SOUND',
  'Grays Harbor|53': 'PUGET_SOUND',
  'Mason|53': 'PUGET_SOUND',
  'King|53': 'PUGET_SOUND',
  'Thurston|53': 'PUGET_SOUND',
  'Pierce|53': 'PUGET_SOUND',
  // Inland NW
  'Okanogan|53': 'INLAND_NW',
  'Chelan|53': 'INLAND_NW',
  'Douglas|53': 'INLAND_NW',
  'Grant|53': 'INLAND_NW',
  'Kittitas|53': 'INLAND_NW',
  'Yakima|53': 'INLAND_NW',
  'Ferry|53': 'INLAND_NW',
  'Stevens|53': 'INLAND_NW',
  'Lincoln|53': 'INLAND_NW',
  'Spokane|53': 'INLAND_NW',
  'Pend Oreille|53': 'INLAND_NW',
  'Whitman|53': 'INLAND_NW',
  'Garfield|53': 'INLAND_NW',
  'Asotin|53': 'INLAND_NW',
  'Columbia|53': 'INLAND_NW',
  'Walla Walla|53': 'INLAND_NW',
  'Umatilla|41': 'INLAND_NW',
  // 'Boundary|16': 'INLAND_NW',

  // ID - 16
  // MT - 30

  // Northern Oregon
  'Clatsop|41': 'NORTHERN_OREGON',
  'Tillamook|41': 'NORTHERN_OREGON',
  'Multnomah|41': 'NORTHERN_OREGON',
  'Wahkiakum|53': 'NORTHERN_OREGON',
  'Cowlitz|53': 'NORTHERN_OREGON',
  'Clark|53': 'NORTHERN_OREGON',
  'Yamhill|41': 'NORTHERN_OREGON',
  'Washington|41': 'NORTHERN_OREGON',
  'Hood River|41': 'NORTHERN_OREGON',
  'Clackamas|41': 'NORTHERN_OREGON',
  'Marion|41': 'NORTHERN_OREGON',
  'Polk|41': 'NORTHERN_OREGON',
  'Columbia|41': 'NORTHERN_OREGON',
  // Southern Oregon
  'Lane|41': 'SOUTHERN_OREGON',
  'Klamath|41': 'SOUTHERN_OREGON',
  'Wasco|41': 'SOUTHERN_OREGON',
  'Wheeler|41': 'SOUTHERN_OREGON',
  'Crook|41': 'SOUTHERN_OREGON',
  'Linn|41': 'SOUTHERN_OREGON',
  'Deschutes|41': 'SOUTHERN_OREGON',
  'Benton|41': 'SOUTHERN_OREGON',
  'Lake|41': 'SOUTHERN_OREGON',
  'Harney|41': 'SOUTHERN_OREGON',
  'Jackson|41': 'SOUTHERN_OREGON',
  'Josephine|41': 'SOUTHERN_OREGON',
  'Curry|41': 'SOUTHERN_OREGON',
  'Coos|41': 'SOUTHERN_OREGON',
  'Siskiyou|06': 'SOUTHERN_OREGON',
  'Modoc|06': 'SOUTHERN_OREGON',
  'Douglas|41': 'SOUTHERN_OREGON',
  'Jefferson|41': 'SOUTHERN_OREGON',
  'Lincoln|41': 'SOUTHERN_OREGON',
  // Sutter Butte
  'Del Norte|06': 'SUTTER_BUTTE',
  'Humboldt|06': 'SUTTER_BUTTE',
  'Trinity|06': 'SUTTER_BUTTE',
  'Shasta|06': 'SUTTER_BUTTE',
  'Lassen|06': 'SUTTER_BUTTE',
  'Tehama|06': 'SUTTER_BUTTE',
  'Plumas|06': 'SUTTER_BUTTE',
  'Glenn|06': 'SUTTER_BUTTE',
  'Colusa|06': 'SUTTER_BUTTE',
  'Butte|06': 'SUTTER_BUTTE',
  'Sierra|06': 'SUTTER_BUTTE',
  'Nevada|06': 'SUTTER_BUTTE',
  'Yuba|06': 'SUTTER_BUTTE',
  // Sacramento
  'Washoe|32': 'SACRAMENTO',
  'Pershing|32': 'SACRAMENTO',
  'Churchill|32': 'SACRAMENTO',
  'Lander|32': 'SACRAMENTO',
  'Eureka|32': 'SACRAMENTO',
  'Storey|32': 'SACRAMENTO',
  'Lyon|32': 'SACRAMENTO',
  'Carson City|32': 'SACRAMENTO',
  'Douglas|32': 'SACRAMENTO',
  'Humboldt|32': 'SACRAMENTO',
  'Nye|32': 'SACRAMENTO',
  'Mineral|32': 'SACRAMENTO',
  'Esmeralda|32': 'SACRAMENTO',
  'Mono|06': 'SACRAMENTO',
  'Alpine|06': 'SACRAMENTO',
  'Tuolumne|06': 'SACRAMENTO',
  'El Dorado|06': 'SACRAMENTO',
  'Placer|06': 'SACRAMENTO',
  'Sutter|06': 'SACRAMENTO',
  'Yolo|06': 'SACRAMENTO',
  'Sacramento|06': 'SACRAMENTO',
  'Solano|06': 'SACRAMENTO',
  'Contra Costa|06': 'SACRAMENTO',
  // ID and MT Counties
  'Boundary|16': 'INLAND_NW',
  'Bonner|16': 'INLAND_NW',
  'Kootenai|16': 'INLAND_NW',
  'Shoshone|16': 'INLAND_NW',
  'Benewah|16': 'INLAND_NW',
  'Latah|16': 'INLAND_NW',
  'Nez Perce|16': 'INLAND_NW',
  'Lewis|16': 'INLAND_NW',
  'Lincoln|30': 'INLAND_NW',
  'Sanders|30': 'INLAND_NW',
};

// Export the mapping for backward compatibility
export const COUNTY_TO_REGION = COUNTY_TO_REGION_INTERNAL;

// Build MapLibre expression for fill-color
function buildColorExpression() {
  const cases: any[] = [];
  Object.entries(COUNTY_COLORS).forEach(([key, { color }]) => {
    const [county, stateFips] = key.split('|');
    // Check both county name AND state FIPS
    cases.push(
      ['all', ['==', ['get', 'NAME'], county], ['==', ['get', 'STATEFP'], stateFips]],
      color
    );
  });
  cases.push('rgba(0, 0, 0, 0)'); // Default transparent
  return ['case', ...cases];
}

// Build MapLibre expression for fill-opacity
function buildOpacityExpression() {
  const cases: any[] = [];
  Object.entries(COUNTY_COLORS).forEach(([key, { opacity }]) => {
    const [county, stateFips] = key.split('|');
    // Check both county name AND state FIPS
    cases.push(
      ['all', ['==', ['get', 'NAME'], county], ['==', ['get', 'STATEFP'], stateFips]],
      opacity
    );
  });
  cases.push(0); // Default transparent
  return ['case', ...cases];
}

// Build expression that checks if a county is in the filtered set
function buildFilteredColorExpression(
  filteredSet: Set<string> | null,
  fipsToState: Record<string, string>
) {
  if (!filteredSet) {
    // No filter active - show all counties with their original colors
    return buildColorExpression();
  }

  // Filter is active - highlight only filtered counties
  const cases: any[] = [];

  // Build a comprehensive condition for each county/state combination
  Object.entries(COUNTY_COLORS).forEach(([key, { color }]) => {
    const [county, stateFips] = key.split('|');
    const stateName = fipsToState[stateFips];

    if (stateName) {
      const filterKey = `${county.toUpperCase()}|${stateName.toUpperCase()}`;
      if (filteredSet.has(filterKey)) {
        // Add condition: county name matches AND state FIPS matches
        cases.push(
          ['all', ['==', ['get', 'NAME'], county], ['==', ['get', 'STATEFP'], stateFips]],
          color
        );
      }
    }
  });

  // Default: transparent for non-filtered counties
  cases.push('rgba(0, 0, 0, 0)');
  return ['case', ...cases];
}

// Build expression for opacity based on filter
function buildFilteredOpacityExpression(
  filteredSet: Set<string> | null,
  fipsToState: Record<string, string>,
  heatmapMode: boolean
) {
  if (heatmapMode) {
    // If heatmap is on, show opacity 0.8 for any feature that has a valid heatmap value
    // We can check if feature-state heatmapValue is present/valid.
    // Since we can't easily check for "existence" of feature-state with default value in 'case', 
    // we will rely on the fact that we set heatmapValue to -1 or null for invalid ones?
    // Or just use the boolean check.
    return ['case',
      ['!=', ['feature-state', 'heatmapValue'], null],
      0.8,
      0
    ];
  }

  if (!filteredSet) {
    // No filter active - show all counties with their original opacity
    return buildOpacityExpression();
  }

  // Filter is active - show only filtered counties
  const cases: any[] = [];

  Object.entries(COUNTY_COLORS).forEach(([key, { opacity }]) => {
    const [county, stateFips] = key.split('|');
    const stateName = fipsToState[stateFips];

    if (stateName) {
      const filterKey = `${county.toUpperCase()}|${stateName.toUpperCase()}`;
      if (filteredSet.has(filterKey)) {
        cases.push(
          ['all', ['==', ['get', 'NAME'], county], ['==', ['get', 'STATEFP'], stateFips]],
          opacity * 1.5 // Make filtered counties more prominent
        );
      }
    }
  });

  // Default: transparent for non-filtered counties
  cases.push(0);
  return ['case', ...cases];
}

// Build Heatmap Color Expression using feature-state
function buildHeatmapColorExpression(metric: string, counties: EnhancedCountyData[]) {
  // 1. Calculate min/max for the metric globally for the interpolation range
  const values = counties
    .map(c => c[metric as keyof EnhancedCountyData] as number)
    .filter(v => typeof v === 'number' && v !== null && !isNaN(v));

  if (values.length === 0) return 'rgba(0,0,0,0)';

  const min = Math.min(...values);
  const max = Math.max(...values);

  // 2. Define color scale based on metric type
  const isLivestock = ['beefCattleHead', 'dairyCattleHead', 'livestockSalesDollars'].includes(metric);

  // Interpolate color based on feature-state "heatmapValue"
  // MapLibre interpolate expression: ['interpolate', ['linear'], ['feature-state', 'heatmapValue'], min, colorMin, max, colorMax]

  if (isLivestock) {
    // Orange/Red scale: Light Orange to Dark Red
    // using exact rgba or hex might be cleaner than hsl interpolation in expression if we want specific stops
    return [
      'interpolate',
      ['linear'],
      ['feature-state', 'heatmapValue'],
      min, 'rgba(254, 217, 118, 0.8)', // Light orange
      max, 'rgba(189, 0, 38, 0.9)'     // Dark red
    ];
  } else {
    // Green scale: Light Green to Dark Green
    return [
      'interpolate',
      ['linear'],
      ['feature-state', 'heatmapValue'],
      min, 'rgba(237, 248, 233, 0.8)', // Light green
      max, 'rgba(0, 109, 44, 0.9)'     // Dark green
    ];
  }
}

// Map Legend Component
function MapLegend() {
  const regionOrder: (keyof typeof REGIONS)[] = [
    'PUGET_SOUND',
    'INLAND_NW',
    'NORTHERN_OREGON',
    'SOUTHERN_OREGON',
    'SUTTER_BUTTE',
    'SACRAMENTO',
  ];

  return (
    <div className="absolute bottom-12 right-6 bg-card/95 backdrop-blur-sm border border-border rounded-md p-3 shadow-lg z-10 min-w-[140px]">
      <h3 className="text-xs font-semibold mb-2 text-foreground">Region Key</h3>
      <div className="space-y-1.5">
        {regionOrder.map((regionKey) => {
          const region = REGIONS[regionKey];
          return (
            <div key={regionKey} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full border border-border/50 flex-shrink-0"
                style={{
                  backgroundColor: region.color,
                  opacity: region.opacity + 0.3,
                }}
              />
              <span className="text-[11px] text-foreground/90">{region.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MapView({ counties = [], filteredCounties, onCountyClick }: MapViewProps) {
  const mapRef = useRef<MapRef>(null);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const [hoveredCountyId, setHoveredCountyId] = useState<string | number | null>(null);
  const [countiesData, setCountiesData] = useState<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Get comparison counties from store
  const { comparisonCounties, heatmapMode, heatmapMetric, heatmapStateFilter } = useStore();

  // Create a Set of comparison county keys for quick lookup
  const comparisonCountySet = useMemo(() => {
    const set = new Set<string>();
    comparisonCounties.forEach((county) => {
      const key = `${county.countyName.toUpperCase()}|${county.stateName.toUpperCase()}`;
      set.add(key);
    });
    return set;
  }, [comparisonCounties]);


  // Create a Set of filtered county names+states for quick lookup
  const filteredCountySet = useMemo(() => {
    if (!filteredCounties || filteredCounties.length === 0) {
      return null; // Show all counties with their original colors if no filter
    }
    const set = new Set<string>();
    filteredCounties.forEach((county) => {
      // Create unique key: "COUNTYNAME|STATENAME" (both uppercase)
      const key = `${county.countyName.toUpperCase()}|${county.stateName.toUpperCase()}`;
      set.add(key);
    });
    return set;
  }, [filteredCounties]);

  // Load GeoJSON data
  useEffect(() => {
    fetch('/data/counties_expanded.json')
      .then((response) => response.json())
      .then((data) => {
        console.log('Counties GeoJSON loaded:', data);
        setCountiesData(data);
      })
      .catch((err) => {
        console.error('Error loading county boundaries:', err);
      });

  }, []);

  // Update feature state for comparison counties
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || !mapLoaded || !countiesData) return;

    // Iterate through all features and set comparison state
    countiesData.features.forEach((feature: any, index: number) => {
      const countyName = feature.properties?.NAME;
      const stateFips = feature.properties?.STATEFP;
      const stateName = FIPS_TO_STATE[stateFips];

      if (countyName && stateName) {
        const key = `${countyName.toUpperCase()}|${stateName.toUpperCase()}`;
        const isInComparison = comparisonCountySet.has(key);

        map.setFeatureState(
          { source: 'counties', id: index },
          { comparison: isInComparison }
        );
      }
    });

    // Handle Heatmap Data Sync: Push values to feature-state
    // We do this every time heatmap settings OR map/data load changes
    if (heatmapMode && heatmapMetric) {

      // Filter data first if state filter is active
      const targetCounties = heatmapStateFilter
        ? counties.filter(c => c.stateName === heatmapStateFilter)
        : counties;

      // Update the COLOR expression dynamically?
      // No, the color expression is in 'countyFillLayer' memo.
      // We need to add 'heatmapStateFilter' to the dependency of 'countyFillLayer' so it rebuilds the expression with new min/max!

      countiesData.features.forEach((feature: any, index: number) => {
        const countyName = feature.properties?.NAME;
        const stateFips = feature.properties?.STATEFP;
        const stateName = FIPS_TO_STATE[stateFips];

        if (countyName && stateName) {
          // Find data
          const county = targetCounties.find(
            (c) => c.countyName.toUpperCase() === countyName.toUpperCase() &&
              c.stateName.toUpperCase() === stateName.toUpperCase()
          );

          if (county) {
            const val = county[heatmapMetric as keyof EnhancedCountyData] as number | null;
            // Set state
            if (val !== null && val !== undefined && !isNaN(val)) {
              map.setFeatureState(
                { source: 'counties', id: index },
                { heatmapValue: val }
              );
            } else {
              map.removeFeatureState(
                { source: 'counties', id: index },
                'heatmapValue'
              );
            }
          } else {
            // If not in target subset (e.g. filtered out by state), remove heatmapValue
            map.removeFeatureState(
              { source: 'counties', id: index },
              'heatmapValue'
            );
          }
        }
      });
    } else {
      // Clear heatmap values if mode is off, to be safe/clean
      countiesData.features.forEach((_: any, index: number) => {
        map.removeFeatureState(
          { source: 'counties', id: index },
          'heatmapValue'
        );
      });
    }

  }, [mapLoaded, countiesData, comparisonCountySet, heatmapMode, heatmapMetric, heatmapStateFilter, counties]);


  // Handle hover
  const onMouseMove = (event: MapLayerMouseEvent) => {
    const feature = event.features?.[0];
    if (feature && feature.properties) {
      const map = mapRef.current?.getMap();

      // Update hover state
      if (hoveredCountyId !== null) {
        map?.setFeatureState(
          { source: 'counties', id: hoveredCountyId },
          { hover: false }
        );
      }

      const newHoveredId = feature.id as number;
      setHoveredCountyId(newHoveredId);

      map?.setFeatureState(
        { source: 'counties', id: newHoveredId },
        { hover: true }
      );

      const countyName = feature.properties.NAME || feature.properties.name;
      const stateFips = feature.properties.STATEFP;
      const stateName = FIPS_TO_STATE[stateFips] || '';

      // Look up county data from the counties array
      // Convert to uppercase to match CSV data format
      const countyData = counties.find(
        (c) => c.countyName.toUpperCase() === countyName.toUpperCase() &&
          c.stateName.toUpperCase() === stateName.toUpperCase()
      );

      setHoverInfo({
        countyName,
        stateName: stateName ? stateName.charAt(0) + stateName.slice(1).toLowerCase() : '',
        x: event.point.x,
        y: event.point.y,
        countyData,
      });

      // Change cursor
      if (map) {
        map.getCanvas().style.cursor = 'pointer';
      }
    }
  };

  const onMouseLeave = () => {
    const map = mapRef.current?.getMap();

    if (hoveredCountyId !== null) {
      map?.setFeatureState(
        { source: 'counties', id: hoveredCountyId },
        { hover: false }
      );
    }
    setHoveredCountyId(null);
    setHoverInfo(null);

    if (map) {
      map.getCanvas().style.cursor = '';
    }
  };

  const onClick = (event: MapLayerMouseEvent) => {
    const feature = event.features?.[0];
    if (feature && feature.properties && onCountyClick) {
      const countyName = feature.properties.NAME || feature.properties.name;
      const stateFips = feature.properties.STATEFP;
      const stateName = FIPS_TO_STATE[stateFips] || '';

      // Look up county data
      const countyData = counties.find(
        (c) => c.countyName.toUpperCase() === countyName.toUpperCase() &&
          c.stateName.toUpperCase() === stateName.toUpperCase()
      );

      if (countyData) {
        onCountyClick(countyData);
      }
    }
  };

  // Layer styles - memoized to update when filter changes
  const countyFillLayer = useMemo(() => {
    let fillColorExpression;
    let fillOpacityExpression;

    if (heatmapMode) {
      // Pass the filtered subset to the color generator to ensure the color scale adapts to the visible data range
      const targetCounties = heatmapStateFilter
        ? counties.filter(c => c.stateName === heatmapStateFilter)
        : counties;

      fillColorExpression = buildHeatmapColorExpression(heatmapMetric, targetCounties);
      fillOpacityExpression = buildFilteredOpacityExpression(filteredCountySet, FIPS_TO_STATE, true);
    } else {
      fillColorExpression = buildFilteredColorExpression(filteredCountySet, FIPS_TO_STATE);
      fillOpacityExpression = buildFilteredOpacityExpression(filteredCountySet, FIPS_TO_STATE, false);
    }

    return {
      id: 'counties-fill',
      type: 'fill' as const,
      paint: {
        'fill-color': fillColorExpression as any,
        'fill-opacity': fillOpacityExpression as any,
      },
    };
  }, [filteredCountySet, heatmapMode, heatmapMetric, heatmapStateFilter, counties]);

  // Base outline layer - just gray borders for all counties
  const countyOutlineLayer = useMemo(() => ({
    id: 'counties-outline',
    type: 'line' as const,
    paint: {
      'line-color': '#6b7280',
      'line-width': 1,
      'line-opacity': 0.6,
    },
  }), []);

  // Comparison outline layer - white borders for comparison counties, rendered on top
  const countyOutlineComparisonLayer = {
    id: 'counties-outline-comparison',
    type: 'line' as const,
    paint: {
      'line-color': '#ffffff',
      'line-width': 2,
      'line-opacity': [
        'case',
        ['boolean', ['feature-state', 'comparison'], false],
        1,
        0,
      ] as any,
    },
  };

  // Hover outline layer - white borders on hover, rendered on top of everything
  const countyOutlineHoverLayer = {
    id: 'counties-outline-hover',
    type: 'line' as const,
    paint: {
      'line-color': '#ffffff',
      'line-width': 2,
      'line-opacity': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        1,
        0,
      ] as any,
    },
  };




  return (
    <div className="h-full w-full relative">
      <Map
        ref={mapRef}
        initialViewState={{
          latitude: 41.0,
          longitude: -113.5,
          zoom: 4,
        }}
        maxBounds={[
          MAP_BOUNDS.SOUTHWEST,
          MAP_BOUNDS.NORTHEAST
        ]}
        style={{ width: '100%', height: '100%' }}
        mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        interactiveLayerIds={['counties-fill', 'counties-outline', 'counties-outline-comparison', 'counties-outline-hover']}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
        onLoad={() => setMapLoaded(true)}
        {...({
          canvasContextAttributes: {
            preserveDrawingBuffer: true
          }
        } as any)}
      >
        {/* Counties source and layers */}
        {countiesData && (
          <Source id="counties" type="geojson" data={countiesData} generateId={true}>
            <Layer {...countyFillLayer} />
            <Layer {...countyOutlineLayer} />
            <Layer {...countyOutlineComparisonLayer} />
            <Layer {...countyOutlineHoverLayer} />
          </Source>
        )}


      </Map>

      {/* Map Legend */}
      <MapLegend />

      {/* Hover tooltip */}
      {hoverInfo && (
        <div
          className="absolute bg-card border border-border rounded-md px-3 py-2 shadow-lg pointer-events-none z-10 min-w-[220px]"
          style={{
            left: hoverInfo.x + 10,
            top: hoverInfo.y + 10,
          }}
        >
          <div className="font-semibold text-sm mb-1">
            {hoverInfo.countyName}
          </div>
          <div className="text-xs text-muted-foreground mb-2">
            {hoverInfo.stateName}
          </div>

          {hoverInfo.countyData ? (
            <div className="space-y-1 border-t border-border pt-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Farms:</span>
                <span className="font-medium">{(hoverInfo.countyData.farms || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Cropland:</span>
                <span className="font-medium">
                  {((hoverInfo.countyData.croplandAcres || 0) / 1000).toFixed(1)}K ac
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Market Val:</span>
                <span className="font-medium">
                  ${((hoverInfo.countyData.marketValueTotalDollars || 0) / 1000000).toFixed(1)}M
                </span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground italic">
              No data available
            </div>
          )}
        </div>
      )}


    </div>
  );
}
