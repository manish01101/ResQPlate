import { io } from "socket.io-client";

const backendUrl = import.meta.env.VITE_BACKEND_URL
  ? import.meta.env.VITE_BACKEND_URL.replace(/\/api$/, "") // Strip /api if present
  : "http://localhost:8080";

const socket = io(backendUrl, {
  autoConnect: true,
});

export default socket;
