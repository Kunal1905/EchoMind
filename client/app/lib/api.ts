import axios from "axios";

type ClerkSession = {
  getToken: () => Promise<string | null>;
};

declare global {
  interface Window {
    Clerk?: {
      session?: ClerkSession | null;
    };
  }
}

const defaultApiUrl =
  process.env.NODE_ENV === "production"
    ? "https://echomind-ig0h.onrender.com/api"
    : "http://localhost:4000/api";

const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL || defaultApiUrl;
const baseURL = configuredApiUrl.replace(/\/$/, "").endsWith("/api")
  ? configuredApiUrl.replace(/\/$/, "")
  : `${configuredApiUrl.replace(/\/$/, "")}/api`;

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  try {
    if (typeof window !== "undefined") {
      const token = await window.Clerk?.session?.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch (error) {
    console.warn("[api] Could not get Clerk session token:", error)
  }
  return config;
});

export default api;
