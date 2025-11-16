import { useRef, useEffect, useState, useMemo } from 'react';
import Map, { Source, Layer } from 'react-map-gl/maplibre';
import type { MapRef, MapLayerMouseEvent } from 'react-map-gl/maplibre';
import type { EnhancedCountyData } from '../../types/ag';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapViewProps {
  selectedCounty: EnhancedCountyData | null;
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
};

// County color mapping by region
const COUNTY_COLORS: Record<string, { color: string; opacity: number }> = {
  // Purple
  'Whatcom': { color: 'hsl(270, 70%, 50%)', opacity: 0.4 },
  'Skagit': { color: 'hsl(270, 70%, 50%)', opacity: 0.4 },
  'San Juan': { color: 'hsl(270, 70%, 50%)', opacity: 0.4 },
  'Clallam': { color: 'hsl(270, 70%, 50%)', opacity: 0.4 },
  'Island': { color: 'hsl(270, 70%, 50%)', opacity: 0.4 },
  'Jefferson': { color: 'hsl(270, 70%, 50%)', opacity: 0.4 },
  'Snohomish': { color: 'hsl(270, 70%, 50%)', opacity: 0.4 },
  'Kitsap': { color: 'hsl(270, 70%, 50%)', opacity: 0.4 },
  'Skamania': { color: 'hsl(270, 70%, 50%)', opacity: 0.4 },
  'Lewis': { color: 'hsl(270, 70%, 50%)', opacity: 0.4 },
  'Pacific': { color: 'hsl(270, 70%, 50%)', opacity: 0.4 },
  'Grays Harbor': { color: 'hsl(270, 70%, 50%)', opacity: 0.4 },
  'Mason': { color: 'hsl(270, 70%, 50%)', opacity: 0.4 },
  'King': { color: 'hsl(270, 70%, 50%)', opacity: 0.4 },
  'Thurston': { color: 'hsl(270, 70%, 50%)', opacity: 0.4 },
  'Pierce': { color: 'hsl(270, 70%, 50%)', opacity: 0.4 },
  '': { color: 'hsl(270, 70%, 50%)', opacity: 0.4 },
  '': { color: 'hsl(270, 70%, 50%)', opacity: 0.4 },
  
  // Blue
  'Okanogan': { color: 'hsl(217, 91%, 60%)', opacity: 0.4 },
  'Chelan': { color: 'hsl(217, 91%, 60%)', opacity: 0.4 },
  'Douglas': { color: 'hsl(217, 91%, 60%)', opacity: 0.4 }, // WA - may need state check
  'Grant': { color: 'hsl(217, 91%, 60%)', opacity: 0.4 },
  'Kittitas': { color: 'hsl(217, 91%, 60%)', opacity: 0.4 },
  'Yakima': { color: 'hsl(217, 91%, 60%)', opacity: 0.4 },
  'Ferry': { color: 'hsl(217, 91%, 60%)', opacity: 0.4 },
  'Stevens': { color: 'hsl(217, 91%, 60%)', opacity: 0.4 },
  'Lincoln': { color: 'hsl(217, 91%, 60%)', opacity: 0.4 },
  'Spokane': { color: 'hsl(217, 91%, 60%)', opacity: 0.4 },
  'Pend Oreille': { color: 'hsl(217, 91%, 60%)', opacity: 0.4 },
  'Whitman': { color: 'hsl(217, 91%, 60%)', opacity: 0.4 },
  'Garfield': { color: 'hsl(217, 91%, 60%)', opacity: 0.4 },
  'Asotin': { color: 'hsl(217, 91%, 60%)', opacity: 0.4 },
  'Columbia': { color: 'hsl(217, 91%, 60%)', opacity: 0.4 },
  'Walla Walla': { color: 'hsl(217, 91%, 60%)', opacity: 0.4 },
  'Umatilla': { color: 'hsl(217, 91%, 60%)', opacity: 0.4 },
  
  // Yellow
  'Clatsop': { color: 'hsl(48, 96%, 53%)', opacity: 0.4 },
  'Tillamook': { color: 'hsl(48, 96%, 53%)', opacity: 0.4 },
  'Multnomah': { color: 'hsl(48, 96%, 53%)', opacity: 0.4 },
  'Wahkiakum': { color: 'hsl(48, 96%, 53%)', opacity: 0.4 },
  'Cowlitz': { color: 'hsl(48, 96%, 53%)', opacity: 0.4 },
  'Clark': { color: 'hsl(48, 96%, 53%)', opacity: 0.4 },
  'Yamhill': { color: 'hsl(48, 96%, 53%)', opacity: 0.4 },
  'Washington': { color: 'hsl(48, 96%, 53%)', opacity: 0.4 },
  'Hood River': { color: 'hsl(48, 96%, 53%)', opacity: 0.4 },
  'Clackamas': { color: 'hsl(48, 96%, 53%)', opacity: 0.4 },
  'Marion': { color: 'hsl(48, 96%, 53%)', opacity: 0.4 },
  'Polk': { color: 'hsl(48, 96%, 53%)', opacity: 0.4 },
  '': { color: 'hsl(48, 96%, 53%)', opacity: 0.4 },



  // Green
  'Lane': { color: 'hsl(142, 76%, 36%)', opacity: 0.4 },
  'Klamath': { color: 'hsl(142, 76%, 36%)', opacity: 0.4 },
  'Wasco': { color: 'hsl(142, 76%, 36%)', opacity: 0.4 },
  'Wheeler': { color: 'hsl(142, 76%, 36%)', opacity: 0.4 },
  'Crook': { color: 'hsl(142, 76%, 36%)', opacity: 0.4 },
  'Linn': { color: 'hsl(142, 76%, 36%)', opacity: 0.4 },
  'Deschutes': { color: 'hsl(142, 76%, 36%)', opacity: 0.4 },
  'Benton': { color: 'hsl(142, 76%, 36%)', opacity: 0.4 },
  'Lake': { color: 'hsl(142, 76%, 36%)', opacity: 0.4 },
  'Harney': { color: 'hsl(142, 76%, 36%)', opacity: 0.4 },
  'Jackson': { color: 'hsl(142, 76%, 36%)', opacity: 0.4 },
  'Josephine': { color: 'hsl(142, 76%, 36%)', opacity: 0.4 },
  'Curry': { color: 'hsl(142, 76%, 36%)', opacity: 0.4 },
  'Coos': { color: 'hsl(142, 76%, 36%)', opacity: 0.4 },
  'Siskiyou': { color: 'hsl(142, 76%, 36%)', opacity: 0.4 },
  'Modoc': { color: 'hsl(142, 76%, 36%)', opacity: 0.4 },


  
  // Orange
  'Del Norte': { color: 'hsl(25, 95%, 53%)', opacity: 0.4 },
  'Humboldt': { color: 'hsl(25, 95%, 53%)', opacity: 0.4 }, // CA - may need state check
  'Trinity': { color: 'hsl(25, 95%, 53%)', opacity: 0.4 },
  'Shasta': { color: 'hsl(25, 95%, 53%)', opacity: 0.4 },
  'Lassen': { color: 'hsl(25, 95%, 53%)', opacity: 0.4 },
  'Tehama': { color: 'hsl(25, 95%, 53%)', opacity: 0.4 },
  'Plumas': { color: 'hsl(25, 95%, 53%)', opacity: 0.4 },
  'Glenn': { color: 'hsl(25, 95%, 53%)', opacity: 0.4 },
  'Colusa': { color: 'hsl(25, 95%, 53%)', opacity: 0.4 },
  'Butte': { color: 'hsl(25, 95%, 53%)', opacity: 0.4 },
  'Sierra': { color: 'hsl(25, 95%, 53%)', opacity: 0.4 },
  'Nevada': { color: 'hsl(25, 95%, 53%)', opacity: 0.4 },
  'Yuba': { color: 'hsl(25, 95%, 53%)', opacity: 0.4 },

  





  
  // Light Blue
  'Washoe': { color: 'hsl(195, 70%, 60%)', opacity: 0.4 },
  'Pershing': { color: 'hsl(195, 70%, 60%)', opacity: 0.4 },
  'Churchill': { color: 'hsl(195, 70%, 60%)', opacity: 0.4 },
  'Lander': { color: 'hsl(195, 70%, 60%)', opacity: 0.4 },
  'Eureka': { color: 'hsl(195, 70%, 60%)', opacity: 0.4 },
  'Storey': { color: 'hsl(195, 70%, 60%)', opacity: 0.4 },
  'Lyon': { color: 'hsl(195, 70%, 60%)', opacity: 0.4 },
  'Carson City': { color: 'hsl(195, 70%, 60%)', opacity: 0.4 },
  'Douglas': { color: 'hsl(195, 70%, 60%)', opacity: 0.4 },
  'Humboldt': { color: 'hsl(195, 70%, 60%)', opacity: 0.4 },
  'Nye': { color: 'hsl(195, 70%, 60%)', opacity: 0.4 },
  'Mineral': { color: 'hsl(195, 70%, 60%)', opacity: 0.4 },
  'Esmeralda': { color: 'hsl(195, 70%, 60%)', opacity: 0.4 },
  'Mono': { color: 'hsl(195, 70%, 60%)', opacity: 0.4 },
  'Alpine': { color: 'hsl(195, 70%, 60%)', opacity: 0.4 },
  'Tuolumne': { color: 'hsl(195, 70%, 60%)', opacity: 0.4 },
  'El Dorado': { color: 'hsl(195, 70%, 60%)', opacity: 0.4 },
  'Placer': { color: 'hsl(195, 70%, 60%)', opacity: 0.4 },
  'Sutter': { color: 'hsl(195, 70%, 60%)', opacity: 0.4 },
  'Yolo': { color: 'hsl(195, 70%, 60%)', opacity: 0.4 },
  'Sacramento': { color: 'hsl(195, 70%, 60%)', opacity: 0.4 },
  'Solano': { color: 'hsl(195, 70%, 60%)', opacity: 0.4 },
  'Contra Costa': { color: 'hsl(195, 70%, 60%)', opacity: 0.4 },
  '': { color: 'hsl(195, 70%, 60%)', opacity: 0.4 },






  // Note: Humboldt (NV) would conflict with Humboldt (CA) - add state check if needed
};




// Build MapLibre expression for fill-color
function buildColorExpression() {
  const cases: any[] = [];
  Object.entries(COUNTY_COLORS).forEach(([county, { color }]) => {
    cases.push(['==', ['get', 'NAME'], county], color);
  });
  cases.push('rgba(0, 0, 0, 0)'); // Default transparent
  return ['case', ...cases];
}

// Build MapLibre expression for fill-opacity
function buildOpacityExpression() {
  const cases: any[] = [];
  Object.entries(COUNTY_COLORS).forEach(([county, { opacity }]) => {
    cases.push(['==', ['get', 'NAME'], county], opacity);
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
  Object.entries(COUNTY_COLORS).forEach(([county, { color }]) => {
    // Check each state to see if this county+state combo is in the filtered set
    const stateConditions: any[] = [];

    Object.entries(fipsToState).forEach(([stateFips, stateName]) => {
      const key = `${county.toUpperCase()}|${stateName.toUpperCase()}`;
      if (filteredSet.has(key)) {
        // Add condition: county name matches AND state FIPS matches
        stateConditions.push([
          'all',
          ['==', ['get', 'NAME'], county],
          ['==', ['get', 'STATEFP'], stateFips],
        ]);
      }
    });

    // If any state matches for this county, add to cases
    if (stateConditions.length > 0) {
      if (stateConditions.length === 1) {
        cases.push(stateConditions[0], color);
      } else {
        // Multiple states have this county in the filter
        cases.push(['any', ...stateConditions], color);
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
  fipsToState: Record<string, string>
) {
  if (!filteredSet) {
    // No filter active - show all counties with their original opacity
    return buildOpacityExpression();
  }

  // Filter is active - show only filtered counties
  const cases: any[] = [];

  Object.entries(COUNTY_COLORS).forEach(([county, { opacity }]) => {
    const stateConditions: any[] = [];

    Object.entries(fipsToState).forEach(([stateFips, stateName]) => {
      const key = `${county.toUpperCase()}|${stateName.toUpperCase()}`;
      if (filteredSet.has(key)) {
        stateConditions.push([
          'all',
          ['==', ['get', 'NAME'], county],
          ['==', ['get', 'STATEFP'], stateFips],
        ]);
      }
    });

    if (stateConditions.length > 0) {
      if (stateConditions.length === 1) {
        cases.push(stateConditions[0], opacity * 1.5); // Make filtered counties more prominent
      } else {
        cases.push(['any', ...stateConditions], opacity * 1.5);
      }
    }
  });

  // Default: transparent for non-filtered counties
  cases.push(0);
  return ['case', ...cases];
}

export function MapView({ selectedCounty, counties = [], filteredCounties }: MapViewProps) {
  const mapRef = useRef<MapRef>(null);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const [hoveredCountyId, setHoveredCountyId] = useState<string | number | null>(null);
  const [countiesData, setCountiesData] = useState<any>(null);

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
    fetch('/data/tl_2023_us_county.json')
      .then((response) => response.json())
      .then((data) => {
        console.log('Counties GeoJSON loaded:', data);
        setCountiesData(data);
      })
      .catch((err) => {
        console.error('Error loading county boundaries:', err);
      });

  }, []);

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
    if (feature && feature.properties) {
      const countyName = feature.properties.NAME || feature.properties.name;
      const stateName = feature.properties.STATE_NAME || feature.properties.state;
      console.log('Clicked county:', countyName, stateName);
    }
  };

  // Layer styles - memoized to update when filter changes
  const countyFillLayer = useMemo(() => ({
    id: 'counties-fill',
    type: 'fill' as const,
    paint: {
      'fill-color': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        'hsl(48, 100%, 50%)', // Yellow on hover
        buildFilteredColorExpression(filteredCountySet, FIPS_TO_STATE),
      ] as any,
      'fill-opacity': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        0.7, // More opaque on hover
        buildFilteredOpacityExpression(filteredCountySet, FIPS_TO_STATE),
      ] as any,
    },
  }), [filteredCountySet]);

  const countyOutlineLayer = {
    id: 'counties-outline',
    type: 'line' as const,
    paint: {
      'line-color': '#6b7280', // Gray color
      'line-width': 1,
      'line-dasharray': [3, 2],
      'line-opacity': 0.6,
    },
  };


  useEffect(() => {
    if (selectedCounty && mapRef.current) {
      // Center map on selected county (would need geocoding in production)
    }
  }, [selectedCounty]);

  return (
    <div className="h-full w-full relative">
      <Map
        ref={mapRef}
        initialViewState={{
          latitude: 43.5,
          longitude: -120.5,
          zoom: 5.5,
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        interactiveLayerIds={['counties-fill', 'counties-outline']}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
      >
        {/* Counties source and layers */}
        {countiesData && (
          <Source id="counties" type="geojson" data={countiesData} generateId={true}>
            <Layer {...countyFillLayer} />
            <Layer {...countyOutlineLayer} />
          </Source>
        )}

       
      </Map>

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
                <span className="font-medium">{hoverInfo.countyData.farms.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Cropland:</span>
                <span className="font-medium">
                  {(hoverInfo.countyData.croplandAcres / 1000).toFixed(1)}K ac
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Irrigated:</span>
                <span className="font-medium">
                  {(hoverInfo.countyData.irrigatedAcres / 1000).toFixed(1)}K ac
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Land in Farms:</span>
                <span className="font-medium">
                  {(hoverInfo.countyData.landInFarmsAcres / 1000).toFixed(1)}K ac
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

      {/* Selected county info */}
      {selectedCounty && (
        <div className="absolute bottom-6 left-6 bg-card border border-border rounded-lg p-4 shadow-lg max-w-sm animate-fade-in">
          <h3 className="font-semibold text-lg mb-2">
            {selectedCounty.countyName}, {selectedCounty.stateName}
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-muted-foreground">Farms</div>
              <div className="font-medium">{selectedCounty.farms.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Cropland</div>
              <div className="font-medium">
                {(selectedCounty.croplandAcres / 1000).toFixed(1)}K ac
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}