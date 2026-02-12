'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';
import type { Station } from '@totallybike/shared';

import 'leaflet/dist/leaflet.css';

function createStationIcon(availableBikes: number, totalSlots: number) {
  const ratio = totalSlots > 0 ? availableBikes / totalSlots : 0;
  let color = '#ef4444'; // red
  if (ratio > 0.5) color = '#10b981'; // green
  else if (ratio > 0) color = '#f59e0b'; // orange

  return L.divIcon({
    className: '',
    html: `<div style="background:${color};color:white;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)">${availableBikes}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

function MapCenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 16);
  }, [map, lat, lng]);
  return null;
}

interface Props {
  stations: Station[];
  onStationClick?: (station: Station) => void;
}

export default function StationMap({ stations, onStationClick }: Props) {
  const center = stations.length > 0
    ? { lat: stations[0].latitude, lng: stations[0].longitude }
    : { lat: 41.0840, lng: 29.0510 };

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={16}
      style={{ width: '100%', height: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapCenter lat={center.lat} lng={center.lng} />
      {stations.map((station) => (
        <Marker
          key={station.id}
          position={[station.latitude, station.longitude]}
          icon={createStationIcon(station.availableBikes, station.totalSlots)}
          eventHandlers={{
            click: () => onStationClick?.(station),
          }}
        >
          <Popup>
            <div style={{ minWidth: '180px' }}>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem' }}>{station.name}</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span>Bisiklet: <strong>{station.availableBikes}</strong></span>
                <span>Dock: <strong>{station.availableDocks}</strong></span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                Toplam: {station.totalSlots} slot
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
