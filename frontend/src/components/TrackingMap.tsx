import { useEffect, useMemo, useState } from 'react';
import { divIcon } from 'leaflet';
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet';
import type { Coordinates } from '../lib/types';

type TrackingMapProps = {
  pickupLocation?: Coordinates | null;
  driverLocation?: Coordinates | null;
  history?: Coordinates[];
  heightClassName?: string;
  focusMode?: 'driver' | 'pickup' | 'both';
  showHistory?: boolean;
};

const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629];

function toTuple(coordinates: Coordinates): [number, number] {
  const latitude = Number(coordinates.latitude);
  const longitude = Number(coordinates.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return DEFAULT_CENTER;
  }
  return [latitude, longitude];
}

const driverCarIcon = divIcon({
  html: '<div style="font-size:20px;line-height:20px;">🚗</div>',
  className: '',
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

function MapUpdater({
  pickupLocation,
  driverLocation,
  focusMode
}: {
  pickupLocation?: Coordinates | null;
  driverLocation?: Coordinates | null;
  focusMode: 'driver' | 'pickup' | 'both';
}) {
  const map = useMap();

  useEffect(() => {
    const pickup = pickupLocation ? toTuple(pickupLocation) : null;
    const driver = driverLocation ? toTuple(driverLocation) : null;

    if (focusMode === 'both' && pickup && driver) {
      const bounds: [[number, number], [number, number]] = [pickup, driver];
      if (pickup[0] === driver[0] && pickup[1] === driver[1]) {
        map.setView(driver, map.getZoom());
      } else {
        map.fitBounds(bounds, { padding: [70, 70], maxZoom: 16, animate: true });
      }
      return;
    }

    if (focusMode === 'pickup' && pickup) {
      map.setView(pickup, map.getZoom());
      return;
    }

    if (driver) {
      map.setView(driver, map.getZoom());
      return;
    }

    if (pickup) {
      map.setView(pickup, map.getZoom());
    }
  }, [map, pickupLocation, driverLocation, focusMode]);

  return null;
}

export function TrackingMap({
  pickupLocation,
  driverLocation,
  history = [],
  heightClassName = 'h-80',
  focusMode = 'driver',
  showHistory = true
}: TrackingMapProps) {
  const center = driverLocation ? toTuple(driverLocation) : pickupLocation ? toTuple(pickupLocation) : DEFAULT_CENTER;
  const path = history.map(toTuple);
  const [routedPath, setRoutedPath] = useState<[number, number][]>([]);

  const routeQuery = useMemo(() => {
    if (!pickupLocation || !driverLocation) return null;
    const pickup = toTuple(pickupLocation);
    const driver = toTuple(driverLocation);
    return {
      driver,
      pickup,
      url: `https://router.project-osrm.org/route/v1/driving/${driver[1]},${driver[0]};${pickup[1]},${pickup[0]}?overview=full&geometries=geojson`
    };
  }, [pickupLocation, driverLocation]);

  useEffect(() => {
    let active = true;
    async function loadRoute() {
      if (!routeQuery) {
        setRoutedPath([]);
        return;
      }
      try {
        const response = await fetch(routeQuery.url);
        if (!response.ok) {
          setRoutedPath([]);
          return;
        }
        const data = (await response.json()) as {
          routes?: Array<{ geometry?: { coordinates?: number[][] } }>;
        };
        const coordinates = data.routes?.[0]?.geometry?.coordinates ?? [];
        const nextPath = coordinates
          .map(([lng, lat]) => [lat, lng] as [number, number])
          .filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng));
        if (active) {
          setRoutedPath(nextPath);
        }
      } catch {
        if (active) {
          setRoutedPath([]);
        }
      }
    }
    void loadRoute();
    return () => {
      active = false;
    };
  }, [routeQuery]);

  const fallbackGuidePath = pickupLocation && driverLocation ? [toTuple(driverLocation), toTuple(pickupLocation)] : [];

  if (!pickupLocation && !driverLocation) {
    return (
      <div className={`grid place-items-center rounded-[1.5rem] bg-slate-100 text-sm text-slate-500 ${heightClassName}`}>
        Coordinates will appear here once a pickup is scheduled and tracking begins.
      </div>
    );
  }

  // Wrap in a sized div so that .leaflet-container { height: 100% } (from index.css /
  // leaflet.css) fills the wrapper instead of collapsing to 0 when the parent has no
  // explicit height. Inline style on MapContainer takes priority over class-based rules.
  return (
    <div className={`${heightClassName} overflow-hidden rounded-[1.5rem]`}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater pickupLocation={pickupLocation} driverLocation={driverLocation} focusMode={focusMode} />
        {pickupLocation ? (
          <CircleMarker center={toTuple(pickupLocation)} radius={12} pathOptions={{ color: '#ffffff', weight: 4, fillColor: '#0f172a', fillOpacity: 1 }}>
            <Tooltip permanent direction="top" offset={[0, -12]}>Pickup point</Tooltip>
            <Popup>Citizen pickup point (waste location)</Popup>
          </CircleMarker>
        ) : null}
        {driverLocation ? (
          <Marker position={toTuple(driverLocation)} icon={driverCarIcon}>
            <Popup>Driver live location</Popup>
          </Marker>
        ) : null}
        {routedPath.length > 1 ? <Polyline positions={routedPath} pathOptions={{ color: '#0ea5e9', weight: 5 }} /> : null}
        {routedPath.length <= 1 && fallbackGuidePath.length === 2 ? <Polyline positions={fallbackGuidePath} pathOptions={{ color: '#f59e0b', weight: 4, dashArray: '8 8' }} /> : null}
        {showHistory && path.length > 1 ? <Polyline positions={path} pathOptions={{ color: '#2563eb', weight: 3, opacity: 0.55 }} /> : null}
      </MapContainer>
    </div>
  );
}
