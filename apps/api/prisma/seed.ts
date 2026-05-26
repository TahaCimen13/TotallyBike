import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.ride.deleteMany();
  await prisma.bike.deleteMany();
  await prisma.station.deleteMany();
  await prisma.user.deleteMany();

  // Create test user
  const hashedPassword = await bcrypt.hash('123456', 10);
  await prisma.user.create({
    data: {
      email: 'test@pisi.com',
      password: hashedPassword,
      name: 'Test User',
      balance: 45.0,
    },
  });

  // Create stations — İTÜ Ayazağa Kampüsü
  const metroStation = await prisma.station.create({
    data: {
      name: 'Ayazağa Metro Girişi',
      latitude: 41.1046,
      longitude: 28.6524,
      totalSlots: 8,
      dockId: '01',
    },
  });

  const libraryStation = await prisma.station.create({
    data: {
      name: 'Kütüphane',
      latitude: 41.1068,
      longitude: 28.6498,
      totalSlots: 6,
      dockId: '02',
    },
  });

  const engineeringStation = await prisma.station.create({
    data: {
      name: 'Mühendislik Binası',
      latitude: 41.1085,
      longitude: 28.6555,
      totalSlots: 6,
      dockId: '03',
    },
  });

  const studentCenterStation = await prisma.station.create({
    data: {
      name: 'Öğrenci Merkezi',
      latitude: 41.1028,
      longitude: 28.6558,
      totalSlots: 8,
      dockId: '04',
    },
  });

  // Create bikes for each station
  const stations = [
    { station: metroStation, count: 5 },
    { station: libraryStation, count: 4 },
    { station: engineeringStation, count: 3 },
    { station: studentCenterStation, count: 6 },
  ];

  for (const { station, count } of stations) {
    for (let i = 1; i <= count; i++) {
      await prisma.bike.create({
        data: {
          qrCode: `${station.dockId}-BIKE-${String(i).padStart(3, '0')}`,
          batteryLevel: Math.floor(Math.random() * 40) + 60, // 60-100%
          status: 'available',
          stationId: station.id,
        },
      });
    }
  }

  // One maintenance bike
  await prisma.bike.create({
    data: {
      qrCode: 'MAINT-BIKE-001',
      batteryLevel: 15,
      status: 'maintenance',
      stationId: metroStation.id,
    },
  });

  console.log('Seed data created successfully — İTÜ Ayazağa');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
