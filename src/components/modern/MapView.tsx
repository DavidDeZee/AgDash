import { useRef, useEffect, useState } from 'react';
import Map, { Source, Layer } from 'react-map-gl/maplibre';
import type { MapRef, MapLayerMouseEvent } from 'react-map-gl/maplibre';
import type { EnhancedCountyData } from '../../types/ag';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapViewProps {
  selectedCounty: EnhancedCountyData | null;
  onCountyClick?: (county: EnhancedCountyData) => void;
}

interface HoverInfo {
  countyName: string;
  stateName: string;
  x: number;
  y: number;
}

export function MapView({ selectedCounty }: MapViewProps) {
  const mapRef = useRef<MapRef>(null);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const [hoveredCountyId, setHoveredCountyId] = useState<string | number | null>(null);
  const [countiesData, setCountiesData] = useState<any>(null);

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

      setHoverInfo({
        countyName: feature.properties.NAME || feature.properties.name,
        stateName: feature.properties.STATE_NAME || feature.properties.state,
        x: event.point.x,
        y: event.point.y,
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

  // Layer styles
  const countyFillLayer = {
    id: 'counties-fill',
    type: 'fill' as const,
    paint: {
      'fill-color': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        'hsl(217.2, 91.2%, 59.8%)', // Primary color on hover
        'rgba(0, 0, 0, 0)', // Transparent by default
      ] as any,
      'fill-opacity': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        0.5,
        0,
      ] as any,
    },
  };

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
          className="absolute bg-card border border-border rounded-md px-3 py-2 shadow-lg pointer-events-none z-10"
          style={{
            left: hoverInfo.x + 10,
            top: hoverInfo.y + 10,
          }}
        >
          <div className="font-semibold text-sm">
            {hoverInfo.countyName}
          </div>
          <div className="text-xs text-muted-foreground">
            {hoverInfo.stateName}
          </div>
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