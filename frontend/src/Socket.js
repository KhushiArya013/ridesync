
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export function connectSocket(token) {
  if (!token) return null;
  if (socket?.connected) socket.disconnect();

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    withCredentials: false,
  });

  socket.on('connect', () => {
    console.log('[Socket] ✅ Connected:', socket.id);
  });
  socket.on('disconnect', (reason) => {
    console.log('[Socket] ❌ Disconnected:', reason);
  });
  socket.on('connect_error', (err) => {
    console.error('[Socket] Error:', err.message);
  });

  return socket;
}

export function getSocket() { return socket; }

export function disconnectSocket() {
  if (socket) { socket.disconnect(); socket = null; }
}
