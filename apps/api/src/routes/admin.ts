import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../index';

export const adminRouter = Router();

// Basit admin key koruması
const adminKey = process.env.ADMIN_KEY || 'pisi-admin-2026';
adminRouter.use((req: Request, res: Response, next: NextFunction) => {
  const key = req.headers['x-admin-key'] || req.query.key;
  if (key !== adminKey) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }
  next();
});

// Tüm bisikletler
adminRouter.get('/bikes', async (_req, res, next) => {
  try {
    const bikes = await prisma.bike.findMany({
      include: { station: { select: { name: true, dockId: true } } },
      orderBy: { station: { name: 'asc' } },
    });
    res.json({ success: true, data: bikes });
  } catch (err) { next(err); }
});

// Bisiklet durum güncelle
adminRouter.patch('/bikes/:id', async (req, res, next) => {
  try {
    const { status, batteryLevel, stationId } = req.body;
    const bike = await prisma.bike.update({
      where: { id: req.params.id as string },
      data: {
        ...(status && { status }),
        ...(batteryLevel !== undefined && { batteryLevel }),
        ...(stationId !== undefined && { stationId: stationId || null }),
      },
      include: { station: { select: { name: true } } },
    });
    res.json({ success: true, data: bike });
  } catch (err) { next(err); }
});

// Tüm istasyonlar (detaylı)
adminRouter.get('/stations', async (_req, res, next) => {
  try {
    const stations = await prisma.station.findMany({
      include: {
        bikes: { select: { id: true, qrCode: true, status: true, batteryLevel: true } },
      },
    });
    res.json({ success: true, data: stations });
  } catch (err) { next(err); }
});

// Tüm sürüşler (son 50)
adminRouter.get('/rides', async (req, res, next) => {
  try {
    const status = req.query.status as string | undefined;
    const rides = await prisma.ride.findMany({
      where: status ? { status } : undefined,
      include: {
        user: { select: { name: true, email: true } },
        bike: { select: { qrCode: true } },
        startStation: { select: { name: true } },
        endStation: { select: { name: true } },
      },
      orderBy: { startTime: 'desc' },
      take: 100,
    });
    res.json({ success: true, data: rides });
  } catch (err) { next(err); }
});

// Aktif sürüşü zorla kapat (admin)
adminRouter.post('/rides/:id/force-end', async (req, res, next) => {
  try {
    const { stationId } = req.body;
    const ride = await prisma.ride.findUnique({ where: { id: req.params.id as string } });
    if (!ride || ride.status !== 'active') {
      res.status(404).json({ success: false, error: 'Active ride not found' });
      return;
    }
    const now = new Date();
    await prisma.$transaction([
      prisma.ride.update({
        where: { id: ride.id },
        data: { status: 'completed', endTime: now, endStationId: stationId || null },
      }),
      prisma.bike.update({
        where: { id: ride.bikeId },
        data: { status: 'available', stationId: stationId || ride.startStationId },
      }),
    ]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// Özet istatistikler
adminRouter.get('/stats', async (_req, res, next) => {
  try {
    const [totalUsers, totalBikes, totalRides, activeRides, totalRevenue] = await Promise.all([
      prisma.user.count(),
      prisma.bike.count(),
      prisma.ride.count(),
      prisma.ride.count({ where: { status: 'active' } }),
      prisma.ride.aggregate({ where: { status: 'completed' }, _sum: { cost: true } }),
    ]);
    res.json({
      success: true,
      data: {
        totalUsers,
        totalBikes,
        totalRides,
        activeRides,
        totalRevenue: totalRevenue._sum.cost ?? 0,
      },
    });
  } catch (err) { next(err); }
});
