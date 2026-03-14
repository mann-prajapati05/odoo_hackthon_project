import { type NextFunction, type Request, type Response } from "express";
import jwt from "jsonwebtoken";

import { AppError, type JwtUserPayload } from "../types/index.js";

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    next(new AppError("Invalid or expired token", 401, "Unauthorized"));
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET || "") as JwtUserPayload;
    req.user = { id: payload.id, email: payload.email, role: payload.role };
    next();
  } catch {
    next(new AppError("Invalid or expired token", 401, "Unauthorized"));
  }
};
