export interface Station {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  totalSlots: number;
  availableBikes: number;
  availableDocks: number;
}

export interface Bike {
  id: string;
  stationId: string | null;
  batteryLevel: number;
  status: 'available' | 'in_use' | 'maintenance';
  qrCode: string;
}

export interface Ride {
  id: string;
  userId: string;
  bikeId: string;
  startStationId: string;
  endStationId: string | null;
  startTime: Date;
  endTime: Date | null;
  cost: number;
  status: 'active' | 'completed';
}

export interface User {
  id: string;
  email: string;
  name: string;
  balance: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface TopupRequest {
  amount: number;
}

export interface EndRideRequest {
  stationId: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface StationWithBikes extends Station {
  bikes: Bike[];
}
