import { getAccessToken } from "@/storage/secureStore";
import { io, Socket } from "socket.io-client";

// Socket.io namespace hishebe path treat kore, tai /api shoho URL diye connect
// korle wrong namespace-e connect hoy — root URL (bina /api) lagbe
const SOCKET_URL =
  process.env.EXPO_PUBLIC_SOCKET_URL ??
  process.env.EXPO_PUBLIC_BASE_URL?.replace(/\/api\/?$/, "");

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { token: null },
      autoConnect: false,
      transports: ["websocket"],
    });

    // Debug listeners — console e ki hocche dekhar jonno
    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket?.id);
    });
    socket.on("connect_error", (err) => {
      console.log("❌ Socket connect_error:", err.message);
    });
    socket.on("message-error", (err) => {
      console.log("❌ Message send error from server:", err);
    });
  }
  return socket;
};

export const connectSocket = async (): Promise<Socket> => {
  const s = getSocket();
  if (s.connected) return s;

  const token = await getAccessToken();
  s.auth = { token };
  s.connect();
  return s;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};