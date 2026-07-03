import axios from "axios";
import { auth } from "@clerk/nextjs/server";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  const { userId } = await auth();
  if (userId) {
    config.headers.Authorization = `Bearer ${userId}`;
  }
  return config;
});

export default api;
