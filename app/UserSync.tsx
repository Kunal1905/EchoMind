"use client";

import useSyncUser from "./hooks/useSyncUser";

export default function UserSync() {
  useSyncUser(); // <-- this runs your syncing logic
  return null;
}
