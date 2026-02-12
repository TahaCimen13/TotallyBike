export const PRICING = {
  UNLOCK_FEE: 5.0,
  FREE_MINUTES: 15,
  PER_MINUTE_RATE: 0.50,
  CURRENCY: 'TL',
} as const;

export const BIKE_STATUS = {
  AVAILABLE: 'available',
  IN_USE: 'in_use',
  MAINTENANCE: 'maintenance',
} as const;

export const RIDE_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
} as const;

export const SOCKET_EVENTS = {
  STATION_UPDATE: 'station:update',
  RIDE_STARTED: 'ride:started',
  RIDE_ENDED: 'ride:ended',
} as const;
