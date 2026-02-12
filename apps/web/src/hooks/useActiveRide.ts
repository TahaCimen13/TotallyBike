'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import type { Ride } from '@totallybike/shared';
import { SOCKET_EVENTS } from '@totallybike/shared';

interface ActiveRideData extends Ride {
  bike: { id: string; qrCode: string; batteryLevel: number };
  startStation: { id: string; name: string };
}

export function useActiveRide() {
  const [ride, setRide] = useState<ActiveRideData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchActiveRide = useCallback(async () => {
    const res = await apiFetch<ActiveRideData>('/api/rides/active');
    if (res.success) {
      setRide(res.data || null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchActiveRide();

    const socket = getSocket();
    socket.on(SOCKET_EVENTS.RIDE_STARTED, fetchActiveRide);
    socket.on(SOCKET_EVENTS.RIDE_ENDED, fetchActiveRide);

    return () => {
      socket.off(SOCKET_EVENTS.RIDE_STARTED);
      socket.off(SOCKET_EVENTS.RIDE_ENDED);
    };
  }, [fetchActiveRide]);

  return { ride, loading, refetch: fetchActiveRide };
}
