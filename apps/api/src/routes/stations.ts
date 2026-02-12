import { Router } from 'express';
import { prisma } from '../index';

export const stationsRouter = Router();

// Get all stations with availability
stationsRouter.get('/', async (_req, res, next) => {
  try {
    const stations = await prisma.station.findMany({
      include: {
        bikes: { where: { status: 'available' } },
      },
    });

    const result = stations.map((s) => ({
      id: s.id,
      name: s.name,
      latitude: s.latitude,
      longitude: s.longitude,
      totalSlots: s.totalSlots,
      availableBikes: s.bikes.length,
      availableDocks: s.totalSlots - s.bikes.length,
    }));

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// Get single station with bikes
stationsRouter.get('/:id', async (req, res, next) => {
  try {
    const station = await prisma.station.findUnique({
      where: { id: req.params.id },
      include: { bikes: true },
    });

    if (!station) {
      res.status(404).json({ success: false, error: 'Station not found' });
      return;
    }

    const availableBikes = station.bikes.filter((b) => b.status === 'available');
    res.json({
      success: true,
      data: {
        id: station.id,
        name: station.name,
        latitude: station.latitude,
        longitude: station.longitude,
        totalSlots: station.totalSlots,
        availableBikes: availableBikes.length,
        availableDocks: station.totalSlots - station.bikes.length,
        bikes: station.bikes.map((b) => ({
          id: b.id,
          qrCode: b.qrCode,
          batteryLevel: b.batteryLevel,
          status: b.status,
          stationId: b.stationId,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
});
