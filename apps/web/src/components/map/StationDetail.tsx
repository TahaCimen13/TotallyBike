'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Station, Bike } from '@totallybike/shared';

interface StationWithBikes extends Station {
  bikes: Bike[];
}

interface Props {
  stationId: string;
  onClose: () => void;
  onUnlocked: () => void;
}

export default function StationDetail({ stationId, onClose, onUnlocked }: Props) {
  const [station, setStation] = useState<StationWithBikes | null>(null);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    apiFetch<StationWithBikes>(`/api/stations/${stationId}`).then((res) => {
      if (res.success && res.data) setStation(res.data);
      setLoading(false);
    });
  }, [stationId]);

  const unlockBike = async (bikeId: string) => {
    setUnlocking(bikeId);
    setError('');
    const res = await apiFetch(`/api/bikes/${bikeId}/unlock`, { method: 'POST' });
    if (res.success) {
      onUnlocked();
      onClose();
    } else {
      setError(res.error || 'Kilit açılamadı');
    }
    setUnlocking(null);
  };

  if (loading) {
    return (
      <div className="card">
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Yükleniyor...</p>
      </div>
    );
  }

  if (!station) return null;

  const availableBikes = station.bikes.filter((b) => b.status === 'available');
  const otherBikes = station.bikes.filter((b) => b.status !== 'available');

  return (
    <div className="card" style={{ position: 'relative' }}>
      <button
        onClick={onClose}
        style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--text-muted)' }}
      >
        ✕
      </button>

      <h3 style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>{station.name}</h3>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
        <span>Bisiklet: <strong style={{ color: 'var(--text)' }}>{station.availableBikes}</strong></span>
        <span>Dock: <strong style={{ color: 'var(--text)' }}>{station.availableDocks}</strong></span>
        <span>Toplam: <strong style={{ color: 'var(--text)' }}>{station.totalSlots}</strong></span>
      </div>

      {error && (
        <div style={{ padding: '0.5rem 0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.375rem', color: 'var(--danger)', marginBottom: '0.75rem', fontSize: '0.8rem' }}>
          {error}
        </div>
      )}

      {availableBikes.length > 0 ? (
        <>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Müsait Bisikletler</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {availableBikes.map((bike) => (
              <div
                key={bike.id}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0.75rem', background: '#f0fdf4', borderRadius: '0.5rem', border: '1px solid #bbf7d0' }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{bike.qrCode}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Batarya: {bike.batteryLevel}%
                    <span style={{
                      display: 'inline-block',
                      width: '2rem',
                      height: '0.375rem',
                      background: '#e5e7eb',
                      borderRadius: '1rem',
                      marginLeft: '0.375rem',
                      verticalAlign: 'middle',
                      position: 'relative',
                      overflow: 'hidden',
                    }}>
                      <span style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${bike.batteryLevel}%`,
                        background: bike.batteryLevel > 30 ? '#10b981' : '#f59e0b',
                        borderRadius: '1rem',
                      }} />
                    </span>
                  </div>
                </div>
                <button
                  className="btn btn-primary"
                  style={{ padding: '0.375rem 1rem', fontSize: '0.8rem' }}
                  onClick={() => unlockBike(bike.id)}
                  disabled={unlocking === bike.id}
                >
                  {unlocking === bike.id ? 'Açılıyor...' : 'Kirala (5 TL)'}
                </button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '1rem 0' }}>
          Bu istasyonda müsait bisiklet yok.
        </p>
      )}

      {otherBikes.length > 0 && (
        <>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, marginTop: '1rem', marginBottom: '0.5rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Diğer Bisikletler</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {otherBikes.map((bike) => (
              <div
                key={bike.id}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: '#f9fafb', borderRadius: '0.375rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}
              >
                <span>{bike.qrCode}</span>
                <span style={{
                  padding: '0.125rem 0.5rem',
                  borderRadius: '0.25rem',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  background: bike.status === 'in_use' ? '#dbeafe' : '#fef3c7',
                  color: bike.status === 'in_use' ? '#1d4ed8' : '#92400e',
                }}>
                  {bike.status === 'in_use' ? 'Kullanımda' : 'Bakımda'}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
