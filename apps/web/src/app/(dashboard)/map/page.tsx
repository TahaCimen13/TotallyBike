'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useStations } from '@/hooks/useStations';
import { useActiveRide } from '@/hooks/useActiveRide';
import ActiveRide from '@/components/ride/ActiveRide';
import StationDetail from '@/components/map/StationDetail';
import type { Station } from '@totallybike/shared';

const StationMap = dynamic(() => import('@/components/map/StationMap'), { ssr: false });

export default function MapPage() {
  const { stations, loading: stationsLoading, refetch: refetchStations } = useStations();
  const { ride, refetch: refetchRide } = useActiveRide();
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

  const handleUnlocked = () => {
    refetchRide();
    refetchStations();
    setSelectedStation(null);
  };

  const handleRideEnded = () => {
    refetchRide();
    refetchStations();
  };

  return (
    <div style={{ flex: 1, display: 'flex', position: 'relative' }}>
      {/* Sidebar */}
      <div style={{ width: '360px', overflowY: 'auto', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        {/* Active Ride */}
        {ride && (
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
            <ActiveRide ride={ride as any} stations={stations} onRideEnded={handleRideEnded} />
          </div>
        )}

        {/* Selected Station Detail or Station List */}
        {selectedStation ? (
          <div style={{ padding: '1rem' }}>
            <StationDetail
              stationId={selectedStation.id}
              onClose={() => setSelectedStation(null)}
              onUnlocked={handleUnlocked}
            />
          </div>
        ) : (
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>İstasyonlar</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {!ride ? 'Bisiklet kiralamak için istasyon seçin' : ''}
              </span>
            </div>
            {stationsLoading ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Yükleniyor...</p>
            ) : (
              stations.map((station) => {
                const ratio = station.totalSlots > 0 ? station.availableBikes / station.totalSlots : 0;
                let statusColor = '#ef4444';
                if (ratio > 0.5) statusColor = '#10b981';
                else if (ratio > 0) statusColor = '#f59e0b';

                return (
                  <div
                    key={station.id}
                    className="card"
                    onClick={() => setSelectedStation(station)}
                    style={{ padding: '0.875rem', cursor: 'pointer', transition: 'box-shadow 0.15s', borderLeft: `4px solid ${statusColor}` }}
                    onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)')}
                    onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
                  >
                    <div style={{ fontWeight: 600, marginBottom: '0.375rem' }}>{station.name}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <span>Bisiklet: <strong style={{ color: statusColor }}>{station.availableBikes}</strong></span>
                      <span>Boş Dock: <strong>{station.availableDocks}</strong></span>
                      <span>Toplam: {station.totalSlots}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Map */}
      <div style={{ flex: 1 }}>
        <StationMap stations={stations} onStationClick={(s) => setSelectedStation(s)} />
      </div>
    </div>
  );
}
