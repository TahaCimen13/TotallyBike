import { Router } from 'express';
import { prisma, io } from '../index';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { PRICING, SOCKET_EVENTS } from '@totallybike/shared';

export const ridesRouter = Router();

ridesRouter.use(authMiddleware);

// Get user's rides
ridesRouter.get('/', async (req: AuthRequest, res, next) => {
  try {
    const rides = await prisma.ride.findMany({
      where: { userId: req.userId },
      include: {
        bike: { select: { qrCode: true } },
        startStation: { select: { name: true } },
        endStation: { select: { name: true } },
      },
      orderBy: { startTime: 'desc' },
    });
    res.json({ success: true, data: rides });
  } catch (err) {
    next(err);
  }
});

// Get active ride
ridesRouter.get('/active', async (req: AuthRequest, res, next) => {
  try {
    const ride = await prisma.ride.findFirst({
      where: { userId: req.userId, status: 'active' },
      include: {
        bike: { select: { id: true, qrCode: true, batteryLevel: true } },
        startStation: { select: { id: true, name: true } },
      },
    });
    res.json({ success: true, data: ride });
  } catch (err) {
    next(err);
  }
});

// Get single ride detail
ridesRouter.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const ride = await prisma.ride.findFirst({
      where: { id: req.params.id as string, userId: req.userId },
      include: {
        bike: { select: { qrCode: true, batteryLevel: true } },
        startStation: { select: { name: true, latitude: true, longitude: true } },
        endStation: { select: { name: true, latitude: true, longitude: true } },
      },
    });
    if (!ride) {
      res.status(404).json({ success: false, error: 'Ride not found' });
      return;
    }
    res.json({ success: true, data: ride });
  } catch (err) {
    next(err);
  }
});

// Cancel active ride (refund unlock fee)
ridesRouter.post('/:id/cancel', async (req: AuthRequest, res, next) => {
  try {
    const ride = await prisma.ride.findFirst({
      where: { id: req.params.id as string, userId: req.userId, status: 'active' },
    });
    if (!ride) {
      res.status(404).json({ success: false, error: 'Aktif sürüş bulunamadı' });
      return;
    }

    const now = new Date();
    const minutes = Math.ceil((now.getTime() - ride.startTime.getTime()) / 60000);
    if (minutes > 2) {
      res.status(400).json({ success: false, error: 'Sürüş başladıktan 2 dakika sonra iptal edilemez' });
      return;
    }

    await prisma.$transaction([
      prisma.ride.update({
        where: { id: ride.id },
        data: { status: 'cancelled', endTime: now },
      }),
      prisma.bike.update({
        where: { id: ride.bikeId },
        data: { status: 'available', stationId: ride.startStationId },
      }),
      prisma.user.update({
        where: { id: req.userId },
        data: { balance: { increment: PRICING.UNLOCK_FEE } },
      }),
    ]);

    io.emit(SOCKET_EVENTS.RIDE_ENDED, { rideId: ride.id });
    io.emit(SOCKET_EVENTS.STATION_UPDATE, { stationId: ride.startStationId });

    res.json({ success: true, data: { refunded: PRICING.UNLOCK_FEE } });
  } catch (err) {
    next(err);
  }
});

// End ride
ridesRouter.post('/:id/end', async (req: AuthRequest, res, next) => {
  try {
    const { stationId } = req.body;
    if (!stationId) {
      res.status(400).json({ success: false, error: 'Station ID required' });
      return;
    }

    const ride = await prisma.ride.findFirst({
      where: { id: req.params.id as string, userId: req.userId, status: 'active' },
    });
    if (!ride) {
      res.status(404).json({ success: false, error: 'Active ride not found' });
      return;
    }

    const station = await prisma.station.findUnique({
      where: { id: stationId },
      include: { bikes: { where: { status: { in: ['available', 'maintenance'] } } } },
    });
    if (!station) {
      res.status(404).json({ success: false, error: 'Station not found' });
      return;
    }
    if (station.bikes.length >= station.totalSlots) {
      res.status(400).json({ success: false, error: 'İstasyon dolu' });
      return;
    }

    const now = new Date();
    const minutes = Math.ceil((now.getTime() - ride.startTime.getTime()) / 60000);
    const extraMinutes = Math.max(0, minutes - PRICING.FREE_MINUTES);
    const totalCost = PRICING.UNLOCK_FEE + extraMinutes * PRICING.PER_MINUTE_RATE;
    const additionalCost = totalCost - ride.cost;

    const [updatedRide] = await prisma.$transaction([
      prisma.ride.update({
        where: { id: ride.id },
        data: { endStationId: stationId, endTime: now, cost: totalCost, status: 'completed' },
      }),
      prisma.bike.update({
        where: { id: ride.bikeId },
        data: { status: 'available', stationId },
      }),
      ...(additionalCost > 0
        ? [prisma.user.update({
            where: { id: req.userId },
            data: { balance: { decrement: additionalCost } },
          })]
        : []),
    ]);

    io.emit(SOCKET_EVENTS.RIDE_ENDED, { rideId: ride.id });
    io.emit(SOCKET_EVENTS.STATION_UPDATE, { stationId });
    io.emit(SOCKET_EVENTS.STATION_UPDATE, { stationId: ride.startStationId });

    res.json({ success: true, data: updatedRide });
  } catch (err) {
    next(err);
  }
});
