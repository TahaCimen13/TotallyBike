'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface RideData {
  id: string;
  startTime: string;
  endTime: string | null;
  cost: number;
  status: string;
  bike: { qrCode: string };
  startStation: { name: string };
  endStation: { name: string } | null;
}

export default function RidesPage() {
  const [rides, setRides] = useState<RideData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<RideData[]>('/api/rides').then((res) => {
      if (res.success && res.data) setRides(res.data);
      setLoading(false);
    });
  }, []);

  const formatDuration = (start: string, end: string | null) => {
    if (!end) return 'Devam ediyor';
    const ms = new Date(end).getTime() - new Date(start).getTime();
    const mins = Math.floor(ms / 60000);
    return `${mins} dk`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Sürüş Geçmişi</h1>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Yükleniyor...</p>
      ) : rides.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          Henüz sürüş yapmadınız.
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem', fontSize: '0.875rem' }}>Tarih</th>
              <th style={{ padding: '0.75rem', fontSize: '0.875rem' }}>Bisiklet</th>
              <th style={{ padding: '0.75rem', fontSize: '0.875rem' }}>Güzergah</th>
              <th style={{ padding: '0.75rem', fontSize: '0.875rem' }}>Süre</th>
              <th style={{ padding: '0.75rem', fontSize: '0.875rem' }}>Ücret</th>
              <th style={{ padding: '0.75rem', fontSize: '0.875rem' }}>Durum</th>
            </tr>
          </thead>
          <tbody>
            {rides.map((ride) => (
              <tr key={ride.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>{formatDate(ride.startTime)}</td>
                <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>{ride.bike.qrCode}</td>
                <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                  {ride.startStation.name} → {ride.endStation?.name || '...'}
                </td>
                <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>{formatDuration(ride.startTime, ride.endTime)}</td>
                <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontWeight: 600 }}>{ride.cost.toFixed(2)} TL</td>
                <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    background: ride.status === 'active' ? '#dbeafe' : '#dcfce7',
                    color: ride.status === 'active' ? '#1d4ed8' : '#15803d',
                  }}>
                    {ride.status === 'active' ? 'Aktif' : 'Tamamlandı'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
