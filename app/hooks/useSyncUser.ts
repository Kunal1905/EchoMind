"use client";

import { useEffect } from "react";
import axios from "axios";
import { useUser } from "@clerk/nextjs";

export function useSyncUser() {
  const { isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    (async () => {
      try {
        const res = await axios.post("/api/users", {}, {
          withCredentials: true, // ensures cookies are sent (safe for same-origin)
          headers: { "Content-Type": "application/json" }
        });
        console.log("[useSyncUser] /api/users response:", res.data);
      } catch (err: any) {
        console.error("[useSyncUser] failed:", err?.response?.data ?? err.message);
      }
    })();
  }, [isLoaded, isSignedIn]);
}

export default useSyncUser;