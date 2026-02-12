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

  // Create stations
  // Boğaziçi Üniversitesi Güney Kampüs çevresi (tümü karada)
  const northStation = await prisma.station.create({
    data: {
      name: 'Kuzey İstasyon',
      latitude: 41.0855,
      longitude: 29.0510,
      totalSlots: 8,
    },
  });

  const westStation = await prisma.station.create({
    data: {
      name: 'Batı İstasyon',
      latitude: 41.0838,
      longitude: 29.0480,
      totalSlots: 6,
    },
  });

  const eastStation = await prisma.station.create({
    data: {
      name: 'Doğu İstasyon',
      latitude: 41.0840,
      longitude: 29.0545,
      totalSlots: 6,
    },
  });

  const southStation = await prisma.station.create({
    data: {
      name: 'Güney İstasyon',
      latitude: 41.0820,
      longitude: 29.0515,
      totalSlots: 8,
    },
  });

  // Create bikes for each station
  const stations = [
    { station: northStation, count: 5 },
    { station: westStation, count: 4 },
    { station: eastStation, count: 3 },
    { station: southStation, count: 6 },
  ];

  for (const { station, count } of stations) {
    for (let i = 1; i <= count; i++) {
      await prisma.bike.create({
        data: {
          qrCode: `${station.name.split(' ')[0].toUpperCase()}-BIKE-${String(i).padStart(3, '0')}`,
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
      stationId: northStation.id,
    },
  });

  console.log('Seed data created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
