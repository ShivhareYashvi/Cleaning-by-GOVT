import { CircleMarker, MapContainer, Polyline, Popup, TileLayer } from 'react-leaflet';
import type { Coordinates } from '../lib/types';

type TrackingMapProps = {
  pickupLocation?: Coordinates | null;
  driverLocation?: Coordinates | null;
  history?: Coordinates[];
  heightClassName?: string;
};

const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629];

function toTuple(coordinates: Coordinates): [number, number] {
  return [coordinates.latitude, coordinates.longitude];
}

export function TrackingMap({
  pickupLocation,
  driverLocation,
  history = [],
  heightClassName = 'h-80'
}: TrackingMapProps) {
  const center = driverLocation ? toTuple(driverLocation) : pickupLocation ? toTuple(pickupLocation) : DEFAULT_CENTER;
  const path = history.map(toTuple);

  if (!pickupLocation && !driverLocation) {
    return (
      <div className={`grid place-items-center rounded-[1.5rem] bg-slate-100 text-sm text-slate-500 ${heightClassName}`}>
        Coordinates will appear here once a pickup is scheduled and tracking begins.
      </div>
    );
  }

  return (
    <MapContainer key={`${center[0]}-${center[1]}`} center={center} zoom={13} className={`${heightClassName} rounded-[1.5rem]`}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {pickupLocation ? (
        <CircleMarker center={toTuple(pickupLocation)} radius={10} pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.8 }}>
          <Popup>Pickup destination</Popup>
        </CircleMarker>
      ) : null}
      {driverLocation ? (
        <CircleMarker center={toTuple(driverLocation)} radius={10} pathOptions={{ color: '#0f172a', fillColor: '#0f172a', fillOpacity: 0.85 }}>
          <Popup>Driver live location</Popup>
        </CircleMarker>
      ) : null}
      {path.length > 1 ? <Polyline positions={path} pathOptions={{ color: '#2563eb', weight: 4 }} /> : null}
    </MapContainer>
  );
}
