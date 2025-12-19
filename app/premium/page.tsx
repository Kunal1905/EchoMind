"use client";

import { SessionsContent } from "./SessionsContent";
import type { ReactElement } from "react";

export default function Sessions(): ReactElement {
  return <SessionsContent isPremium={false} />;
}