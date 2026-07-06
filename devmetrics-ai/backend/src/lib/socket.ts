import { Server } from 'socket.io';
import { verifyAccessToken } from './jwt';

export function initSocketHandlers(io: Server) {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Unauthorized'));
    try {
      const payload = verifyAccessToken(token);
      socket.data.user = payload;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user;
    console.log(`Socket connected: ${user.userId}`);

    // Join org room for real-time metric updates
    socket.on('join:org', (orgId: string) => {
      socket.join(`org:${orgId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${user.userId}`);
    });
  });
}

// Broadcast real-time metric update to all org members
export function broadcastMetricUpdate(io: Server, orgId: string, data: unknown) {
  io.to(`org:${orgId}`).emit('metric:update', data);
}
