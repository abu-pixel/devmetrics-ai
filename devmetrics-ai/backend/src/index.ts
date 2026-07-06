import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';

import { authRouter } from './routes/auth';
import { metricsRouter } from './routes/metrics';
import { aiRouter } from './routes/ai';
import { stripeRouter } from './routes/stripe';
import { orgRouter } from './routes/org';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { initSocketHandlers } from './lib/socket';

const app = express();
const httpServer = createServer(app);

export const io = new SocketServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(rateLimiter);

// Routes
app.use('/api/auth', authRouter);
app.use('/api/metrics', metricsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/stripe', stripeRouter);
app.use('/api/org', orgRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.io handlers
initSocketHandlers(io);

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`🚀 DevMetrics API running on port ${PORT}`);
});

export default app;
