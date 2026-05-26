import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' }); // local monorepo root
dotenv.config();                        // Railway / production (fallback)

// Validate required env vars at startup
const REQUIRED_ENV = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'DATABASE_URL'];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) throw new Error(`Missing required env var: ${key}`);
}

import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import rateLimit from 'express-rate-limit';

import { initMqtt } from './lib/mqtt';
import { authRouter } from './routes/auth';
import { stationsRouter } from './routes/stations';
import { bikesRouter } from './routes/bikes';
import { ridesRouter } from './routes/rides';
import { walletRouter } from './routes/wallet';
import { errorHandler } from './middleware/errorHandler';

export const prisma = new PrismaClient();

const app = express();
const server = http.createServer(app);

export const io = new SocketIOServer(server, {
  cors: { origin: '*' },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Routes
app.use('/api/auth', authRouter);
app.use('/api/stations', stationsRouter);
app.use('/api/bikes', bikesRouter);
app.use('/api/rides', ridesRouter);
app.use('/api/wallet', walletRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Error handler
app.use(errorHandler);

// Socket.IO
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);

  initMqtt();
});
