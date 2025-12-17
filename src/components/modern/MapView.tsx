import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Plus, Minus, RotateCcw } from 'lucide-react';
import Map, { Source, Layer, Popup, Marker } from 'react-map-gl/maplibre';
import type { MapRef, MapLayerMouseEvent } from 'react-map-gl/maplibre';
import Supercluster from 'supercluster';
import type { EnhancedCountyData } from '../../types/ag';
import papeLocationsData from '../../data/pape-locations.json';
import newHollandLocationsData from '../../data/new-holland-locations.json';
import caseIHLocationsData from '../../data/case-ih-locations.json';
import kubotaLocationsData from '../../data/kubota-locations.json';
import kiotiLocationsData from '../../data/kioti-locations.json';
import { useStore } from '../../store/useStore';
import { DEALERSHIP_BRANDING } from '../../constants/branding';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapViewProps {

  onCountyClick?: (county: EnhancedCountyData) => void;
  counties?: EnhancedCountyData[];
  filteredCounties?: EnhancedCountyData[];
  papeData?: any; // Using any to avoid circular deps or complex importing if types are tricky, but preferably use PapeDataMap
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
function buildHeatmapColorExpression(metric: string, counties: EnhancedCountyData[], papeData?: any) {
  // Check if this is an internal metric
  if (metric.startsWith('internal|')) {
    // Format: internal|CATEGORY|metricKey
    // We need to calculate global min/max for this internal metric across all counties found in papeData
    if (!papeData) return 'rgba(0,0,0,0)';

    const parts = metric.split('|');
    if (parts.length < 3) return 'rgba(0,0,0,0)';

    // category is parts[1], key is parts[2]
    // However, our internal data structure is flattening differently in the modal vs here.
    // Let's assume the metric key in papeData items is what we need. 
    // Wait, papeData is Map<countyId, Array<CategoryItem>>.
    // We need to iterate all counties to find min/max for this specific key.

    const targetKey = parts[2]; // e.g. "indDollars", "sharePercentage"
    const targetCategory = parts[1]; // e.g. "MID HAY"

    let min = Infinity;
    let max = -Infinity;
    let count = 0;

    // Iterate only over the filtered counties to calculate min/max
    counties.forEach((county) => {
      const items = papeData[county.id];
      if (items && Array.isArray(items)) {
        const item = items.find((i: any) => i.category === targetCategory);
        if (item) {
          let val: number | null = null;
          const raw = item[targetKey];

          if (typeof raw === 'number') {
            val = raw;
          } else if (typeof raw === 'string') {
            // Remove $, %, ,
            const clean = raw.replace(/[$,%]/g, '');
            if (clean && !isNaN(parseFloat(clean))) {
              val = parseFloat(clean);
            }
          }

          if (val !== null) {
            if (val < min) min = val;
            if (val > max) max = val;
            count++;
          }
        }
      }
    });

    if (count === 0) return 'rgba(0,0,0,0)';
    if (min === max) max = min + 1; // Avoid divide by zero range

    // Green scale for internal data generally? Or maybe Blue?
    // Let's go with a distinct scale: Blue-Purple
    return [
      'interpolate',
      ['linear'],
      ['feature-state', 'heatmapValue'],
      min, 'rgba(237, 248, 251, 0.8)', // Light blue/cyan
      max, 'rgba(129, 15, 124, 0.9)'   // Dark purple
    ];
  }

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
  const { regionMode, showPapeLocations, showNewHollandLocations, showCaseIHLocations, showKubotaLocations, showKiotiLocations } = useStore();

  const regionOrder: (keyof typeof REGIONS)[] = [
    'PUGET_SOUND',
    'INLAND_NW',
    'NORTHERN_OREGON',
    'SOUTHERN_OREGON',
    'SUTTER_BUTTE',
    'SACRAMENTO',
  ];

  if (!regionMode && !showPapeLocations && !showNewHollandLocations && !showCaseIHLocations && !showKubotaLocations && !showKiotiLocations) return null;

  return (
    <div className="absolute bottom-12 right-6 bg-card/95 backdrop-blur-sm border border-border rounded-md p-3 shadow-lg z-10 min-w-[140px]">
      {regionMode && (
        <>
          <h3 className="text-xs font-semibold mb-2 text-foreground">Regions</h3>
          <div className="space-y-1.5">
            {regionOrder.map((regionKey) => {
              const region = REGIONS[regionKey];
              return (
                <div key={regionKey} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
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
        </>
      )}

      {regionMode && (showPapeLocations || showNewHollandLocations || showCaseIHLocations || showKubotaLocations || showKiotiLocations) && (
        <div className="my-2 border-t border-border/50" />
      )}

      {(showPapeLocations || showNewHollandLocations || showCaseIHLocations || showKubotaLocations || showKiotiLocations) && (
        <>
          <h3 className="text-xs font-semibold mb-2 text-foreground">Dealerships</h3>
          {showPapeLocations && (
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: DEALERSHIP_BRANDING.PAPE.color }}
              />
              <span className="text-[11px] text-foreground/90">{DEALERSHIP_BRANDING.PAPE.name}</span>
            </div>
          )}
          {showNewHollandLocations && (
            <div className={`flex items-center gap-2 ${showPapeLocations ? 'mt-1' : ''}`}>
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: DEALERSHIP_BRANDING.NEW_HOLLAND.color }}
              />
              <span className="text-[11px] text-foreground/90">{DEALERSHIP_BRANDING.NEW_HOLLAND.name}</span>
            </div>
          )}
          {showCaseIHLocations && (
            <div className={`flex items-center gap-2 ${showPapeLocations || showNewHollandLocations ? 'mt-1' : ''}`}>
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: DEALERSHIP_BRANDING.CASE_IH.color }}
              />
              <span className="text-[11px] text-foreground/90">{DEALERSHIP_BRANDING.CASE_IH.name}</span>
            </div>
          )}
          {showKubotaLocations && (
            <div className={`flex items-center gap-2 ${showPapeLocations || showNewHollandLocations || showCaseIHLocations ? 'mt-1' : ''}`}>
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: DEALERSHIP_BRANDING.KUBOTA.color }}
              />
              <span className="text-[11px] text-foreground/90">{DEALERSHIP_BRANDING.KUBOTA.name}</span>
            </div>
          )}
          {showKiotiLocations && (
            <div className={`flex items-center gap-2 ${showPapeLocations || showNewHollandLocations || showCaseIHLocations || showKubotaLocations ? 'mt-1' : ''}`}>
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: DEALERSHIP_BRANDING.KIOTI.color }}
              />
              <span className="text-[11px] text-foreground/90">{DEALERSHIP_BRANDING.KIOTI.name}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Popup info interface
interface PopupInfo {
  longitude: number;
  latitude: number;
  features: any[]; // Array of GeoJSON features
  anchor?: 'top' | 'bottom';
}

export function MapView({ counties = [], filteredCounties, onCountyClick, papeData }: MapViewProps) {
  const mapRef = useRef<MapRef>(null);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const [popupInfo, setPopupInfo] = useState<PopupInfo | null>(null);
  const [hoveredCountyId, setHoveredCountyId] = useState<string | number | null>(null);
  const [countiesData, setCountiesData] = useState<any>(null);
  const [stateData, setStateData] = useState<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Track hover state for Pape locations (marker + popup)
  const closePopupTimeoutRef = useRef<number | null>(null);

  // Get comparison counties from store
  // Get comparison counties from store
  // Get comparison counties from store
  const { comparisonCounties, heatmapMode, showPapeLocations, showNewHollandLocations, showCaseIHLocations, showKubotaLocations, showKiotiLocations, sortField, regionMode } = useStore();

  // Clustering state
  const [clusters, setClusters] = useState<any[]>([]);
  const [newHollandClusters, setNewHollandClusters] = useState<any[]>([]);
  const [caseIHClusters, setCaseIHClusters] = useState<any[]>([]);
  const [kubotaClusters, setKubotaClusters] = useState<any[]>([]);
  const [kiotiClusters, setKiotiClusters] = useState<any[]>([]);

  // Helper function to offset overlapping locations
  // We shift the location slightly (approx 10-15m) if it overlaps with a higher priority brand
  const offsetLocations = (
    features: any[],
    higherPriorityFeatureLists: any[][]
  ) => {
    // collected occupied coordinates from higher priority lists
    const occupied = new Set<string>();

    higherPriorityFeatureLists.forEach(list => {
      list.forEach(f => {
        const [lon, lat] = f.geometry.coordinates;
        occupied.add(`${lon},${lat}`);
      });
    });

    return features.map(f => {
      const [lon, lat] = f.geometry.coordinates;
      const key = `${lon},${lat}`;

      if (occupied.has(key)) {
        // Offset by ~0.0001 degrees (approx 11 meters)
        // We can shift right/up slightly
        return {
          ...f,
          geometry: {
            ...f.geometry,
            coordinates: [lon + 0.0001, lat + 0.0001]
          }
        };
      }
      return f;
    });
  };

  // Process dealership data with offsets
  // Priority: Pape > New Holland > Case IH > Kubota > Kioti
  const processedPape = papeLocationsData.features;

  const processedNewHolland = useMemo(() =>
    offsetLocations(newHollandLocationsData.features, [processedPape]),
    []);

  const processedCaseIH = useMemo(() =>
    offsetLocations(caseIHLocationsData.features, [processedPape, processedNewHolland]),
    [processedNewHolland]);

  const processedKubota = useMemo(() =>
    offsetLocations(kubotaLocationsData.features, [processedPape, processedNewHolland, processedCaseIH]),
    [processedNewHolland, processedCaseIH]);

  const processedKioti = useMemo(() =>
    offsetLocations(kiotiLocationsData.features, [processedPape, processedNewHolland, processedCaseIH, processedKubota]),
    [processedNewHolland, processedCaseIH, processedKubota]);

  // Initialize Supercluster
  const supercluster = useMemo(() => {
    const index = new Supercluster({
      radius: 5,
      maxZoom: 14,
    });
    index.load(processedPape as any);
    return index;
  }, []);

  const superclusterNewHolland = useMemo(() => {
    const index = new Supercluster({
      radius: 5,
      maxZoom: 14,
    });
    index.load(processedNewHolland as any);
    return index;
  }, [processedNewHolland]);

  const superclusterCaseIH = useMemo(() => {
    const index = new Supercluster({
      radius: 5,
      maxZoom: 14,
    });
    index.load(processedCaseIH as any);
    return index;
  }, [processedCaseIH]);

  const superclusterKubota = useMemo(() => {
    const index = new Supercluster({
      radius: 5,
      maxZoom: 14,
    });
    index.load(processedKubota as any);
    return index;
  }, [processedKubota]);

  const superclusterKioti = useMemo(() => {
    const index = new Supercluster({
      radius: 5,
      maxZoom: 14,
    });
    index.load(processedKioti as any);
    return index;
  }, [processedKioti]);

  // Update clusters when map moves
  const updateClusters = useCallback(() => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();

    const b = map.getBounds();
    const newBounds: [number, number, number, number] = [
      b.getWest(), b.getSouth(), b.getEast(), b.getNorth()
    ];
    const newZoom = map.getZoom();

    try {
      setClusters(supercluster.getClusters(newBounds, Math.floor(newZoom)));
      setNewHollandClusters(superclusterNewHolland.getClusters(newBounds, Math.floor(newZoom)));
      setCaseIHClusters(superclusterCaseIH.getClusters(newBounds, Math.floor(newZoom)));
      setKubotaClusters(superclusterKubota.getClusters(newBounds, Math.floor(newZoom)));
      setKiotiClusters(superclusterKioti.getClusters(newBounds, Math.floor(newZoom)));
    } catch (e) {
      console.error("Error updating clusters", e);
    }
  }, [supercluster, superclusterNewHolland, superclusterCaseIH, superclusterKubota, superclusterKioti]);

  // Initial cluster load 
  useEffect(() => {
    updateClusters();
  }, [updateClusters]);
  // Map Control Handlers
  const handleZoomIn = () => {
    mapRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapRef.current?.zoomOut();
  };

  const handleResetMap = () => {
    mapRef.current?.fitBounds(
      [MAP_BOUNDS.SOUTHWEST, MAP_BOUNDS.NORTHEAST],
      { padding: 20 }
    );
  };

  // Get comparison counties from store
  // Get comparison counties from store - ALREADY IMPORTED ABOVE

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
    // Only return null (show all) if filteredCounties is explicitly undefined (not passed)
    // If it is an empty array (0 matches), we return an empty Set to hide everything
    if (filteredCounties === undefined) {
      return null;
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
    // Load counties
    fetch('/data/counties_expanded.json')
      .then((response) => response.json())
      .then((data) => {
        console.log('Counties GeoJSON loaded:', data);
        setCountiesData(data);
      })
      .catch((err) => {
        console.error('Error loading county boundaries:', err);
      });

    // Load state outlines
    fetch('/data/state_outlines.json')
      .then((response) => response.json())
      .then((data) => {
        console.log('State outlines loaded:', data);
        setStateData(data);
      })
      .catch((err) => {
        console.error('Error loading state outlines:', err);
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
    if (heatmapMode) {
      // Use filteredCounties if available to respect global filters
      // If filteredCounties is empty, it means 0 matches, so heatmap should be empty.
      // We only fallback to counties if filteredCounties is undefined.
      const targetCounties = filteredCounties !== undefined ? filteredCounties : counties;
      const metric = sortField;

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
            let val: number | null = null;

            if (metric.startsWith('internal|') && papeData) {
              // Handle internal data lookup
              const parts = metric.split('|');
              if (parts.length >= 3) {
                const targetCategory = parts[1];
                const targetKey = parts[2];
                const countyId = county.id;
                const items = papeData[countyId];

                if (items && Array.isArray(items)) {
                  const item = items.find((i: any) => i.category === targetCategory);
                  if (item) {
                    const raw = item[targetKey];
                    if (typeof raw === 'number') {
                      val = raw;
                    } else if (typeof raw === 'string') {
                      const clean = raw.replace(/[$,%]/g, '');
                      if (clean && !isNaN(parseFloat(clean))) {
                        val = parseFloat(clean);
                      }
                    }
                  }
                }
              }
            } else {
              // Standard public data lookup
              val = county[metric as keyof EnhancedCountyData] as number | null;
            }

            // Set state
            if (val !== null && val !== undefined && typeof val === 'number' && !isNaN(val)) {
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

  }, [mapLoaded, countiesData, comparisonCountySet, heatmapMode, sortField, counties, filteredCounties]);


  // Update popup when clusters change (handle zoom/pan updates)
  useEffect(() => {
    if (!popupInfo || !mapRef.current) return;
    const map = mapRef.current.getMap();

    // Find the nearest cluster/point in the NEW clusters list to the current popup position
    const currentPoint = map.project([popupInfo.longitude, popupInfo.latitude]);

    let closestFeature = null;
    let minDistance = Infinity;

    // We only check clusters that are rendered (in the clusters array)
    const allActiveClusters = [
      ...(showPapeLocations ? clusters : []),
      ...(showNewHollandLocations ? newHollandClusters : []),
      ...(showCaseIHLocations ? caseIHClusters : []),
      ...(showCaseIHLocations ? caseIHClusters : []),
      ...(showKubotaLocations ? kubotaClusters : []),
      ...(showKiotiLocations ? kiotiClusters : [])
    ];

    for (const feature of allActiveClusters) {
      const [lon, lat] = feature.geometry.coordinates;
      const featurePoint = map.project([lon, lat]);
      const dist = Math.sqrt(
        Math.pow(featurePoint.x - currentPoint.x, 2) +
        Math.pow(featurePoint.y - currentPoint.y, 2)
      );
      if (dist < minDistance) {
        minDistance = dist;
        closestFeature = feature;
      }
    }

    // Threshold: If the closest feature is more than 50px away, assume the cluster decomposed/merged significantly
    if (!closestFeature || minDistance > 50) {
      // Check if the popup is simply off-screen (Supercluster only returns on-screen clusters)
      // If it's off-screen, keep it open (standard map behavior)
      const bounds = map.getBounds();
      if (!bounds.contains([popupInfo.longitude, popupInfo.latitude])) {
        return;
      }

      setPopupInfo(null);
      return;
    }

    // If we found a matching features, update the popup
    const { cluster: isCluster, cluster_id, point_count } = closestFeature.properties;
    const [newLon, newLat] = closestFeature.geometry.coordinates;

    // Strict check: If the point count changed, the cluster composition changed (merged or split) -> Close popup
    // exception: single points don't have point_count, so check for that.
    const currentCount = popupInfo.features.length;
    const newCount = isCluster ? point_count : 1;

    if (currentCount !== newCount) {
      setPopupInfo(null);
      return;
    }

    if (isCluster) {
      // Update with new leaves (position might have shifted slightly)

      // Select appropriate supercluster
      const sampleFeature = popupInfo.features[0];
      let targetSupercluster = supercluster;
      if (sampleFeature?.properties?.type === 'New Holland Dealer') {
        targetSupercluster = superclusterNewHolland;
      } else if (sampleFeature?.properties?.type === 'Case IH Dealer') {
        targetSupercluster = superclusterCaseIH;
      } else if (sampleFeature?.properties?.type === 'Kubota Dealer') {
        targetSupercluster = superclusterKubota;
      } else if (sampleFeature?.properties?.type === 'Kioti Dealer') {
        targetSupercluster = superclusterKioti;
      }

      const leaves = targetSupercluster.getLeaves(cluster_id, 2000);
      setPopupInfo(prev => prev ? ({
        ...prev,
        longitude: newLon,
        latitude: newLat,
        features: leaves
      }) : null);
    } else {
      // It became a single point (or was one), and count matches (1 === 1)
      setPopupInfo(prev => prev ? ({
        ...prev,
        longitude: newLon,
        latitude: newLat,
        features: [closestFeature]
      }) : null);
    }
  }, [clusters, newHollandClusters, caseIHClusters, kubotaClusters, kiotiClusters, supercluster, superclusterNewHolland, superclusterCaseIH, superclusterKubota, superclusterKioti, showPapeLocations, showNewHollandLocations, showCaseIHLocations, showKubotaLocations, showKiotiLocations]);

  // Close popup logic for external clicks (sidebar, menus, etc.)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Close popup if click is NOT inside the popup itself or on a dealership marker.
      // This handles map background, sidebar buttons, modals, etc.
      if (popupInfo && !target.closest('.maplibregl-popup') && !target.closest('.dealership-marker')) {
        setPopupInfo(null);
      }
    };
    // Use capture phase to intercept clicks before they are stopped by other components
    // Changed from 'mousedown' to 'click' to allow map dragging/panning (which starts with mousedown)
    // without immediately closing the popup.
    document.addEventListener('click', handleClickOutside, true);
    return () => document.removeEventListener('click', handleClickOutside, true);
  }, [popupInfo]);

  // Pape Location Hover Handlers

  const handlePapeHoverEnter = (feature: any) => {
    // Cancel any pending close timeout
    if (closePopupTimeoutRef.current) {
      clearTimeout(closePopupTimeoutRef.current);
      closePopupTimeoutRef.current = null;
    }

    // Clear county hover immediately when entering a Pape location
    if (hoveredCountyId !== null) {
      mapRef.current?.getMap().setFeatureState(
        { source: 'counties', id: hoveredCountyId },
        { hover: false }
      );
      setHoveredCountyId(null);
    }
    setHoverInfo(null);

    const [longitude, latitude] = feature.geometry.coordinates;
    let anchor: 'top' | 'bottom' = 'bottom';
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      const point = map.project([longitude, latitude]);
      if (point.y < map.getContainer().clientHeight / 2) {
        anchor = 'top';
      }
    }

    setPopupInfo({
      longitude,
      latitude,
      features: [feature],
      anchor
    });
  };

  const handlePapeHoverLeave = () => {
    // Use a small delay to allow moving from marker to popup
    closePopupTimeoutRef.current = window.setTimeout(() => {
      setPopupInfo(null);
    }, 150);
  };

  const handlePopupMouseEnter = () => {
    // Cancel pending close when entering popup
    if (closePopupTimeoutRef.current) {
      clearTimeout(closePopupTimeoutRef.current);
      closePopupTimeoutRef.current = null;
    }
  };

  const handlePopupMouseLeave = () => {
    // Close popup when leaving
    setPopupInfo(null);
  };

  // Handle hover
  const onMouseMove = (event: MapLayerMouseEvent) => {
    const feature = event.features?.[0];

    // Check if we are hovering over a Papè location or cluster
    const isPapeLocation = feature && (
      feature.layer.id === 'pape-locations-bg' ||
      feature.layer.id === 'pape-locations-symbol' ||
      feature.layer.id === 'clusters' ||
      feature.layer.id === 'cluster-count'
    );

    if (isPapeLocation) {
      // Change cursor to pointer for clickable items
      if (mapRef.current) {
        mapRef.current.getCanvas().style.cursor = 'pointer';
      }
      // Clear county hover if we were hovering a county
      if (hoveredCountyId !== null) {
        mapRef.current?.getMap().setFeatureState(
          { source: 'counties', id: hoveredCountyId },
          { hover: false }
        );
        setHoveredCountyId(null);
        setHoverInfo(null);
      }
      return;
    }

    if (feature && feature.properties && feature.source === 'counties') {
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

      // Only show tooltip if NOT dragging map
      if (!event.originalEvent.buttons) {
        setHoverInfo({
          countyName,
          stateName: stateName ? stateName.charAt(0) + stateName.slice(1).toLowerCase() : '',
          x: event.point.x,
          y: event.point.y,
          countyData,
        });
      }

      // Change cursor
      if (map) {
        map.getCanvas().style.cursor = 'pointer';
      }
    } else {
      // Not hovering anything 
      if (hoveredCountyId !== null) {
        mapRef.current?.getMap().setFeatureState(
          { source: 'counties', id: hoveredCountyId },
          { hover: false }
        );
        setHoveredCountyId(null);
      }
      setHoverInfo(null);
      if (mapRef.current) {
        mapRef.current.getCanvas().style.cursor = '';
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

    // Check if clicked county
    if (feature && feature.source === 'counties' && onCountyClick) {
      const countyName = feature.properties?.NAME || feature.properties?.name;
      const stateFips = feature.properties?.STATEFP;
      const stateName = FIPS_TO_STATE[stateFips as string] || '';
      const countyData = counties.find(
        (c) => c.countyName.toUpperCase() === countyName.toUpperCase() &&
          c.stateName.toUpperCase() === stateName.toUpperCase()
      );
      if (countyData) onCountyClick(countyData);
    }
  };



  // Layer styles - memoized to update when filter changes
  const countyFillLayer = useMemo(() => {
    let fillColorExpression;
    let fillOpacityExpression;

    if (heatmapMode) {
      // Pass the filtered subset to the color generator to ensure the color scale adapts to the visible data range
      const targetCounties = filteredCounties !== undefined ? filteredCounties : counties;

      fillColorExpression = buildHeatmapColorExpression(sortField, targetCounties, papeData);
      fillOpacityExpression = buildFilteredOpacityExpression(filteredCountySet, FIPS_TO_STATE, true);
    } else {
      // If region mode is OFF, we hide the region colors regardless of filter state.
      if (!regionMode) {
        fillColorExpression = 'rgba(0, 0, 0, 0)';
        fillOpacityExpression = 0;
      } else {
        fillColorExpression = buildFilteredColorExpression(filteredCountySet, FIPS_TO_STATE);
        fillOpacityExpression = buildFilteredOpacityExpression(filteredCountySet, FIPS_TO_STATE, false);
      }
    }



    return {
      id: 'counties-fill',
      type: 'fill' as const,
      paint: {
        'fill-color': fillColorExpression as any,
        'fill-opacity': fillOpacityExpression as any,
      },
    };
  }, [filteredCountySet, heatmapMode, sortField, counties, filteredCounties, regionMode, papeData]);

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

  // Helper to get City, State, Zip from address string
  // Expected format: "1906 S. Main St, Moscow, ID 83843"
  const getCityStateFromAddress = (address: string) => {
    if (!address) return { cityState: '', zip: '' };

    const parts = address.split(',');
    if (parts.length >= 3) {
      // Last part is usually " ID 83843" or " State Zip"
      const stateZip = parts[parts.length - 1].trim();
      // Second to last is City
      const city = parts[parts.length - 2].trim();

      // Extract State and Zip
      const stateZipParts = stateZip.split(' ');
      const state = stateZipParts[0];
      const zip = stateZipParts.length > 1 ? stateZipParts[1] : '';

      return {
        city: city,
        state: state,
        zip: zip,
        fullStateZip: stateZip
      };
    }
    return { city: address, state: '', zip: '', fullStateZip: '' };
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
        onMove={updateClusters}
        onZoomEnd={updateClusters}
        onLoad={() => {
          updateClusters(); // Ensure clusters render immediately
          setMapLoaded(true); // Enable heatmap/comparison logic
        }}
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

        {/* State outlines source and layer */}
        {stateData && (
          <Source id="states" type="geojson" data={stateData}>
            <Layer
              id="states-outline"
              type="line"
              paint={{
                'line-color': '#9ca3af',
                'line-width': 1,
              }}
            />
          </Source>
        )}

        {/* CLUSTER MARKERS - Only show if toggle is enabled */}
        {showPapeLocations && clusters.map((cluster) => {
          const [longitude, latitude] = cluster.geometry.coordinates;

          return (
            <Marker
              key={`location-${cluster.id || cluster.properties.name}-${longitude}-${latitude}`}
              longitude={longitude}
              latitude={latitude}
              anchor="center"
            >
              <div
                className="dealership-marker w-2 h-2 rounded-full shadow-sm cursor-pointer hover:scale-150 transition-transform hover:z-50"
                style={{ backgroundColor: DEALERSHIP_BRANDING.PAPE.color }}
                onClick={(e) => e.stopPropagation()}
                onMouseEnter={(e) => {
                  e.stopPropagation();
                  handlePapeHoverEnter(cluster);
                }}
                onMouseLeave={handlePapeHoverLeave}
              />
            </Marker>
          );
        })}

        {/* New Holland MARKERS */}
        {showNewHollandLocations && newHollandClusters.map((cluster) => {
          const [longitude, latitude] = cluster.geometry.coordinates;

          return (
            <Marker
              key={`nh-location-${cluster.id || cluster.properties.name}-${longitude}-${latitude}`}
              longitude={longitude}
              latitude={latitude}
              anchor="center"
            >
              <div
                className="dealership-marker w-2 h-2 rounded-full shadow-sm cursor-pointer hover:scale-150 transition-transform hover:z-50"
                style={{ backgroundColor: DEALERSHIP_BRANDING.NEW_HOLLAND.color }}
                onClick={(e) => e.stopPropagation()}
                onMouseEnter={(e) => {
                  e.stopPropagation();
                  handlePapeHoverEnter(cluster);
                }}
                onMouseLeave={handlePapeHoverLeave}
              />
            </Marker>
          );
        })}

        {/* Case IH MARKERS */}
        {showCaseIHLocations && caseIHClusters.map((cluster) => {
          const [longitude, latitude] = cluster.geometry.coordinates;

          return (
            <Marker
              key={`cih-location-${cluster.id || cluster.properties.name}-${longitude}-${latitude}`}
              longitude={longitude}
              latitude={latitude}
              anchor="center"
            >
              <div
                className="dealership-marker w-2 h-2 rounded-full shadow-sm cursor-pointer hover:scale-150 transition-transform hover:z-50"
                style={{ backgroundColor: DEALERSHIP_BRANDING.CASE_IH.color }}
                onClick={(e) => e.stopPropagation()}
                onMouseEnter={(e) => {
                  e.stopPropagation();
                  handlePapeHoverEnter(cluster);
                }}
                onMouseLeave={handlePapeHoverLeave}
              />
            </Marker>
          );
        })}

        {/* Kubota MARKERS */}
        {showKubotaLocations && kubotaClusters.map((cluster) => {
          const [longitude, latitude] = cluster.geometry.coordinates;

          return (
            <Marker
              key={`kubota-location-${cluster.id || cluster.properties.name}-${longitude}-${latitude}`}
              longitude={longitude}
              latitude={latitude}
              anchor="center"
            >
              <div
                className="dealership-marker w-2 h-2 rounded-full shadow-sm cursor-pointer hover:scale-150 transition-transform hover:z-50"
                style={{ backgroundColor: DEALERSHIP_BRANDING.KUBOTA.color }}
                onClick={(e) => e.stopPropagation()}
                onMouseEnter={(e) => {
                  e.stopPropagation();
                  handlePapeHoverEnter(cluster);
                }}
                onMouseLeave={handlePapeHoverLeave}
              />
            </Marker>
          );
        })}

        {/* Kioti MARKERS */}
        {showKiotiLocations && kiotiClusters.map((cluster) => {
          const [longitude, latitude] = cluster.geometry.coordinates;

          return (
            <Marker
              key={`kioti-location-${cluster.id || cluster.properties.name}-${longitude}-${latitude}`}
              longitude={longitude}
              latitude={latitude}
              anchor="center"
            >
              <div
                className="dealership-marker w-2 h-2 rounded-full shadow-sm cursor-pointer hover:scale-150 transition-transform hover:z-50"
                style={{ backgroundColor: DEALERSHIP_BRANDING.KIOTI.color }}
                onClick={(e) => e.stopPropagation()}
                onMouseEnter={(e) => {
                  e.stopPropagation();
                  handlePapeHoverEnter(cluster);
                }}
                onMouseLeave={handlePapeHoverLeave}
              />
            </Marker>
          );
        })}

        {popupInfo && (
          <Popup
            longitude={popupInfo.longitude}
            latitude={popupInfo.latitude}
            anchor={popupInfo.anchor || 'bottom'}
            onClose={() => setPopupInfo(null)}
            closeOnClick={false}
            closeOnMove={false} // Allow moving map without closing
            className={`pape-popup ${(() => {
              if (popupInfo.features.length === 0) return 'popup-pape';
              const firstFeature = popupInfo.features[0];
              const type = firstFeature.properties.type;

              if (type === 'New Holland Dealer') return 'popup-new-holland';
              if (type === 'Case IH Dealer') return 'popup-case-ih';
              if (type === 'Kubota Dealer') return 'popup-kubota';
              if (type === 'Kioti Dealer') return 'popup-kioti';
              return 'popup-pape';
            })()}`}
            maxWidth="300px"
            offset={20}
          >
            <div
              className="flex flex-col max-h-[300px]"
              onMouseEnter={() => {
                handlePopupMouseEnter();
                setHoverInfo(null);
              }}
              onMouseLeave={handlePopupMouseLeave}
              onMouseMove={(e) => e.stopPropagation()}
            >
              {popupInfo.features.length > 3 && (
                <div className="text-[10px] font-bold text-gray-400 mb-2 sticky top-0 bg-black z-10 pb-0.5 border-b border-gray-800 pr-10 -mt-3">
                  SCROLL TO VIEW MORE LOCATIONS.
                </div>
              )}
              <div
                className="overflow-y-auto pr-1"
                key={`${popupInfo.latitude}-${popupInfo.longitude}`} // Force re-render to reset scroll on location change
              >
                {popupInfo.features.map((feature, index) => {
                  const address = feature.properties.address || '';
                  const { city, state } = getCityStateFromAddress(address);
                  const isNewHolland = feature.properties.type === 'New Holland Dealer';
                  const isCaseIH = feature.properties.type === 'Case IH Dealer';
                  const isKubota = feature.properties.type === 'Kubota Dealer';
                  const isKioti = feature.properties.type === 'Kioti Dealer';

                  let themeColor: string = DEALERSHIP_BRANDING.PAPE.color; // Default Pape
                  if (isNewHolland) themeColor = DEALERSHIP_BRANDING.NEW_HOLLAND.color;
                  if (isCaseIH) themeColor = DEALERSHIP_BRANDING.CASE_IH.color;
                  if (isKubota) themeColor = DEALERSHIP_BRANDING.KUBOTA.color;
                  if (isKioti) themeColor = DEALERSHIP_BRANDING.KIOTI.color;

                  let displayName = 'PAPÉ MACHINERY AGRICULTURE & TURF';
                  if (isNewHolland) displayName = feature.properties.name || 'NEW HOLLAND DEALER';
                  if (isCaseIH) displayName = feature.properties.name || 'CASE IH DEALER';
                  if (isKubota) displayName = feature.properties.name || 'KUBOTA DEALER';
                  if (isKioti) displayName = feature.properties.name || 'KIOTI DEALER';

                  return (
                    <div key={index} className={`flex flex-col gap-1 ${index > 0 ? `mt-4 border-t pt-3` : ''}`} style={{ borderColor: index > 0 ? `${themeColor}4D` : 'transparent' }}>
                      <div className="font-bold text-base leading-tight text-white">
                        {city}, {state}
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-wide leading-tight" style={{ color: themeColor }}>
                        {displayName}
                      </div>
                      <div className="text-sm text-gray-300 leading-tight">
                        {address.split(',')[0]}<br />
                        {city}, {state} {address.split(' ').pop()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <div className="bg-card/95 backdrop-blur-sm border border-border rounded-md shadow-lg flex flex-col overflow-hidden">
          <button
            onClick={handleZoomIn}
            className="p-2 hover:bg-secondary/50 active:bg-secondary transition-colors border-b border-border/50 text-foreground"
            title="Zoom In"
            type="button"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 hover:bg-secondary/50 active:bg-secondary transition-colors text-foreground"
            title="Zoom Out"
            type="button"
          >
            <Minus className="h-4 w-4" />
          </button>
        </div>

        <button
          onClick={handleResetMap}
          className="bg-card/95 backdrop-blur-sm border border-border rounded-md shadow-lg p-2 hover:bg-secondary/50 active:bg-secondary transition-colors text-foreground"
          title="Reset Map View"
          type="button"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {/* Map Legend */}
      {(regionMode || showPapeLocations || showNewHollandLocations || showCaseIHLocations) && <MapLegend />}

      {/* Hover tooltip - ONLY for counties now, hidden when Pape popup is open */}
      {hoverInfo && !popupInfo && (
        <div
          className="absolute bg-card border border-border rounded-md px-3 py-2 shadow-lg pointer-events-none z-[1] min-w-[220px] text-center flex flex-col justify-center items-center"
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
            <div className="space-y-1 border-t border-border pt-2 w-full">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Farms:</span>
                <span className="font-medium">
                  {hoverInfo.countyData.farms != null
                    ? hoverInfo.countyData.farms.toLocaleString()
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Cropland:</span>
                <span className="font-medium">
                  {hoverInfo.countyData.croplandAcres != null
                    ? `${(hoverInfo.countyData.croplandAcres / 1000).toFixed(1)}K ac`
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Market Val:</span>
                <span className="font-medium">
                  {hoverInfo.countyData.marketValueTotalDollars != null
                    ? `$${(hoverInfo.countyData.marketValueTotalDollars / 1000000).toFixed(1)}M`
                    : 'N/A'}
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
