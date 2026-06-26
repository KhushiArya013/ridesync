import { io } from "socket.io-client";

let socket = null;

export function connectSocket(token) {
  if (!token) return null;
  if (socket?.connected) socket.disconnect();

  socket = io("https://ridesync-backend-rlsh.onrender.com", {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => {
    console.log("[Socket] ✅ Connected:", socket.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("[Socket] ❌ Disconnected:", reason);
  });

  socket.on("connect_error", (err) => {
    console.error("[Socket] Connection error:", err.message);
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}