import { getAuth } from "@clerk/express";
import type { NextFunction, Request, Response } from "express";

export type AuthedRequest = Request & {
  authUserId?: string;
};

export function requireUser(req: AuthedRequest, res: Response, next: NextFunction) {
  const auth = getAuth(req);

  if (!auth.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  req.authUserId = auth.userId;
  next();
}
