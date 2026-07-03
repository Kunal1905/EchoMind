import axios from "axios";
import { auth } from "@clerk/nextjs/server";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  try {
    const { userId } = await auth();
    if (userId) {
      config.headers.Authorization = `Bearer ${userId}`;
    }
  } catch (error) {
    console.warn("[api] Could not get Clerk session token:", error)
  }
  return config;
});

export default api;
