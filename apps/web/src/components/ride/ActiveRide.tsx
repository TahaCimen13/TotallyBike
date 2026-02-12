'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import type { Station } from '@totallybike/shared';
import { PRICING } from '@totallybike/shared';

interface ActiveRideData {
  id: string;
  startTime: string;
  bike: { id: string; qrCode: string; batteryLevel: number };
  startStation: { id: string; name: string };
}

interface Props {
  ride: ActiveRideData;
  stations: Station[];
  onRideEnded: () => void;
}

export default function ActiveRide({ ride, stations, onRideEnded }: Props) {
  const [elapsed, setElapsed] = useState(0);
  const [ending, setEnding] = useState(false);
  const [selectedStation, setSelectedStation] = useState('');

  useEffect(() => {
    const start = new Date(ride.startTime).getTime();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [ride.startTime]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const extraMinutes = Math.max(0, minutes - PRICING.FREE_MINUTES);
  const estimatedCost = PRICING.UNLOCK_FEE + extraMinutes * PRICING.PER_MINUTE_RATE;

  const endRide = async () => {
    if (!selectedStation) return;
    setEnding(true);
    const res = await apiFetch(`/api/rides/${ride.id}/end`, {
      method: 'POST',
      body: JSON.stringify({ stationId: selectedStation }),
    });
    if (res.success) {
      onRideEnded();
    }
    setEnding(false);
  };

  return (
    <div className="card" style={{ background: '#ecfdf5', border: '2px solid var(--primary)' }}>
      <h3 style={{ marginBottom: '0.75rem' }}>Aktif Sürüş</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.875rem', marginBottom: '1rem' }}>
        <div>Bisiklet: <strong>{ride.bike.qrCode}</strong></div>
        <div>Batarya: <strong>{ride.bike.batteryLevel}%</strong></div>
        <div>Başlangıç: <strong>{ride.startStation.name}</strong></div>
        <div>Süre: <strong>{minutes}:{String(seconds).padStart(2, '0')}</strong></div>
      </div>
      <div style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
        Tahmini ücret: <strong>{estimatedCost.toFixed(2)} TL</strong>
        {minutes < PRICING.FREE_MINUTES && (
          <span style={{ color: 'var(--primary)', marginLeft: '0.5rem' }}>
            (Ücretsiz süre: {PRICING.FREE_MINUTES - minutes} dk kaldı)
          </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <select
          className="input"
          value={selectedStation}
          onChange={(e) => setSelectedStation(e.target.value)}
          style={{ flex: 1 }}
        >
          <option value="">İstasyon seç...</option>
          {stations.filter((s) => s.availableDocks > 0).map((s) => (
            <option key={s.id} value={s.id}>{s.name} ({s.availableDocks} dock)</option>
          ))}
        </select>
        <button className="btn btn-danger" onClick={endRide} disabled={!selectedStation || ending}>
          {ending ? 'Bitiriliyor...' : 'Sürüşü Bitir'}
        </button>
      </div>
    </div>
  );
}
