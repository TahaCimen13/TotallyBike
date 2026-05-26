import { Router } from 'express';
import { prisma, io } from '../index';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { PRICING, SOCKET_EVENTS } from '@totallybike/shared';
import { publishUnlock } from '../lib/mqtt';

export const bikesRouter = Router();

// Get bike by QR code
bikesRouter.get('/:qrCode', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const qrCode = req.params.qrCode as string;
    const bike = await prisma.bike.findUnique({
      where: { qrCode },
      include: { station: true },
    });

    if (!bike) {
      res.status(404).json({ success: false, error: 'Bike not found' });
      return;
    }

    const stationData = bike.station
      ? { id: bike.station.id, name: bike.station.name }
      : null;

    res.json({
      success: true,
      data: {
        id: bike.id,
        qrCode: bike.qrCode,
        batteryLevel: bike.batteryLevel,
        status: bike.status,
        stationId: bike.stationId,
        station: stationData,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Unlock bike (start ride)
bikesRouter.post('/:id/unlock', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const bikeId = req.params.id as string;
    const bike = await prisma.bike.findUnique({ where: { id: bikeId } });
    if (!bike) {
      res.status(404).json({ success: false, error: 'Bike not found' });
      return;
    }
    if (bike.status !== 'available') {
      res.status(400).json({ success: false, error: 'Bike is not available' });
      return;
    }
    if (!bike.stationId) {
      res.status(400).json({ success: false, error: 'Bike is not at a station' });
      return;
    }

    // Check user balance
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || user.balance < PRICING.UNLOCK_FEE) {
      res.status(400).json({ success: false, error: 'Insufficient balance' });
      return;
    }

    // Check if user already has an active ride
    const activeRide = await prisma.ride.findFirst({
      where: { userId: req.userId, status: 'active' },
    });
    if (activeRide) {
      res.status(400).json({ success: false, error: 'You already have an active ride' });
      return;
    }

    const stationId = bike.stationId;

    // Start transaction
    const [ride] = await prisma.$transaction([
      prisma.ride.create({
        data: {
          userId: req.userId!,
          bikeId: bike.id,
          startStationId: stationId,
          cost: PRICING.UNLOCK_FEE,
          status: 'active',
        },
      }),
      prisma.bike.update({
        where: { id: bike.id },
        data: { status: 'in_use', stationId: null },
      }),
      prisma.user.update({
        where: { id: req.userId },
        data: { balance: { decrement: PRICING.UNLOCK_FEE } },
      }),
    ]);

    const stationForUnlock = await prisma.station.findUnique({
      where: { id: stationId },
    });
    if (stationForUnlock?.dockId) {
      try {
        await publishUnlock(stationForUnlock.dockId, ride.id);
      } catch (err) {
        console.error('[Unlock] MQTT publish failed for ride', ride.id, err);
      }
    }

    // Emit realtime events
    io.emit(SOCKET_EVENTS.RIDE_STARTED, { rideId: ride.id });
    io.emit(SOCKET_EVENTS.STATION_UPDATE, { stationId });

    res.json({ success: true, data: ride });
  } catch (err) {
    next(err);
  }
});
