'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import type { Station } from '@totallybike/shared';
import { SOCKET_EVENTS } from '@totallybike/shared';

export function useStations() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStations = useCallback(async () => {
    const res = await apiFetch<Station[]>('/api/stations');
    if (res.success && res.data) {
      setStations(res.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStations();

    const socket = getSocket();
    socket.on(SOCKET_EVENTS.STATION_UPDATE, () => {
      fetchStations();
    });

    return () => {
      socket.off(SOCKET_EVENTS.STATION_UPDATE);
    };
  }, [fetchStations]);

  return { stations, loading, refetch: fetchStations };
}
