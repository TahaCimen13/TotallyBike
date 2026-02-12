'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';

interface BikeInfo {
  id: string;
  qrCode: string;
  batteryLevel: number;
  status: string;
  station: { id: string; name: string } | null;
}

interface Props {
  onUnlocked: () => void;
}

export default function QRScanner({ onUnlocked }: Props) {
  const [qrCode, setQrCode] = useState('');
  const [bike, setBike] = useState<BikeInfo | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const searchBike = async () => {
    if (!qrCode.trim()) return;
    setError('');
    setBike(null);
    setLoading(true);

    const res = await apiFetch<BikeInfo>(`/api/bikes/${qrCode.trim()}`);
    if (res.success && res.data) {
      setBike(res.data);
    } else {
      setError(res.error || 'Bisiklet bulunamadı');
    }
    setLoading(false);
  };

  const unlockBike = async () => {
    if (!bike) return;
    setLoading(true);
    setError('');

    const res = await apiFetch(`/api/bikes/${bike.id}/unlock`, { method: 'POST' });
    if (res.success) {
      setBike(null);
      setQrCode('');
      onUnlocked();
    } else {
      setError(res.error || 'Kilit açılamadı');
    }
    setLoading(false);
  };

  return (
    <div className="card">
      <h3 style={{ marginBottom: '0.75rem' }}>Bisiklet Kirala</h3>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
        QR kodu girerek bisiklet kiralayabilirsiniz
      </p>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input
          className="input"
          placeholder="QR kod (ör: KUZEY-BIKE-001)"
          value={qrCode}
          onChange={(e) => setQrCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && searchBike()}
        />
        <button className="btn btn-primary" onClick={searchBike} disabled={loading}>
          Ara
        </button>
      </div>

      {error && (
        <div style={{ padding: '0.75rem', background: '#fef2f2', borderRadius: '0.5rem', color: 'var(--danger)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
          {error}
        </div>
      )}

      {bike && (
        <div style={{ padding: '1rem', background: '#f0fdf4', borderRadius: '0.5rem' }}>
          <div style={{ fontSize: '0.875rem', marginBottom: '0.75rem' }}>
            <div>Bisiklet: <strong>{bike.qrCode}</strong></div>
            <div>Batarya: <strong>{bike.batteryLevel}%</strong></div>
            <div>Durum: <strong>{bike.status === 'available' ? 'Müsait' : bike.status === 'in_use' ? 'Kullanımda' : 'Bakımda'}</strong></div>
            {bike.station && <div>İstasyon: <strong>{bike.station.name}</strong></div>}
          </div>
          {bike.status === 'available' ? (
            <button className="btn btn-primary" onClick={unlockBike} disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Kilit açılıyor...' : 'Kilidi Aç (5.00 TL)'}
            </button>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Bu bisiklet şu anda müsait değil.</p>
          )}
        </div>
      )}
    </div>
  );
}
