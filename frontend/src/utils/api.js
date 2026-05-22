import axios from "axios";

const getBaseURL = () => {
  if (import.meta.env.VITE_BACKEND_URL) {
    // Remove any accidental trailing slash from the Vercel env variable
    const cleanUrl = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

    // Safely ensure it ends with '/api'
    return cleanUrl.endsWith("/api") ? cleanUrl : `${cleanUrl}/api`;
  }

  // Local development fallback.
  // browser automatically prepends http://localhost:5173, and vite.config.js proxies it to 8080.
  return "/api";
};

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("resqplate_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally — redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Prevent redirecting if the 401 came from the login page itself
    if (err.response?.status === 401 && window.location.pathname !== "/login") {
      localStorage.removeItem("resqplate_token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  },
);

export default api;
