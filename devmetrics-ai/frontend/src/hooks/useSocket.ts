'use client';
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000';

export function useSocket(orgId: string | undefined, onMetricUpdate: (data: unknown) => void) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!orgId) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    socketRef.current = io(WS_URL, { auth: { token } });
    const socket = socketRef.current;

    socket.on('connect', () => {
      socket.emit('join:org', orgId);
    });

    socket.on('metric:update', onMetricUpdate);
    socket.on('connect_error', (err) => console.error('Socket error:', err));

    return () => { socket.disconnect(); };
  }, [orgId, onMetricUpdate]);

  return socketRef.current;
}
